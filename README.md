# Pandectes Staff

Internal staff panel for **Pandectes GDPR Compliance for Shopify** (`../app`).

- **Sign in** — allowlisted emails only, one-time 6-digit PIN mailed via AWS SES.
- **Store lookup** — search a Shopify domain, see the store's install, billing, access and
  deployment status.

## Stack

React Router 7 (SSR) · Tailwind CSS 4 · shadcn/ui · Drizzle + mysql2 · AWS SES.

## Setup

```bash
pnpm install
cp .env.example .env
# fill in MYSQL_* and SESSION_SECRET
pnpm dev
```

Without `AWS_SES_*` credentials the sign-in PIN is printed to the server log instead of emailed,
so local development needs no mail setup.

## Database access

The panel opens its **own read-only connection** to the GDPR app's MySQL database. Point
`MYSQL_USER` at an account with `SELECT` only — nothing here writes.

`app/.server/schema/` is a hand-trimmed mirror of the columns this panel displays. The GDPR app
owns those tables; **never run migrations from this repo**. When the panel needs a new column, add
it to the mirror after it exists upstream.

## Auth model

No PIN is stored server-side. Requesting a code sets a signed, httpOnly cookie holding
`HMAC(SESSION_SECRET, email:pin:expiry)` — so the cookie cannot be turned back into a code. Verify
compares in constant time, allows `PIN_MAX_ATTEMPTS` tries, then burns the challenge. On success the
challenge cookie is cleared and a signed session cookie is issued for `SESSION_MAX_AGE` seconds.

The allowlist is re-checked on every request, so removing an address from `STAFF_EMAILS` and
restarting logs that person out.

## Scripts

| Script           | What it does                   |
| ---------------- | ------------------------------ |
| `pnpm dev`       | Vite dev server                |
| `pnpm build`     | Production build               |
| `pnpm start`     | Serve the build                |
| `pnpm typecheck` | Route typegen + `tsc --noEmit` |
