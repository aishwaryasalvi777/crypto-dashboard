# Tessera — Crypto Dashboard

A dynamic cryptocurrency dashboard built with **Remix + React + TypeScript**. View, filter,
reorder, and refresh real-time exchange rates for 12 major cryptocurrencies, with USD and BTC
pricing, 7-day sparklines, dark/light theming, and session-based authentication.

> Built from the [`Crypto Dashboard.dc.html`](https://claude.ai/design/p/1ab29611-82ab-449d-87dc-068285b5d7bf)
> Claude Design source. The visual design (layout, tokens, interactions) is a faithful Remix
> translation of that file.

![dark mode grid view](#) <!-- add screenshots before submitting -->

---

## Features

| Requirement | Status |
| --- | --- |
| Responsive card layout, 10+ coins (name, symbol, USD rate, BTC rate) | ✅ |
| Dynamic data fetching on page load | ✅ (Remix `loader`, server-side) |
| Manual refresh + auto-refresh (configurable interval) | ✅ |
| Drag & drop reordering, persists on the page | ✅ (native HTML5 DnD) |
| Filter by name or symbol | ✅ |
| **Bonus** — order persisted to `localStorage` | ✅ |
| **Bonus** — dark / light mode toggle | ✅ (persisted, SSR-safe) |
| **Bonus** — loading + error states | ✅ (skeletons, error + retry, demo fallback) |
| **Bonus** — user authentication | ✅ (env credentials, cookie session) |
| **Bonus** — unit tests | ✅ (Vitest) |

Extra polish beyond the brief: grid/list view toggle, 7-day sparklines, 24h change badges,
empty-search state, accessible focus styles, and a pluggable data-provider layer so the live API
can be swapped without touching the UI. See [CLAUDE.md](./CLAUDE.md) for the full breakdown of
what's done, what's deferred, and what could be done next.

---

## Tech stack

- **Remix** (v2, Vite) — SSR, nested routes, loaders/actions, sessions
- **React 18** + **TypeScript** (strict)
- **Vitest** + **Testing Library** — unit tests
- Native HTML5 drag-and-drop (no DnD dependency)
- Plain CSS with CSS custom-property theme tokens (no UI framework)

---

## Getting started

### Prerequisites

- Node.js **18.18+** (or 20+)
- npm

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy the example env file and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `SESSION_SECRET` | _(required)_ | Secret used to sign the session cookie. Use a long random string. |
| `AUTH_USERNAME` | `admin` | Temporary login username (auth integration is wired but credentials live in env). |
| `AUTH_PASSWORD` | `password` | Temporary login password. **Change before any real use.** |
| `CRYPTO_PROVIDER` | `mock` | Data source: `mock` (offline demo data) or `coingecko` (live API). |
| `COINGECKO_API_BASE` | `https://api.coingecko.com/api/v3` | Override for CoinGecko Pro / proxy. |
| `COINGECKO_API_KEY` | _(empty)_ | Optional CoinGecko API key for higher rate limits. |
| `REFRESH_SECONDS` | `30` | Auto-refresh interval (10–300s). |

> **Why `mock` by default?** The brief states *"all the integrations and API we will integrate
> later."* The app ships fully functional against deterministic demo data so it runs offline with
> zero setup. Flip `CRYPTO_PROVIDER=coingecko` to hit the live API. See
> [CLAUDE.md](./CLAUDE.md#data-provider-layer) for the contract.

### 3. Run

```bash
npm run dev        # start the dev server (http://localhost:3000)
```

Log in with the credentials from your `.env` (defaults: `admin` / `password`).

### Other scripts

```bash
npm run build      # production build
npm start          # serve the production build
npm run typecheck  # tsc --noEmit
npm test           # run unit tests (Vitest)
npm run test:watch # watch mode
```

---

## Authentication

Authentication is **required** and intentionally minimal: a single set of credentials stored in
environment variables, verified server-side, with the result persisted in a signed, HTTP-only
cookie session.

- `app/lib/auth/auth.server.ts` — credential verification + route guards
- `app/lib/auth/session.server.ts` — cookie session storage
- `/login` — login form (Remix `action`)
- `/logout` — destroys the session
- `/dashboard` — protected; unauthenticated users are redirected to `/login`

This is a deliberate take-home-scoped stand-in. The same `requireUserId` guard and session plumbing
extend cleanly to a real identity provider (OAuth, JWT, a users table) — see
[CLAUDE.md](./CLAUDE.md#authentication) for the upgrade path.

---

## Data fetching & live prices

Data flows through a small **provider interface** (`CryptoProvider`) so the UI never knows where
prices come from:

```
routes/dashboard.tsx (loader, server)
        └─ getCryptoProvider(env)        ← factory picks mock | coingecko
              └─ provider.getMarkets()    ← returns normalized Coin[]
```

- **`mock`** — built-in deterministic dataset (12 coins, generated sparklines). No network, no keys.
- **`coingecko`** — live `coins/markets` endpoint (USD prices, 24h change, 7-day sparkline). BTC
  rate is derived as `coin.priceUsd / bitcoin.priceUsd`.

Refreshing (manual button + auto-refresh toggle) re-runs the loader via Remix's `useRevalidator`,
so data fetching stays on the server and the client just re-renders.

> The brief references the Coinbase API; CoinGecko is used because its single `coins/markets`
> endpoint returns name, symbol, USD price, 24h change, and 7-day sparkline in one keyless call,
> which maps directly to the design. A Coinbase provider can be dropped in behind the same
> interface — see [CLAUDE.md](./CLAUDE.md#trade-offs).

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
├── components/              # Header, Controls, CoinCard, CoinList, Sparkline, states…
├── hooks/                   # useLocalStorage, useTheme, useCardOrder, useAutoRefresh
├── lib/
│   ├── auth/                # session + credential auth (server-only)
│   ├── crypto/              # types, provider interface, mock/coingecko, formatting
│   └── theme.ts             # theme tokens + types
└── styles/app.css           # design tokens + component styles
tests/                       # Vitest unit tests
```

See [CLAUDE.md](./CLAUDE.md) for architecture rationale, conventions, and guidelines for AI agents
extending this codebase.

---

## License

Take-home exercise — not licensed for redistribution.
