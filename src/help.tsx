import type { Child } from 'hono/jsx'
import { DAYS, money, prettyDate } from './lib'

const REPO_URL = 'https://github.com/asallen/bankofallen'
const DASHBOARD_URL = 'https://dash.cloudflare.com/?to=/:account/workers/services/view/bankofallen/production'

export type HelpStatus = {
  origin: string
  timezone: string
  interestRateBps: number
  lastProcessed: string
  kids: { display_name: string; username: string; allowance_cents: number; allowance_day: number }[]
  parents: number
  transactions: number
  firstDate: string | null
}

/** A shell command with a copy button. */
function Cmd({ children }: { children: string }) {
  return (
    <div class="cmd">
      <code>{children}</code>
      <button type="button" class="icon-btn copy" data-copy={children} aria-label="Copy command">Copy</button>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: Child }) {
  return (
    <section class="card help" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

const COPY_SCRIPT = `
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copied'; }
  catch {
    // Clipboard blocked: highlight the command so it can be copied by hand.
    const r = document.createRange(); r.selectNodeContents(b.previousElementSibling);
    getSelection().removeAllRanges(); getSelection().addRange(r); b.textContent = 'Press ⌘C';
  }
  setTimeout(() => { b.textContent = 'Copy'; }, 1500);
});
`

export function HelpContent({ status: s }: { status: HelpStatus }) {
  return (
    <>
      <h1>Help <span>· running &amp; fixing the bank</span></h1>
      <nav class="help-toc">
        <a href="#status">Status</a>
        <a href="#how">How it works</a>
        <a href="#mistakes">Fixing mistakes</a>
        <a href="#passwords">Passwords</a>
        <a href="#backups">Backups</a>
        <a href="#changes">Changing the app</a>
        <a href="#limits">Costs &amp; limits</a>
      </nav>

      <Section id="status" title="Status">
        <dl class="facts">
          <dt>Web address</dt><dd><a href={s.origin}>{s.origin.replace('https://', '')}</a></dd>
          <dt>Timezone</dt><dd>{s.timezone}</dd>
          <dt>Interest rate</dt><dd>{s.interestRateBps / 100}% a year</dd>
          <dt>Payments up to date through</dt><dd>{s.lastProcessed ? prettyDate(s.lastProcessed) : '—'}</dd>
          <dt>Accounts</dt><dd>{s.kids.length} kid{s.kids.length === 1 ? '' : 's'}, {s.parents} parent{s.parents === 1 ? '' : 's'}</dd>
          <dt>Transactions</dt><dd>{s.transactions.toLocaleString('en-US')}{s.firstDate && ` since ${prettyDate(s.firstDate)}`}</dd>
          <dt>Allowances</dt>
          <dd>
            {s.kids.length === 0 && '—'}
            {s.kids.map((k) => (
              <div>
                {k.display_name} (@{k.username}): {k.allowance_cents > 0 ? `${money(k.allowance_cents)} every ${DAYS[k.allowance_day]}` : 'off'}
              </div>
            ))}
          </dd>
          <dt>Code</dt><dd><a href={REPO_URL}>{REPO_URL.replace('https://', '')}</a></dd>
          <dt>Hosting</dt><dd><a href={DASHBOARD_URL}>Cloudflare dashboard</a> (Workers &amp; Pages → bankofallen)</dd>
        </dl>
      </Section>

      <Section id="how" title="How it works">
        <ul>
          <li><strong>No real money.</strong> The app is just a ledger: every deposit, debit, allowance, and interest payment is a row, and a balance is the sum of its rows.</li>
          <li><strong>Allowance</strong> is paid automatically on each kid's payday. If nobody opens the app for a while, the next visit catches up and dates each payment on the day it was due.</li>
          <li><strong>Interest</strong> is paid on the 1st of each month: the balance at the end of the previous month × the yearly rate ÷ 12, rounded to the cent. Very small balances can round to $0 (for example, $1 at 5% is under half a cent).</li>
          <li><strong>Changing an allowance or the rate</strong> only affects payments from now on. Anything already due is paid at the old amount first.</li>
          <li><strong>Balances can't go below $0.</strong> Debits and edits that would overdraw an account are blocked.</li>
        </ul>
      </Section>

      <Section id="mistakes" title="Fixing mistakes">
        <ul>
          <li><strong>Wrong amount, date, or description:</strong> click ✎ on the transaction (on Home or a kid's page), change it, and save.</li>
          <li><strong>Shouldn't exist at all:</strong> open it with ✎ and choose <em>Delete</em>. Deleted allowance and interest payments are not re-paid.</li>
          <li><strong>Forgot to record something:</strong> use <em>Deposit</em> or <em>Debit</em> and set the date to when it happened.</li>
          <li><strong>Interest after an edit:</strong> editing an old transaction doesn't recalculate interest already paid. If it matters, edit that month's interest entry by hand.</li>
          <li><strong>Rename a kid or change their login:</strong> edit <em>Name</em> or <em>Username</em> on their card in <a href="/admin">Settings</a>. Their history stays.</li>
          <li><strong>Remove a kid:</strong> <em>Delete account</em> on their card in Settings removes the account and all its transactions. It can only be brought back with a full rollback within 7 days.</li>
          <li><strong>A big mess</strong> (lots of wrong changes): roll the whole database back. See <a href="#backups">Backups</a>.</li>
        </ul>
      </Section>

      <Section id="passwords" title="Passwords & lockouts">
        <ul>
          <li><strong>A kid forgot their password:</strong> set a new one in <a href="/admin">Settings</a>, under their card.</li>
          <li><strong>Locked out:</strong> 5 wrong passwords in a row locks that username for 15 minutes. Wait, or reset the password, which also unlocks it.</li>
          <li><strong>A parent forgot their password</strong> (works for anyone): on a computer with this project, Node 22.18+, and <code>npx wrangler login</code> done, run the command below. It asks for the new password, saves it, signs them out everywhere, and clears any lockout.</li>
        </ul>
        <Cmd>npm run reset-password -- USERNAME</Cmd>
        <p class="muted sm">Forgot the username too? List every account:</p>
        <Cmd>npx wrangler d1 execute bankofallen --remote --command "SELECT username, display_name, role FROM users"</Cmd>
      </Section>

      <Section id="backups" title="Backups & undo">
        <p><strong>Automatic, nothing to do.</strong> Cloudflare keeps a restorable history of the database for the last <strong>7 days</strong>. To undo a mess, roll everything back to a moment before it (use your local time and offset):</p>
        <Cmd>npx wrangler d1 time-travel restore bankofallen --timestamp=2026-10-12T18:00:00-07:00</Cmd>
        <p class="warn">This replaces the <em>entire</em> database. Every change after that moment, in every account, is lost. To fix one transaction, edit it instead. The restore prints a bookmark you can use to undo the restore itself.</p>
        <p><strong>Keepsake copy (optional, e.g. once a year).</strong> Saves everything to a file. Keep it private: it contains password hashes.</p>
        <Cmd>npx wrangler d1 export bankofallen --remote --output=backup-$(date +%F).sql</Cmd>
        <p class="muted sm">To restore a keepsake copy: create a new database (<code>npx wrangler d1 create bankofallen-restore</code>), load the file into it with <code>npx wrangler d1 execute bankofallen-restore --remote --file=backup-….sql</code>, point <code>database_id</code> in <code>wrangler.jsonc</code> at it, and deploy.</p>
      </Section>

      <Section id="changes" title="Changing the app">
        <ul>
          <li><strong>Deploys are automatic.</strong> Pushing to the <code>main</code> branch on GitHub deploys to the live site in about a minute. Watch progress under <em>Deployments</em> in the <a href={DASHBOARD_URL}>Cloudflare dashboard</a>.</li>
          <li><strong>Before pushing,</strong> run the tests. They check the allowance and interest math, the login lockout, and money and date parsing.</li>
        </ul>
        <Cmd>npm test</Cmd>
        <ul>
          <li><strong>A deploy broke something?</strong> Roll the code back to the previous version right away (it doesn't touch the data), then fix it and push again:</li>
        </ul>
        <Cmd>npx wrangler rollback</Cmd>
        <ul>
          <li><strong>Try changes locally first:</strong> <code>npm run db:init:local</code> once, then <code>npm run dev</code> and open <code>http://localhost:8787</code>. The local database is separate from the real one.</li>
          <li><strong>Moved to a different timezone?</strong> Payment days follow the family timezone (currently {s.timezone}). Change it with:</li>
        </ul>
        <Cmd>npx wrangler d1 execute bankofallen --remote --command "UPDATE settings SET value = 'America/New_York' WHERE key = 'timezone'"</Cmd>
        <p class="muted sm">Tools need Node 22 or newer. If <code>node -v</code> shows an older version, switch with <code>nvm use</code> in this folder.</p>
      </Section>

      <Section id="limits" title="Costs & limits">
        <ul>
          <li><strong>Cost: $0.</strong> Everything runs on Cloudflare's free plan. There's no server to update and nothing to renew.</li>
          <li><strong>Free plan limits:</strong> 100,000 page loads a day, 5 GB of storage, and 5 million database reads a day. A family uses a tiny fraction of that; years of transactions take a few megabytes.</li>
          <li><strong>If a limit were ever hit,</strong> the site would show errors until midnight UTC, and no data would be lost. Usage is on the Cloudflare dashboard's Workers page.</li>
          <li><strong>Accounts involved:</strong> Cloudflare (hosting + database) and GitHub (code). Keep access to both; the README in the repo has full setup steps if you ever need to rebuild.</li>
        </ul>
      </Section>
      <script dangerouslySetInnerHTML={{ __html: COPY_SCRIPT }} />
    </>
  )
}
