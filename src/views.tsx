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
html { -webkit-text-size-adjust: 100%; background: var(--bg); }
body { margin: 0; background: var(--page-wash), var(--bg); background-attachment: fixed; min-height: 100vh; color: var(--text); font: 15px/1.55 var(--font-text);
  -webkit-font-smoothing: antialiased; position: relative; overflow-x: hidden; }
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
.cash { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 12px 18px; padding-top: 6px; }
.cash-item { position: relative; display: inline-flex; align-items: center; gap: 4px; }
.cash-item svg { display: block; overflow: visible; }
.cash-n { position: absolute; top: -7px; right: -9px; min-width: 20px; padding: 2px 5px; border-radius: 32px;
  background: var(--coin-ink); color: var(--card); border: 2px solid var(--card); font-size: .68rem; font-weight: 700;
  line-height: 1.2; text-align: center; font-variant-numeric: tabular-nums; }
.cash.lg .cash-n { font-size: .78rem; top: -8px; right: -10px; }
.cash-n.bill { background: var(--bill-ink); }
.cash-n.penny { background: var(--penny-ink); }
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
  .bal-row .cash { justify-content: flex-start; }
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
              {t.category && t.type !== 'allowance' && <span class="cat">{CATEGORIES[t.category]}</span>}
              <span class={`badge ${t.type}`}>{LABELS[t.type]}</span>
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

/**
 * An amount drawn as the real bills and coins that make it, so money from the
 * cash days still feels like money. Each kind shows as a small stack with a
 * count, e.g. three $20 bills → a stack of three labelled ×3.
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
    <span class={`cash ${size}`} role="img" aria-label={describe}>
      {bills.map(([v, n]) => {
        const layers = Math.min(n, 3)
        return (
          <span class="cash-item">
            <svg viewBox={`0 0 ${48 + (layers - 1) * 3} ${26 + (layers - 1) * 3}`} width={(48 + (layers - 1) * 3) * k} height={(26 + (layers - 1) * 3) * k}>
              {Array.from({ length: layers }, (_, i) => (
                <g transform={`translate(${(layers - 1 - i) * 3},${(layers - 1 - i) * 3})`}><Bill cents={v} /></g>
              ))}
            </svg>
            {n > 1 && <span class="cash-n bill">{n}x</span>}
          </span>
        )
      })}
      {coins.map(([v, n]) => {
        const r = COIN_R[v]
        const layers = Math.min(n, 3)
        // The top coin sits at the upper left; the ones under it peek out toward the bottom right.
        const dx = 4, dy = 3
        const w = r * 2 + 2 + (layers - 1) * dx, h = r * 2 + 2 + (layers - 1) * dy
        return (
          <span class="cash-item">
            <svg viewBox={`0 0 ${w} ${h}`} width={w * k} height={h * k}>
              {Array.from({ length: layers }, (_, i) => <Coin cents={v} cx={r + 1 + (layers - 1 - i) * dx} cy={r + 1 + (layers - 1 - i) * dy} />)}
            </svg>
            {n > 1 && <span class={`cash-n ${v === 1 ? 'penny' : 'coin'}`}>{n}x</span>}
          </span>
        )
      })}
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
  const top = plot.querySelector('[data-top]'), len = top.getTotalLength();
  const line = plot.querySelector('.hover-line'), dot = plot.querySelector('.hover-dot'), tip = plot.querySelector('.tip');
  const usd = (c) => (c / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const day = (t) => new Date(t).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
  const yAt = (ux) => { let lo = 0, hi = len; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (top.getPointAtLength(m).x < ux) lo = m; else hi = m; } return top.getPointAtLength(lo).y; };
  let index = pts.length - 1;
  const show = (frac) => {
    frac = Math.min(1, Math.max(0, frac));
    const t = Math.round((d.t0 + frac * d.span) / 864e5) * 864e5;  // snap to a whole day
    let p = pts[0]; for (const q of pts) if (q.t <= t) p = q;
    index = pts.indexOf(p);
    const ux = frac * 300, pct = frac * 100;
    line.hidden = dot.hidden = tip.hidden = false;
    line.style.left = dot.style.left = pct + '%';
    dot.style.top = yAt(ux) + '%';
    tip.innerHTML = '<div class="tip-date">' + day(t) + '</div><div class="tip-total">' + usd(p.saved + p.interest) + '</div>'
      + '<div class="tip-row"><i class="sw-saved"></i>Saved ' + usd(p.saved) + '</div>'
      + '<div class="tip-row"><i class="sw-earned"></i>Interest ' + usd(p.interest) + '</div>';
    tip.classList.toggle('left', frac > .62);
    tip.style.left = pct + '%';
  };
  const hide = () => { line.hidden = dot.hidden = tip.hidden = true; };
  const fracOf = (e) => { const r = plot.getBoundingClientRect(); return (e.clientX - r.left) / r.width; };
  plot.addEventListener('pointermove', (e) => show(fracOf(e)));
  plot.addEventListener('pointerdown', (e) => show(fracOf(e)));
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
        data-series={JSON.stringify({ t0, span, points: series.map((p) => [p.date, p.saved, p.interest]) })}>
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
        <path d={total} fill="none" stroke="none" data-top />
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
