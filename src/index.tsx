import { Hono, type Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import {
  addDays, afterFailure, catchUp, DAYS, getSettings, hashPassword, isValidDate, localDate, lockedMinutes, money,
  newToken, nextAllowanceDate, parseCents, parseLoginState, prettyDate, savingStreak, USER_COLS, verifyPassword, type Tx, type User,
} from './lib'
import { HelpContent } from './help'
import { Avatar, Cash, DaySelect, EditTxDialog, Icon, Layout, Money, PHOTO_SCRIPT, SavingsChart, TxActions, TxDialog, TxTable, type NavKid } from './views'

type Env = { Bindings: { DB: D1Database }; Variables: { user: User | null; navKids: NavKid[] } }
type C = Context<Env>

const app = new Hono<Env>()
const SESSION_DAYS = 90

// Every request: pay anything that's come due, then figure out who's logged in.
app.use('*', async (c, next) => {
  const db = c.env.DB
  await catchUp(db)
  const token = getCookie(c, 'sid')
  const user = token
    ? await db
        .prepare(`SELECT ${USER_COLS.replace(/(^|, )/g, '$1u.')} FROM sessions s JOIN users u ON u.id = s.user_id
                  WHERE s.token = ? AND s.expires_at > datetime('now')`)
        .bind(token)
        .first<User>()
    : null
  c.set('user', user)
  c.set(
    'navKids',
    user?.role === 'parent'
      ? (await db.prepare(`SELECT ${USER_COLS} FROM users WHERE role = 'kid' ORDER BY display_name`).all<NavKid>()).results
      : [],
  )

  const path = new URL(c.req.url).pathname
  if (path !== '/setup' && !user) {
    const anyUser = await db.prepare('SELECT 1 FROM users LIMIT 1').first()
    if (!anyUser) return c.redirect('/setup')
    if (path !== '/login') return c.redirect('/login')
  }
  await next()
})

const flash = (c: C) => ({ msg: c.req.query('msg'), err: c.req.query('err') })
const back = (c: C, path: string, kind: 'msg' | 'err', text: string) =>
  c.redirect(`${path}?${kind}=${encodeURIComponent(text)}`)
const isParent = (c: C) => c.get('user')?.role === 'parent'
const field = (body: Record<string, unknown>, name: string) => String(body[name] ?? '').trim()

async function kids(db: D1Database): Promise<(User & { balance: number })[]> {
  return (
    await db
      .prepare(`SELECT ${USER_COLS}, (SELECT COALESCE(SUM(amount_cents), 0) FROM transactions t WHERE t.kid_id = users.id) AS balance
                FROM users WHERE role = 'kid' ORDER BY display_name`)
      .all<User & { balance: number }>()
  ).results
}

async function startSession(c: C, userId: number) {
  const token = newToken()
  await c.env.DB.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+${SESSION_DAYS} days'))`)
    .bind(token, userId)
    .run()
  setCookie(c, 'sid', token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: SESSION_DAYS * 86400 })
}

// ---------- first-time setup ----------

app.get('/setup', async (c) => {
  if (await c.env.DB.prepare('SELECT 1 FROM users LIMIT 1').first()) return c.redirect('/')
  return c.html(
    <Layout title="Welcome" {...flash(c)}>
      <div class="card login">
        <h1>Open the Bank</h1>
        <p class="muted" style="text-align:center;margin:-12px 0 24px">Create the first banker account, then add the kids.</p>
        <form class="stack" method="post">
          <label>Your name<input name="display_name" required maxlength={40} /></label>
          <label>Username<input name="username" required autocapitalize="none" pattern="[a-zA-Z0-9_\-]+" /></label>
          <label>Password<input name="password" type="password" required minlength={8} /></label>
          <input type="hidden" name="timezone" id="tz" />
          <script dangerouslySetInnerHTML={{ __html: `document.getElementById('tz').value = Intl.DateTimeFormat().resolvedOptions().timeZone` }} />
          <button class="primary">Open the bank</button>
        </form>
      </div>
    </Layout>,
  )
})

app.post('/setup', async (c) => {
  const db = c.env.DB
  if (await db.prepare('SELECT 1 FROM users LIMIT 1').first()) return c.redirect('/')
  const b = await c.req.parseBody()
  const username = field(b, 'username').toLowerCase()
  const password = field(b, 'password')
  const name = field(b, 'display_name').slice(0, 40)
  if (!/^[a-z0-9_-]{1,30}$/.test(username) || password.length < 8 || !name) {
    return back(c, '/setup', 'err', 'Please fill in every field (password at least 8 characters).')
  }
  let timezone = field(b, 'timezone') || 'UTC'
  try { localDate(timezone) } catch { timezone = 'UTC' }

  const user = await db
    .prepare("INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, 'parent', ?) RETURNING id")
    .bind(username, await hashPassword(password), name)
    .first<{ id: number }>()
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
  await db.batch([
    stmt.bind('timezone', timezone),
    stmt.bind('interest_rate_bps', '500'),
    stmt.bind('last_processed_date', addDays(localDate(timezone), -1)),
  ])
  await startSession(c, user!.id)
  return back(c, '/admin', 'msg', 'The bank is open! Now add an account for each kid.')
})

// ---------- login / logout ----------

app.get('/login', (c) => {
  if (c.get('user')) return c.redirect('/')
  return c.html(
    <Layout title="Log In" {...flash(c)}>
      <div class="card login">
        <h1>Welcome Back</h1>
        <form class="stack" method="post">
          <label>Username<input name="username" required autocapitalize="none" autocomplete="username" /></label>
          <label>Password<input name="password" type="password" required autocomplete="current-password" /></label>
          <button class="primary">Log in</button>
        </form>
      </div>
    </Layout>,
  )
})

app.post('/login', async (c) => {
  const db = c.env.DB
  const b = await c.req.parseBody()
  const username = field(b, 'username').toLowerCase()
  if (!/^[a-z0-9_-]{1,30}$/.test(username)) return back(c, '/login', 'err', 'Wrong username or password.')

  // After 5 wrong passwords, the username is locked for 15 minutes.
  const key = `login:${username}`
  const now = new Date()
  const stored = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>()
  const state = parseLoginState(stored?.value)
  const wait = lockedMinutes(state, now)
  if (wait > 0) return back(c, '/login', 'err', `Too many wrong tries. Try again in ${wait} minute${wait === 1 ? '' : 's'}.`)

  const row = await db.prepare('SELECT id, password_hash FROM users WHERE username = ?')
    .bind(username)
    .first<{ id: number; password_hash: string }>()
  if (!row || !(await verifyPassword(field(b, 'password'), row.password_hash))) {
    const next = afterFailure(state, now)
    await db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(key, `${next.failures}|${next.lockedUntil}`).run()
    return back(c, '/login', 'err', next.lockedUntil
      ? 'Too many wrong tries. Try again in 15 minutes.'
      : 'Wrong username or password.')
  }
  if (stored) await db.prepare('DELETE FROM settings WHERE key = ?').bind(key).run()
  await startSession(c, row.id)
  return c.redirect('/')
})

app.post('/logout', async (c) => {
  const token = getCookie(c, 'sid')
  if (token) await c.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
  deleteCookie(c, 'sid', { path: '/' })
  return c.redirect('/login')
})

// ---------- home ----------

app.get('/', async (c) => {
  const user = c.get('user')!
  if (user.role === 'kid') return kidPage(c, user.id)

  const db = c.env.DB
  const all = await kids(db)
  const recent = (
    await db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC LIMIT 30').all<Tx>()
  ).results
  const names = new Map(all.map((k) => [k.id, k.display_name]))
  const today = localDate((await getSettings(db))!.timezone)

  return c.html(
    <Layout title="Home" user={user} kids={c.get('navKids')} active="home" {...flash(c)}>
      <h1>Welcome, {user.display_name}</h1>
      {all.length > 0 && <TxActions />}
      {all.length > 0 && <TxDialog kids={all} back="/" today={today} />}
      <EditTxDialog back="/" today={today} />
      {all.length === 0 && <p class="card">No kid accounts yet. <a href="/admin">Add one in Settings</a>.</p>}
      {all.length > 0 && (
        <div class="card hero">
          <div class="label">Total in savings</div>
          <div class="bal"><Money cents={all.reduce((sum, k) => sum + k.balance, 0)} /></div>
          <div class="list">
            <div class="list-head"><span>Account</span><span>Balance</span></div>
            {all.map((k) => (
              <a class="list-row" href={`/kid/${k.id}`}>
                <Avatar user={k} size={36} />
                <div class="grow">
                  <div>{k.display_name}</div>
                  <div class="muted sm">Savings · @{k.username}</div>
                </div>
                <div class="num"><Money cents={k.balance} /></div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div class="card">
        <h2>Recent Activity</h2>
        <TxTable txs={recent} names={names} editable />
      </div>
    </Layout>,
  )
})

app.get('/kid/:id', async (c) => (isParent(c) ? kidPage(c, Number(c.req.param('id'))) : c.redirect('/')))

async function kidPage(c: C, kidId: number) {
  const db = c.env.DB
  const viewer = c.get('user')!
  const kid = await db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ? AND role = 'kid'`).bind(kidId).first<User>()
  if (!kid) return c.notFound()
  const txs = (
    await db.prepare('SELECT * FROM transactions WHERE kid_id = ? ORDER BY date, id').bind(kidId).all<Tx>()
  ).results
  const s = (await getSettings(db))!
  const today = localDate(s.timezone)
  const balance = txs.reduce((sum, t) => sum + t.amount_cents, 0)
  const interest = txs.filter((t) => t.type === 'interest')
  const interestAll = interest.reduce((sum, t) => sum + t.amount_cents, 0)
  const interestYear = interest.filter((t) => t.date.startsWith(today.slice(0, 4))).reduce((sum, t) => sum + t.amount_cents, 0)
  const nextInterest = Math.max(0, Math.round((balance * s.interest_rate_bps) / 10000 / 12))
  const nextAllowance = kid.allowance_cents > 0 ? nextAllowanceDate(today, kid.allowance_day) : null
  const isMe = viewer.id === kid.id
  const streak = savingStreak(txs, today)
  const nextFirst = addDays(today.slice(0, 7) + '-01', 32).slice(0, 7) + '-01'

  return c.html(
    <Layout title={kid.display_name} user={viewer} kids={c.get('navKids')} active={isMe ? 'home' : `kid:${kid.id}`} {...flash(c)}>
      <h1>{isMe ? `Welcome, ${kid.display_name}` : kid.display_name}</h1>
      {viewer.role === 'parent' && <TxActions kidId={kid.id} />}
      {viewer.role === 'parent' && <TxDialog kids={c.get('navKids')} back={`/kid/${kid.id}`} today={today} />}
      {viewer.role === 'parent' && <EditTxDialog back={`/kid/${kid.id}`} today={today} />}
      <div class="card hero">
        <div style="display:flex;align-items:center;gap:12px">
          <Avatar user={kid} size={36} />
          <div class="label" style="flex:1">Savings balance</div>
          {streak > 0 && (
            <span class="streak" title="Weeks in a row your balance went up">
              <Icon name="flame" />{streak}-week streak
            </span>
          )}
        </div>
        <div class="bal-row">
          <div class="bal"><Money cents={balance} /></div>
          <Cash cents={balance} size="lg" />
        </div>
        {interestAll > 0 && <div class="from-interest"><Money cents={interestAll} /> came from interest</div>}
        <SavingsChart txs={txs} today={today} />
      </div>

      <div class="stats">
        <div class="stat">
          <div class="label">Next allowance</div>
          <div class="value">{nextAllowance ? <Money cents={kid.allowance_cents} sign /> : '—'}</div>
          <div class="muted">{nextAllowance ? `${DAYS[kid.allowance_day]}, ${prettyDate(nextAllowance)}` : 'Not set up'}</div>
          {nextAllowance && <Cash cents={kid.allowance_cents} />}
        </div>
        <div class="stat">
          <div class="label">Interest rate</div>
          <div class="value">{s.interest_rate_bps / 100}% a year</div>
          <div class="muted">≈ +{money(nextInterest)} next month</div>
          {s.interest_rate_bps > 0 && (
            <div class="rate-pic" title={`Every $100 saved for a year earns ${money(s.interest_rate_bps)}`}>
              <div class="pics"><Cash cents={10000} /><span aria-hidden="true">→</span>+<Cash cents={s.interest_rate_bps} /></div>
              Every $100 saved grows by {money(s.interest_rate_bps)} a year
            </div>
          )}
        </div>
        <div class="stat">
          <div class="label">Interest earned this year</div>
          <div class="value in"><Money cents={interestYear} /></div>
          <div class="muted">{money(interestAll)} all time</div>
          <Cash cents={interestYear} empty={s.interest_rate_bps > 0 && interestAll === 0 ? `First payment ${prettyDate(nextFirst)}` : 'None yet this year'} />
        </div>
      </div>


      <div class="card">
        <h2>History</h2>
        <TxTable txs={[...txs].reverse()} editable={viewer.role === 'parent'} />
      </div>
    </Layout>,
  )
}

// ---------- transactions ----------

app.post('/tx', async (c) => {
  if (!isParent(c)) return c.redirect('/')
  const db = c.env.DB
  const b = await c.req.parseBody()
  const kidId = Number(b.kid_id)
  const cents = parseCents(b.amount)
  const kind = b.kind === 'debit' ? 'debit' : 'deposit'
  const memo = field(b, 'memo').slice(0, 100)
  const to = backTo(b)
  const kid = (await kids(db)).find((k) => k.id === kidId)
  if (!kid) return back(c, to, 'err', 'Pick an account.')
  if (!cents) return back(c, to, 'err', 'Enter an amount greater than $0.')
  if (kind === 'debit' && cents > kid.balance) {
    return back(c, to, 'err', `${kid.display_name} only has ${money(kid.balance)}.`)
  }
  const today = localDate((await getSettings(db))!.timezone)
  const date = field(b, 'date') || today
  if (!isValidDate(date) || date > today) return back(c, to, 'err', 'Pick a real date that isn’t in the future.')
  await db
    .prepare('INSERT INTO transactions (kid_id, amount_cents, type, memo, date, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(kidId, kind === 'debit' ? -cents : cents, kind, memo, date, c.get('user')!.id)
    .run()
  return back(c, to, 'msg', `${kind === 'debit' ? 'Took' : 'Added'} ${money(cents)} ${kind === 'debit' ? 'from' : 'to'} ${kid.display_name}'s account.`)
})

/** Where to send a parent after a transaction change: the page they came from. */
function backTo(b: Record<string, unknown>): string {
  const to = field(b, 'back')
  return /^\/(kid\/\d+)?$/.test(to) ? to : '/'
}

async function balanceOf(db: D1Database, kidId: number): Promise<number> {
  const r = await db.prepare('SELECT COALESCE(SUM(amount_cents), 0) AS total FROM transactions WHERE kid_id = ?').bind(kidId).first<{ total: number }>()
  return r?.total ?? 0
}

app.post('/tx/:id', async (c) => {
  if (!isParent(c)) return c.redirect('/')
  const db = c.env.DB
  const b = await c.req.parseBody()
  const to = backTo(b)
  const tx = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(Number(c.req.param('id'))).first<Tx>()
  if (!tx) return back(c, to, 'err', 'That transaction no longer exists.')

  const cents = parseCents(b.amount)
  if (!cents) return back(c, to, 'err', 'Enter an amount greater than $0.')
  const today = localDate((await getSettings(db))!.timezone)
  const date = field(b, 'date')
  if (!isValidDate(date) || date > today) return back(c, to, 'err', 'Pick a real date that isn’t in the future.')
  // Deposits and debits can be switched; allowance and interest keep their type.
  const type = tx.type === 'deposit' || tx.type === 'debit' ? (b.kind === 'debit' ? 'debit' : 'deposit') : tx.type
  const amount = type === 'debit' ? -cents : cents
  const newBalance = (await balanceOf(db, tx.kid_id)) - tx.amount_cents + amount
  if (newBalance < 0) return back(c, to, 'err', `That would leave the account at ${money(newBalance)}.`)

  await db.prepare('UPDATE transactions SET amount_cents = ?, type = ?, memo = ?, date = ? WHERE id = ?')
    .bind(amount, type, field(b, 'memo').slice(0, 100), date, tx.id)
    .run()
  return back(c, to, 'msg', 'Transaction updated.')
})

app.post('/tx/:id/delete', async (c) => {
  if (!isParent(c)) return c.redirect('/')
  const db = c.env.DB
  const to = backTo(await c.req.parseBody())
  const tx = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(Number(c.req.param('id'))).first<Tx>()
  if (!tx) return back(c, to, 'err', 'That transaction no longer exists.')
  const newBalance = (await balanceOf(db, tx.kid_id)) - tx.amount_cents
  if (newBalance < 0) return back(c, to, 'err', `Deleting that would leave the account at ${money(newBalance)}.`)
  // Keep the key's row gone for good: allowance/interest for that day won't be re-paid,
  // because catch-up only looks at days after the last processed date.
  await db.prepare('DELETE FROM transactions WHERE id = ?').bind(tx.id).run()
  return back(c, to, 'msg', 'Transaction deleted.')
})

// ---------- parent settings ----------

app.get('/admin', async (c) => {
  if (!isParent(c)) return c.redirect('/')
  const db = c.env.DB
  const s = (await getSettings(db))!
  const users = (await db.prepare(`SELECT ${USER_COLS} FROM users ORDER BY role DESC, display_name`).all<User>()).results
  const stats = new Map(
    (await db.prepare('SELECT kid_id, COUNT(*) AS n, SUM(amount_cents) AS balance FROM transactions GROUP BY kid_id')
      .all<{ kid_id: number; n: number; balance: number }>()).results.map((r) => [r.kid_id, r]),
  )

  return c.html(
    <Layout title="Settings" user={c.get('user')} kids={c.get('navKids')} active="settings" {...flash(c)}>
      <h1>Settings <span>· allowance, interest &amp; accounts</span></h1>

      <div class="card">
        <h2>Interest Rate</h2>
        <form class="row" method="post" action="/admin/rate">
          <label>Yearly rate (%)<input name="rate" inputmode="decimal" value={String(s.interest_rate_bps / 100)} required /></label>
          <button class="primary" style="flex:0 0 auto">Save</button>
        </form>
        <p class="muted" style="margin-bottom:0">Paid on the 1st of each month: end-of-month balance × rate ÷ 12.</p>
      </div>

      {users.filter((u) => u.role === 'kid').map((k) => (
        <div class="card">
          <div class="row" style="align-items:center;margin-bottom:12px">
            <div style="flex:0 0 auto"><Avatar user={k} size={44} /></div>
            <div><strong>{k.display_name}</strong> <span class="muted">· username: {k.username}</span></div>
          </div>
          <form class="stack" method="post" action={`/admin/users/${k.id}`}>
            <div class="row">
              <label>Name<input name="display_name" value={k.display_name} required maxlength={40} /></label>
              <label>Username (for logging in)<input name="username" value={k.username} required autocapitalize="none" pattern="[a-zA-Z0-9_\-]+" maxlength={30} /></label>
            </div>
            <div class="row">
              <label>Weekly allowance<input name="allowance" inputmode="decimal" value={(k.allowance_cents / 100).toFixed(2)} /></label>
              <label>Paid on<DaySelect name="allowance_day" value={k.allowance_day} /></label>
              <label>New password<input name="password" type="password" placeholder="Leave blank to keep" autocomplete="new-password" /></label>
            </div>
            <div class="dialog-buttons" style="justify-content:space-between">
              <button class="primary">Save {k.display_name}</button>
              <button type="submit" class="pill danger" formaction={`/admin/users/${k.id}/delete`} formnovalidate
                onclick={`return confirm(${JSON.stringify(deleteWarning(k.display_name, stats.get(k.id)))})`}>
                Delete account
              </button>
            </div>
          </form>
        </div>
      ))}

      <div class="card">
        <h2>Add an Account</h2>
        <form class="stack" method="post" action="/admin/users">
          <div class="row">
            <label>Username<input name="username" required autocapitalize="none" pattern="[a-zA-Z0-9_\-]+" /></label>
            <label>Password<input name="password" type="password" required minlength={4} autocomplete="new-password" /></label>
            <label>Type
              <select name="role">
                <option value="kid">Kid (savings account)</option>
                <option value="parent">Parent (banker)</option>
              </select>
            </label>
          </div>
          <div><button class="primary">Add account</button></div>
        </form>
        <p class="muted" style="margin-bottom:0">Kids can set their own name and photo after logging in.</p>
      </div>

      <div class="card">
        <h2>Parents</h2>
        {users.filter((u) => u.role === 'parent').map((p) => (
          <div class="row" style="align-items:center;margin-bottom:8px">
            <div style="flex:0 0 auto"><Avatar user={p} size={32} /></div>
            <div>{p.display_name} <span class="muted">· {p.username}</span></div>
          </div>
        ))}
      </div>
    </Layout>,
  )
})

app.post('/admin/rate', async (c) => {
  if (!isParent(c)) return c.redirect('/')
  const pct = Number(field(await c.req.parseBody(), 'rate').replace('%', ''))
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return back(c, '/admin', 'err', 'Enter a rate between 0 and 100.')
  await c.env.DB.prepare("UPDATE settings SET value = ? WHERE key = 'interest_rate_bps'").bind(String(Math.round(pct * 100))).run()
  return back(c, '/admin', 'msg', `Interest rate set to ${pct}% a year.`)
})

app.post('/admin/users', async (c) => {
  if (!isParent(c)) return c.redirect('/')
  const b = await c.req.parseBody()
  const username = field(b, 'username').toLowerCase()
  const password = field(b, 'password')
  const role = b.role === 'parent' ? 'parent' : 'kid'
  if (!/^[a-z0-9_-]{1,30}$/.test(username)) return back(c, '/admin', 'err', 'Usernames can use letters, numbers, - and _.')
  if (password.length < (role === 'parent' ? 8 : 4)) {
    return back(c, '/admin', 'err', `Password must be at least ${role === 'parent' ? 8 : 4} characters.`)
  }
  try {
    await c.env.DB.prepare('INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)')
      .bind(username, await hashPassword(password), role, username.toUpperCase())
      .run()
  } catch {
    return back(c, '/admin', 'err', `The username "${username}" is taken.`)
  }
  return back(c, '/admin', 'msg', `Added ${username}.`)
})

function deleteWarning(name: string, stats?: { n: number; balance: number }): string {
  const history = stats ? `its ${money(stats.balance)} balance and all ${stats.n} transaction${stats.n === 1 ? '' : 's'}` : 'its history'
  return `Delete ${name}'s account, ${history}?\n\nThis can't be undone in the app. (A full database rollback within 7 days can bring it back; see Help.)`
}

app.post('/admin/users/:id', async (c) => {
  if (!isParent(c)) return c.redirect('/')
  const db = c.env.DB
  const id = Number(c.req.param('id'))
  const b = await c.req.parseBody()
  const name = field(b, 'display_name').slice(0, 40)
  const username = field(b, 'username').toLowerCase()
  if (!name) return back(c, '/admin', 'err', 'Name can’t be blank.')
  if (!/^[a-z0-9_-]{1,30}$/.test(username)) return back(c, '/admin', 'err', 'Usernames can use letters, numbers, - and _.')
  const taken = await db.prepare('SELECT 1 FROM users WHERE username = ? AND id != ?').bind(username, id).first()
  if (taken) return back(c, '/admin', 'err', `The username "${username}" is taken.`)
  const cents = parseCents(b.allowance || '0')
  const day = Number(b.allowance_day)
  if (cents === null || !(day >= 0 && day <= 6)) return back(c, '/admin', 'err', 'Check the allowance amount.')
  const password = field(b, 'password')
  if (password && password.length < 4) return back(c, '/admin', 'err', 'Password must be at least 4 characters.')

  await db.prepare("UPDATE users SET display_name = ?, username = ?, allowance_cents = ?, allowance_day = ? WHERE id = ? AND role = 'kid'")
    .bind(name, username, cents, day, id)
    .run()
  if (password) {
    await db.batch([
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ? AND role = 'kid'").bind(await hashPassword(password), id),
      db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    ])
  }
  return back(c, '/admin', 'msg', `Saved ${name}.`)
})

app.post('/admin/users/:id/delete', async (c) => {
  if (!isParent(c)) return c.redirect('/')
  const db = c.env.DB
  const id = Number(c.req.param('id'))
  const kid = await db.prepare("SELECT display_name FROM users WHERE id = ? AND role = 'kid'").bind(id).first<{ display_name: string }>()
  if (!kid) return back(c, '/admin', 'err', 'That account no longer exists.')
  // Children first: transactions and sessions point at the user.
  await db.batch([
    db.prepare('DELETE FROM transactions WHERE kid_id = ?').bind(id),
    db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    db.prepare("DELETE FROM users WHERE id = ? AND role = 'kid'").bind(id),
  ])
  return back(c, '/admin', 'msg', `Deleted ${kid.display_name}'s account.`)
})

// ---------- help (parents) ----------

app.get('/help', async (c) => {
  if (!isParent(c)) return c.redirect('/')
  const db = c.env.DB
  const s = (await getSettings(db))!
  const kids = (
    await db.prepare("SELECT display_name, username, allowance_cents, allowance_day FROM users WHERE role = 'kid' ORDER BY display_name")
      .all<{ display_name: string; username: string; allowance_cents: number; allowance_day: number }>()
  ).results
  const counts = await db
    .prepare("SELECT (SELECT COUNT(*) FROM users WHERE role = 'parent') AS parents, COUNT(*) AS transactions, MIN(date) AS first FROM transactions")
    .first<{ parents: number; transactions: number; first: string | null }>()
  return c.html(
    <Layout title="Help" user={c.get('user')} kids={c.get('navKids')} active="help">
      <HelpContent
        status={{
          origin: new URL(c.req.url).origin,
          timezone: s.timezone,
          interestRateBps: s.interest_rate_bps,
          lastProcessed: s.last_processed_date,
          kids,
          parents: counts?.parents ?? 0,
          transactions: counts?.transactions ?? 0,
          firstDate: counts?.first ?? null,
        }}
      />
    </Layout>,
  )
})

// ---------- my profile (everyone) ----------

app.get('/me', (c) => {
  const user = c.get('user')!
  return c.html(
    <Layout title="My Profile" user={user} kids={c.get('navKids')} active="me" {...flash(c)}>
      <h1>My Profile <span>· name, photo &amp; password</span></h1>
      <div class="card">
        <form class="stack" method="post" action="/me">
          <div class="row" style="align-items:center">
            <div id="photo-preview" style="flex:0 0 auto"><Avatar user={user} size={96} /></div>
            <label>Photo<input id="photo-file" type="file" accept="image/*" /></label>
          </div>
          <input type="hidden" name="photo" id="photo-data" />
          <label>Name<input name="display_name" value={user.display_name} required maxlength={40} /></label>
          <label>New password<input name="password" type="password" placeholder="Leave blank to keep" autocomplete="new-password" /></label>
          <div><button class="primary">Save</button></div>
        </form>
        <script dangerouslySetInnerHTML={{ __html: PHOTO_SCRIPT }} />
      </div>
    </Layout>,
  )
})

app.post('/me', async (c) => {
  const db = c.env.DB
  const user = c.get('user')!
  const b = await c.req.parseBody()
  const name = field(b, 'display_name').slice(0, 40)
  const photo = field(b, 'photo')
  const password = field(b, 'password')
  if (!name) return back(c, '/me', 'err', 'Your name can’t be blank.')
  const minLen = user.role === 'parent' ? 8 : 4
  if (password && password.length < minLen) return back(c, '/me', 'err', `Password must be at least ${minLen} characters.`)
  if (photo && (!photo.startsWith('data:image/jpeg;base64,') || photo.length > 300_000)) {
    return back(c, '/me', 'err', 'That photo didn’t work. Try another one.')
  }

  const stmts = [db.prepare('UPDATE users SET display_name = ? WHERE id = ?').bind(name, user.id)]
  if (photo) stmts.push(db.prepare('UPDATE users SET photo = ?, photo_v = photo_v + 1 WHERE id = ?').bind(photo, user.id))
  if (password) {
    stmts.push(db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(password), user.id))
    stmts.push(db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').bind(user.id, getCookie(c, 'sid') ?? ''))
  }
  await db.batch(stmts)
  return back(c, '/me', 'msg', 'Saved!')
})

app.get('/photo/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT photo FROM users WHERE id = ?').bind(Number(c.req.param('id'))).first<{ photo: string | null }>()
  if (!row?.photo) return c.notFound()
  const bytes = Uint8Array.from(atob(row.photo.split(',')[1]), (ch) => ch.charCodeAt(0))
  return c.body(bytes, 200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable' })
})

export default app
