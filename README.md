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

## Local development

```bash
npm run db:init:local
npm run dev                            # http://localhost:8787
```

## Code

| File | What |
|---|---|
| `schema.sql` | 4 tables: users, transactions, sessions, settings |
| `src/index.tsx` | All pages and routes |
| `src/lib.ts` | Money, dates, passwords, and the allowance/interest catch-up |
| `src/views.tsx` | Layout, styles, shared UI bits |
