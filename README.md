# 🏦 Bank of Allen

A pretend bank for the kids. No real money: it's just a ledger.

- **Kids** log in to see their balance, history, interest earned, and next allowance. They pick their own name and photo.
- **Parents** deposit and debit, set each kid's weekly allowance, set the interest rate, and see all activity.
- **Interest** is paid on the 1st of each month: end-of-month balance × yearly rate ÷ 12.
- **Allowance and interest** are paid automatically the next time anyone opens the app, backdated to the day they were due. No cron job needed.

Runs free on Cloudflare: one Worker + one D1 (SQLite) database.

## Deploy (one time)

Requires Node 22+ (`nvm use`).

```bash
npm install
npx wrangler login
npx wrangler d1 create bankofallen     # copy the database_id it prints into wrangler.jsonc
npm run db:init                        # create the tables
npm run deploy                         # prints your URL, e.g. https://bankofallen.<you>.workers.dev
```

Then open the URL **right away** and create the first parent account. The setup page only works until that first account exists.

After that: **Settings → Add an account** for each kid, and set their allowance.

To redeploy after code changes: `npm run deploy`. (Optional: connect the GitHub repo in the Cloudflare dashboard under *Workers → bankofallen → Settings → Builds* to auto-deploy on every push.)

## Good to know

- **Fixing mistakes:** parents can edit or delete any transaction (✎ on each row), and backdate new ones. Edits don't recalculate interest already paid; edit the interest entry by hand if needed.
- **Locked out:** 5 wrong passwords locks that username for 15 minutes. Wait it out, or reset the password (below), which also unlocks it.

## Forgot a password

**A kid forgot theirs:** a parent sets a new one in **Settings**, under that kid's card.

**A parent forgot theirs** (or anyone, from the command line):

```bash
npm run reset-password -- <username>
```

It asks for the new password, saves it, signs that person out everywhere, and clears any lockout. Run it from this folder on a computer with Node 22.18+ that's logged in to Cloudflare (`npx wrangler login`). Add `--local` to reset someone in the local dev database instead.

**Forgot the username too?** List everyone:

```bash
npx wrangler d1 execute bankofallen --remote --command "SELECT username, display_name, role FROM users"
```

## Backups

**Automatic (nothing to do):** Cloudflare D1 keeps a point-in-time history of the database for the last **7 days** on the free plan (30 on paid). To undo something, like a mistake or a bad edit, roll the whole database back to a moment before it:

```bash
npx wrangler d1 time-travel restore bankofallen --timestamp=2026-10-12T18:00:00-07:00
```

⚠️ This replaces the entire database. Everything after that moment is lost, across all accounts. To fix a single transaction, edit it in the app instead. Run `npx wrangler d1 time-travel info bankofallen` first to see the current bookmark. The restore also prints a bookmark you can use to undo the restore.

**Keepsake copy (optional, e.g. once a year):** export everything to a file:

```bash
npx wrangler d1 export bankofallen --remote --output=backup-$(date +%F).sql
```

Keep it somewhere private. It contains password hashes, so don't commit it (`backup-*.sql` is git-ignored). To restore a keepsake copy, create a new empty database (`npx wrangler d1 create bankofallen-restore`), load it with `npx wrangler d1 execute bankofallen-restore --remote --file=backup-....sql`, then point `database_id` in `wrangler.jsonc` at the new database and deploy.

## Local development

```bash
npm run db:init:local
npm run dev                            # http://localhost:8787
npm test                               # allowance/interest math, login lockout, parsing
```

## Code

| File | What |
|---|---|
| `schema.sql` | 4 tables: users, transactions, sessions, settings |
| `src/index.tsx` | All pages and routes |
| `src/lib.ts` | Money, dates, passwords, and the allowance/interest catch-up |
| `src/views.tsx` | Layout, styles, shared UI bits |
| `test/lib.test.ts` | Tests for the money math, login lockout, and parsing |
| `scripts/reset-password.ts` | Command-line password reset |
| `public/brand/` | Logo masters (lockup, tulip mark on light, dark and transparent) |
| `scripts/build-icons.mjs` | `npm run icons`: rebuilds the favicon, home-screen icons and login logos in `public/` from `public/brand/` |
