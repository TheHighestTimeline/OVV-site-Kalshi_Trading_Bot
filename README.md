# Kalshi Trading Bot — Dashboard

Next.js 14 (App Router) + Clerk dashboard for the Kalshi BTC/RSI trading bot.
Users connect their Kalshi API credentials and a GitHub fork of the bot; the
dashboard shows live portfolio/positions/settlements and a market scanner, and
starts/stops the bot by dispatching a GitHub Actions workflow on the fork.

## Stack

- Next.js 14.2 (App Router, TypeScript)
- Clerk — authentication; credentials stored encrypted in `privateMetadata`
- Tailwind CSS
- libsodium-wrappers — sealed-box encryption for pushing GitHub Actions secrets
- Kalshi Trade API v2 (RSA-PSS request signing)

## Routes

```
app/
  page.tsx                          → redirects to /dashboard or /sign-in
  dashboard/page.tsx                main app (live + backtest tabs)
  setup/page.tsx                    GitHub connection flow
  sign-in / sign-up                 Clerk
  api/
    user            GET/POST        read setup state · save Kalshi/GitHub creds
    bot/start       POST            push secrets + dispatch bot.yml
    bot/stop        POST            cancel the running workflow
    bot/status      GET             current workflow run status
    bot/state       GET             read dashboard/btc_paper_state.json from fork
    kalshi/portfolio  GET           balance
    kalshi/positions  GET           open positions
    kalshi/settlements GET          trade history
    scanner         GET             multi-TF confluence + active contract
    github/repos    POST            list user repos for a PAT
components/  BTCChart, StatsCards, TradeTable, Modal, SetupCards,
             BacktestDashboard, SettingsModal, ScanSnapshot
lib/         kalshi.ts, crypto.ts, github.ts, csrf.ts
middleware.ts  Clerk route protection
```

## Environment variables

See `.env.example`. Required to boot: the two Clerk keys + `ENCRYPTION_KEY`.
Set all of them in Netlify → Site settings → Environment variables.

## ⚠️ Important — reconstruction notes

This codebase was **reconstructed**. The source folder it came from had badly
scrambled filenames (file contents did not match their names) and was missing
files. What was done:

**Recovered verbatim** (real source, just renamed to correct paths):
all 10 API routes, the dashboard page, setup page, sign-up page, sign-in page,
layout, and `globals.css`.

**Re-implemented from scratch** to match the recovered code's exact import
contracts (the originals were missing entirely, and the deployed build was
minified with no sourcemaps):
`lib/kalshi.ts`, `lib/crypto.ts`, `lib/github.ts`, `lib/csrf.ts`, and the
components `BTCChart`, `StatsCards`, `TradeTable`, `Modal`, `SetupCards`,
`BacktestDashboard`, `SettingsModal`, `ScanSnapshot`, plus `middleware.ts`,
`app/page.tsx`, and all config files.

Things to verify before trusting in production:
- **`lib/crypto.ts`** uses AES-256-GCM keyed off `ENCRYPTION_KEY`. If your
  original used a different scheme, previously-stored credentials won't decrypt
  — users would simply re-enter them. Set a fresh `ENCRYPTION_KEY`.
- **`lib/kalshi.ts`** signing targets `api.elections.kalshi.com` with RSA-PSS.
  Confirm the base URL and any field names against a live Kalshi key.
- **`lib/github.ts`** dispatches `bot.yml` and sets `KALSHI_API_KEY_ID` /
  `KALSHI_PRIVATE_KEY` secrets — make sure the bot repo's workflow matches.
- The reconstructed **components** match the dashboard's prop contracts but the
  visual detail is best-effort; refine to taste.

Verification done here: balanced-brace parse + import-graph resolution across
all 30 TS/TSX files passed. A full `next build` was not possible in the rebuild
environment (no registry access); Netlify will run it on deploy.
