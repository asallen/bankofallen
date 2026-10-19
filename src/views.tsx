import type { Child } from 'hono/jsx'
import { addDays, CATEGORIES, cashBreakdown, DAYS, money, prettyDate, savingsSeries, weekday, type Tx, type User } from './lib'

const CSS = `
:root {
  /* Palette — cream #FFFCF4/#F2EAD3/#E5DDC3 · gold #DAA025/#F2B636/#FFD13F/#FFE278/#FFF1BA
     · leaf #73AE48/#A6C45F/#C2E067 · tulip #FF3157/#FF667D/#FF9CAC · navy #040D23/#111E3D/#1E2E56
     · royal #154373/#225780 · sky #1880AF · violet #714DFE/#9E66FF/#C082FF.
     Vibrant gradients for chart fills; subtle gradients for backgrounds. */
  color-scheme: light;
  --font-text: "Rethink Sans", "Helvetica Neue", Arial, sans-serif;
  --font-display: "Rethink Sans", "Helvetica Neue", Arial, sans-serif;
  --bg: #FFFCF4; --card: #FFFFFF; --raised: #F8F4E7; --raised-hover: #F2EAD3; --field: #FFFFFF;
  --text: #111E3D; --soft-text: #1E2E56; --muted: #6A7290; --placeholder: #A6ABBE;
  --line: #F2EAD3; --line-strong: #E5DDC3;
  --brand: #FFD13F; --brand-hover: #F2B636; --brand-ink: #111E3D; --brand-lite: #225780;
  --in: #4C8A2A; --out: #111E3D; --focus: rgba(255, 209, 63, .45); --focus-border: #DAA025;
  --shadow: 0 1px 2px rgba(17, 30, 61, .05), 0 6px 20px -6px rgba(17, 30, 61, .08);
  --page-wash: radial-gradient(45% 40% at 88% 8%, rgba(255, 226, 120, .22), transparent 70%),
               radial-gradient(40% 35% at 8% 22%, rgba(255, 156, 172, .10), transparent 70%),
               radial-gradient(50% 45% at 20% 100%, rgba(194, 224, 103, .14), transparent 70%),
               radial-gradient(45% 40% at 95% 95%, rgba(255, 152, 96, .08), transparent 70%),
               linear-gradient(180deg, #FFFCF4, #F8F4E7);
  --glow: radial-gradient(110% 90% at 95% -20%, rgba(255, 226, 120, .28), transparent 60%),
          radial-gradient(80% 70% at 0% 120%, rgba(194, 224, 103, .14), transparent 60%);
  --page-glow: radial-gradient(60% 60% at 50% 0%, rgba(255, 226, 120, .35), transparent 70%),
               radial-gradient(40% 40% at 15% 45%, rgba(255, 156, 172, .14), transparent 70%);
  --login-bg: rgba(255, 255, 255, .9);
  --msg-bg: #FFF1BA; --err: #D41F45; --err-bg: #FFE6EA;
  --avatar-bg: #FFE278; --avatar-ink: #111E3D;
  --b-interest: #3F7420; --b-interest-bg: #EEF6D8; --b-allowance: #225780; --b-allowance-bg: #E2EEF6;
  --b-deposit: #7A5300; --b-deposit-bg: #FFF1BA; --b-debit: #C21E44; --b-debit-bg: #FFE6EA;
  --b-streak: #5B36E8; --b-streak-bg: #EEE8FF;
  --bloom-1: #75AD49; --bloom-2: #B58B61; --bloom-3: #FF677D; --bloom-4: #FF9860; --bloom-5: #FFD042;
  --earned-1: #714DFE; --earned-2: #C082FF;
  --bill-bg: #EEF6D8; --bill-ink: #3F7420; --coin-bg: #F2EAD3; --coin-ink: #6A6450; --penny-bg: #FFD3B8; --penny-ink: #9A4F24;
}
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --bg: #111E3D; --card: #1A2A52; --raised: #22355F; --raised-hover: #2A4070; --field: #111E3D;
    --text: #FFFCF4; --soft-text: #E5DDC3; --muted: #9AA5C3; --placeholder: #5E6C92;
    --line: rgba(255, 252, 244, .1); --line-strong: rgba(255, 252, 244, .2);
    --brand: #FFD13F; --brand-hover: #FFE278; --brand-ink: #111E3D; --brand-lite: #FFE278;
    --in: #C2E067; --out: #FFFCF4; --focus: rgba(255, 209, 63, .4); --focus-border: #FFD13F;
    --shadow: none;
    --page-wash: radial-gradient(45% 40% at 88% 5%, rgba(158, 102, 255, .14), transparent 70%),
                 radial-gradient(50% 45% at 10% 100%, rgba(24, 128, 175, .18), transparent 70%),
                 radial-gradient(40% 35% at 95% 90%, rgba(255, 102, 125, .07), transparent 70%),
                 linear-gradient(180deg, #111E3D, #172649);
    --glow: radial-gradient(110% 90% at 95% -20%, rgba(158, 102, 255, .22), transparent 60%),
            radial-gradient(90% 80% at 0% 120%, rgba(24, 128, 175, .3), transparent 60%);
    --page-glow: radial-gradient(60% 60% at 50% 0%, rgba(34, 87, 128, .7), transparent 70%),
                 radial-gradient(40% 40% at 80% 30%, rgba(158, 102, 255, .16), transparent 70%);
    --login-bg: rgba(26, 42, 82, .88);
    --msg-bg: rgba(255, 209, 63, .14); --err: #FF9CAC; --err-bg: rgba(255, 49, 87, .14);
    --avatar-bg: #225780; --avatar-ink: #FFE278;
    --b-interest: #C2E067; --b-interest-bg: rgba(194, 224, 103, .14); --b-allowance: #9FD3F0; --b-allowance-bg: rgba(24, 128, 175, .28);
    --b-deposit: #FFE278; --b-deposit-bg: rgba(255, 209, 63, .16); --b-debit: #FF9CAC; --b-debit-bg: rgba(255, 102, 125, .16);
    --b-streak: #C082FF; --b-streak-bg: rgba(158, 102, 255, .2);
    --earned-1: #9E66FF; --earned-2: #C082FF;
    --bill-bg: #22381F; --bill-ink: #C2E067; --coin-bg: #2A3A62; --coin-ink: #E5DDC3; --penny-bg: #4F3424; --penny-ink: #FFB48D;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; background: var(--bg); overflow-x: clip; }
body { margin: 0; background: var(--page-wash), var(--bg); background-attachment: fixed; min-height: 100vh; color: var(--text); font: 15px/1.55 var(--font-text);
  -webkit-font-smoothing: antialiased; position: relative; overflow-x: hidden; overflow-x: clip; max-width: 100vw; }
a { color: var(--brand-lite); text-decoration: none; }
a:hover { color: var(--text); }

header { position: relative; z-index: 1; }
header .wrap { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; min-height: 68px; padding-top: 12px; padding-bottom: 12px; }
.logo { display: flex; align-items: center; gap: 10px; color: var(--text); margin-right: auto;
  font-family: var(--font-display); font-size: .9rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.logo:hover { color: var(--text); }
.logo img { width: 32px; height: 32px; flex: none; }
.brand-head { position: relative; z-index: 1; display: flex; justify-content: center; padding: 6vh 16px 0; }
.brand-head img { display: block; width: 220px; height: auto; }
header nav { display: flex; gap: 22px; align-items: center; flex-wrap: wrap; }
header nav a { color: var(--soft-text); font-size: .92rem; }
header nav a:hover { color: var(--text); }
header nav button { font: inherit; font-size: .88rem; color: var(--text); background: var(--raised); border: 0;
  border-radius: 32px; padding: 7px 16px; cursor: pointer; }
header nav button:hover { background: var(--raised-hover); }

.wrap { max-width: 960px; margin: 0 auto; padding: 0 16px; }
main { padding: 20px 0 72px; position: relative; z-index: 1; }
h1 { font-family: var(--font-display); font-size: 2.1rem; font-weight: 700; letter-spacing: -.015em; line-height: 1.1; margin: 0 0 24px; }
h1 span, .soft { color: var(--muted); }
h1 span { font-family: var(--font-text); font-size: .5em; font-weight: 400; text-transform: none; letter-spacing: 0; vertical-align: .25em; }
h2 { font-size: .95rem; font-weight: 700; margin: 0 0 16px; }
.muted { color: var(--muted); }
.sm { font-size: .82rem; }
.label { color: var(--muted); font-size: .85rem; }

.card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: var(--shadow); }
.num, .bal, td.amt, .stat .value { font-variant-numeric: tabular-nums; }
.money sup { font-size: .5em; vertical-align: .75em; line-height: 0; margin-left: 1px; letter-spacing: 0; }

.avatar { border-radius: 50%; object-fit: cover; background: var(--avatar-bg); color: var(--avatar-ink);
  box-shadow: inset 0 0 0 1px var(--line-strong); display: inline-flex; align-items: center; justify-content: center; font-weight: 500; flex: none; }

.hero { position: relative; overflow: hidden; background: var(--glow), var(--card); }
.hero > * { position: relative; }
.hero .bal { font-family: var(--font-display); font-size: 3.4rem; font-weight: 700; letter-spacing: -.025em; line-height: 1.05; margin: 6px 0 4px; }
.savings-chart { margin-top: 20px; }
/* Pressing or dragging on the chart (and the cash pictures) shouldn't select text or open iOS's Copy/Look Up menu. */
.savings-chart, .cash { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
.savings-chart .plot { position: relative; touch-action: pan-y; cursor: crosshair; outline: none; border-radius: 4px; }
.savings-chart .plot:focus-visible { box-shadow: 0 0 0 3px var(--focus); }
.y-label { position: absolute; left: 0; transform: translateY(-115%); font-size: .72rem; color: var(--muted);
  font-variant-numeric: tabular-nums; pointer-events: none; text-shadow: 0 0 3px var(--card), 0 0 3px var(--card); }
.hover-line { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1.5px solid var(--text); opacity: .35; pointer-events: none; }
.hover-dot { position: absolute; width: 12px; height: 12px; margin: -6px 0 0 -6px; border-radius: 50%; background: var(--card);
  border: 3px solid var(--text); pointer-events: none; }
.tip { position: absolute; top: 0; margin-left: 12px; min-width: 150px; padding: 10px 12px; border-radius: 10px; pointer-events: none;
  background: var(--card); color: var(--text); border: 1px solid var(--line); box-shadow: 0 8px 24px -6px rgba(17, 30, 61, .25);
  font-size: .8rem; z-index: 2; white-space: nowrap; }
.tip.left { margin-left: 0; transform: translateX(calc(-100% - 12px)); }
.tip-date { color: var(--muted); }
.tip-total { font-size: 1.15rem; font-weight: 700; margin: 2px 0 6px; font-variant-numeric: tabular-nums; }
.tip-row { display: flex; align-items: center; gap: 6px; color: var(--soft-text); font-variant-numeric: tabular-nums; }
.tip-row i { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
.sw-saved { background: linear-gradient(20deg, var(--bloom-1), var(--bloom-3), var(--bloom-5)); }
.sw-earned { background: linear-gradient(90deg, var(--earned-1), var(--earned-2)); }
.savings-chart .grain { position: absolute; inset: 0; pointer-events: none; background-size: 180px 180px;
  mix-blend-mode: overlay; opacity: .7; -webkit-mask-size: 100% 100%; mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; }
.savings-chart .legend { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: .82rem; color: var(--muted); margin-bottom: 10px; }
.savings-chart .legend span { display: inline-flex; align-items: center; gap: 6px; }
.savings-chart .legend i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
.savings-chart .legend b { color: var(--text); font-weight: 500; font-variant-numeric: tabular-nums; }
.savings-chart .axis { position: relative; height: 18px; margin-top: 6px; font-size: .75rem; color: var(--muted); }
.savings-chart .axis span { position: absolute; transform: translateX(-50%); white-space: nowrap; }
.streak { display: inline-flex; align-items: center; gap: 5px; font-size: .8rem; padding: 4px 11px; border-radius: 32px;
  color: var(--b-streak); background: var(--b-streak-bg); white-space: nowrap; }
.streak svg { width: 14px; height: 14px; }
.from-interest { color: var(--in); font-size: .9rem; }
.cash { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; }
.cash[data-cash] { cursor: pointer; border-radius: 8px; transition: transform .15s; }
.cash[data-cash]:hover { transform: translateY(-1px); }
.cash[data-cash]:active { transform: scale(.97); }
.cash[data-cash]:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--focus); }
.cash-item { position: relative; display: inline-flex; align-items: center; gap: 4px; }
.cash-item svg { display: block; overflow: visible; }
.cash-empty { font-size: .78rem; color: var(--muted); }
.bal-row { display: flex; align-items: center; justify-content: space-between; gap: 12px 24px; flex-wrap: wrap; }
.bal-row .cash { justify-content: flex-end; }
.stat .cash { margin-top: 10px; }

.list { margin: 20px -24px -24px; }
.list:first-child { margin-top: 0; }
.list-head { display: flex; justify-content: space-between; padding: 0 24px 10px; color: var(--muted); font-size: .8rem; border-bottom: 1px solid var(--line); }
.list-row { display: flex; align-items: center; gap: 14px; padding: 14px 24px; color: var(--text); border-bottom: 1px solid var(--line); transition: background .12s; }
.list-row:last-child { border-bottom: 0; border-radius: 0 0 12px 12px; }
.list-row:hover { background: var(--raised); color: var(--text); }
.list-row .grow { flex: 1; min-width: 0; }
.list-row .num { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; }

.stats { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-bottom: 16px; }
.stat { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 18px; box-shadow: var(--shadow); }
.stat .label { margin-bottom: 8px; }
.stat .value { font-family: var(--font-display); font-size: 1.45rem; font-weight: 700; letter-spacing: -.01em; }
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
.badge.debit { color: var(--b-debit); background: var(--b-debit-bg); }
td .memo { margin-right: 8px; }
td .cat { margin-right: 8px; color: var(--muted); font-size: .82rem; }
td .memo + .cat::before { content: '· '; }

form.stack { display: grid; gap: 16px; }
label { display: grid; gap: 6px; font-size: .85rem; color: var(--muted); }
input, select { font: inherit; font-size: .95rem; color: var(--text); background: var(--field); width: 100%; padding: 10px 14px;
  border: 1px solid var(--line-strong); border-radius: 8px; transition: border-color .15s, box-shadow .15s; }
input::placeholder { color: var(--placeholder); }
input:focus, select:focus { outline: none; border-color: var(--focus-border); box-shadow: 0 0 0 3px var(--focus); }
input[type=file] { padding: 8px; font-size: .85rem; }
.row { display: flex; gap: 12px; flex-wrap: wrap; align-items: end; }
.row > * { flex: 1 1 150px; }
button.primary { font: inherit; font-weight: 600; font-size: .95rem; padding: 11px 22px; border: 0; border-radius: 32px;
  background: var(--brand); color: var(--brand-ink); cursor: pointer; transition: background .15s; }
button.primary:hover { background: var(--brand-hover); }
.toggle { display: flex; background: var(--raised); border: 1px solid var(--line-strong); border-radius: 32px; padding: 4px; gap: 4px; }
.toggle label { flex: 1; display: block; text-align: center; padding: 7px; border-radius: 32px; cursor: pointer; font-size: .92rem; color: var(--muted); }
.toggle label:has(input:checked) { background: var(--card); color: var(--text); box-shadow: 0 1px 3px rgba(7, 31, 56, .14); }
.toggle input { position: absolute; opacity: 0; pointer-events: none; }
.toggle label:has(input:focus-visible) { box-shadow: 0 0 0 3px var(--focus); }

.msg { padding: 12px 18px; border-radius: 12px; margin-bottom: 16px; background: var(--msg-bg); color: var(--text); font-size: .92rem; }
.msg.err { background: var(--err-bg); color: var(--err); }
.chart { width: 100%; height: 160px; display: block; }
.login { max-width: 420px; margin: 28px auto 0; padding: 32px; background: var(--login-bg); backdrop-filter: blur(12px); }
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
.side-link.active svg { color: var(--brand-lite); }
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
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.card-head h2 { margin: 0; }
.who-row { display: flex; align-items: center; gap: 12px; min-width: 0; }
.setting-value { font-size: 1.45rem; font-weight: 700; margin-bottom: 4px; }
.card-head .pill { padding: 7px 14px; font-size: .88rem; }
.pill.danger { color: var(--err); background: none; box-shadow: none; padding-left: 4px; padding-right: 4px; white-space: nowrap; }
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
  .side { position: static; height: auto; display: grid; grid-template-columns: minmax(0, 1fr) auto; min-width: 0; align-items: center; gap: 8px 12px;
    padding: 10px 16px; border-right: 0; border-bottom: 1px solid var(--line); }
  .side .logo { padding: 4px 0; margin: 0; border: 0; }
  .side-nav { grid-column: 1 / -1; flex-direction: row; overflow-x: auto; gap: 4px; margin: 0; min-width: 0; max-width: 100%;
    -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .side-nav::-webkit-scrollbar { display: none; }
  .side-link { width: auto; padding: 7px 12px; font-size: .9rem; }
  .side-label, .side-link.kid { display: none; }
  .side-foot { margin: 0; padding: 0; border: 0; grid-column: 2; grid-row: 1; }
  .side-foot .side-link { padding: 6px 12px; background: var(--raised); border-radius: 32px; font-size: .85rem; }
  .side-foot svg { display: none; }
  .content { padding: 24px 16px 64px; min-width: 0; }
}

@media (max-width: 600px) {
  .bal-row .cash { justify-content: flex-start; }
  .table { overflow-x: visible; }
  .table table { table-layout: fixed; font-size: .85rem; }
  .table td, .table th { padding-left: 4px; padding-right: 4px; }
  .table .c-date { width: 64px; } .table .c-who { width: 38px; } .table .c-amt { width: 84px; } .table .c-edit { width: 52px; }
  .table td:last-child, .table th:last-child { padding-right: 16px; }
  .table td:first-child, .table th:first-child { padding-left: 20px; width: 80px; }
  .table td { overflow-wrap: anywhere; }
  .table td .badge:not(.solo) { display: none; }
  .table td .memo + .cat::before { content: ''; }
  .table td .cat { display: block; margin-top: 2px; }
  .table td.amt { font-size: .85rem; }
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
      <a class="logo" href="/"><img src="/brand-mark.png" width="32" height="32" alt="" />Bank of Allen</a>
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
        <meta name="theme-color" content="#FFFCF4" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#111E3D" media="(prefers-color-scheme: dark)" />
        <title>{props.title} · Bank of Allen</title>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="apple-mobile-web-app-title" content="Bank of Allen" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rethink+Sans:wght@400;500;600;700&display=swap" />
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
            <header class="brand-head">
              <a href="/" aria-label="Bank of Allen">
                <picture>
                  <source srcset="/lockup-dark.png" media="(prefers-color-scheme: dark)" />
                  <img src="/lockup.png" width="220" height="112" alt="Bank of Allen" />
                </picture>
              </a>
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

/** "Oct 12", plus the year only for dates more than 365 days ago: "Oct 12 '25". */
function shortDate(date: string): string {
  const d = new Date(date + 'T00:00:00Z')
  const md = d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
  return Date.now() - d.getTime() > 365 * 864e5 ? `${md} '${String(d.getUTCFullYear()).slice(2)}` : md
}

const LABELS: Record<Tx['type'], string> = { deposit: 'Deposit', debit: 'Debit', allowance: 'Allowance', interest: 'Interest' }

export function TxTable({ txs, kids, editable }: { txs: Tx[]; kids?: Map<number, NavKid>; editable?: boolean }) {
  if (txs.length === 0) return <p class="muted">No activity yet.</p>
  return (
    <div class="table">
    <table>
      <thead>
        <tr>
          <th class="c-date">Date</th>
          {kids && <th class="c-who">Who</th>}
          <th>Description</th>
          <th class="c-amt" style="text-align:right">Amount</th>
          {editable && <th class="c-edit"><span class="sr">Edit</span></th>}
        </tr>
      </thead>
      <tbody>
        {txs.map((t) => (
          <tr>
            <td class="date" title={prettyDate(t.date)}>{shortDate(t.date)}</td>
            {kids && (
              <td class="who">
                {kids.get(t.kid_id) && (
                  <span title={kids.get(t.kid_id)!.display_name}>
                    <Avatar user={kids.get(t.kid_id)!} size={26} />
                    <span class="sr">{kids.get(t.kid_id)!.display_name}</span>
                  </span>
                )}
              </td>
            )}
            <td>
              {t.memo && <span class="memo">{t.memo}</span>}
              {t.category && <span class="cat">{CATEGORIES[t.category]}</span>}
              {/* On phones the badge is hidden unless it's the only description. */}
              <span class={`badge ${t.type}${!t.memo && !t.category ? ' solo' : ''}`}>{LABELS[t.type]}</span>
            </td>
            <td class="amt"><Amount cents={t.amount_cents} /></td>
            {editable && (
              <td class="edit">
                <button type="button" class="icon-btn" title="Edit" aria-label="Edit transaction"
                  data-edit={String(t.id)} data-type={t.type} data-amount={(Math.abs(t.amount_cents) / 100).toFixed(2)}
                  data-memo={t.memo} data-date={t.date} data-category={t.category ?? ''}>
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

const COIN_NAMES: Record<number, [string, string]> = { 25: ['quarter', 'quarters'], 10: ['dime', 'dimes'], 5: ['nickel', 'nickels'], 1: ['penny', 'pennies'] }
const COIN_R: Record<number, number> = { 25: 12, 10: 9.5, 5: 11, 1: 10 }

function Bill({ cents }: { cents: number }) {
  return (
    <g>
      <rect x=".75" y=".75" width="46.5" height="24.5" rx="3" fill="var(--bill-bg)" stroke="var(--bill-ink)" stroke-width="1.2" />
      <rect x="4" y="4" width="40" height="18" rx="1.5" fill="none" stroke="var(--bill-ink)" stroke-opacity=".35" />
      <text x="24" y="16.5" text-anchor="middle" font-size="10" font-weight="600" fill="var(--bill-ink)">{`$${cents / 100}`}</text>
    </g>
  )
}

function Coin({ cents, cx, cy }: { cents: number; cx: number; cy: number }) {
  const penny = cents === 1
  const r = COIN_R[cents]
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={penny ? 'var(--penny-bg)' : 'var(--coin-bg)'} stroke={penny ? 'var(--penny-ink)' : 'var(--coin-ink)'} stroke-width="1.2" />
      <circle cx={cx} cy={cy} r={r - 2.5} fill="none" stroke={penny ? 'var(--penny-ink)' : 'var(--coin-ink)'} stroke-opacity=".35" />
      <text x={cx} y={cy + 3} text-anchor="middle" font-size={r > 10 ? 9 : 8} font-weight="700" fill={penny ? 'var(--penny-ink)' : 'var(--coin-ink)'}>{cents}</text>
    </g>
  )
}

/** Every bill and coin is drawn: up to 4 per stack (the most of anything but $1,000s), then a new stack. */
function stacks(n: number): number[] {
  const out: number[] = []
  for (let left = n; left > 0; left -= 4) out.push(Math.min(left, 4))
  return out
}

/**
 * An amount drawn as the real bills and coins that make it, so money from the
 * cash days still feels like money. Every bill and coin is drawn, stacked,
 * e.g. three quarters → a stack of three.
 */
export function Cash({ cents, empty, size = 'sm' }: { cents: number; empty?: string; size?: 'sm' | 'lg' }) {
  const k = size === 'lg' ? 1.6 : 1
  const { bills, coins } = cashBreakdown(cents)
  const describe = [...bills, ...coins]
    .map(([v, n]) => (v >= 100 ? `${n} × $${v / 100} bill` : `${n} ${COIN_NAMES[v][n > 1 ? 1 : 0]}`))
    .join(', ')
  if (bills.length + coins.length === 0) {
    return (
      <span class="cash" role="img" aria-label={empty ?? 'No money yet'}>
        <span class="cash-item">
          <svg viewBox="0 0 26 26" width="26" height="26"><circle cx="13" cy="13" r="11" fill="none" stroke="var(--line-strong)" stroke-width="1.5" stroke-dasharray="3 3" /></svg>
          {empty && <span class="cash-empty">{empty}</span>}
        </span>
      </span>
    )
  }
  return (
    <span class={`cash ${size}`} role="button" tabindex={0} aria-label={`${describe}. Tap to count it.`}
      data-cash={[...bills, ...coins].map(([v, n]) => `${v}:${n}`).join(',')}>
      {bills.flatMap(([v, n]) => stacks(n).map((layers) => (
        <span class="cash-item">
          <svg viewBox={`0 0 48 ${26 + (layers - 1) * 3.5}`} width={48 * k} height={(26 + (layers - 1) * 3.5) * k}>
            {Array.from({ length: layers }, (_, i) => (
              <g transform={`translate(0,${(layers - 1 - i) * 3.5})`}><Bill cents={v} /></g>
            ))}
          </svg>
        </span>
      )))}
      {coins.flatMap(([v, n]) => stacks(n).map((layers) => {
        const r = COIN_R[v]
        // Stacked straight down: the top coin is on top, the ones under it peek out below.
        const dx = 0, dy = 3.5
        const w = r * 2 + 2 + (layers - 1) * dx, h = r * 2 + 2 + (layers - 1) * dy
        return (
          <span class="cash-item">
            <svg viewBox={`0 0 ${w} ${h}`} width={w * k} height={h * k}>
              {Array.from({ length: layers }, (_, i) => <Coin cents={v} cx={r + 1 + (layers - 1 - i) * dx} cy={r + 1 + (layers - 1 - i) * dy} />)}
            </svg>
          </span>
        )
      }))}
    </span>
  )
}

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`

function grainMask(areaPath: string): string {
  const shape = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 100' preserveAspectRatio='none'><path d='${areaPath}'/></svg>`,
  )}")`
  return `background-image:${GRAIN};-webkit-mask-image:${shape};mask-image:${shape}`
}

/** A round step (1, 2, 2.5 or 5 × a power of ten) close to `rough`, in cents. */
function niceStep(rough: number): number {
  const pow = 10 ** Math.floor(Math.log10(Math.max(rough, 1)))
  return ([1, 2, 2.5, 5, 10].find((m) => m * pow >= rough) ?? 10) * pow
}

/** Hover / touch / arrow-key readout for each savings chart. */
export const CHART_SCRIPT = `
document.querySelectorAll('.plot[data-series]').forEach((plot) => {
  const d = JSON.parse(plot.dataset.series);
  const pts = d.points.map(([date, saved, interest]) => ({ date, t: Date.parse(date + 'T00:00:00Z'), saved, interest }));
  const line = plot.querySelector('.hover-line'), dot = plot.querySelector('.hover-dot'), tip = plot.querySelector('.tip');
  const usd = (c) => (c / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const day = (t) => new Date(t).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
  let index = pts.length - 1;
  const show = (frac) => {
    frac = Math.min(1, Math.max(0, frac));
    // Snap to the nearest day: the line, dot and readout all sit on that day's point.
    const t = Math.round((d.t0 + frac * d.span) / 864e5) * 864e5;
    let p = pts[0]; for (const q of pts) if (q.t <= t) p = q;
    index = pts.indexOf(p);
    const pct = ((p.t - d.t0) / d.span) * 100;
    const drawn = p.saved + (p.interest > 0 ? Math.max(p.interest, d.minBand) : 0);
    line.hidden = dot.hidden = tip.hidden = false;
    line.style.left = dot.style.left = pct + '%';
    dot.style.top = (96 - (drawn / d.max) * 88) + '%';
    tip.innerHTML = '<div class="tip-date">' + day(p.t) + '</div><div class="tip-total">' + usd(p.saved + p.interest) + '</div>'
      + '<div class="tip-row"><i class="sw-saved"></i>Saved ' + usd(p.saved) + '</div>'
      + '<div class="tip-row"><i class="sw-earned"></i>Interest ' + usd(p.interest) + '</div>';
    tip.classList.toggle('left', pct > 62);
    tip.style.left = pct + '%';
  };
  const hide = () => { line.hidden = dot.hidden = tip.hidden = true; };
  const fracOf = (e) => { const r = plot.getBoundingClientRect(); return (e.clientX - r.left) / r.width; };
  plot.addEventListener('pointermove', (e) => show(fracOf(e)));
  plot.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') e.preventDefault(); show(fracOf(e)); });
  plot.addEventListener('contextmenu', (e) => e.preventDefault());
  plot.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
  plot.addEventListener('focus', () => show((pts[index].t - d.t0) / d.span));
  plot.addEventListener('blur', hide);
  document.addEventListener('pointerdown', (e) => { if (!plot.contains(e.target)) hide(); });
  plot.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    index = Math.min(pts.length - 1, Math.max(0, index + (e.key === 'ArrowRight' ? 1 : -1)));
    show((pts[index].t - d.t0) / d.span);
  });
});
`

/**
 * Smooth path that passes exactly through every daily point (monotone cubic,
 * as in d3's curveMonotoneX): no overshoot, flat stretches stay flat, and the
 * hover dot sits on the line.
 */
function smoothPath(pts: number[][]): string {
  const n = pts.length
  const f = (x: number, y: number) => `${x.toFixed(2)},${y.toFixed(2)}`
  if (n < 3) return pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0], p[1])}`).join(' ')
  const sign = (v: number) => (v < 0 ? -1 : v > 0 ? 1 : 0)
  const slope = (i: number) => (pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0])
  const t: number[] = new Array(n)
  for (let i = 1; i < n - 1; i++) {
    const h0 = pts[i][0] - pts[i - 1][0], h1 = pts[i + 1][0] - pts[i][0]
    const s0 = slope(i - 1), s1 = slope(i)
    const p = (s0 * h1 + s1 * h0) / (h0 + h1)
    t[i] = (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0
  }
  t[0] = (3 * slope(0) - t[1]) / 2
  t[n - 1] = (3 * slope(n - 2) - t[n - 2]) / 2
  let d = `M${f(pts[0][0], pts[0][1])}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]
    const dx = (x1 - x0) / 3
    d += ` C${f(x0 + dx, y0 + dx * t[i])} ${f(x1 - dx, y1 - dx * t[i + 1])} ${f(x1, y1)}`
  }
  return d
}

/**
 * Balance over time as two stacked layers: what the kid saved (periwinkle)
 * and what interest added on top (green). Spaced by real dates.
 */
export function SavingsChart({ txs, today }: { txs: Tx[]; today: string }) {
  const raw = savingsSeries(txs, today)
  if (raw.length < 2) return null
  // Start from $0 the day before the first transaction, so the chart rises to it.
  const series = [{ date: addDays(raw[0].date, -1), saved: 0, interest: 0 }, ...raw]
  const t = (d: string) => Date.parse(d + 'T00:00:00Z')
  const t0 = t(series[0].date)
  const span = Math.max(t(today) - t0, 1)
  // Round the top of the scale up to a clean number so gridlines land on round amounts.
  const peak = Math.max(...series.map((p) => p.saved + p.interest), 1)
  const tick = niceStep(peak / 3)
  const max = Math.ceil(peak / tick) * tick
  const ticks = Array.from({ length: Math.round(max / tick) }, (_, i) => (i + 1) * tick)
  const x = (d: string) => ((t(d) - t0) / span) * 300
  const y = (cents: number) => 96 - (cents / max) * 88
  // Interest is tiny next to savings at first, so give it a minimum visible
  // thickness once there is any. The amounts in the legend stay exact.
  const minBand = peak * 0.035
  const total = smoothPath(series.map((p) => [x(p.date), y(p.saved + (p.interest > 0 ? Math.max(p.interest, minBand) : 0))]))
  const saved = smoothPath(series.map((p) => [x(p.date), y(p.saved)]))
  const last = series[series.length - 1]

  // Date labels along the bottom, spaced to fit the range: days for short charts,
  // weeks (Sundays) for a couple of months, then month names. At most ~6, and none
  // hugging the edges where they'd be cut off.
  const days = Math.round(span / 864e5)
  const fmt = (d: string, opts: Intl.DateTimeFormatOptions) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', ...opts })
  const candidates: { date: string; label: string }[] = []
  if (days <= 14) {
    for (let d = series[0].date; d <= today; d = addDays(d, 1)) candidates.push({ date: d, label: fmt(d, { month: 'short', day: 'numeric' }) })
  } else if (days <= 75) {
    let d = series[0].date
    while (weekday(d) !== 0) d = addDays(d, 1)
    for (; d <= today; d = addDays(d, 7)) candidates.push({ date: d, label: fmt(d, { month: 'short', day: 'numeric' }) })
  } else {
    for (let d = addDays(series[0].date.slice(0, 7) + '-01', 32).slice(0, 7) + '-01'; d <= today; d = addDays(d, 32).slice(0, 7) + '-01') {
      candidates.push({ date: d, label: fmt(d, { month: 'short' }) })
    }
  }
  const inside = candidates.map((c) => ({ left: (x(c.date) / 300) * 100, label: c.label })).filter((c) => c.left >= 5 && c.left <= 95)
  const step = Math.ceil(inside.length / 6)
  const months = inside.filter((_, i) => i % step === 0)

  return (
    <div class="savings-chart">
      <div class="legend">
        <span><i style="background:linear-gradient(20deg,var(--bloom-1),var(--bloom-3),var(--bloom-5))" />You saved <b>{money(last.saved)}</b></span>
        <span><i style="background:linear-gradient(90deg,var(--earned-1),var(--earned-2))" />Bank paid you <b>{money(last.interest)}</b></span>
      </div>
      <div class="plot" tabindex={0} aria-label="Savings chart. Use the arrow keys to step through dates."
        data-series={JSON.stringify({ t0, span, max, minBand, points: series.map((p) => [p.date, p.saved, p.interest]) })}>
      <svg class="chart" viewBox="0 0 300 100" preserveAspectRatio="none" role="img"
        aria-label={`Balance over time: ${money(last.saved)} saved plus ${money(last.interest)} from interest`}>
        <defs>
          {/* Amorphous fills: soft radial glows layered and clipped to each area. */}
          {[
            ['b-green', 'var(--bloom-1)'], ['b-olive', 'var(--bloom-2)'], ['b-pink', 'var(--bloom-3)'],
            ['b-orange', 'var(--bloom-4)'], ['b-gold', 'var(--bloom-5)'], ['e-1', 'var(--earned-1)'], ['e-2', 'var(--earned-2)'],
          ].map(([id, color]) => (
            <radialGradient id={id}>
              <stop offset="0" style={`stop-color:${color}`} />
              <stop offset=".45" style={`stop-color:${color};stop-opacity:.75`} />
              <stop offset="1" style={`stop-color:${color};stop-opacity:0`} />
            </radialGradient>
          ))}
          <clipPath id="clip-total"><path d={`${total} L300,100 L0,100 Z`} /></clipPath>
          <clipPath id="clip-saved"><path d={`${saved} L300,100 L0,100 Z`} /></clipPath>
        </defs>
        {ticks.map((c) => (
          <line x1="0" x2="300" y1={y(c)} y2={y(c)} stroke="var(--line-strong)" stroke-dasharray="3 4" vector-effect="non-scaling-stroke" />
        ))}
        <g clip-path="url(#clip-total)">
          <rect width="300" height="100" style="fill:var(--earned-1)" />
          <ellipse cx="60" cy="10" rx="160" ry="70" fill="url(#e-2)" />
          <ellipse cx="260" cy="20" rx="140" ry="60" fill="url(#e-2)" />
        </g>
        <g clip-path="url(#clip-saved)">
          <rect width="300" height="100" style="fill:var(--bloom-4)" />
          <ellipse cx="290" cy="105" rx="190" ry="85" fill="url(#b-gold)" />
          <ellipse cx="175" cy="0" rx="170" ry="70" fill="url(#b-pink)" />
          <ellipse cx="300" cy="10" rx="110" ry="55" fill="url(#b-pink)" />
          <ellipse cx="95" cy="55" rx="110" ry="65" fill="url(#b-olive)" />
          <ellipse cx="10" cy="100" rx="170" ry="95" fill="url(#b-green)" />
          <ellipse cx="150" cy="38" rx="115" ry="38" fill="url(#b-pink)" />
          <ellipse cx="215" cy="80" rx="80" ry="34" fill="url(#b-gold)" />
        </g>
        <path d={saved} fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        <line x1="0" y1="99.5" x2="300" y2="99.5" stroke="var(--line-strong)" vector-effect="non-scaling-stroke" />
      </svg>
      {/* Film grain at real screen pixels (the SVG is stretched, which would smear it),
          trimmed to the chart's shape with a mask that stretches the same way. */}
      <div class="grain" aria-hidden="true" style={grainMask(`${total} L300,100 L0,100 Z`)} />
      {ticks.map((c) => <span class="y-label" style={`top:${y(c)}%`}>{money(c).replace('.00', '')}</span>)}
      <div class="hover-line" hidden />
      <div class="hover-dot" hidden />
      <div class="tip" hidden role="status" aria-live="polite" />
      </div>
      <div class="axis">
        {months.map((m) => <span style={`left:${m.left}%`}>{m.label}</span>)}
      </div>
      <script dangerouslySetInnerHTML={{ __html: CHART_SCRIPT }} />
    </div>
  )
}

function CategorySelect() {
  return (
    <select name="category">
      <option value="">None</option>
      {Object.entries(CATEGORIES).map(([value, label]) => <option value={value}>{label}</option>)}
    </select>
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
      <h2>New Transaction</h2>
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
        <div class="row">
          <label>What for?<input name="memo" maxlength={100} placeholder="e.g. Birthday money, LEGO set" /></label>
          <label>Category<CategorySelect /></label>
        </div>
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
      <h2>Edit Transaction</h2>
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
        <div class="row">
          <label>What for?<input name="memo" maxlength={100} /></label>
          <label>Category<CategorySelect /></label>
        </div>
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
    f.amount.value = t.amount; f.date.value = t.date; f.memo.value = t.memo || ''; f.category.value = t.category || '';
    d.showModal();
  });
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
})();
`

/** Generic: [data-dialog="id"] opens that dialog; [data-close] or a backdrop click closes it. */
export const DIALOG_SCRIPT = `
document.addEventListener('click', (e) => {
  const open = e.target.closest('[data-dialog]');
  if (open) { const d = document.getElementById(open.dataset.dialog); d.showModal(); d.querySelector('input:not([type=hidden])')?.focus(); return; }
  if (e.target.closest('[data-close]')) { e.target.closest('dialog').close(); return; }
  if (e.target.tagName === 'DIALOG') e.target.close();
});
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

const COUNTER_CSS = `
dialog.cash-dialog { width: 100%; height: 100%; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0;
  border-radius: 0; background: transparent; box-shadow: none; color: #FFFCF4; overflow: hidden; touch-action: none; }
dialog.cash-dialog[open] { animation: cd-fade .25s ease-out; }
dialog.cash-dialog::backdrop { background: radial-gradient(60% 50% at 50% 50%, rgba(34, 87, 128, .55), transparent 70%), rgba(4, 13, 35, .84);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.cd-wrap { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  padding: calc(56px + env(safe-area-inset-top)) 16px calc(32px + env(safe-area-inset-bottom));
  -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
.cd-head { text-align: center; }
.cd-label { font-size: .78rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: rgba(255, 252, 244, .6); }
.cd-count { font-size: 3.2rem; font-weight: 700; letter-spacing: -.02em; line-height: 1.1; font-variant-numeric: tabular-nums; transition: color .3s; }
.cd-count.pop { animation: cd-pop .28s ease-out; }
.cd-count.done { color: #FFD13F; }
.cd-of { color: rgba(255, 252, 244, .65); font-size: .95rem; font-variant-numeric: tabular-nums; }
.cd-stage { position: relative; width: 100%; max-width: 440px; height: min(50vh, 340px); perspective: 900px; touch-action: none; }
.cd-card { position: absolute; left: 50%; top: 42%; cursor: grab; touch-action: none; will-change: transform;
  transition: transform .4s cubic-bezier(.2, .8, .2, 1), opacity .3s; }
.cd-card.dragging { transition: none; cursor: grabbing; }
.cd-card.flying { pointer-events: none; transition: transform .5s cubic-bezier(.25, .6, .35, 1), opacity .5s; }
.cd-card.hinting { animation: cd-nudge 1.4s ease-in-out .5s 2; }
.cd-card svg { display: block; width: 100%; height: auto; }
.cd-card.bill { width: min(340px, calc(100vw - 56px)); border-radius: 6px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, .12), 0 16px 32px -12px rgba(0, 0, 0, .6); }
.cd-card.coin { width: calc(min(200px, 50vw) * var(--f)); border-radius: 50%;
  box-shadow: 0 3px 0 rgba(0, 0, 0, .28), 0 16px 28px -10px rgba(0, 0, 0, .65); }
.cd-shine { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; mix-blend-mode: soft-light;
  background: linear-gradient(105deg, transparent 38%, rgba(255, 255, 255, .7) 50%, transparent 62%) var(--sx, 110%) 0 / 260% 100% no-repeat; }
.cd-hint { display: flex; align-items: center; gap: 8px; font-size: .92rem; color: rgba(255, 252, 244, .7); transition: opacity .4s; }
.cd-hint.gone { opacity: 0; }
.cd-hint svg { width: 18px; height: 18px; }
.cd-close { position: absolute; top: calc(14px + env(safe-area-inset-top)); right: 14px; width: 42px; height: 42px; border-radius: 50%;
  border: 0; background: rgba(255, 252, 244, .12); color: #FFFCF4; cursor: pointer; display: grid; place-items: center; z-index: 3000; }
.cd-close:hover { background: rgba(255, 252, 244, .2); }
.cd-close svg { width: 20px; height: 20px; }
.cd-defs { position: absolute; width: 0; height: 0; }
.cd-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 2500; }
.cd-confetti i { position: absolute; left: 50%; top: 32%; width: 8px; height: 13px; border-radius: 2px;
  animation: cd-burst 1.6s cubic-bezier(.15, .7, .35, 1) forwards; }
@keyframes cd-fade { from { opacity: 0; } }
@keyframes cd-pop { 50% { transform: scale(1.08); } }
@keyframes cd-nudge { 0%, 100% { translate: 0; rotate: 0deg; } 25% { translate: 26px 0; rotate: 5deg; } 50% { translate: -8px 0; rotate: -1.5deg; } 70% { translate: 0; rotate: 0deg; } }
@keyframes cd-burst { from { transform: translate(-50%, 0) rotate(0); opacity: 1; }
  to { transform: translate(calc(-50% + var(--x)), var(--y)) rotate(var(--r)); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .cd-card, .cd-card.flying { transition-duration: .15s; }
  .cd-card.hinting, .cd-confetti i { animation: none; }
}
`

/**
 * The counting table: tap any Cash picture to pick up that money as a stack of
 * big bills and coins, then flick them off one at a time to count it. Render once per page.
 */
export function CashCounter() {
  return (
    <dialog id="cash-dialog" class="cash-dialog" aria-label="Count your money">
      <style dangerouslySetInnerHTML={{ __html: COUNTER_CSS }} />
      <svg class="cd-defs" aria-hidden="true"><defs data-defs /></svg>
      <button type="button" class="cd-close" data-close-cash aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <div class="cd-wrap">
        <div class="cd-head" aria-live="polite">
          <div class="cd-label" data-label>Counted</div>
          <div class="cd-count" data-counted>$0</div>
          <div class="cd-of" data-of></div>
        </div>
        <div class="cd-stage" data-stage />
        <div class="cd-hint" data-hint>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L4.5 14.5a1.5 1.5 0 0 1 2.3-1.9L9 15" />
          </svg>
          Swipe the top one away to count it
        </div>
        <div class="cd-confetti" data-confetti />
      </div>
      <script dangerouslySetInnerHTML={{ __html: COUNTER_SCRIPT }} />
    </dialog>
  )
}

const COUNTER_SCRIPT = `
(() => {
  const d = document.getElementById('cash-dialog');
  const $ = (s) => d.querySelector(s);
  const stage = $('[data-stage]'), countEl = $('[data-counted]'), ofEl = $('[data-of]'), labelEl = $('[data-label]'), hint = $('[data-hint]');

  // Flat, US-style money: every bill is green like the real ones, with Bank of Allen touches.
  const BILLS = { 100: 'ONE', 500: 'FIVE', 1000: 'TEN', 5000: 'FIFTY', 10000: 'ONE HUNDRED', 50000: 'FIVE HUNDRED', 100000: 'ONE THOUSAND' };
  const G = { edge: '#C9E5A8', border: '#5A9A34', panel: '#B9DC93', bar: '#6FAE45', dark: '#4A8628', face: '#D4E99C', neck: '#9EC66C',
    light: '#E9F5D8' };
  // [words along the bottom, size vs a quarter, metal, ridged edge]
  const COINS = { 25: ['QUARTER DOLLAR', 1, 's', 1], 10: ['ONE DIME', .74, 's', 1], 5: ['FIVE CENTS', .87, 'n', 0], 1: ['ONE CENT', .79, 'c', 0] };
  // [rim, face, highlight, ring, portrait, hair, ink]
  const METALS = { s: ['#8E96A2', '#CDD2D9', '#E8EBEF', '#AEB5BF', '#A9B0BA', '#8C94A0', '#4F5866'],
    n: ['#8E8A82', '#C9C5BC', '#E2DFD8', '#ADA89E', '#A8A398', '#8A857B', '#55504A'],
    c: ['#A65A2E', '#DA8B52', '#F0B07F', '#C1743F', '#BC6C35', '#9A5226', '#6E3315'] };
  const FONT = 'font-family="Rethink Sans, Helvetica Neue, Arial, sans-serif" font-weight="700"';

  $('[data-defs]').innerHTML = '<path id="cd-arc-top" d="M32 100a68 68 0 0 1 136 0"/><path id="cd-arc-bot" d="M22 100a78 78 0 0 0 156 0"/>'
    + '<clipPath id="cd-coin-face"><circle cx="100" cy="100" r="86"/></clipPath>';

  // The Bank of Allen lotus.
  const lotus = (x, y, s, color) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="none" stroke="' + color + '" stroke-width="3.2" stroke-linecap="round">'
    + '<path d="M0-22C-11-15-15-4-11 7"/><path d="M0-22C11-15 15-4 11 7"/><path d="M-11 7c-9-1-15-8-15-20 8 0 14 4 18 10"/><path d="M11 7c9-1 15-8 15-20-8 0-14 4-18 10"/></g>';
  const rect = (x, y, w, h, fill, rx) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx ?? h / 2) + '" fill="' + fill + '"/>';
  const text = (x, y, size, str, fill, extra) => '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" ' + (extra || '') + '>' + str + '</text>';
  // A box whose corners are scooped out by circles of radius r centered on its corners.
  function scallop(x0, y0, x1, y1, r) {
    return 'M' + (x0 + r) + ' ' + y0 + 'H' + (x1 - r) + 'A' + r + ' ' + r + ' 0 0 0 ' + x1 + ' ' + (y0 + r) + 'V' + (y1 - r)
      + 'A' + r + ' ' + r + ' 0 0 0 ' + (x1 - r) + ' ' + y1 + 'H' + (x0 + r) + 'A' + r + ' ' + r + ' 0 0 0 ' + x0 + ' ' + (y1 - r)
      + 'V' + (y0 + r) + 'A' + r + ' ' + r + ' 0 0 0 ' + (x0 + r) + ' ' + y0 + 'Z';
  }

  // One flat portrait, after the classic bill illustration, drawn in its own 0–690 × 75–300 space and
  // turned into each person by flipping it and swapping hair, beard and tie.
  const HAIR = {
    swoop: 'M262 205c-10-55 0-105 38-123 30-12 75-7 92 18 8 15 3 30-4 40-8-20-26-30-48-28-20 3-32 18-35 38-2 20-5 40-15 55z',
    short: 'M298 150c-6-40 8-64 40-72 30-6 52 6 56 30 2 12-2 24-6 32-8-22-26-30-46-28-22 2-36 16-44 38z',
    sides: 'M296 118c-10 10-14 30-12 48l14 6c-2-18 0-36 6-46zM392 118c8 10 10 30 6 48l-12 4c4-18 4-34-2-44z',
    long: 'M298 112c-22 20-30 80-14 130l28-4c-14-36-14-80-6-110zM390 112c20 20 24 80 6 130l-24-4c12-36 12-80 6-110z',
  };
  const BEARD = {
    chin: 'M301 162c2 38 22 60 44 60 25 0 41-22 43-62-8 25-23 36-43 36-20 0-35-11-44-34z',
    full: 'M301 168c0 46 20 64 44 64 26 0 43-20 43-68-6 14-14 22-26 24h-34c-14-2-22-8-27-20z',
  };
  const STACHE = 'M314 190c8-15 48-15 58 0-10 8-22 6-29 2-7 4-19 6-29-2z';
  function figure(o, C) {
    let g = '<path d="M235 300c1-45 27-72 65-78h90c35 6 40 38 40 78z" fill="' + C.coat + '"/>'
      + '<path d="M300 300l36-62 38-2-34 64z" fill="' + C.shirt + '"/>'
      + '<path d="M318 186h54v52c-12 10-42 10-54 0z" fill="' + C.neck + '"/>'
      + '<path d="M300 130c0-30 30-40 55-38 25 3 35 28 33 58-2 35-16 62-43 65-27-3-43-25-45-55z" fill="' + C.face + '"/>';
    if (o.beard) g += '<path d="' + BEARD[o.beard] + '" fill="' + C.hair + '"/>';
    if (o.stache) g += '<path d="' + STACHE + '" fill="' + C.hair + '"/>';
    if (o.beard === 'full') g += '<path d="M334 200h20" stroke="' + C.face + '" stroke-width="4" stroke-linecap="round"/>';
    g += '<path d="' + HAIR[o.hair] + '" fill="' + (o.light ? C.light : C.hair) + '"/>';
    if (o.curls) g += [[276, 176], [280, 198]].map(([x, y]) => '<ellipse cx="' + x + '" cy="' + y + '" rx="13" ry="10" fill="' + C.light + '"/>').join('');
    if (o.bald) g += '<path d="M310 104c14-10 50-10 66 2" fill="none" stroke="' + C.neck + '" stroke-width="4" stroke-linecap="round"/>';
    g += '<path d="M326 152h-6v18h-7" fill="none" stroke="' + C.hair + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>';
    if (o.tie) g += '<path d="M326 236l19 9 19-9v18l-19-9-19 9z" fill="' + C.hair + '"/>';
    return o.flip ? '<g transform="translate(690 0) scale(-1 1)">' + g + '</g>' : g;
  }
  const PEOPLE = {
    100: { hair: 'swoop', light: 1, curls: 1, flip: 1 }, // Washington
    500: { hair: 'short', beard: 'chin', tie: 1 }, // Lincoln
    1000: { hair: 'swoop' }, // Hamilton
    5000: { hair: 'short', beard: 'full', stache: 1, flip: 1 }, // Grant
    10000: { hair: 'long', light: 1, bald: 1, flip: 1 }, // Franklin
    50000: { hair: 'short', tie: 1 }, // McKinley
    100000: { hair: 'sides', bald: 1, stache: 1, flip: 1 }, // Cleveland
    25: { hair: 'swoop', light: 1, curls: 1 }, // Washington
    10: { hair: 'short' }, // Roosevelt
    5: { hair: 'swoop' }, // Jefferson
    1: { hair: 'short', beard: 'chin', flip: 1 }, // Lincoln
  };
  const billPortrait = (v) => '<g transform="translate(380 104) scale(.8) translate(-345 -75)">'
    + figure(PEOPLE[v], { coat: G.dark, shirt: G.face, neck: G.neck, face: G.face, hair: G.dark, light: G.light }) + '</g>';
  const coinPortrait = (v, bust, hair, hi) => '<g transform="translate(100 50) scale(.36) translate(-332 -75)">'
    + figure(PEOPLE[v], { coat: hair, shirt: hi, neck: bust, face: hi, hair: hair, light: hi }) + '</g>';

  function bill(v) {
    const n = String(v / 100), size = n.length > 3 ? 30 : n.length > 2 ? 36 : 46;
    const corner = (x, y, anchor) => text(x, y, size, n, G.light, 'text-anchor="' + anchor + '"');
    return '<svg viewBox="0 0 760 324"><g ' + FONT + '>'
      + rect(0, 0, 760, 324, G.edge, 6)
      + rect(14, 14, 732, 296, G.border, 4)
      + '<path d="' + scallop(40, 40, 720, 284, 62) + '" fill="' + G.panel + '"/>'
      + '<path d="' + scallop(54, 54, 706, 270, 62) + '" fill="none" stroke="' + G.border + '" stroke-width="2.5"/>'
      + '<path d="' + scallop(62, 62, 698, 262, 62) + '" fill="none" stroke="' + G.border + '" stroke-width="1" stroke-opacity=".6"/>'
      + corner(24, 72, 'start') + corner(736, 72, 'end') + corner(24, 298, 'start') + corner(736, 298, 'end')
      // Top banner, split by the portrait.
      + rect(150, 76, 190, 24, G.bar) + text(245, 93, 13, 'BANK OF ALLEN', G.light, 'text-anchor="middle" letter-spacing="2.5"')
      + rect(498, 76, 160, 24, G.bar) + text(578, 92.5, 10, BILLS[v] + ' DOLLAR' + (v > 100 ? 'S' : ''), G.light, 'text-anchor="middle" letter-spacing="1.2"')
      // Left seal: the Bank of Allen lotus. Right seal: the BoA monogram.
      + '<circle cx="180" cy="160" r="40" fill="' + G.border + '"/><circle cx="180" cy="160" r="29" fill="' + G.bar + '"/>' + lotus(180, 166, 1, G.light)
      + '<circle cx="580" cy="160" r="40" fill="' + G.border + '"/><circle cx="580" cy="160" r="29" fill="' + G.bar + '"/>'
      + text(580, 167, 19, 'BoA', G.light, 'text-anchor="middle"')
      // Text lines under the seals.
      + rect(120, 222, 120, 10, G.border) + rect(140, 242, 90, 10, G.border)
      + rect(520, 222, 120, 10, G.border) + rect(530, 242, 100, 10, G.border) + rect(540, 108, 80, 10, G.border)
      + billPortrait(v)
      + rect(150, 290, 180, 14, G.bar) + rect(430, 290, 180, 14, G.bar)
      + '</g></svg>';
  }

  function coin(v) {
    const [word, , m, ridged] = COINS[v], [rim, face, hi, ring, bust, hair, ink] = METALS[m];
    const arc = (id, str) => '<text font-size="13" letter-spacing="3" fill="' + ink + '"><textPath href="#' + id + '" startOffset="50%" text-anchor="middle">' + str + '</textPath></text>';
    return '<svg viewBox="0 0 200 200"><g ' + FONT + ' text-anchor="middle">'
      + '<circle cx="100" cy="100" r="100" fill="' + rim + '"/>'
      + (ridged ? '<circle cx="100" cy="100" r="96" fill="none" stroke="' + ink + '" stroke-opacity=".35" stroke-width="6" stroke-dasharray="1.6 1.8"/>' : '')
      // Flat face with a lit crescent on the top-left edge.
      + '<g clip-path="url(#cd-coin-face)"><circle cx="100" cy="100" r="86" fill="' + hi + '"/><circle cx="106" cy="106" r="86" fill="' + face + '"/></g>'
      + '<circle cx="100" cy="100" r="80" fill="none" stroke="' + ring + '" stroke-width="2.5"/>'
      + arc('cd-arc-top', 'BANK OF ALLEN')
      + arc('cd-arc-bot', word)
      + coinPortrait(v, bust, hair, hi)
      + text(100, 150, 24, v + '¢', ink)
      + '</g></svg>';
  }

  let deck = [], total = 0, counted = 0, seen = 0, finished = false, shown = 0, raf = 0;
  let fmt = String;

  function place(el, x, y, rot, scale, tiltY) {
    el.style.transform = 'translate(-50%, -50%) translate(' + x + 'px, ' + y + 'px) rotate(' + rot + 'deg) rotateY(' + (tiltY || 0) + 'deg) scale(' + scale + ')';
  }
  // The stack: the top card sits straight, the ones under it peek out a little crooked.
  function slot(el, i, lift) {
    const depth = Math.min(i, 6);
    el.style.zIndex = String(1000 - i);
    el.style.setProperty('--sx', '110%');
    place(el, i ? el._dx : 0, depth * 7 + (lift || 0), i ? el._rot : 0, 1 - depth * .03);
  }
  function layout() {
    deck.forEach((el, i) => { if (el._out) return; slot(el, i); el.style.opacity = i > 6 ? '0' : '1'; });
  }

  function open(src) {
    stage.replaceChildren();
    $('[data-confetti]').replaceChildren();
    const values = [];
    src.dataset.cash.split(',').forEach((p) => { const [v, n] = p.split(':').map(Number); for (let i = 0; i < n && values.length < 200; i++) values.push(v); });
    total = values.reduce((a, b) => a + b, 0);
    fmt = (c) => '$' + (c / 100).toLocaleString('en-US', total % 100 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 });
    deck = values.map((v, i) => {
      const el = document.createElement('div'), isCoin = v < 100;
      el.className = 'cd-card ' + (isCoin ? 'coin' : 'bill');
      if (isCoin) el.style.setProperty('--f', COINS[v][1]);
      el.innerHTML = (isCoin ? coin(v) : bill(v)) + '<i class="cd-shine"></i>';
      el._v = v; el._coin = isCoin;
      el._rot = ((i * 47) % 11 - 5) * .9; el._dx = ((i * 31) % 7 - 3) * 2.5;
      el.style.transition = 'none'; el.style.opacity = '0';
      place(el, 0, 60, el._rot, .9);
      stage.appendChild(el);
      return el;
    });
    counted = 0; seen = 0; shown = 0; finished = false;
    countEl.textContent = fmt(0); countEl.classList.remove('done');
    labelEl.textContent = 'Counted';
    ofEl.textContent = 'of ' + fmt(total);
    hint.classList.remove('gone');
    d.showModal();
    stage.offsetWidth; // deal the stack in from below
    deck.forEach((el, i) => { el.style.transition = ''; el.style.transitionDelay = Math.min(i, 6) * 30 + 'ms'; });
    layout();
    setTimeout(() => { deck.forEach((el) => (el.style.transitionDelay = '')); deck[0]?.classList.add('hinting'); }, 500);
  }

  function rollTo(to) {
    const from = shown, t0 = performance.now();
    cancelAnimationFrame(raf);
    const step = (t) => {
      const k = Math.min((t - t0) / 320, 1);
      shown = from + (to - from) * (1 - (1 - k) ** 3);
      countEl.textContent = fmt(Math.round(shown));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    countEl.classList.remove('pop'); countEl.offsetWidth; countEl.classList.add('pop');
  }

  function celebrate() {
    finished = true;
    labelEl.textContent = 'You counted it all!';
    countEl.classList.add('done');
    ofEl.textContent = 'Swipe again to count it over';
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = $('[data-confetti]'), colors = ['#FFD13F', '#FF667D', '#A6C45F', '#9E66FF', '#1880AF', '#FF9860'];
    for (let i = 0; i < 46; i++) {
      const c = document.createElement('i'), a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 220;
      c.style.background = colors[i % colors.length];
      c.style.setProperty('--x', Math.cos(a) * r + 'px');
      c.style.setProperty('--y', Math.sin(a) * r * .7 + 160 + Math.random() * 120 + 'px');
      c.style.setProperty('--r', (Math.random() * 900 - 450) + 'deg');
      c.style.animationDelay = Math.random() * 120 + 'ms';
      box.appendChild(c);
    }
    setTimeout(() => box.replaceChildren(), 2000);
  }

  let audio;
  function sound(isCoin) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime, out = audio.destination;
      if (isCoin) { // a little clink
        [2700, 4100].forEach((f, i) => {
          const o = audio.createOscillator(), g = audio.createGain();
          o.frequency.value = f * (.96 + Math.random() * .08);
          g.gain.setValueAtTime(.08 / (i + 1), t); g.gain.exponentialRampToValueAtTime(.0001, t + .32);
          o.connect(g).connect(out); o.start(t); o.stop(t + .35);
        });
      } else { // a paper flick
        const len = Math.floor(audio.sampleRate * .11), buf = audio.createBuffer(1, len, audio.sampleRate), ch = buf.getChannelData(0);
        for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
        const s = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
        s.buffer = buf; f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = .7; g.gain.value = .35;
        s.connect(f).connect(g).connect(out); s.start(t);
      }
    } catch {}
  }

  // Throw the top card off the stack, count it, and tuck it back under the bottom.
  function fling(dx, dy) {
    if (!deck[0] || deck[0]._out) return;
    const el = deck.shift();
    if (finished) { counted = 0; seen = 0; shown = 0; finished = false; labelEl.textContent = 'Counted'; countEl.classList.remove('done'); ofEl.textContent = 'of ' + fmt(total); }
    const m = Math.hypot(dx, dy) || 1, far = Math.max(innerWidth, innerHeight) * .9;
    el.classList.remove('hinting', 'dragging'); el.classList.add('flying');
    el.style.zIndex = '2000';
    place(el, dx / m * far, dy / m * far - 40, (dx >= 0 ? 1 : -1) * 38, .95, (dx >= 0 ? 1 : -1) * 25);
    el.style.opacity = '0';
    deck.push(el);
    counted += el._v; seen++;
    rollTo(counted);
    sound(el._coin);
    navigator.vibrate?.(8);
    if (seen === deck.length) setTimeout(celebrate, 200);
    // Everyone else moves up now, so the next card can be grabbed straight away.
    el._out = true;
    layout();
    setTimeout(() => {
      if (!el._out) return;
      el._out = false;
      el.classList.remove('flying');
      const i = deck.indexOf(el);
      el.style.transition = 'none';
      slot(el, i, 30); // slide it in under the stack
      el.offsetWidth;
      el.style.transition = '';
      el.style.opacity = i > 6 ? '0' : '1';
      slot(el, i);
    }, 480);
  }

  let drag = null, lastDrag = 0;
  stage.addEventListener('pointerdown', (e) => {
    const el = deck[0];
    if (!el || !e.target.closest('.cd-card')) return; // a press anywhere on the stack picks up the top one
    if (el._out) return; // a one-card stack that's still flying
    el.setPointerCapture(e.pointerId);
    el.classList.remove('hinting'); el.classList.add('dragging');
    hint.classList.add('gone');
    drag = { el, id: e.pointerId, x0: e.clientX, y0: e.clientY, x: 0, y: 0, lx: e.clientX, ly: e.clientY, t: e.timeStamp, vx: 0, vy: 0 };
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dt = Math.max(e.timeStamp - drag.t, 1);
    drag.vx = (e.clientX - drag.lx) / dt; drag.vy = (e.clientY - drag.ly) / dt;
    drag.lx = e.clientX; drag.ly = e.clientY; drag.t = e.timeStamp;
    drag.x = e.clientX - drag.x0; drag.y = e.clientY - drag.y0;
    place(drag.el, drag.x, drag.y, drag.x * .07, 1.04, Math.max(-25, Math.min(25, drag.x * .12)));
    drag.el.style.setProperty('--sx', 100 - drag.x / 3 + '%');
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { el, x, y } = drag, fresh = e.timeStamp - drag.t < 90;
    const dist = Math.hypot(x, y), speed = fresh ? Math.hypot(drag.vx, drag.vy) : 0;
    drag = null; lastDrag = Date.now();
    el.classList.remove('dragging');
    if (e.type === 'pointercancel') layout();
    else if (dist < 6) fling(1, -.15); // a tap counts it too
    else if (dist > 90 || (speed > .4 && dist > 24)) fling(x, y); // off the way it was dragged
    else layout();
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  const close = () => { d.close(); cancelAnimationFrame(raf); };
  d.addEventListener('click', (e) => {
    if (e.target.closest('[data-close-cash]')) return close();
    if (Date.now() - lastDrag < 300 || e.target.closest('.cd-card')) return;
    if (e.target === d || e.target.classList.contains('cd-wrap')) close();
  });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); hint.classList.add('gone'); fling(1, 0); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); hint.classList.add('gone'); fling(-1, 0); }
  });

  document.addEventListener('click', (e) => { const c = e.target.closest('[data-cash]'); if (c) open(c); });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-cash]')) { e.preventDefault(); open(e.target); }
  });
})();
`
