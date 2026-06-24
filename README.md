# Tessera — Crypto Dashboard

A dynamic cryptocurrency dashboard built with **Remix + React + TypeScript**. View, filter,
reorder, and refresh real-time exchange rates for 12 major cryptocurrencies — each with its USD
price, Bitcoin (BTC) exchange rate, coin logo, and (depending on the data source) a 24-hour change
badge and 7-day sparkline. Includes dark/light theming, grid/list views, drag-and-drop reordering
that persists, and session-based authentication.

🔗 **Live demo:** https://crypto-currency-canvas.netlify.app 

> 📖 For a single, consolidated record of the project — what it is, every decision, and the full
> build/deploy history — see [documentation.md](./documentation.md). For AI/engineer contribution
> rules and architecture rationale, see [CLAUDE.md](./CLAUDE.md).

<!-- Add screenshots before submitting:
![Dark mode — grid view](docs/screenshot-grid-dark.png)
![Light mode — list view](docs/screenshot-list-light.png)
-->

---

## Table of contents

- [Tessera — Crypto Dashboard](#tessera--crypto-dashboard)
  - [Table of contents](#table-of-contents)
  - [Features](#features)
    - [Core requirements](#core-requirements)
    - [Bonus / extras](#bonus--extras)
  - [Tech stack](#tech-stack)
  - [Quick start](#quick-start)
    - [Prerequisites](#prerequisites)
    - [1. Install](#1-install)
    - [2. Configure environment](#2-configure-environment)
    - [3. Run](#3-run)
    - [Scripts](#scripts)
  - [Environment variables](#environment-variables)
  - [Architecture](#architecture)
    - [Request flow](#request-flow)
    - [Domain model](#domain-model)
    - [Client state \& the watchlist](#client-state--the-watchlist)
    - [Authentication](#authentication)
  - [Decisions \& tradeoffs](#decisions--tradeoffs)
  - [Coin-id drift — how it's handled](#coin-id-drift--how-its-handled)
  - [Testing](#testing)
  - [Deployment (Netlify)](#deployment-netlify)
  - [Guidelines for AI follow-up features](#guidelines-for-ai-follow-up-features)
  - [Project structure](#project-structure)
  - [License](#license)

---

## Features

### Core requirements

| Requirement | Status |
| --- | --- |
| Responsive card layout, 10+ coins (name, symbol, USD rate, BTC rate) | ✅ 12 coins |
| Dynamic data fetching on page load | ✅ Remix `loader` (server-side) |
| Manual refresh **and** auto-refresh (configurable interval) | ✅ |
| Drag-and-drop reordering, persists while on the page | ✅ native HTML5 DnD |
| Filter by name or symbol | ✅ |

### Bonus / extras

| Item | Status |
| --- | --- |
| Card order persisted to `localStorage` | ✅ survives reload |
| Dark / light mode toggle | ✅ persisted, SSR-safe (no flash) |
| Loading + error states | ✅ skeletons, error + retry |
| User authentication | ✅ env credentials + signed cookie session |
| Unit tests | ✅ 35 tests (Vitest) |
| **Customizable watchlist** | ✅ search the top-250 market, **add / remove** coins, persisted (`localStorage`), default = 12 |
| Real coin logos | ✅ color SVGs w/ graceful initial-letter fallback |
| Grid / list view toggle | ✅ persisted |
| 24h change badges + 7-day sparklines | ✅ (hybrid / coingecko) |
| Empty-search state, accessible focus styles, tabular-figure prices | ✅ |
| Pluggable data-provider layer | ✅ swap the live API without touching the UI |

---

## Tech stack

- **[Remix](https://remix.run/) v2 (Vite)** — SSR, nested routes, loaders/actions, cookie sessions
- **React 18** + **TypeScript** (`strict`)
- **Vitest** + **Testing Library** — unit tests
- **Native HTML5 drag-and-drop** — zero DnD dependencies
- **Plain CSS** with CSS custom-property theme tokens — no UI framework
- **Deployed on Netlify** via `@netlify/remix-adapter` (serverless SSR)

---

## Quick start

### Prerequisites

- **Node.js 18.18+** (or 20+) and npm

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set at least `SESSION_SECRET` (any long random string) and your login
`AUTH_USERNAME` / `AUTH_PASSWORD`. The defaults run out of the box. See
[Environment variables](#environment-variables).

> Generate a strong session secret:
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

### 3. Run

```bash
npm run dev          # dev server → http://localhost:3000
```

Open http://localhost:3000 and log in with your `.env` credentials.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run unit tests once |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run check:coins` | Live guard — fails if a tracked coin's symbol stops resolving on either API |

---

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `SESSION_SECRET` | _(required)_ | Secret that signs the session cookie. Use a long random string. |
| `AUTH_USERNAME` | `admin` | Login username (temporary, env-based credentials). |
| `AUTH_PASSWORD` | `password` | Login password. **Change before any real use.** |
| `CRYPTO_PROVIDER` | `hybrid` | Live data source: `hybrid` (default — CoinGecko catalog + Coinbase prices), `coinbase`, or `coingecko`. |
| `COINBASE_API_BASE` | `https://api.coinbase.com` | Coinbase API base URL. |
| `COINBASE_API_KEY` | _(empty)_ | **Not required** for public exchange rates — reserved for future authenticated features. Leave blank. |
| `COINGECKO_API_BASE` | `https://api.coingecko.com/api/v3` | Override for CoinGecko Pro / proxy. |
| `COINGECKO_API_KEY` | _(empty)_ | Optional CoinGecko key for higher rate limits. |
| `REFRESH_SECONDS` | `30` | Auto-refresh interval (clamped 10–300s). |

`.env` is gitignored. On Netlify, set these in **Site configuration → Environment variables**
(see [Deployment](#deployment-netlify)).

---

## Architecture

### Request flow

Price data is fetched **server-side in the Remix loader** and flows through a single provider
interface, so the UI never knows or cares where prices come from:

```
routes/dashboard.tsx  (loader — runs on the server, behind the auth guard)
   └─ getCryptoProvider()              ← factory reads CRYPTO_PROVIDER
        └─ provider.getMarkets()       ← hybrid | coinbase | coingecko
             └─ returns Coin[]         ← normalized domain model (raw numbers only)
```

- **`hybrid`** (default) — **CoinGecko** supplies the full searchable **catalog** (top-250 markets,
  with 24h change + 7-day sparkline); **Coinbase** prices are **overlaid** for every symbol it
  quotes, so Coinbase stays the USD/BTC authority for those coins (the brief's requirement) while
  CoinGecko covers the long tail you can search/add. Resilient via `Promise.allSettled`: Coinbase
  down → catalog with CoinGecko prices; CoinGecko down → Coinbase-priced default watchlist; both
  down → error state.
- **`coinbase`** — `GET /v2/exchange-rates?currency=USD`. Keyless; `priceUsd = 1 / rate[coin]`,
  `priceBtc = rate[BTC] / rate[coin]`. No 24h change / sparkline (not exposed publicly).
- **`coingecko`** — `coins/markets`: USD price, 24h change, and 7-day sparkline in one call.
Manual refresh and auto-refresh re-run the loader via Remix's `useRevalidator` — data fetching
stays on the server; the client just re-renders.

### Domain model

`Coin` (`app/lib/crypto/types.ts`) holds **raw numbers only** (`priceUsd`, `priceBtc`, `change24h`,
`sparkline`). All display formatting (`$`, `₿`, `%`, SVG sparkline points, logo URLs) lives in pure,
unit-tested functions in `format.ts`. Principle: **numbers in the model, strings at the edge.**

### Client state & the watchlist

Filter, view (grid/list), theme, and the **watchlist** are client state, persisted to `localStorage`
(`cd_watchlist`, `cd_theme`, `cd_view`) via an SSR-safe `useLocalStorage` hook. Theme is applied
pre-paint by a tiny inline script (`data-theme` on `<html>`) to avoid a flash.

The **watchlist** is an ordered array of coin ids (symbols) — it's both *which* coins you track and
*their order*. The loader returns the whole top-250 **catalog**; the client shows the watchlist
subset, lets you **search the catalog and add** any coin (`+ Add coin`), **remove** any card (×), and
**drag to reorder** — all persisted. A new user starts at the default 12; the watchlist is reconciled
against the catalog on refresh so stale entries drop out. Pure logic lives in `lib/watchlist.ts`; the
React shell is `hooks/useWatchlist.ts`.

> Tradeoff: the loader ships the full catalog (~250 coins) so search/add is instant with no extra
> round-trips; sparklines are down-sampled server-side to keep the payload small (≈50 KB gzipped).

### Authentication

Required and intentionally minimal: a single credential pair in env, verified server-side
(constant-time comparison), persisted in a **signed, HTTP-only cookie session**.

- `app/lib/auth/auth.server.ts` — `verifyCredentials`, `createUserSession`, `requireUserId` guard
- `app/lib/auth/session.server.ts` — cookie session storage
- `/login` (form + `action`), `/logout` (`action`), `/dashboard` (guarded → redirects to `/login`)

The `requireUserId` guard and session plumbing extend cleanly to a real identity provider (OAuth,
JWT, a users table) without changing the UI.

---

## Decisions & tradeoffs

- **Hybrid (Coinbase + CoinGecko) as the default live source.** The brief specifies the Coinbase
  API, so Coinbase remains the authority for the required USD + BTC rates; CoinGecko enriches each
  coin with 24h change + sparkline so the full visual design renders. They're combined in a
  `hybrid` provider behind the same `CryptoProvider` seam, with `Promise.allSettled` graceful
  degradation (one source down → still works). Tradeoff: two upstream calls per refresh (bounded by
  the 12s cache) and a minor source mix (Coinbase price, CoinGecko %). `coinbase` and `coingecko`
  remain selectable via one env var.
- **All-live (no mock).** The app runs entirely on live data. Unit tests stay offline via fixtures
  and injected fakes (not a runtime mock source), so CI needs no network or keys.
- **Server-side fetching in the loader** (vs. the design's client `fetch`). Idiomatic Remix: keeps
  API keys server-side, enables SSR, centralizes error handling; refresh uses `useRevalidator`.
- **Native HTML5 drag-and-drop** over a library. The design already uses it; zero dependencies,
  sufficient for a small list. Tradeoff: weaker touch/keyboard support — swap to `@dnd-kit` behind
  the same `useCardOrder` hook if requirements grow.
- **Env-based single-credential auth.** Matches the explicit requirement (temporary id/password in
  env). Real enough to demonstrate the session + guard pattern, small enough not to over-build.
- **Plain CSS + theme tokens** over a UI framework. Faithful to the design, easy to theme in one
  place, no runtime cost or dependency churn.
- **Coin logos from a CDN with a fallback.** Real color-SVG logos load from jsdelivr's
  `cryptocurrency-icons` (a durable CDN), with a graceful fallback to a colored initial-letter
  avatar if an icon fails — so there's never a broken image, regardless of provider.

---

## Coin-id drift — how it's handled

**The risk.** Hardcoding provider-specific keys per coin is fragile: CoinGecko **renames ids**
(Polygon's `matic-network` → `polygon-ecosystem-token`), Coinbase may not **quote** a symbol, and
tickers can **collide**. A stale key would silently drop a coin's 24h badge / sparkline — easy to
miss, and the risk grows as coins are added.

**How it's resolved (implemented):**

1. **Identity we own.** [`coins.ts`](app/lib/crypto/coins.ts) defines each coin as `{ id, symbol,
   name }` where `id` is *our own* stable slug. Providers are matched to the live APIs **by symbol**,
   never by a hardcoded provider id — so a CoinGecko id rename **self-heals** (we still match `pol`),
   and the displayed id/name stay stable.
2. **Top-market resolution.** The CoinGecko provider fetches the **top 250 markets by market cap** and
   matches tracked coins by symbol; on a ticker collision the **highest-market-cap** coin wins.
   Adding a coin = add one `{ id, symbol, name }` row — no provider id to rot.
3. **Guard against drift.** `npm run check:coins` hits both live APIs and **fails** if any tracked
   symbol stops resolving on Coinbase or CoinGecko — so drift surfaces loudly (run it in CI) instead
   of as a silently graph-less card. It's a Vitest test, skipped in the default offline `npm test`.

Result: all 12 coins (incl. Polygon, now `POL`) render fully, and future coins are a one-line add.
Tradeoff: the CoinGecko call returns the top 250 (larger payload than 12), bounded by the 12s cache.

---

## Testing

```bash
npm test
```

**61 unit tests (Vitest)** cover the logic that matters most and is DOM-independent:

- `format.ts` — USD/BTC/percent formatting, sparkline geometry, logo URLs, avatar helpers
- `order.ts` — order reconciliation, drag-move, filtering by name/symbol
- providers — Coinbase + CoinGecko normalization (symbol matching, BTC math, id-rename self-heal,
  collisions), hybrid overlay + all fallback paths; watchlist add/remove/reconcile
- `cache.server.ts` — TTL cache hit/dedup/expiry; `auth.server.ts` — credential verify + fail-closed

CI-friendly: the default suite uses no network or keys. A separate live guard,
`npm run check:coins`, hits both APIs and fails if any tracked coin's symbol stops resolving — run
it in CI to catch coin drift before deploy (skipped in the offline `npm test`).

---

## Deployment (Netlify)

Deployed from GitHub with the official **`@netlify/remix-adapter`**, which emits a serverless
function for SSR. Config lives in [`netlify.toml`](./netlify.toml):

- Build command `npm run build`, publish dir `build/client`
- The adapter's Vite plugin auto-generates the SSR function and routing
- `SECRETS_SCAN_OMIT_KEYS` excludes non-secret config (public API URLs, provider name, demo
  credentials) from Netlify's secret scanner — `SESSION_SECRET` stays scanned

To deploy your own: connect the repo, set the [environment variables](#environment-variables) in
Netlify, and push. (See [documentation.md](./documentation.md) for the full deployment story,
including the three issues solved along the way.)

---

## Guidelines for AI follow-up features

This codebase is structured so an AI agent (or any engineer) can add features without breaking its
seams. Full detail in [CLAUDE.md](./CLAUDE.md); the essentials:

1. **New data sources implement `CryptoProvider` and register in the factory** — never fetch prices
   from a component or the browser. The `Coin` type is the contract.
2. **Numbers in the model, strings at the edge.** Add raw fields to `Coin`; format them in
   `format.ts` with a unit test. Don't bake display strings into a provider.
3. **Server-only code lives in `*.server.ts`** (anything reading `process.env`, secrets, or Node
   APIs) so it's stripped from the client bundle.
4. **Persisted client state goes through `useLocalStorage`** with a `cd_` key prefix and must be
   SSR-safe (no `localStorage` access during the first render).
5. **Theme values are CSS custom properties under `[data-theme]`** — keep both themes in sync; no
   inline colors.
6. **Add a test with each logic change**, and run `npm run typecheck && npm test` before declaring
   done. Keep unit tests offline (fixtures/fakes, no network) so CI stays green without keys.

`CLAUDE.md` also tracks **what's done, what's deferred, and a ready backlog** (watchlists, WebSocket
prices, per-coin detail pages, sortable columns, currency selector, real multi-user auth) with
rationale for each.

---

## Project structure

```
app/
├── root.tsx                 # document shell, theme bootstrapping
├── routes/
│   ├── _index.tsx           # redirect → /dashboard
│   ├── login.tsx            # login form + action
│   ├── logout.tsx           # logout action
│   └── dashboard.tsx        # protected; loader fetches markets
├── components/              # Header, Controls, CoinCard/Row, CoinAvatar, AddCoinPanel, states…
├── hooks/                   # useLocalStorage, useTheme, useWatchlist, useAutoRefresh
├── lib/
│   ├── auth/                # session + credential auth (server-only)
│   ├── crypto/              # types, provider interface, hybrid/coinbase/coingecko, cache, format
│   ├── watchlist.ts         # add/remove/reconcile (pure)
│   └── theme.ts             # theme tokens + types
└── styles/app.css           # design tokens + component styles
tests/                       # Vitest unit tests
netlify.toml                 # Netlify build + secrets-scan config
documentation.md             # consolidated project record (overview, decisions, history)
CLAUDE.md                    # architecture + contribution guidelines for AI/engineers
```

---

## License

Take-home exercise — not licensed for redistribution.
