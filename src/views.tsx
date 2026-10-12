import type { Child } from 'hono/jsx'
import { DAYS, money, prettyDate, type Tx, type User } from './lib'

const CSS = `
:root {
  --bg: #f4f6fb; --card: #fff; --text: #1d2433; --muted: #6b7385; --line: #e3e7ef;
  --brand: #2f6b4f; --brand-ink: #fff; --in: #1f8a4c; --out: #c0392b; --soft: #eaf4ee;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #12151c; --card: #1c212b; --text: #e8ebf2; --muted: #9aa3b5; --line: #2c3340;
    --brand: #4fae80; --brand-ink: #0d1a13; --in: #5fd08f; --out: #ff7b6e; --soft: #1f3a2c;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text);
  font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
a { color: var(--brand); }
header { background: var(--brand); color: var(--brand-ink); }
header .wrap { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding-top: 12px; padding-bottom: 12px; }
header .logo { font-weight: 800; font-size: 1.15rem; color: inherit; text-decoration: none; margin-right: auto; }
header nav { display: flex; gap: 14px; align-items: center; }
header nav a, header nav button { color: inherit; text-decoration: none; font: inherit; background: none; border: 0; padding: 0; cursor: pointer; opacity: .9; }
.wrap { max-width: 860px; margin: 0 auto; padding: 0 16px; }
main { padding: 24px 0 48px; }
h1 { font-size: 1.5rem; margin: 0 0 16px; }
h2 { font-size: 1.1rem; margin: 0 0 12px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; margin-bottom: 18px; }
.grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); margin-bottom: 18px; }
.kid { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px;
  background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 14px 8px; text-decoration: none; color: inherit; }
.kid .bal { font-size: 1.25rem; font-weight: 800; }
.avatar { border-radius: 50%; object-fit: cover; background: var(--soft); color: var(--brand);
  display: inline-flex; align-items: center; justify-content: center; font-weight: 800; flex: none; }
.hero { text-align: center; padding: 28px 18px; }
.hero .bal { font-size: 3rem; font-weight: 800; letter-spacing: -1px; margin: 6px 0; }
.stats { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin-bottom: 18px; }
.stat { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 14px; }
.stat .label { color: var(--muted); font-size: .85rem; }
.stat .value { font-size: 1.25rem; font-weight: 700; }
.muted { color: var(--muted); }
table { width: 100%; border-collapse: collapse; }
td, th { padding: 10px 6px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
th { color: var(--muted); font-weight: 600; font-size: .85rem; }
td.amt { text-align: right; font-weight: 700; white-space: nowrap; }
.in { color: var(--in); } .out { color: var(--out); }
form.stack { display: grid; gap: 12px; }
label { display: grid; gap: 4px; font-weight: 600; font-size: .9rem; }
input, select { font: inherit; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--text); width: 100%; }
.row { display: flex; gap: 10px; flex-wrap: wrap; align-items: end; }
.row > * { flex: 1 1 140px; }
button.primary { font: inherit; font-weight: 700; padding: 11px 18px; border: 0; border-radius: 10px; background: var(--brand); color: var(--brand-ink); cursor: pointer; }
.toggle { display: flex; gap: 8px; }
.toggle label { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 1px solid var(--line); border-radius: 10px; cursor: pointer; }
.toggle input { width: auto; }
.msg { padding: 12px 14px; border-radius: 10px; margin-bottom: 18px; background: var(--soft); }
.msg.err { background: #fde8e6; color: #8c2318; }
.chart { width: 100%; height: 140px; display: block; }
.login { max-width: 380px; margin: 40px auto; }
`

export function Layout(props: { title: string; user?: User | null; msg?: string; err?: string; children: Child }) {
  const u = props.user
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.title} · Bank of Allen</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏦</text></svg>" />
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>
      <body>
        <header>
          <div class="wrap">
            <a class="logo" href="/">🏦 Bank of Allen</a>
            {u && (
              <nav>
                <a href="/">Home</a>
                {u.role === 'parent' && <a href="/admin">Settings</a>}
                <a href="/me">My profile</a>
                <form method="post" action="/logout" style="margin:0">
                  <button>Log out</button>
                </form>
              </nav>
            )}
          </div>
        </header>
        <main class="wrap">
          {props.msg && <div class="msg">{props.msg}</div>}
          {props.err && <div class="msg err">{props.err}</div>}
          {props.children}
        </main>
      </body>
    </html>
  )
}

export function Avatar({ user, size }: { user: Pick<User, 'id' | 'display_name' | 'has_photo' | 'photo_v'>; size: number }) {
  const style = `width:${size}px;height:${size}px;font-size:${Math.round(size / 2.4)}px`
  return user.has_photo ? (
    <img class="avatar" style={style} src={`/photo/${user.id}?v=${user.photo_v}`} alt="" />
  ) : (
    <span class="avatar" style={style}>{user.display_name.slice(0, 1).toUpperCase()}</span>
  )
}

export function Amount({ cents }: { cents: number }) {
  return <span class={cents >= 0 ? 'in' : 'out'}>{cents >= 0 ? '+' : '−'}{money(Math.abs(cents))}</span>
}

const ICONS: Record<Tx['type'], string> = { deposit: '💵', debit: '🛍️', allowance: '📅', interest: '🌱' }

export function TxTable({ txs, names }: { txs: Tx[]; names?: Map<number, string> }) {
  if (txs.length === 0) return <p class="muted">No activity yet.</p>
  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          {names && <th>Who</th>}
          <th>What</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {txs.map((t) => (
          <tr>
            <td class="muted" style="white-space:nowrap">{prettyDate(t.date)}</td>
            {names && <td>{names.get(t.kid_id)}</td>}
            <td>{ICONS[t.type]} {t.memo || t.type}</td>
            <td class="amt"><Amount cents={t.amount_cents} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Balance over time as a simple SVG area chart. `txs` must be oldest first. */
export function BalanceChart({ txs }: { txs: Tx[] }) {
  const points: number[] = []
  let bal = 0
  txs.forEach((t, i) => {
    bal += t.amount_cents
    if (i === txs.length - 1 || txs[i + 1].date !== t.date) points.push(bal)
  })
  if (points.length < 2) return null
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const xy = points.map((p, i) => `${(i / (points.length - 1)) * 300},${95 - ((p - min) / (max - min)) * 90}`)
  return (
    <svg class="chart" viewBox="0 0 300 100" preserveAspectRatio="none" role="img" aria-label="Balance over time">
      <polygon points={`0,100 ${xy.join(' ')} 300,100`} fill="var(--soft)" />
      <polyline points={xy.join(' ')} fill="none" stroke="var(--brand)" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
    </svg>
  )
}

export function DaySelect({ name, value }: { name: string; value: number }) {
  return (
    <select name={name}>
      {DAYS.map((d, i) => (
        <option value={String(i)} selected={i === value}>{d}</option>
      ))}
    </select>
  )
}

/** Resizes the chosen photo to a 256px square JPEG in the browser before upload. */
export const PHOTO_SCRIPT = `
document.getElementById('photo-file').addEventListener('change', async (e) => {
  const file = e.target.files[0]; if (!file) return;
  const img = await createImageBitmap(file);
  const s = Math.min(img.width, img.height), c = document.createElement('canvas');
  c.width = c.height = 256;
  c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256);
  const url = c.toDataURL('image/jpeg', 0.85);
  document.getElementById('photo-data').value = url;
  document.getElementById('photo-preview').innerHTML = '<img class="avatar" style="width:96px;height:96px" src="' + url + '">';
});
`
