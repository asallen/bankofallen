export type User = {
  id: number
  username: string
  role: 'parent' | 'kid'
  display_name: string
  photo_v: number
  has_photo: number
  allowance_cents: number
  allowance_day: number
}

export type Tx = {
  id: number
  kid_id: number
  amount_cents: number
  type: 'deposit' | 'debit' | 'allowance' | 'interest'
  memo: string
  date: string
}

export const USER_COLS =
  'id, username, role, display_name, photo_v, photo IS NOT NULL AS has_photo, allowance_cents, allowance_day'

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ---------- money ----------

export function money(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

/** "5", "$5.50", "1,000" -> cents. Returns null if not a valid non-negative amount. */
export function parseCents(input: unknown): number | null {
  const n = Number(String(input ?? '').replace(/[$,\s]/g, ''))
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return null
  return Math.round(n * 100)
}

// ---------- dates (all YYYY-MM-DD strings in the family's timezone) ----------

export function localDate(timezone: string, at = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at)
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function weekday(date: string): number {
  return new Date(date + 'T00:00:00Z').getUTCDay()
}

export function prettyDate(date: string): string {
  return new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function nextAllowanceDate(today: string, day: number): string {
  let d = addDays(today, 1)
  while (weekday(d) !== day) d = addDays(d, 1)
  return d
}

// ---------- settings ----------

export type Settings = { timezone: string; interest_rate_bps: number; last_processed_date: string }

export async function getSettings(db: D1Database): Promise<Settings | null> {
  const rows = (await db.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>()).results
  if (rows.length === 0) return null
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return {
    timezone: s.timezone ?? 'UTC',
    interest_rate_bps: Number(s.interest_rate_bps ?? 0),
    last_processed_date: s.last_processed_date ?? '',
  }
}

// ---------- passwords & sessions ----------

const ITERATIONS = 100_000
const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(await pbkdf2(password, salt, ITERATIONS))}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, iter, salt, hash] = stored.split('$')
  return b64(await pbkdf2(password, unb64(salt), Number(iter))) === hash
}

export function newToken(): string {
  return b64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g, '')
}

// ---------- catch-up: pay any allowance & interest due since the app was last opened ----------

export type PlannedTx = {
  kid_id: number
  amount_cents: number
  type: 'allowance' | 'interest'
  memo: string
  date: string
  key: string
}

type KidSchedule = Pick<User, 'id' | 'allowance_cents' | 'allowance_day'>

/**
 * Works out every allowance and interest payment due on the days after
 * `last` up to and including `today`, in order. `balances` are each kid's
 * balance at the end of `last`. Pure, so it can be unit tested.
 *
 * Interest is paid on the 1st: end-of-last-month balance × yearly rate ÷ 12,
 * rounded to the cent. It is paid before that day's allowance.
 */
export function planCatchUp(opts: {
  last: string
  today: string
  kids: KidSchedule[]
  balances: Map<number, number>
  interestRateBps: number
}): PlannedTx[] {
  const { last, today, kids, interestRateBps: bps } = opts
  const balance = new Map(kids.map((k) => [k.id, opts.balances.get(k.id) ?? 0]))
  const planned: PlannedTx[] = []
  const add = (t: PlannedTx) => {
    planned.push(t)
    balance.set(t.kid_id, (balance.get(t.kid_id) ?? 0) + t.amount_cents)
  }

  for (let d = addDays(last, 1); d <= today; d = addDays(d, 1)) {
    if (d.endsWith('-01') && bps > 0) {
      const month = new Date(addDays(d, -1) + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long' })
      for (const k of kids) {
        const interest = Math.round(((balance.get(k.id) ?? 0) * bps) / 10000 / 12)
        if (interest <= 0) continue
        add({ kid_id: k.id, amount_cents: interest, type: 'interest', memo: `Interest for ${month} (${bps / 100}% a year)`, date: d, key: `interest:${k.id}:${d.slice(0, 7)}` })
      }
    }
    for (const k of kids) {
      if (k.allowance_cents <= 0 || weekday(d) !== k.allowance_day) continue
      add({ kid_id: k.id, amount_cents: k.allowance_cents, type: 'allowance', memo: 'Weekly allowance', date: d, key: `allowance:${k.id}:${d}` })
    }
  }
  return planned
}

/**
 * Inserts the allowance and interest transactions that came due since the
 * app was last opened, dated on the day they were due. Runs at the start of
 * every request; it's a single settings read when there's nothing to do.
 *
 * Safe to run concurrently or retry: every automatic transaction has a
 * unique key, so duplicates are ignored.
 */
export async function catchUp(db: D1Database): Promise<void> {
  const s = await getSettings(db)
  if (!s || !s.last_processed_date) return
  const today = localDate(s.timezone)
  const last = s.last_processed_date
  if (last >= today) return

  const kids = (
    await db.prepare("SELECT id, allowance_cents, allowance_day FROM users WHERE role = 'kid'").all<KidSchedule>()
  ).results
  const sums = await db
    .prepare('SELECT kid_id, SUM(amount_cents) AS total FROM transactions WHERE date <= ? GROUP BY kid_id')
    .bind(last)
    .all<{ kid_id: number; total: number }>()
  const balances = new Map(sums.results.map((r) => [r.kid_id, r.total]))

  const insert = db.prepare(
    'INSERT OR IGNORE INTO transactions (kid_id, amount_cents, type, memo, date, key) VALUES (?, ?, ?, ?, ?, ?)',
  )
  const stmts = planCatchUp({ last, today, kids, balances, interestRateBps: s.interest_rate_bps }).map((t) =>
    insert.bind(t.kid_id, t.amount_cents, t.type, t.memo, t.date, t.key),
  )
  stmts.push(
    db.prepare("UPDATE settings SET value = ? WHERE key = 'last_processed_date' AND value < ?").bind(today, today),
  )
  for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50))
}

// ---------- cash breakdown ----------

export const BILLS = [10000, 5000, 2000, 1000, 500, 100]
export const COINS = [25, 10, 5, 1]

/** The fewest US bills and coins that make `cents`, as [value in cents, count] pairs. */
export function cashBreakdown(cents: number): { bills: [number, number][]; coins: [number, number][] } {
  let left = Math.max(0, Math.round(cents))
  const take = (values: number[]) =>
    values.flatMap((v): [number, number][] => {
      const n = Math.floor(left / v)
      left -= n * v
      return n > 0 ? [[v, n]] : []
    })
  const bills = take(BILLS)
  return { bills, coins: take(COINS) }
}

// ---------- savings chart & streak ----------

type Dated = { amount_cents: number; date: string; type?: string }

export type SeriesPoint = { date: string; saved: number; interest: number }

/**
 * End-of-day balance split into what the kid saved and what interest added,
 * one point per day with activity, plus today. Interest is capped at the
 * balance so spending never makes "saved" go negative.
 */
export function savingsSeries(txs: Dated[], today: string): SeriesPoint[] {
  const sorted = [...txs].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const points: SeriesPoint[] = []
  let balance = 0
  let interest = 0
  sorted.forEach((t, i) => {
    balance += t.amount_cents
    if (t.type === 'interest') interest += t.amount_cents
    if (i === sorted.length - 1 || sorted[i + 1].date !== t.date) {
      const fromInterest = Math.max(0, Math.min(interest, balance))
      points.push({ date: t.date, saved: balance - fromInterest, interest: fromInterest })
    }
  })
  const last = points[points.length - 1]
  if (last && last.date < today) points.push({ ...last, date: today })
  return points
}

/**
 * Weeks in a row (Sunday–Saturday, in the family timezone) that the balance
 * went up. The current week counts once it's ahead of last week; a week still
 * in progress that's merely flat doesn't break the streak, but one that's
 * behind does.
 */
export function savingStreak(txs: Dated[], today: string): number {
  if (txs.length === 0) return 0
  const balanceOn = (d: string) => txs.reduce((sum, t) => (t.date <= d ? sum + t.amount_cents : sum), 0)
  const first = txs.reduce((min, t) => (t.date < min ? t.date : min), txs[0].date)
  const lastSaturday = addDays(today, -((weekday(today) + 1) % 7 || 7))

  let streak = 0
  const now = balanceOn(today)
  const lastWeek = balanceOn(lastSaturday)
  if (now > lastWeek) streak++
  else if (now < lastWeek) return 0

  for (let end = lastSaturday; end >= first; end = addDays(end, -7)) {
    if (balanceOn(end) > balanceOn(addDays(end, -7))) streak++
    else break
  }
  return streak
}

// ---------- login throttling ----------

export const MAX_LOGIN_FAILURES = 5
export const LOCKOUT_MINUTES = 15

/**
 * Tracks failed logins per username in the settings table (key "login:<username>",
 * value "<failures>|<locked until ISO time>"), so no extra table is needed.
 */
export type LoginState = { failures: number; lockedUntil: string }

export function parseLoginState(value: string | null | undefined): LoginState {
  const [failures, lockedUntil] = (value ?? '').split('|')
  return { failures: Number(failures) || 0, lockedUntil: lockedUntil ?? '' }
}

/** Minutes left on a lockout, or 0 if not locked. */
export function lockedMinutes(state: LoginState, now: Date): number {
  const ms = Date.parse(state.lockedUntil) - now.getTime()
  return ms > 0 ? Math.ceil(ms / 60000) : 0
}

/** The state after one more failed attempt. */
export function afterFailure(state: LoginState, now: Date): LoginState {
  const failures = (lockedMinutes(state, now) > 0 ? 0 : state.failures) + 1
  if (failures >= MAX_LOGIN_FAILURES) {
    return { failures: 0, lockedUntil: new Date(now.getTime() + LOCKOUT_MINUTES * 60000).toISOString() }
  }
  return { failures, lockedUntil: '' }
}

// ---------- validation ----------

/** True for a real calendar date written as YYYY-MM-DD. */
export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && addDays(value, 0) === value
}
