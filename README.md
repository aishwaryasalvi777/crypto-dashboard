# Tessera — Crypto Dashboard

A dynamic cryptocurrency dashboard built with **Remix + React + TypeScript**. View, filter,
reorder, and refresh real-time exchange rates for 12 major cryptocurrencies — each with its USD
price, Bitcoin (BTC) exchange rate, coin logo, and (depending on the data source) a 24-hour change
badge and 7-day sparkline. Includes dark/light theming, grid/list views, drag-and-drop reordering
that persists, and session-based authentication.

🔗 **Live demo:** https://crypto-currency-canvas.netlify.app
🎨 **Design source:** [`Crypto Dashboard.dc.html`](https://claude.ai/design/p/1ab29611-82ab-449d-87dc-068285b5d7bf)
(the UI is a faithful Remix translation of this Claude Design file)

> 📖 For a single, consolidated record of the project — what it is, every decision, and the full
> build/deploy history — see [documentation.md](./documentation.md). For AI/engineer contribution
> rules and architecture rationale, see [CLAUDE.md](./CLAUDE.md).

<!-- Add screenshots before submitting:
![Dark mode — grid view](docs/screenshot-grid-dark.png)
![Light mode — list view](docs/screenshot-list-light.png)
-->

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Architecture](#architecture)
- [Decisions & tradeoffs](#decisions--tradeoffs)
- [Testing](#testing)
- [Deployment (Netlify)](#deployment-netlify)
- [Guidelines for AI follow-up features](#guidelines-for-ai-follow-up-features)
- [Project structure](#project-structure)

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
| Loading + error states | ✅ skeletons, error + retry, "load demo data" fallback |
| User authentication | ✅ env credentials + signed cookie session |
| Unit tests | ✅ 35 tests (Vitest) |
| Real coin logos | ✅ color SVGs w/ graceful initial-letter fallback |
| Grid / list view toggle | ✅ persisted |
| 24h change badges + 7-day sparklines | ✅ (shown under `coingecko`/`mock`; see tradeoffs) |
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

---

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `SESSION_SECRET` | _(required)_ | Secret that signs the session cookie. Use a long random string. |
| `AUTH_USERNAME` | `admin` | Login username (temporary, env-based credentials). |
| `AUTH_PASSWORD` | `password` | Login password. **Change before any real use.** |
| `CRYPTO_PROVIDER` | `coinbase` | Data source: `coinbase` (live, default), `coingecko` (live + 24h change & sparklines), or `mock` (offline demo data). |
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
        └─ provider.getMarkets()       ← coinbase | coingecko | mock
             └─ returns Coin[]         ← normalized domain model (raw numbers only)
```

- **`coinbase`** (default) — `GET /v2/exchange-rates?currency=USD`. One keyless request returns the
  rate of every currency per USD; we derive `priceUsd = 1 / rate[coin]` and
  `priceBtc = rate[BTC] / rate[coin]`. No 24h change / sparkline (not exposed publicly).
- **`coingecko`** — `coins/markets`: USD price, 24h change, and 7-day sparkline in one call. Use
  this for the full visual design.
- **`mock`** — deterministic offline dataset (12 coins, seeded sparklines). No network or keys;
  also backs the error-state "Load demo data" button.

Manual refresh and auto-refresh re-run the loader via Remix's `useRevalidator` — data fetching
stays on the server; the client just re-renders.

### Domain model

`Coin` (`app/lib/crypto/types.ts`) holds **raw numbers only** (`priceUsd`, `priceBtc`, `change24h`,
`sparkline`). All display formatting (`$`, `₿`, `%`, SVG sparkline points, logo URLs) lives in pure,
unit-tested functions in `format.ts`. Principle: **numbers in the model, strings at the edge.**

### Client state

Filter, view (grid/list), theme, and card order are client state. Order, theme, and view persist to
`localStorage` (`cd_order`, `cd_theme`, `cd_view`) via an SSR-safe `useLocalStorage` hook. Theme is
applied pre-paint by a tiny inline script (`data-theme` on `<html>`) to avoid a flash. Card order is
an array of coin ids that's reconciled with each refresh (new coins appended, removed coins dropped).

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

- **Coinbase as the default live source.** The brief specifies the Coinbase API, and its public
  `exchange-rates` endpoint returns every required field (name, symbol, USD rate, BTC rate) in one
  keyless call. Tradeoff: Coinbase's public API has **no 24h change or price history**, so those
  visuals degrade gracefully under `coinbase` (badge/sparkline omitted). **CoinGecko** stays wired
  (`CRYPTO_PROVIDER=coingecko`) for the full visual design. All sources sit behind one interface, so
  switching is a single env var.
- **Mock-first, "integrate APIs later."** Honoring the brief's note that integrations come later,
  the app ships fully functional on deterministic mock data — runs offline, in CI, with zero setup.
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

## Testing

```bash
npm test
```

**35 unit tests (Vitest)** cover the logic that matters most and is DOM-independent:

- `format.ts` — USD/BTC/percent formatting, sparkline geometry, logo URLs, avatar helpers
- `order.ts` — order reconciliation, drag-move, filtering by name/symbol
- providers — mock dataset shape/determinism, Coinbase rate normalization (USD + BTC math)
- `auth.server.ts` — credential verification

CI-friendly: tests use the mock provider, so they need no network or API keys.

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
   done. Keep the offline path working: `CRYPTO_PROVIDER=mock` must run with no network or keys.

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
├── components/              # Header, Controls, CoinCard/Row, CoinAvatar, Sparkline, states…
├── hooks/                   # useLocalStorage, useTheme, useCardOrder, useAutoRefresh
├── lib/
│   ├── auth/                # session + credential auth (server-only)
│   ├── crypto/              # types, provider interface, coinbase/coingecko/mock, formatting
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
