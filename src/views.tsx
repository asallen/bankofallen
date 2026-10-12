import type { Child } from 'hono/jsx'
import { addDays, DAYS, money, prettyDate, savingsSeries, type Tx, type User } from './lib'

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
  --chart-saved: #5266eb; --chart-interest: #4cbb86;
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
    --chart-saved: #6274f0; --chart-interest: #3fae7c;
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
.savings-chart { margin-top: 20px; }
.savings-chart .legend { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: .82rem; color: var(--muted); margin-bottom: 10px; }
.savings-chart .legend span { display: inline-flex; align-items: center; gap: 6px; }
.savings-chart .legend i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
.savings-chart .legend b { color: var(--text); font-weight: 500; font-variant-numeric: tabular-nums; }
.savings-chart .axis { position: relative; height: 18px; margin-top: 6px; font-size: .75rem; color: var(--muted); }
.savings-chart .axis span { position: absolute; transform: translateX(-50%); white-space: nowrap; }
.streak { display: inline-flex; align-items: center; gap: 5px; font-size: .8rem; padding: 4px 11px; border-radius: 32px;
  color: var(--b-allowance); background: var(--b-allowance-bg); white-space: nowrap; }
.streak svg { width: 14px; height: 14px; }
.from-interest { color: var(--in); font-size: .9rem; }

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

/* ---- app shell: sidebar on desktop, compact top bar on phones ---- */
.shell { display: grid; grid-template-columns: 248px minmax(0, 1fr); min-height: 100vh; }
.side { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; gap: 4px; padding: 16px 12px;
  background: var(--card); border-right: 1px solid var(--line); overflow-y: auto; z-index: 2; }
.side .logo { padding: 6px 10px 18px; margin: 0 -12px 12px; padding-left: 22px; border-bottom: 1px solid var(--line); }
.side-nav { display: flex; flex-direction: column; gap: 2px; }
.side-link { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: 8px; color: var(--soft-text);
  font: inherit; font-size: .95rem; background: none; border: 0; width: 100%; text-align: left; cursor: pointer; white-space: nowrap; }
.side-link:hover { background: var(--raised); color: var(--text); }
.side-link.active { background: var(--raised); color: var(--text); box-shadow: inset 0 0 0 1px var(--line); }
.side-link.active svg { color: var(--brand); }
.side-link svg { width: 18px; height: 18px; flex: none; color: var(--muted); }
.side-link .avatar { margin: 0 -2px; }
.side-label { color: var(--muted); font-size: .82rem; padding: 18px 10px 6px; }
.side-foot { margin-top: auto; padding-top: 12px; border-top: 1px solid var(--line); }
.content { padding: 36px 40px 72px; max-width: 1000px; width: 100%; position: relative; z-index: 1; }

.actions { display: flex; gap: 10px; flex-wrap: wrap; margin: -8px 0 24px; }
.pill { display: inline-flex; align-items: center; gap: 8px; font: inherit; font-size: .95rem; padding: 9px 18px; border-radius: 32px;
  border: 0; cursor: pointer; background: var(--raised); color: var(--text); box-shadow: inset 0 0 0 1px var(--line); transition: background .15s; }
.pill:hover { background: var(--raised-hover); color: var(--text); }
.pill.primary { background: var(--brand); color: var(--brand-ink); box-shadow: none; }
.pill.primary:hover { background: var(--brand-hover); color: var(--brand-ink); }
.pill svg { width: 16px; height: 16px; }

dialog { border: 1px solid var(--line); border-radius: 16px; padding: 28px; width: min(440px, calc(100% - 32px));
  background: var(--card); color: var(--text); box-shadow: 0 24px 60px -12px rgba(15, 15, 30, .35); }
dialog::backdrop { background: rgba(15, 15, 25, .45); backdrop-filter: blur(3px); }
dialog h2 { font-size: 1.25rem; margin-bottom: 20px; }
.dialog-buttons { display: flex; gap: 10px; justify-content: flex-end; align-items: center; }
.pill.danger { color: var(--err); background: none; box-shadow: none; padding-left: 4px; padding-right: 4px; }
.pill.danger:hover { background: none; text-decoration: underline; }
[hidden] { display: none !important; }
td.edit { width: 1%; padding-left: 0; }
.icon-btn { display: inline-grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: 8px; cursor: pointer;
  background: none; color: var(--muted); }
.icon-btn:hover { background: var(--raised-hover); color: var(--text); }
.icon-btn svg { width: 16px; height: 16px; }
/* ---- help page ---- */
.help-toc { display: flex; flex-wrap: wrap; gap: 6px; margin: -8px 0 20px; }
.help-toc a { font-size: .85rem; color: var(--soft-text); background: var(--card); box-shadow: inset 0 0 0 1px var(--line); padding: 5px 12px; border-radius: 32px; }
.help-toc a:hover { color: var(--text); background: var(--raised); }
.help { scroll-margin-top: 16px; }
.help h2 { font-size: 1.1rem; }
.help p, .help ul { margin: 0 0 14px; color: var(--soft-text); }
.help ul { padding-left: 20px; }
.help li { margin-bottom: 8px; }
.help strong { color: var(--text); font-weight: 500; }
.help > :last-child { margin-bottom: 0; }
code { font: .85em/1.4 ui-monospace, "SF Mono", Menlo, monospace; background: var(--raised); padding: 1px 5px; border-radius: 4px; }
.cmd { display: flex; align-items: center; gap: 8px; background: var(--raised); border-radius: 8px; padding: 8px 8px 8px 14px; margin: 0 0 14px; }
.cmd code { flex: 1; min-width: 0; background: none; padding: 0; overflow-x: auto; white-space: nowrap; }
.cmd .copy { width: auto; padding: 0 10px; font: inherit; font-size: .8rem; flex: none; }
.warn { background: var(--err-bg); color: var(--err) !important; padding: 10px 14px; border-radius: 8px; font-size: .9rem; }
.facts { display: grid; grid-template-columns: max-content 1fr; gap: 10px 24px; margin: 0; }
.facts dt { color: var(--muted); }
.facts dd { margin: 0; }
@media (max-width: 600px) { .facts { grid-template-columns: 1fr; gap: 2px; } .facts dd { margin-bottom: 10px; } }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

@media (max-width: 900px) {
  .shell { display: block; }
  .side { position: static; height: auto; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px 12px;
    padding: 10px 16px; border-right: 0; border-bottom: 1px solid var(--line); }
  .side .logo { padding: 4px 0; margin: 0; border: 0; }
  .side-nav { grid-column: 1 / -1; flex-direction: row; overflow-x: auto; gap: 4px; margin: 0 -4px; }
  .side-link { width: auto; padding: 7px 12px; font-size: .9rem; }
  .side-label, .side-link.kid { display: none; }
  .side-foot { margin: 0; padding: 0; border: 0; grid-column: 2; grid-row: 1; }
  .side-foot .side-link { padding: 6px 12px; background: var(--raised); border-radius: 32px; font-size: .85rem; }
  .side-foot svg { display: none; }
  .content { padding: 24px 16px 64px; }
}

@media (max-width: 600px) {
  h1 { font-size: 1.7rem; }
  .hero .bal { font-size: 2.7rem; }
  .card { padding: 20px; } .table { margin: 0 -20px -8px; } .list { margin: 16px -20px -20px; }
  .list-head, .list-row { padding-left: 20px; padding-right: 20px; }
  td:first-child, th:first-child { padding-left: 20px; } td:last-child, th:last-child { padding-right: 20px; }
  header nav { gap: 16px; }
}
`

export type NavKid = Pick<User, 'id' | 'display_name' | 'has_photo' | 'photo_v'>

type LayoutProps = {
  title: string
  user?: User | null
  kids?: NavKid[]
  active?: string // 'home' | 'settings' | 'help' | 'me' | `kid:${id}`
  msg?: string
  err?: string
  children: Child
}

function Sidebar({ user, kids = [], active }: { user: User; kids?: NavKid[]; active?: string }) {
  const link = (key: string) => `side-link${active === key ? ' active' : ''}`
  return (
    <aside class="side">
      <a class="logo" href="/"><LogoMark />Bank of Allen</a>
      <nav class="side-nav">
        <a class={link('home')} href="/"><Icon name="home" />Home</a>
        {user.role === 'parent' && kids.length > 0 && <div class="side-label">Accounts</div>}
        {user.role === 'parent' &&
          kids.map((k) => (
            <a class={`${link(`kid:${k.id}`)} kid`} href={`/kid/${k.id}`}><Avatar user={k} size={22} />{k.display_name}</a>
          ))}
        {user.role === 'parent' && <div class="side-label">Bank</div>}
        {user.role === 'parent' && <a class={link('settings')} href="/admin"><Icon name="settings" />Settings</a>}
        {user.role === 'parent' && <a class={link('help')} href="/help"><Icon name="help" />Help</a>}
        <a class={link('me')} href="/me"><Icon name="user" />My profile</a>
      </nav>
      <form class="side-foot" method="post" action="/logout">
        <button class="side-link"><Icon name="logout" />Log out</button>
      </form>
    </aside>
  )
}

export function Layout(props: LayoutProps) {
  const u = props.user
  const flash = (
    <>
      {props.msg && <div class="msg">{props.msg}</div>}
      {props.err && <div class="msg err">{props.err}</div>}
    </>
  )
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
        {u ? (
          <div class="shell">
            <Sidebar user={u} kids={props.kids} active={props.active} />
            <main class="content">
              {flash}
              {props.children}
            </main>
          </div>
        ) : (
          <>
            <div class="page-glow" />
            <header>
              <div class="wrap">
                <a class="logo" href="/"><LogoMark />Bank of Allen</a>
              </div>
            </header>
            <main class="wrap">
              {flash}
              {props.children}
            </main>
          </>
        )}
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

const ICON_PATHS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  settings: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  logout: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10',
  deposit: 'M12 5v14M5 12h14',
  debit: 'M5 12h14',
  flame: 'M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.2 2.3-5.3 3.8-7.6.4 1.8 1.4 2.9 2.6 3.4.2-2.6 1.4-5.2 3.6-7.1-.3 3 1.5 4.7 2.6 6.4.9 1.4 1.4 2.8 1.4 4.6 0 3.9-3.5 6.5-7.5 6.5z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01',
}

export function Icon({ name }: { name: keyof typeof ICON_PATHS }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={ICON_PATHS[name]} />
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

export function TxTable({ txs, names, editable }: { txs: Tx[]; names?: Map<number, string>; editable?: boolean }) {
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
          {editable && <th><span class="sr">Edit</span></th>}
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
            {editable && (
              <td class="edit">
                <button type="button" class="icon-btn" title="Edit" aria-label="Edit transaction"
                  data-edit={String(t.id)} data-type={t.type} data-amount={(Math.abs(t.amount_cents) / 100).toFixed(2)}
                  data-memo={t.memo} data-date={t.date}>
                  <Icon name="edit" />
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}

/** Smooth path through points, passing through the midpoints so it never overshoots. */
function smoothPath(pts: number[][]): string {
  let d = `M${pts[0]}`
  for (let i = 1; i < pts.length - 1; i++) {
    d += ` Q${pts[i]} ${(pts[i][0] + pts[i + 1][0]) / 2},${(pts[i][1] + pts[i + 1][1]) / 2}`
  }
  return d + ` L${pts[pts.length - 1]}`
}

/**
 * Balance over time as two stacked layers: what the kid saved (periwinkle)
 * and what interest added on top (green). Spaced by real dates.
 */
export function SavingsChart({ txs, today }: { txs: Tx[]; today: string }) {
  const series = savingsSeries(txs, today)
  if (series.length < 2) return null
  const t = (d: string) => Date.parse(d + 'T00:00:00Z')
  const t0 = t(series[0].date)
  const span = Math.max(t(today) - t0, 1)
  const max = Math.max(...series.map((p) => p.saved + p.interest), 1)
  const x = (d: string) => ((t(d) - t0) / span) * 300
  const y = (cents: number) => 96 - (cents / max) * 88
  // Interest is tiny next to savings at first, so give it a minimum visible
  // thickness once there is any. The amounts in the legend stay exact.
  const minBand = max * 0.035
  const total = smoothPath(series.map((p) => [x(p.date), y(p.saved + (p.interest > 0 ? Math.max(p.interest, minBand) : 0))]))
  const saved = smoothPath(series.map((p) => [x(p.date), y(p.saved)]))
  const last = series[series.length - 1]

  // Month labels at each 1st inside the range (at most ~6, so they don't crowd).
  const months: { left: number; label: string }[] = []
  for (let d = addDays(series[0].date.slice(0, 7) + '-01', 32).slice(0, 7) + '-01'; d <= today; d = addDays(d, 32).slice(0, 7) + '-01') {
    months.push({ left: (x(d) / 300) * 100, label: new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' }) })
  }
  const step = Math.ceil(months.length / 6)

  return (
    <div class="savings-chart">
      <div class="legend">
        <span><i style="background:var(--chart-saved)" />You saved <b>{money(last.saved)}</b></span>
        <span><i style="background:var(--chart-interest)" />Bank paid you <b>{money(last.interest)}</b></span>
      </div>
      <svg class="chart" viewBox="0 0 300 100" preserveAspectRatio="none" role="img"
        aria-label={`Balance over time: ${money(last.saved)} saved plus ${money(last.interest)} from interest`}>
        <path d={`${total} L300,100 L0,100 Z`} fill="var(--chart-interest)" />
        <path d={`${saved} L300,100 L0,100 Z`} fill="var(--chart-saved)" />
        <line x1="0" y1="99.5" x2="300" y2="99.5" stroke="var(--line-strong)" vector-effect="non-scaling-stroke" />
      </svg>
      <div class="axis">
        {months.filter((_, i) => i % step === 0).map((m) => <span style={`left:${m.left}%`}>{m.label}</span>)}
      </div>
    </div>
  )
}

/** Deposit / Debit pill buttons. Pass `kidId` to preselect that account in the dialog. */
export function TxActions({ kidId }: { kidId?: number }) {
  return (
    <div class="actions">
      <button type="button" class="pill primary" data-tx="deposit" data-kid={kidId ? String(kidId) : undefined}><Icon name="deposit" />Deposit</button>
      <button type="button" class="pill" data-tx="debit" data-kid={kidId ? String(kidId) : undefined}><Icon name="debit" />Debit</button>
    </div>
  )
}

/** The transaction form, shown in a dialog when a TxActions button is clicked. */
export function TxDialog({ kids, back, today }: { kids: NavKid[]; back: string; today: string }) {
  return (
    <dialog id="tx-dialog">
      <h2>New transaction</h2>
      <form class="stack" method="post" action="/tx">
        <input type="hidden" name="back" value={back} />
        <div class="toggle">
          <label><input type="radio" name="kind" value="deposit" checked />Deposit</label>
          <label><input type="radio" name="kind" value="debit" />Debit</label>
        </div>
        <label>Account
          <select name="kid_id" required>
            {kids.map((k) => <option value={String(k.id)}>{k.display_name}</option>)}
          </select>
        </label>
        <div class="row">
          <label>Amount<input name="amount" inputmode="decimal" placeholder="0.00" required /></label>
          <label>Date<input name="date" type="date" value={today} max={today} required /></label>
        </div>
        <label>What for?<input name="memo" maxlength={100} placeholder="e.g. Birthday money, LEGO set" /></label>
        <div class="dialog-buttons">
          <button type="button" class="pill" onclick="this.closest('dialog').close()">Cancel</button>
          <button class="primary">Save</button>
        </div>
      </form>
      <script dangerouslySetInnerHTML={{ __html: TX_SCRIPT }} />
    </dialog>
  )
}

/** Edit or delete an existing transaction. Filled in from the row's Edit button. */
export function EditTxDialog({ back, today }: { back: string; today: string }) {
  return (
    <dialog id="edit-dialog">
      <h2>Edit transaction</h2>
      <form class="stack" method="post">
        <input type="hidden" name="back" value={back} />
        <div class="toggle" data-kind-toggle>
          <label><input type="radio" name="kind" value="deposit" />Deposit</label>
          <label><input type="radio" name="kind" value="debit" />Debit</label>
        </div>
        <p class="muted sm" data-auto-note style="margin:0">Automatic <span data-type-name></span> payment.</p>
        <div class="row">
          <label>Amount<input name="amount" inputmode="decimal" required /></label>
          <label>Date<input name="date" type="date" max={today} required /></label>
        </div>
        <label>What for?<input name="memo" maxlength={100} /></label>
        <div class="dialog-buttons">
          <button type="submit" class="pill danger" data-delete formnovalidate
            onclick="return confirm('Delete this transaction? This can’t be undone.')">Delete</button>
          <span style="flex:1" />
          <button type="button" class="pill" onclick="this.closest('dialog').close()">Cancel</button>
          <button class="primary">Save</button>
        </div>
      </form>
      <script dangerouslySetInnerHTML={{ __html: EDIT_SCRIPT }} />
    </dialog>
  )
}

const EDIT_SCRIPT = `
(() => {
  const d = document.getElementById('edit-dialog'), f = d.querySelector('form');
  // Delegated: the table rows come after this script in the page.
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-edit]');
    if (!b) return;
    const t = b.dataset, manual = t.type === 'deposit' || t.type === 'debit';
    f.action = '/tx/' + t.edit;
    d.querySelector('[data-delete]').formAction = '/tx/' + t.edit + '/delete';
    d.querySelector('[data-kind-toggle]').hidden = !manual;
    d.querySelector('[data-auto-note]').hidden = manual;
    d.querySelector('[data-type-name]').textContent = t.type;
    if (manual) f.querySelector('input[name=kind][value=' + t.type + ']').checked = true;
    f.amount.value = t.amount; f.date.value = t.date; f.memo.value = t.memo || '';
    d.showModal();
  });
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
})();
`

const TX_SCRIPT = `
(() => {
  const d = document.getElementById('tx-dialog');
  document.querySelectorAll('[data-tx]').forEach((b) => b.addEventListener('click', () => {
    d.querySelector('input[name=kind][value=' + b.dataset.tx + ']').checked = true;
    if (b.dataset.kid) d.querySelector('select[name=kid_id]').value = b.dataset.kid;
    d.showModal();
    d.querySelector('input[name=amount]').focus();
  }));
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
})();
`

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
