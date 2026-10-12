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

/**
 * Walks each day from the last processed date up to today and inserts the
 * allowance and interest transactions that should have happened, dated on
 * the day they were due. Runs at the start of every request; it's a single
 * settings read when there's nothing to do.
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
    await db.prepare("SELECT id, allowance_cents, allowance_day FROM users WHERE role = 'kid'").all<User>()
  ).results

  // Balances as of the last processed day; everything after that is computed here.
  const balance = new Map<number, number>(kids.map((k) => [k.id, 0]))
  const sums = await db
    .prepare('SELECT kid_id, SUM(amount_cents) AS total FROM transactions WHERE date <= ? GROUP BY kid_id')
    .bind(last)
    .all<{ kid_id: number; total: number }>()
  for (const r of sums.results) balance.set(r.kid_id, r.total)

  const insert = db.prepare(
    'INSERT OR IGNORE INTO transactions (kid_id, amount_cents, type, memo, date, key) VALUES (?, ?, ?, ?, ?, ?)',
  )
  const stmts: D1PreparedStatement[] = []
  const pct = s.interest_rate_bps / 100

  for (let d = addDays(last, 1); d <= today; d = addDays(d, 1)) {
    // Interest on the 1st, based on the balance at the end of last month.
    if (d.endsWith('-01') && s.interest_rate_bps > 0) {
      const month = new Date(addDays(d, -1) + 'T00:00:00Z').toLocaleDateString('en-US', {
        timeZone: 'UTC',
        month: 'long',
      })
      for (const k of kids) {
        const bal = balance.get(k.id) ?? 0
        const interest = Math.round((bal * s.interest_rate_bps) / 10000 / 12)
        if (interest <= 0) continue
        stmts.push(insert.bind(k.id, interest, 'interest', `Interest for ${month} (${pct}% a year)`, d, `interest:${k.id}:${d.slice(0, 7)}`))
        balance.set(k.id, bal + interest)
      }
    }
    // Weekly allowance.
    for (const k of kids) {
      if (k.allowance_cents <= 0 || weekday(d) !== k.allowance_day) continue
      stmts.push(insert.bind(k.id, k.allowance_cents, 'allowance', 'Weekly allowance', d, `allowance:${k.id}:${d}`))
      balance.set(k.id, (balance.get(k.id) ?? 0) + k.allowance_cents)
    }
  }

  stmts.push(
    db.prepare("UPDATE settings SET value = ? WHERE key = 'last_processed_date' AND value < ?").bind(today, today),
  )
  for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50))
}
