import type { Child } from 'hono/jsx'
import { DAYS, money, prettyDate, type Tx, type User } from './lib'

const CSS = `
:root {
  --bg: #f6f9fc; --card: #fff; --text: #061b31; --soft-text: #50617a; --muted: #727f96; --line: #e5edf5;
  --brand: #533afd; --brand-hover: #4434d4; --brand-ink: #fff; --brand-tint: #f2f0ff;
  --in: #006908; --out: #061b31; --focus: rgba(83, 58, 253, .25);
  --shadow: 0 1px 1px rgba(6, 27, 49, .04), 0 2px 6px -1px rgba(50, 50, 93, .1);
  --ribbon: conic-gradient(from 210deg at 65% 55%, #ffcb57, #ff8a4c, #ff4f8b, #c45cf0, #7a5cff, #533afd, #82d8ff, #ffcb57);
  --b-green-bg: #d7f7c2; --b-green: #006908; --b-blue-bg: #cff5f6; --b-blue: #0055bc;
  --b-purple-bg: #e8e5ff; --b-purple: #4434d4; --b-gray-bg: #ebeef1; --b-gray: #545969;
  --err-bg: #fff0f0; --err: #b3093c;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0a1a2f; --card: #10233d; --text: #f6f9fc; --soft-text: #b6c2d4; --muted: #8d9ab0; --line: #1f3450;
    --brand: #7a73ff; --brand-hover: #8f89ff; --brand-ink: #fff; --brand-tint: #1d2a5a;
    --in: #6fe08a; --out: #f6f9fc; --focus: rgba(122, 115, 255, .35);
    --shadow: 0 1px 2px rgba(0, 0, 0, .3);
    --b-green-bg: #12402a; --b-green: #8ef0a5; --b-blue-bg: #0f3a52; --b-blue: #8fd8ff;
    --b-purple-bg: #2a2a66; --b-purple: #c3bfff; --b-gray-bg: #22344c; --b-gray: #b6c2d4;
    --err-bg: #3d1424; --err: #ff9db5;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.55 "Inter", system-ui, -apple-system, sans-serif;
  font-feature-settings: "ss01", "cv11"; -webkit-font-smoothing: antialiased; position: relative; overflow-x: hidden; }
a { color: var(--brand); text-decoration: none; font-weight: 500; }
a:hover { color: var(--brand-hover); }

header { background: var(--card); border-bottom: 1px solid var(--line); position: relative; z-index: 1; }
header .wrap { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; min-height: 60px; padding-top: 10px; padding-bottom: 10px; }
.logo { display: flex; align-items: center; gap: 10px; color: var(--text); font-weight: 600; font-size: 1.05rem; letter-spacing: -.02em; margin-right: auto; }
.logo:hover { color: var(--text); }
.logo .mark { width: 26px; height: 26px; border-radius: 6px; background: var(--ribbon); display: grid; place-items: center;
  color: #fff; font-size: 14px; font-weight: 700; box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
header nav { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
header nav a { color: var(--soft-text); font-size: .9rem; }
header nav a:hover { color: var(--text); }
header nav button { font: inherit; font-size: .85rem; font-weight: 500; color: var(--text); background: var(--card);
  border: 1px solid var(--line); border-radius: 4px; padding: 5px 12px; cursor: pointer; }
header nav button:hover { border-color: var(--muted); }

.wrap { max-width: 920px; margin: 0 auto; padding: 0 16px; }
main { padding: 32px 0 64px; position: relative; z-index: 1; }
h1 { font-size: 2rem; font-weight: 300; letter-spacing: -.025em; line-height: 1.15; margin: 0 0 24px; }
h1 span, .soft { color: var(--muted); }
h2 { font-size: 1rem; font-weight: 600; letter-spacing: -.01em; margin: 0 0 16px; }
.muted { color: var(--muted); }
.label { color: var(--soft-text); font-size: .8rem; font-weight: 500; }

.card { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 24px; margin-bottom: 20px; box-shadow: var(--shadow); }
.grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); margin-bottom: 20px; }
.kid { display: flex; flex-direction: column; gap: 14px; background: var(--card); border: 1px solid var(--line); border-radius: 8px;
  padding: 16px; color: var(--text); box-shadow: var(--shadow); transition: border-color .15s, transform .15s; }
.kid:hover { color: var(--text); border-color: var(--brand); transform: translateY(-1px); }
.kid .who { display: flex; align-items: center; gap: 10px; font-weight: 500; min-width: 0; }
.kid .who span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kid .bal { font-size: 1.5rem; font-weight: 300; letter-spacing: -.02em; }
.num, .bal, td.amt, .stat .value { font-variant-numeric: tabular-nums; }

.avatar { border-radius: 50%; object-fit: cover; background: linear-gradient(135deg, #7a5cff, #ff4f8b); color: #fff;
  display: inline-flex; align-items: center; justify-content: center; font-weight: 600; flex: none; }

.hero { position: relative; overflow: hidden; padding: 32px 28px; }
.hero .ribbon { position: absolute; inset: -60% -20% -60% 35%; background: var(--ribbon); filter: blur(40px); opacity: .85;
  transform: rotate(-12deg); -webkit-mask-image: linear-gradient(to right, transparent, #000 45%); mask-image: linear-gradient(to right, transparent, #000 45%); }
.hero > * { position: relative; }
.hero .who { display: flex; align-items: center; gap: 12px; font-size: 1.25rem; font-weight: 300; letter-spacing: -.02em; margin-bottom: 24px; }
.hero .bal { font-size: 3.25rem; font-weight: 300; letter-spacing: -.035em; line-height: 1.1; margin-top: 4px; }

.stats { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); margin-bottom: 20px; }
.stat { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 16px; box-shadow: var(--shadow); }
.stat .label { margin-bottom: 6px; }
.stat .value { font-size: 1.35rem; font-weight: 400; letter-spacing: -.02em; }
.stat .muted { font-size: .8rem; }

.table { overflow-x: auto; margin: 0 -24px -8px; }
table { width: 100%; border-collapse: collapse; font-size: .875rem; }
td, th { padding: 11px 8px; border-top: 1px solid var(--line); text-align: left; vertical-align: middle; }
td:first-child, th:first-child { padding-left: 24px; } td:last-child, th:last-child { padding-right: 24px; }
th { color: var(--muted); font-weight: 600; font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; border-top: 0; padding-top: 0; }
tbody tr:hover { background: var(--bg); }
td.amt { text-align: right; font-weight: 500; white-space: nowrap; }
td.date { color: var(--muted); white-space: nowrap; }
.in { color: var(--in); } .out { color: var(--out); }
.badge { display: inline-block; font-size: .72rem; font-weight: 500; line-height: 1; padding: 4px 6px; border-radius: 4px; white-space: nowrap; }
.badge.interest { background: var(--b-green-bg); color: var(--b-green); }
.badge.allowance { background: var(--b-blue-bg); color: var(--b-blue); }
.badge.deposit { background: var(--b-purple-bg); color: var(--b-purple); }
.badge.debit { background: var(--b-gray-bg); color: var(--b-gray); }
td .memo { margin-right: 8px; }

form.stack { display: grid; gap: 16px; }
label { display: grid; gap: 6px; font-weight: 500; font-size: .8rem; color: var(--soft-text); }
input, select { font: inherit; font-size: .95rem; color: var(--text); background: var(--card); width: 100%; padding: 9px 12px;
  border: 1px solid var(--line); border-radius: 4px; box-shadow: 0 1px 1px rgba(6,27,49,.04); transition: border-color .15s, box-shadow .15s; }
input:focus, select:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--focus); }
input[type=file] { padding: 7px; font-size: .85rem; }
.row { display: flex; gap: 12px; flex-wrap: wrap; align-items: end; }
.row > * { flex: 1 1 150px; }
button.primary { font: inherit; font-weight: 500; font-size: .95rem; padding: 10px 18px; border: 0; border-radius: 4px;
  background: var(--brand); color: var(--brand-ink); cursor: pointer; transition: background .15s; }
button.primary::after { content: "›"; display: inline-block; margin-left: 8px; transition: transform .15s; }
button.primary:hover { background: var(--brand-hover); }
button.primary:hover::after { transform: translateX(3px); }
.toggle { display: flex; background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 3px; gap: 3px; }
.toggle label { flex: 1; display: block; text-align: center; padding: 7px; border-radius: 4px; cursor: pointer; font-size: .9rem; color: var(--soft-text); }
.toggle label:has(input:checked) { background: var(--card); color: var(--text); box-shadow: var(--shadow); }
.toggle input { position: absolute; opacity: 0; pointer-events: none; }
.toggle label:has(input:focus-visible) { box-shadow: 0 0 0 3px var(--focus); }

.msg { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; background: var(--brand-tint); color: var(--text); font-size: .9rem; border: 1px solid var(--line); }
.msg.err { background: var(--err-bg); color: var(--err); }
.chart { width: 100%; height: 160px; display: block; }
.login { max-width: 420px; margin: 24px 0; padding: 32px; }
.page-ribbon { position: absolute; z-index: 0; top: -200px; right: -260px; width: 760px; height: 900px; background: var(--ribbon);
  filter: blur(60px); opacity: .75; transform: rotate(-24deg); border-radius: 40%; pointer-events: none; }
@media (max-width: 600px) {
  h1 { font-size: 1.6rem; }
  .hero .bal { font-size: 2.6rem; }
  .card { padding: 20px; } .table { margin: 0 -20px -4px; }
  td:first-child, th:first-child { padding-left: 20px; } td:last-child, th:last-child { padding-right: 20px; }
  .page-ribbon { right: -480px; opacity: .55; }
}
`

export function Layout(props: { title: string; user?: User | null; msg?: string; err?: string; children: Child }) {
  const u = props.user
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.title} · Bank of Allen</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%23533afd'/><text x='16' y='23' font-family='Arial' font-weight='700' font-size='19' fill='white' text-anchor='middle'>A</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>
      <body>
        {!u && <div class="page-ribbon" />}
        <header>
          <div class="wrap">
            <a class="logo" href="/"><span class="mark">A</span>Bank of Allen</a>
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
  const xy = points.map((p, i) => `${(i / (points.length - 1)) * 300},${95 - ((p - min) / (max - min)) * 90}`)
  return (
    <svg class="chart" viewBox="0 0 300 100" preserveAspectRatio="none" role="img" aria-label="Balance over time">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--brand)" stop-opacity=".18" />
          <stop offset="1" stop-color="var(--brand)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${xy.join(' ')} 300,100`} fill="url(#fade)" />
      <polyline points={xy.join(' ')} fill="none" stroke="var(--brand)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
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
