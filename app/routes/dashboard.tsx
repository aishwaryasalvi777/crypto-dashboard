import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";

import { AddCoinPanel } from "~/components/AddCoinPanel";
import { CoinCard } from "~/components/CoinCard";
import { CoinRow } from "~/components/CoinRow";
import { Controls, type ViewMode } from "~/components/Controls";
import { Header } from "~/components/Header";
import { EmptyState, ErrorState, SkeletonGrid } from "~/components/states";
import { useAutoRefresh } from "~/hooks/useAutoRefresh";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import { useTheme } from "~/hooks/useTheme";
import { useWatchlist } from "~/hooks/useWatchlist";
import { requireUserId } from "~/lib/auth/auth.server";
import { getActiveProviderName, getMarketsCached } from "~/lib/crypto/provider.server";
import { filterCoins, orderCoins } from "~/lib/order";

export const meta: MetaFunction = () => [{ title: "Tessera — Crypto Dashboard" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const userName = await requireUserId(request);

  const refreshSeconds = clampRefresh(Number(process.env.REFRESH_SECONDS) || 30);

  try {
    const { coins, source } = await getMarketsCached();
    return json({ coins, source, error: null as string | null, refreshSeconds, userName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error — check your connection.";
    return json({ coins: [], source: getActiveProviderName(), error: message, refreshSeconds, userName });
  }
}

function clampRefresh(n: number): number {
  return Math.min(300, Math.max(10, n));
}

export default function Dashboard() {
  const { coins: catalog, error, refreshSeconds, userName } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  const [theme, toggleTheme] = useTheme();
  const { refresh, auto, toggleAuto, isRefreshing, countdown } = useAutoRefresh(refreshSeconds);

  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useLocalStorage<ViewMode>("cd_view", "grid", (raw) =>
    raw === "grid" || raw === "list" ? raw : undefined,
  );

  const catalogIds = useMemo(() => catalog.map((c) => c.id), [catalog]);
  const watchlist = useWatchlist(catalogIds);

  // Client-side "last updated" timestamp (avoids SSR/client time mismatch).
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  useEffect(() => {
    if (catalog.length) setLastUpdated(Date.now());
  }, [catalog]);

  const chosen = useMemo(() => orderCoins(catalog, watchlist.ids), [catalog, watchlist.ids]);
  const visible = useMemo(() => filterCoins(chosen, query), [chosen, query]);

  const hasCatalog = catalog.length > 0;
  const isNavigating = navigation.state === "loading";
  const isLoading = !hasCatalog && !error && isNavigating;
  const isError = !hasCatalog && !!error;
  const watchlistEmpty = hasCatalog && watchlist.ids.length === 0;
  const filterEmpty = hasCatalog && !watchlistEmpty && visible.length === 0;
  const showGrid = hasCatalog && !watchlistEmpty && !filterEmpty && view === "grid";
  const showList = hasCatalog && !watchlistEmpty && !filterEmpty && view === "list";

  const updatedLabel = (isRefreshing || isNavigating) && hasCatalog
    ? "Updating…"
    : lastUpdated
      ? `Updated ${new Date(lastUpdated).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
      : "";

  return (
    <div className="app">
      <Header
        userName={userName}
        updatedLabel={updatedLabel}
        countdown={auto && !(isRefreshing || isNavigating) ? countdown : null}
        isRefreshing={isRefreshing || isNavigating}
        auto={auto}
        theme={theme}
        onRefresh={refresh}
        onToggleAuto={toggleAuto}
        onToggleTheme={toggleTheme}
      />

      <Controls
        query={query}
        view={view}
        onQueryChange={setQuery}
        onViewChange={setView}
        onAddClick={() => setShowAdd(true)}
        countLabel={hasCatalog ? `${catalog.length}+ coins available` : ""}
      />

      <div className="hint-row">
        <span className="hint-row__text">⠿ drag to reorder · hover a card to remove</span>
      </div>

      {showAdd && hasCatalog && (
        <AddCoinPanel
          catalog={catalog}
          has={watchlist.has}
          onAdd={watchlist.add}
          onClose={() => setShowAdd(false)}
        />
      )}

      <div className="body">
        {isLoading && <SkeletonGrid />}

        {isError && <ErrorState message={error} onRetry={refresh} />}

        {watchlistEmpty && (
          <div className="empty">
            <div className="empty__title">Your watchlist is empty</div>
            <div className="empty__sub">
              Click <strong>+ Add coin</strong> to search the market and build your view.
            </div>
          </div>
        )}

        {filterEmpty && <EmptyState query={query} />}

        {showGrid && (
          <div className="grid">
            {visible.map((coin, i) => (
              <CoinCard
                key={coin.id}
                coin={coin}
                index={i}
                drag={watchlist}
                onRemove={watchlist.remove}
              />
            ))}
          </div>
        )}

        {showList && (
          <div className="list">
            <div className="list__scroll">
              <div className="list__inner">
                <div className="list__head">
                  <span />
                  <span>Asset</span>
                  <span>7d trend</span>
                  <span className="right">Price (USD)</span>
                  <span className="right">24h</span>
                  <span className="right">vs BTC</span>
                  <span />
                </div>
                {visible.map((coin, i) => (
                  <CoinRow
                    key={coin.id}
                    coin={coin}
                    index={i}
                    drag={watchlist}
                    onRemove={watchlist.remove}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
