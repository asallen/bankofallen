import { describe, expect, it } from 'vitest'
import {
  addDays, afterFailure, cashBreakdown, hashPassword, isValidDate, LOCKOUT_MINUTES, lockedMinutes, MAX_LOGIN_FAILURES,
  nextAllowanceDate, parseCategory, parseCents, parseLoginState, planCatchUp, savingStreak, savingsSeries, verifyPassword, weekday,
} from '../src/lib'

const SAT = 6
const MON = 1
const kid = (id: number, allowance_cents = 0, allowance_day = SAT) => ({ id, allowance_cents, allowance_day })
const sum = (txs: { amount_cents: number }[]) => txs.reduce((s, t) => s + t.amount_cents, 0)

describe('planCatchUp: allowance', () => {
  it('pays nothing when already up to date', () => {
    const txs = planCatchUp({ last: '2026-10-10', today: '2026-10-10', kids: [kid(1, 500)], balances: new Map(), interestRateBps: 500 })
    expect(txs).toEqual([])
  })

  it('pays on the allowance day, dated that day', () => {
    // 2026-10-10 is a Saturday.
    const txs = planCatchUp({ last: '2026-10-09', today: '2026-10-10', kids: [kid(1, 500)], balances: new Map(), interestRateBps: 0 })
    expect(txs).toEqual([
      { kid_id: 1, amount_cents: 500, type: 'allowance', category: 'allowance', memo: 'Weekly allowance', date: '2026-10-10', key: 'allowance:1:2026-10-10' },
    ])
  })

  it('does not pay the day after `last` if that is not the allowance day', () => {
    const txs = planCatchUp({ last: '2026-10-10', today: '2026-10-16', kids: [kid(1, 500)], balances: new Map(), interestRateBps: 0 })
    expect(txs).toEqual([])
  })

  it('catches up every missed week after a long gap', () => {
    const txs = planCatchUp({ last: '2026-01-01', today: '2026-12-31', kids: [kid(1, 500)], balances: new Map(), interestRateBps: 0 })
    expect(txs).toHaveLength(52) // 2026 has 52 Saturdays after Jan 1
    expect(txs.every((t) => weekday(t.date) === SAT)).toBe(true)
    expect(new Set(txs.map((t) => t.key)).size).toBe(52)
  })

  it('skips kids with no allowance and handles different days per kid', () => {
    const txs = planCatchUp({
      last: '2026-10-04', today: '2026-10-11', // Sun → Sun
      kids: [kid(1, 500, SAT), kid(2, 350, MON), kid(3, 0, SAT)],
      balances: new Map(), interestRateBps: 0,
    })
    expect(txs.map((t) => [t.kid_id, t.date])).toEqual([[2, '2026-10-05'], [1, '2026-10-10']])
  })
})

describe('planCatchUp: interest', () => {
  it('pays balance × rate ÷ 12 on the 1st, rounded to the cent', () => {
    const txs = planCatchUp({ last: '2026-09-30', today: '2026-10-01', kids: [kid(1)], balances: new Map([[1, 2000]]), interestRateBps: 500 })
    // $20.00 × 5% ÷ 12 = 8.33¢ → 8¢
    expect(txs).toEqual([
      { kid_id: 1, amount_cents: 8, type: 'interest', category: null, memo: 'Interest for September (5% a year)', date: '2026-10-01', key: 'interest:1:2026-10' },
    ])
  })

  it('pays nothing when the rate is 0 or the balance is 0', () => {
    expect(planCatchUp({ last: '2026-09-30', today: '2026-10-01', kids: [kid(1)], balances: new Map([[1, 2000]]), interestRateBps: 0 })).toEqual([])
    expect(planCatchUp({ last: '2026-09-30', today: '2026-10-01', kids: [kid(1)], balances: new Map(), interestRateBps: 500 })).toEqual([])
  })

  it('pays nothing on tiny balances that round to 0¢', () => {
    // $1.00 × 5% ÷ 12 = 0.42¢
    expect(planCatchUp({ last: '2026-09-30', today: '2026-10-01', kids: [kid(1)], balances: new Map([[1, 100]]), interestRateBps: 500 })).toEqual([])
  })

  it('compounds month to month and includes allowance paid during the month', () => {
    // Matches the hand-checked local run: $5 every Saturday from Aug 8, 5%.
    const txs = planCatchUp({ last: '2026-08-02', today: '2026-10-01', kids: [kid(1, 500)], balances: new Map(), interestRateBps: 500 })
    const interest = txs.filter((t) => t.type === 'interest')
    expect(interest.map((t) => [t.date, t.amount_cents])).toEqual([
      ['2026-09-01', 8], // Aug 8,15,22,29 → $20.00 → 8.33¢
      ['2026-10-01', 17], // $20.08 + Sep 5,12,19,26 = $40.08 → 16.7¢
    ])
  })

  it('pays interest before allowance when both fall on the 1st', () => {
    // 2026-08-01 is a Saturday.
    const txs = planCatchUp({ last: '2026-07-31', today: '2026-08-01', kids: [kid(1, 1000)], balances: new Map([[1, 12000]]), interestRateBps: 1200 })
    expect(txs.map((t) => [t.type, t.amount_cents])).toEqual([['interest', 120], ['allowance', 1000]])
  })

  it('handles year end and February', () => {
    const txs = planCatchUp({ last: '2026-12-31', today: '2027-03-01', kids: [kid(1)], balances: new Map([[1, 120000]]), interestRateBps: 1000 })
    expect(txs.map((t) => [t.date, t.key, t.memo])).toEqual([
      ['2027-01-01', 'interest:1:2027-01', 'Interest for December (10% a year)'],
      ['2027-02-01', 'interest:1:2027-02', 'Interest for January (10% a year)'],
      ['2027-03-01', 'interest:1:2027-03', 'Interest for February (10% a year)'],
    ])
    expect(sum(txs)).toBe(1000 + 1008 + 1017) // $1,200 at 10%, compounding
  })

  it('does not change the balances map it was given', () => {
    const balances = new Map([[1, 2000]])
    planCatchUp({ last: '2026-09-30', today: '2026-10-01', kids: [kid(1, 500)], balances, interestRateBps: 500 })
    expect(balances.get(1)).toBe(2000)
  })
})

describe('login throttling', () => {
  const now = new Date('2026-10-12T12:00:00Z')

  it('counts failures and locks after the limit', () => {
    let state = parseLoginState(null)
    for (let i = 1; i < MAX_LOGIN_FAILURES; i++) {
      state = afterFailure(state, now)
      expect(state).toEqual({ failures: i, lockedUntil: '' })
    }
    state = afterFailure(state, now)
    expect(lockedMinutes(state, now)).toBe(LOCKOUT_MINUTES)
  })

  it('unlocks after the lockout ends and starts counting again', () => {
    const locked = { failures: 0, lockedUntil: new Date(now.getTime() + LOCKOUT_MINUTES * 60000).toISOString() }
    const later = new Date(now.getTime() + (LOCKOUT_MINUTES + 1) * 60000)
    expect(lockedMinutes(locked, later)).toBe(0)
    expect(afterFailure(locked, later)).toEqual({ failures: 1, lockedUntil: '' })
  })

  it('round-trips through the stored string format', () => {
    expect(parseLoginState('3|')).toEqual({ failures: 3, lockedUntil: '' })
    expect(parseLoginState('garbage')).toEqual({ failures: 0, lockedUntil: '' })
  })
})

describe('parseCents', () => {
  it.each([
    ['5', 500], ['5.5', 550], ['$1,234.56', 123456], [' 0.01 ', 1], ['0', 0], ['19.999', 2000],
  ])('%s → %i', (input, cents) => expect(parseCents(input)).toBe(cents))

  it.each(['abc', '-5', '1000001', 'NaN'])('rejects %s', (input) => expect(parseCents(input)).toBeNull())

  it('treats blank as 0, which the forms then reject as "greater than $0"', () => expect(parseCents('')).toBe(0))
})

describe('dates', () => {
  it('validates real calendar dates only', () => {
    expect(isValidDate('2026-10-12')).toBe(true)
    expect(isValidDate('2028-02-29')).toBe(true)
    expect(isValidDate('2026-02-29')).toBe(false)
    expect(isValidDate('2026-13-01')).toBe(false)
    expect(isValidDate('10/12/2026')).toBe(false)
    expect(isValidDate('')).toBe(false)
  })

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('finds the next allowance day strictly after today', () => {
    expect(nextAllowanceDate('2026-10-10', SAT)).toBe('2026-10-17') // today is Saturday → next week
    expect(nextAllowanceDate('2026-10-11', MON)).toBe('2026-10-12')
  })
})

describe('passwords', () => {
  it('verifies the right password and rejects the wrong one', async () => {
    const hash = await hashPassword('correct horse')
    expect(hash.startsWith('pbkdf2$')).toBe(true)
    expect(await verifyPassword('correct horse', hash)).toBe(true)
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })
})

describe('savingsSeries', () => {
  const tx = (date: string, amount_cents: number, type = 'deposit') => ({ date, amount_cents, type })

  it('splits each day\'s balance into saved and interest, and extends to today', () => {
    const s = savingsSeries([tx('2026-09-05', 500, 'allowance'), tx('2026-10-01', 8, 'interest'), tx('2026-10-01', 500, 'allowance')], '2026-10-12')
    expect(s).toEqual([
      { date: '2026-09-05', saved: 500, interest: 0 },
      { date: '2026-10-01', saved: 1000, interest: 8 },
      { date: '2026-10-12', saved: 1000, interest: 8 },
    ])
  })

  it('never lets spending push "saved" below zero', () => {
    const s = savingsSeries([tx('2026-09-01', 50, 'interest'), tx('2026-09-02', -30, 'debit')], '2026-09-02')
    expect(s[s.length - 1]).toEqual({ date: '2026-09-02', saved: 0, interest: 20 })
  })

  it('handles transactions in any order', () => {
    const s = savingsSeries([tx('2026-09-02', 200), tx('2026-09-01', 100)], '2026-09-02')
    expect(s.map((p) => p.saved)).toEqual([100, 300])
  })
})

describe('savingStreak', () => {
  // Saturdays: 2026-09-05, 12, 19, 26, 10-03, 10-10. 2026-10-12 is a Monday.
  const allowance = (dates: string[]) => dates.map((date) => ({ date, amount_cents: 500 }))
  const sats = ['2026-09-05', '2026-09-12', '2026-09-19', '2026-09-26', '2026-10-03', '2026-10-10']

  it('counts completed weeks the balance went up', () => {
    expect(savingStreak(allowance(sats), '2026-10-12')).toBe(6)
  })

  it('counts the current week once it is ahead', () => {
    expect(savingStreak([...allowance(sats), { date: '2026-10-12', amount_cents: 100 }], '2026-10-12')).toBe(7)
  })

  it('breaks on a week where spending beat saving', () => {
    const txs = [...allowance(sats), { date: '2026-09-22', amount_cents: -800 }]
    expect(savingStreak(txs, '2026-10-12')).toBe(2) // only the weeks ending Oct 3 and Oct 10
  })

  it('is 0 when this week is already behind', () => {
    expect(savingStreak([...allowance(sats), { date: '2026-10-12', amount_cents: -100 }], '2026-10-12')).toBe(0)
  })

  it('is 0 with no activity', () => {
    expect(savingStreak([], '2026-10-12')).toBe(0)
  })

  it('works when today is a Saturday', () => {
    expect(savingStreak(allowance(sats), '2026-10-10')).toBe(6)
  })
})

describe('cashBreakdown', () => {
  it('uses the fewest bills and coins', () => {
    expect(cashBreakdown(6500)).toEqual({ bills: [[5000, 1], [1000, 1], [500, 1]], coins: [] })
    expect(cashBreakdown(6000)).toEqual({ bills: [[5000, 1], [1000, 1]], coins: [] })
    expect(cashBreakdown(4138)).toEqual({ bills: [[1000, 4], [100, 1]], coins: [[25, 1], [10, 1], [1, 3]] })
    expect(cashBreakdown(18691)).toEqual({ bills: [[10000, 1], [5000, 1], [1000, 3], [500, 1], [100, 1]], coins: [[25, 3], [10, 1], [5, 1], [1, 1]] })
  })

  it('uses $500 and $1,000 bills for big balances', () => {
    expect(cashBreakdown(268000)).toEqual({ bills: [[100000, 2], [50000, 1], [10000, 1], [5000, 1], [1000, 3]], coins: [] })
    expect(cashBreakdown(40000)).toEqual({ bills: [[10000, 4]], coins: [] })
  })

  it('is empty for zero or negative amounts', () => {
    expect(cashBreakdown(0)).toEqual({ bills: [], coins: [] })
    expect(cashBreakdown(-500)).toEqual({ bills: [], coins: [] })
  })
})

describe('parseCategory', () => {
  it('accepts known categories and rejects everything else', () => {
    expect(parseCategory('toys')).toBe('toys')
    expect(parseCategory('allowance')).toBe('allowance')
    expect(parseCategory('')).toBeNull()
    expect(parseCategory('toString')).toBeNull()
    expect(parseCategory(undefined)).toBeNull()
  })
})
