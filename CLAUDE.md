# CLAUDE.md — Project guide for AI agents

This file orients Claude (and other AI agents) working on the Tessera crypto dashboard. Read it
before making changes. It records architecture, conventions, current status, and explicit
guidelines for follow-up features.

---

## 1. What this project is

A **Remix + React + TypeScript** cryptocurrency dashboard implementing the
`Crypto Dashboard.dc.html` Claude Design source. It lists 12 major coins as draggable cards (or a
table), shows USD price, 24h change, a 7-day sparkline, and the BTC exchange rate, and supports
filtering, manual/auto refresh, dark/light theming, and env-based login.

The brief's governing constraint: **"All the integrations and API we will integrate later."** So
the app is built to be fully functional *today* on deterministic mock data, with the real
integration points (live price API, real auth provider) isolated behind clean seams and documented
for later wiring — not stubbed with `TODO`s scattered through the UI.

---

## 2. Architecture & conventions

### Routing (Remix v2, Vite)
- `_index.tsx` redirects to `/dashboard`.
- `dashboard.tsx` is the only data route. Its `loader` runs the auth guard, then fetches markets
  through the provider. The component is presentational + client interaction only.
- Auth lives in `login.tsx` (form + `action`) and `logout.tsx` (`action`).

### Server vs client boundary
- Anything touching secrets or Node APIs is in a `*.server.ts` file (`auth.server.ts`,
  `session.server.ts`, `*.provider.server.ts`). Remix strips these from the client bundle.
- Price fetching happens **server-side in the loader**, never in the browser. Refresh re-runs the
  loader via `useRevalidator()` — the client holds no API logic.

### Data provider layer
The single most important seam. `app/lib/crypto/provider.server.ts` defines:

```ts
interface CryptoProvider {
  getMarkets(): Promise<Coin[]>;
}
```

- `getCryptoProvider()` is a factory that reads `CRYPTO_PROVIDER` and returns `mock` or `coingecko`.
- `mock.provider.server.ts` — deterministic data, used by default and by the "Load demo data" error
  fallback.
- `coingecko.provider.server.ts` — live implementation. Normalizes the response into `Coin[]` and
  derives the BTC rate from the bitcoin row.
- **To add a new source (e.g. Coinbase): implement `CryptoProvider`, register it in the factory.
  Touch nothing else.** The `Coin` type is the contract.

### Domain model
`Coin` (in `types.ts`) holds **raw numeric data only** — `priceUsd`, `priceBtc`, `change24h`,
`sparkline: number[]`. All display formatting (`$`, `₿`, `%`, sparkline SVG points) lives in pure
functions in `format.ts`. Keep it that way: numbers in the model, strings at the edge. This is what
makes the logic unit-testable without a DOM.

### Client state (dashboard component)
- **Filter, view (grid/list), theme, card order** are client state.
- Persisted to `localStorage` via `useLocalStorage` (keys: `cd_theme`, `cd_view`, `cd_order`).
- Theme is also read in `root.tsx` before hydration to avoid a flash; it's applied via a
  `data-theme` attribute and CSS custom properties.
- Card order is an array of coin `id`s (`useCardOrder`). New coins from the API are appended;
  removed coins are filtered out — order survives data refreshes.

### Styling
- Plain CSS in `app/styles/app.css`, organized as **design tokens** (CSS custom properties per
  theme on `[data-theme]`) + semantic component classes. No CSS framework, no inline style soup.
- Tokens mirror the design exactly: `--bg`, `--surface`, `--surface2`, `--border`, `--text`,
  `--muted`, `--accent`. Change a theme in one place.

### TypeScript
- `strict: true`. No `any` in app code. Loader/action data is typed via Remix generics.
- Path alias `~/*` → `app/*`.

---

## 3. Current status

### ✅ Done
- Full UI translation of the design: header, controls, grid + list views, coin cards/rows,
  sparklines, 24h badges, BTC rate, drag handle.
- Server-side data fetching in the loader; mock + CoinGecko providers behind a factory.
- Manual refresh + toggleable auto-refresh (interval from `REFRESH_SECONDS`).
- Native HTML5 drag-and-drop reordering, persisted to `localStorage`.
- Filter by name/symbol; empty-search state.
- Dark/light theme toggle, SSR-safe (no flash), persisted.
- Loading skeletons, error state with **Retry** + **Load demo data**.
- Required auth: env credentials, signed cookie session, route guard, login/logout.
- Unit tests for formatting, ordering, filtering, and auth verification.

### 🚧 Remaining / deferred (by design — "integrate later")
- **Live by default.** `CRYPTO_PROVIDER=coinbase` (live) is the default; `coingecko` and `mock`
  are alternatives. Coinbase + CoinGecko providers are both implemented.
- **Coinbase 24h change / sparkline** are unavailable from its public API (degrade gracefully);
  use `coingecko` for those visuals. An authenticated Coinbase key is wired but unused.
- **Real auth provider** not integrated — single env credential pair stands in. Session plumbing is
  real and reusable.
- No server-side persistence of card order (per-browser `localStorage` only) — the brief only
  requires per-page persistence; localStorage is the bonus.
- No price history beyond the 7-day sparkline the API returns; no per-coin detail page.
- No rate-limit backoff/caching layer for the live API yet (see "could be done").

### 💡 Could be done next (brainstorm beyond the brief)
- **Server-side response cache** (short TTL) + request de-dup to respect CoinGecko's free-tier rate
  limit and make refresh feel instant.
- **WebSocket / SSE live prices** instead of polling, for true real-time ticks.
- **Per-coin detail route** with full price chart, market cap, volume.
- **Watchlist / portfolio** — quantity per coin, total value, gain/loss (needs the auth/user layer
  to become per-user, and server persistence).
- **Currency selector** (EUR, GBP…) — provider already takes a vs-currency; surface it in the UI.
- **Sortable columns** in list view (price, 24h, name) alongside manual drag order.
- **Keyboard-accessible reordering** (arrow keys) — native DnD isn't keyboard-friendly; add an
  a11y path. Consider `@dnd-kit` if DnD requirements grow.
- **E2E tests** (Playwright) for login → dashboard → drag/filter/refresh flows.
- **Optimistic + skeleton-on-refresh** polish; toast on refresh failure while showing stale data.
- **Multi-user auth** with a real store, password hashing (argon2/bcrypt), CSRF tokens, rate
  limiting on login.

---

## 4. Trade-offs & decisions

- **Coinbase is the default provider (the brief names it).** `/v2/exchange-rates?currency=USD` is a
  single keyless call returning every coin's USD + BTC rate — exactly the required card fields.
  Its public API does **not** expose 24h change or price history, so those design extras (not in the
  required fields) degrade gracefully: `Coin.change24h` is `null` and `sparkline` is `[]`, and the
  card/row omit the badge + sparkline. **CoinGecko** stays available (`CRYPTO_PROVIDER=coingecko`)
  for the full visual design, since its `coins/markets` returns 24h change + sparkline in one call.
  All three sources sit behind `CryptoProvider`; switching is one env var.
- **Native HTML5 DnD over a library.** The design already uses native DnD; it's zero-dependency and
  sufficient for reordering a small list. Trade-off: weaker touch + keyboard support. If DnD needs
  grow, switch to `@dnd-kit` behind the same `useCardOrder` hook.
- **Server-side fetching in the loader** (vs the design's client `fetch`). Idiomatic Remix: keeps
  API keys server-side, enables SSR, and centralizes error handling. Refresh uses `useRevalidator`.
- **Mock-first.** Honors "integrate APIs later" and makes the app runnable with zero setup, offline,
  and in CI. The same mock backs the error-state "Load demo data" button.
- **Env-based single-credential auth.** Matches the explicit requirement (temp id/password in env).
  Real enough to demonstrate the session + guard pattern, small enough not to over-build.

---

## 5. Guidelines for AI follow-up work

1. **Respect the seams.** New data sources implement `CryptoProvider` and register in the factory —
   don't fetch prices from components or the browser.
2. **Numbers in the model, strings at the edge.** Add raw fields to `Coin`; format in `format.ts`
   with a unit test. Never bake display strings into the provider.
3. **Server-only code → `*.server.ts`.** Anything reading `process.env`, secrets, or Node APIs.
4. **Keep theme tokens centralized.** Add colors as CSS custom properties under `[data-theme]`, not
   inline. Both themes must stay in sync.
5. **Persisted client state goes through `useLocalStorage`** with a `cd_` key prefix, and must be
   SSR-safe (no `localStorage` access during render before mount).
6. **Add a test with each logic change.** Pure functions (format, ordering, filtering, auth verify)
   are covered by Vitest; extend `tests/`.
7. **Don't break the offline path.** `CRYPTO_PROVIDER=mock` must always run with no network/keys.
8. **Type everything.** `strict` is on; no `any`. Type loader/action data with Remix generics.
9. Run `npm run typecheck && npm test` before declaring a change done.

---

## 6. Key files

| File | Responsibility |
| --- | --- |
| `app/routes/dashboard.tsx` | Protected route; loader fetches markets; hosts client interactions |
| `app/lib/crypto/provider.server.ts` | `CryptoProvider` interface + factory (coinbase/coingecko/mock) |
| `app/lib/crypto/coinbase.provider.server.ts` | Live Coinbase integration (default) |
| `app/lib/crypto/coingecko.provider.server.ts` | Live CoinGecko integration (full visuals) |
| `app/lib/crypto/mock.provider.server.ts` | Deterministic demo data |
| `app/lib/crypto/format.ts` | Pure formatting + sparkline math (heavily tested) |
| `app/lib/crypto/types.ts` | `Coin` domain model — the provider contract |
| `app/lib/auth/auth.server.ts` | Credential verify + `requireUserId` guard |
| `app/lib/auth/session.server.ts` | Cookie session storage |
| `app/hooks/useCardOrder.ts` | Drag/drop ordering + persistence |
| `app/styles/app.css` | Theme tokens + component styles |
