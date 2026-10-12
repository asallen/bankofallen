import type { Child } from 'hono/jsx'
import { DAYS, money, prettyDate, type Tx, type User } from './lib'

const CSS = `
:root {
  color-scheme: light;
  --bg: #f6f6f8; --card: #fff; --raised: #f1f1f5; --raised-hover: #e8e8ee; --field: #fff;
  --text: #1e1e2a; --soft-text: #3f4157; --muted: #6e7189; --placeholder: #a3a5b8;
  --line: #ebebf0; --line-strong: #dcdde6;
  --brand: #5266eb; --brand-hover: #4256dc; --brand-ink: #fff; --brand-lite: #4a5de0;
  --in: #14804f; --out: #1e1e2a; --focus: rgba(82, 102, 235, .22);
  --shadow: 0 1px 2px rgba(30, 30, 42, .04), 0 6px 20px -6px rgba(30, 30, 42, .06);
  --page-wash: radial-gradient(70% 50% at 0% 100%, rgba(255, 205, 185, .28), transparent 70%),
               radial-gradient(70% 60% at 100% 100%, rgba(200, 208, 255, .45), transparent 70%);
  --glow: radial-gradient(120% 90% at 90% -20%, rgba(82, 102, 235, .07), transparent 60%);
  --page-glow: radial-gradient(60% 60% at 50% 0%, rgba(82, 102, 235, .14), transparent 70%),
               radial-gradient(40% 40% at 15% 40%, rgba(255, 190, 160, .2), transparent 70%);
  --login-bg: rgba(255, 255, 255, .88);
  --msg-bg: #eef0fe; --err: #b4233c; --err-bg: #fdecef;
  --b-interest: #11734a; --b-interest-bg: #e2f5eb; --b-allowance: #4256dc; --b-allowance-bg: #eceefe;
  --b-deposit: #3a4570; --b-deposit-bg: #eaf0ff;
  --chart-line: #5266eb; --chart-fill: rgba(82, 102, 235, .14);
}
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --bg: #171721; --card: #1e1e2a; --raised: #272735; --raised-hover: #31313f; --field: #171721;
    --text: #ededf3; --soft-text: #c3c5d9; --muted: #8e91ad; --placeholder: #5f6280;
    --line: rgba(175, 178, 206, .14); --line-strong: rgba(175, 178, 206, .28);
    --brand: #5266eb; --brand-hover: #6476f0; --brand-ink: #fff; --brand-lite: #a9b4ff;
    --in: #7fd1a6; --out: #ededf3; --focus: rgba(82, 102, 235, .45);
    --shadow: none;
    --page-wash: none;
    --glow: radial-gradient(120% 90% at 85% -10%, rgba(82, 102, 235, .38), transparent 60%),
            radial-gradient(80% 70% at 10% 120%, rgba(205, 221, 255, .08), transparent 60%);
    --page-glow: radial-gradient(60% 60% at 50% 0%, rgba(82, 102, 235, .35), transparent 70%),
                 radial-gradient(40% 40% at 80% 30%, rgba(205, 221, 255, .08), transparent 70%);
    --login-bg: rgba(30, 30, 42, .85);
    --msg-bg: rgba(82, 102, 235, .14); --err: #ff9aa8; --err-bg: rgba(255, 110, 130, .1);
    --b-interest: #9fe3bf; --b-interest-bg: rgba(127, 209, 166, .12); --b-allowance: #a9b4ff; --b-allowance-bg: rgba(82, 102, 235, .18);
    --b-deposit: #cdddff; --b-deposit-bg: rgba(205, 221, 255, .1);
    --chart-line: #c3c9ff; --chart-fill: rgba(169, 180, 255, .22);
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; background: var(--bg); }
body { margin: 0; background: var(--page-wash), var(--bg); background-attachment: fixed; min-height: 100vh; color: var(--text); font: 15px/1.55 "DM Sans", system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased; position: relative; overflow-x: hidden; }
a { color: var(--brand-lite); text-decoration: none; }
a:hover { color: var(--text); }

header { position: relative; z-index: 1; }
header .wrap { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; min-height: 68px; padding-top: 12px; padding-bottom: 12px; }
.logo { display: flex; align-items: center; gap: 10px; color: var(--text); margin-right: auto;
  font-size: .82rem; font-weight: 500; letter-spacing: .22em; text-transform: uppercase; }
.logo:hover { color: var(--text); }
.logo svg { width: 30px; height: 30px; flex: none; }
header nav { display: flex; gap: 22px; align-items: center; flex-wrap: wrap; }
header nav a { color: var(--soft-text); font-size: .92rem; }
header nav a:hover { color: var(--text); }
header nav button { font: inherit; font-size: .88rem; color: var(--text); background: var(--raised); border: 0;
  border-radius: 32px; padding: 7px 16px; cursor: pointer; }
header nav button:hover { background: var(--raised-hover); }

.wrap { max-width: 960px; margin: 0 auto; padding: 0 16px; }
main { padding: 20px 0 72px; position: relative; z-index: 1; }
h1 { font-size: 2.1rem; font-weight: 500; letter-spacing: -.01em; line-height: 1.15; margin: 0 0 24px; }
h1 span, .soft { color: var(--muted); }
h2 { font-size: .95rem; font-weight: 500; margin: 0 0 16px; }
.muted { color: var(--muted); }
.sm { font-size: .82rem; }
.label { color: var(--muted); font-size: .85rem; }

.card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: var(--shadow); }
.num, .bal, td.amt, .stat .value { font-variant-numeric: tabular-nums; }
.money sup { font-size: .5em; vertical-align: .75em; line-height: 0; margin-left: 1px; letter-spacing: 0; }

.avatar { border-radius: 50%; object-fit: cover; background: var(--raised); color: var(--soft-text);
  box-shadow: inset 0 0 0 1px var(--line-strong); display: inline-flex; align-items: center; justify-content: center; font-weight: 500; flex: none; }

.hero { position: relative; overflow: hidden; background: var(--glow), var(--card); }
.hero > * { position: relative; }
.hero .bal { font-size: 3.4rem; font-weight: 400; letter-spacing: -.02em; line-height: 1.1; margin: 6px 0 4px; }
.hero .chart { margin: 20px -8px -8px; }

.list { margin: 20px -24px -24px; }
.list-head { display: flex; justify-content: space-between; padding: 0 24px 10px; color: var(--muted); font-size: .8rem; border-bottom: 1px solid var(--line); }
.list-row { display: flex; align-items: center; gap: 14px; padding: 14px 24px; color: var(--text); border-bottom: 1px solid var(--line); transition: background .12s; }
.list-row:last-child { border-bottom: 0; border-radius: 0 0 12px 12px; }
.list-row:hover { background: var(--raised); color: var(--text); }
.list-row .grow { flex: 1; min-width: 0; }
.list-row .num { font-size: 1.05rem; }

.stats { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-bottom: 16px; }
.stat { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 18px; box-shadow: var(--shadow); }
.stat .label { margin-bottom: 8px; }
.stat .value { font-size: 1.45rem; font-weight: 400; }
.stat .muted { font-size: .82rem; margin-top: 2px; }

.table { overflow-x: auto; margin: 0 -24px -12px; }
table { width: 100%; border-collapse: collapse; font-size: .9rem; }
td, th { padding: 13px 8px; border-top: 1px solid var(--line); text-align: left; vertical-align: middle; }
td:first-child, th:first-child { padding-left: 24px; } td:last-child, th:last-child { padding-right: 24px; }
th { color: var(--muted); font-weight: 400; font-size: .8rem; border-top: 0; padding-top: 0; }
tbody tr:hover { background: var(--raised); }
td.amt { text-align: right; white-space: nowrap; }
td.date { color: var(--muted); white-space: nowrap; }
.in { color: var(--in); } .out { color: var(--out); }
.badge { display: inline-block; font-size: .74rem; line-height: 1; padding: 4px 9px; border-radius: 32px; white-space: nowrap;
  color: var(--soft-text); background: var(--raised); }
.badge.interest { color: var(--b-interest); background: var(--b-interest-bg); }
.badge.allowance { color: var(--b-allowance); background: var(--b-allowance-bg); }
.badge.deposit { color: var(--b-deposit); background: var(--b-deposit-bg); }
td .memo { margin-right: 8px; }

form.stack { display: grid; gap: 16px; }
label { display: grid; gap: 6px; font-size: .85rem; color: var(--muted); }
input, select { font: inherit; font-size: .95rem; color: var(--text); background: var(--field); width: 100%; padding: 10px 14px;
  border: 1px solid var(--line-strong); border-radius: 8px; transition: border-color .15s, box-shadow .15s; }
input::placeholder { color: var(--placeholder); }
input:focus, select:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--focus); }
input[type=file] { padding: 8px; font-size: .85rem; }
.row { display: flex; gap: 12px; flex-wrap: wrap; align-items: end; }
.row > * { flex: 1 1 150px; }
button.primary { font: inherit; font-weight: 500; font-size: .95rem; padding: 11px 22px; border: 0; border-radius: 32px;
  background: var(--brand); color: var(--brand-ink); cursor: pointer; transition: background .15s; }
button.primary:hover { background: var(--brand-hover); }
.toggle { display: flex; background: var(--raised); border: 1px solid var(--line-strong); border-radius: 32px; padding: 4px; gap: 4px; }
.toggle label { flex: 1; display: block; text-align: center; padding: 7px; border-radius: 32px; cursor: pointer; font-size: .92rem; color: var(--muted); }
.toggle label:has(input:checked) { background: var(--card); color: var(--text); box-shadow: 0 1px 3px rgba(30, 30, 42, .12); }
.toggle input { position: absolute; opacity: 0; pointer-events: none; }
.toggle label:has(input:focus-visible) { box-shadow: 0 0 0 3px var(--focus); }

.msg { padding: 12px 18px; border-radius: 12px; margin-bottom: 16px; background: var(--msg-bg); color: var(--text); font-size: .92rem; }
.msg.err { background: var(--err-bg); color: var(--err); }
.chart { width: 100%; height: 160px; display: block; }
.login { max-width: 420px; margin: 8vh auto 0; padding: 32px; background: var(--login-bg); backdrop-filter: blur(12px); }
.login h1 { text-align: center; font-size: 1.9rem; }
.page-glow { position: absolute; inset: 0 0 auto; height: 720px; z-index: 0; pointer-events: none; background: var(--page-glow); }
@media (max-width: 600px) {
  h1 { font-size: 1.7rem; }
  .hero .bal { font-size: 2.7rem; }
  .card { padding: 20px; } .table { margin: 0 -20px -8px; } .list { margin: 16px -20px -20px; }
  .list-head, .list-row { padding-left: 20px; padding-right: 20px; }
  td:first-child, th:first-child { padding-left: 20px; } td:last-child, th:last-child { padding-right: 20px; }
  header nav { gap: 16px; }
}
`

export function Layout(props: { title: string; user?: User | null; msg?: string; err?: string; children: Child }) {
  const u = props.user
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f6f6f8" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#171721" media="(prefers-color-scheme: dark)" />
        <title>{props.title} · Bank of Allen</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%231e1e2a'/><g fill='none' stroke='%23ededf3' stroke-width='1.6'><circle cx='16' cy='16' r='9.5'/><circle cx='16' cy='13.5' r='6.5'/><circle cx='16' cy='11.5' r='3.5'/></g></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" />
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>
      <body>
        {!u && <div class="page-glow" />}
        <header>
          <div class="wrap">
            <a class="logo" href="/"><LogoMark />Bank of Allen</a>
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

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1e1e2a" />
      <rect x=".5" y=".5" width="31" height="31" rx="7.5" fill="none" stroke="rgba(175,178,206,.3)" />
      <g fill="none" stroke="#ededf3" stroke-width="1.3">
        <circle cx="16" cy="16" r="9.5" />
        <circle cx="16" cy="13.5" r="6.5" />
        <circle cx="16" cy="11.5" r="3.5" />
      </g>
    </svg>
  )
}

/** "$1,234.56" with the cents raised and small, Mercury-style. */
export function Money({ cents, sign }: { cents: number; sign?: boolean }) {
  const [dollars, change] = money(Math.abs(cents)).split('.')
  const prefix = cents < 0 ? '−' : sign ? '+' : ''
  return <span class="money">{prefix}{dollars}<sup>.{change}</sup></span>
}

export function Amount({ cents }: { cents: number }) {
  return <span class={cents >= 0 ? 'in' : 'out'}><Money cents={cents} sign /></span>
}

const LABELS: Record<Tx['type'], string> = { deposit: 'Deposit', debit: 'Debit', allowance: 'Allowance', interest: 'Interest' }

export function TxTable({ txs, names }: { txs: Tx[]; names?: Map<number, string> }) {
  if (txs.length === 0) return <p class="muted">No activity yet.</p>
  return (
    <div class="table">
    <table>
      <thead>
        <tr>
          <th>Date</th>
          {names && <th>Who</th>}
          <th>Description</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {txs.map((t) => (
          <tr>
            <td class="date">{prettyDate(t.date)}</td>
            {names && <td>{names.get(t.kid_id)}</td>}
            <td>
              {t.memo && <span class="memo">{t.memo}</span>}
              <span class={`badge ${t.type}`}>{LABELS[t.type]}</span>
            </td>
            <td class="amt"><Amount cents={t.amount_cents} /></td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
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
  const pts = points.map((p, i) => [(i / (points.length - 1)) * 300, 95 - ((p - min) / (max - min)) * 90])
  // Smooth line through the midpoints (never overshoots the real values).
  let line = `M${pts[0]}`
  for (let i = 1; i < pts.length - 1; i++) {
    line += ` Q${pts[i]} ${(pts[i][0] + pts[i + 1][0]) / 2},${(pts[i][1] + pts[i + 1][1]) / 2}`
  }
  line += ` L${pts[pts.length - 1]}`
  return (
    <svg class="chart" viewBox="0 0 300 100" preserveAspectRatio="none" role="img" aria-label="Balance over time">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--chart-fill)" />
          <stop offset="1" stop-color="var(--chart-fill)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L300,100 L0,100 Z`} fill="url(#fade)" />
      <path d={line} fill="none" stroke="var(--chart-line)" stroke-width="1.75" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
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
