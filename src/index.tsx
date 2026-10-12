import { Hono, type Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import {
  addDays, catchUp, DAYS, getSettings, hashPassword, localDate, money, newToken, nextAllowanceDate,
  parseCents, prettyDate, USER_COLS, verifyPassword, type Tx, type User,
} from './lib'
import { Avatar, BalanceChart, DaySelect, Layout, PHOTO_SCRIPT, TxTable } from './views'

type Env = { Bindings: { DB: D1Database }; Variables: { user: User | null } }
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
        <h1>Open the Bank of Allen</h1>
        <p class="muted">Create the first parent (banker) account. You'll add the kids next.</p>
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
    <Layout title="Log in" {...flash(c)}>
      <div class="card login">
        <h1>Log in</h1>
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
  const b = await c.req.parseBody()
  const row = await c.env.DB.prepare('SELECT id, password_hash FROM users WHERE username = ?')
    .bind(field(b, 'username').toLowerCase())
    .first<{ id: number; password_hash: string }>()
  if (!row || !(await verifyPassword(field(b, 'password'), row.password_hash))) {
    return back(c, '/login', 'err', 'Wrong username or password.')
  }
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

  return c.html(
    <Layout title="Home" user={user} {...flash(c)}>
      <h1>Accounts</h1>
      {all.length === 0 && <p class="card">No kid accounts yet. <a href="/admin">Add one in Settings</a>.</p>}
      <div class="grid">
        {all.map((k) => (
          <a class="kid" href={`/kid/${k.id}`}>
            <Avatar user={k} size={64} />
            <div>{k.display_name}</div>
            <div class="bal">{money(k.balance)}</div>
          </a>
        ))}
      </div>

      {all.length > 0 && (
        <div class="card">
          <h2>Add a transaction</h2>
          <form class="stack" method="post" action="/tx">
            <div class="row">
              <label>Account
                <select name="kid_id" required>
                  {all.map((k) => <option value={String(k.id)}>{k.display_name}</option>)}
                </select>
              </label>
              <label>Amount<input name="amount" inputmode="decimal" placeholder="0.00" required /></label>
            </div>
            <div class="toggle">
              <label><input type="radio" name="kind" value="deposit" checked /> 💵 Deposit</label>
              <label><input type="radio" name="kind" value="debit" /> 🛍️ Debit</label>
            </div>
            <label>What for?<input name="memo" maxlength={100} placeholder="e.g. Birthday money, LEGO set" /></label>
            <button class="primary">Save</button>
          </form>
        </div>
      )}

      <div class="card">
        <h2>Recent activity</h2>
        <TxTable txs={recent} names={names} />
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

  return c.html(
    <Layout title={kid.display_name} user={viewer} {...flash(c)}>
      <div class="card hero">
        <Avatar user={kid} size={96} />
        <div class="muted" style="margin-top:8px">{isMe ? `Hi ${kid.display_name}! You have` : `${kid.display_name} has`}</div>
        <div class="bal">{money(balance)}</div>
        <div class="muted">in savings</div>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="label">Next allowance</div>
          <div class="value">{nextAllowance ? `+${money(kid.allowance_cents)}` : '—'}</div>
          <div class="muted">{nextAllowance ? `${DAYS[kid.allowance_day]}, ${prettyDate(nextAllowance)}` : 'Not set up'}</div>
        </div>
        <div class="stat">
          <div class="label">Interest rate</div>
          <div class="value">{s.interest_rate_bps / 100}% a year</div>
          <div class="muted">≈ +{money(nextInterest)} next month</div>
        </div>
        <div class="stat">
          <div class="label">Interest earned this year</div>
          <div class="value in">{money(interestYear)}</div>
          <div class="muted">{money(interestAll)} all time</div>
        </div>
      </div>

      {txs.length > 1 && (
        <div class="card">
          <h2>Balance over time</h2>
          <BalanceChart txs={txs} />
        </div>
      )}

      <div class="card">
        <h2>History</h2>
        <TxTable txs={[...txs].reverse()} />
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
  const kid = (await kids(db)).find((k) => k.id === kidId)
  if (!kid) return back(c, '/', 'err', 'Pick an account.')
  if (!cents) return back(c, '/', 'err', 'Enter an amount greater than $0.')
  if (kind === 'debit' && cents > kid.balance) {
    return back(c, '/', 'err', `${kid.display_name} only has ${money(kid.balance)}.`)
  }
  const s = (await getSettings(db))!
  await db
    .prepare('INSERT INTO transactions (kid_id, amount_cents, type, memo, date, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(kidId, kind === 'debit' ? -cents : cents, kind, memo, localDate(s.timezone), c.get('user')!.id)
    .run()
  return back(c, '/', 'msg', `${kind === 'debit' ? 'Took' : 'Added'} ${money(cents)} ${kind === 'debit' ? 'from' : 'to'} ${kid.display_name}'s account.`)
})

// ---------- parent settings ----------

app.get('/admin', async (c) => {
  if (!isParent(c)) return c.redirect('/')
  const db = c.env.DB
  const s = (await getSettings(db))!
  const users = (await db.prepare(`SELECT ${USER_COLS} FROM users ORDER BY role DESC, display_name`).all<User>()).results

  return c.html(
    <Layout title="Settings" user={c.get('user')} {...flash(c)}>
      <h1>Bank settings</h1>

      <div class="card">
        <h2>Interest rate</h2>
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
              <label>Weekly allowance<input name="allowance" inputmode="decimal" value={(k.allowance_cents / 100).toFixed(2)} /></label>
              <label>Paid on<DaySelect name="allowance_day" value={k.allowance_day} /></label>
              <label>New password<input name="password" type="password" placeholder="Leave blank to keep" autocomplete="new-password" /></label>
            </div>
            <div><button class="primary">Save {k.display_name}</button></div>
          </form>
        </div>
      ))}

      <div class="card">
        <h2>Add an account</h2>
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

app.post('/admin/users/:id', async (c) => {
  if (!isParent(c)) return c.redirect('/')
  const db = c.env.DB
  const id = Number(c.req.param('id'))
  const b = await c.req.parseBody()
  const cents = parseCents(b.allowance || '0')
  const day = Number(b.allowance_day)
  if (cents === null || !(day >= 0 && day <= 6)) return back(c, '/admin', 'err', 'Check the allowance amount.')
  const password = field(b, 'password')
  if (password && password.length < 4) return back(c, '/admin', 'err', 'Password must be at least 4 characters.')

  await db.prepare("UPDATE users SET allowance_cents = ?, allowance_day = ? WHERE id = ? AND role = 'kid'").bind(cents, day, id).run()
  if (password) {
    await db.batch([
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ? AND role = 'kid'").bind(await hashPassword(password), id),
      db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    ])
  }
  return back(c, '/admin', 'msg', 'Saved.')
})

// ---------- my profile (everyone) ----------

app.get('/me', (c) => {
  const user = c.get('user')!
  return c.html(
    <Layout title="My profile" user={user} {...flash(c)}>
      <h1>My profile</h1>
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
