import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";

import { CoinCard } from "~/components/CoinCard";
import { CoinRow } from "~/components/CoinRow";
import { Controls, type ViewMode } from "~/components/Controls";
import { Header } from "~/components/Header";
import { EmptyState, ErrorState, SkeletonGrid } from "~/components/states";
import { useAutoRefresh } from "~/hooks/useAutoRefresh";
import { useCardOrder } from "~/hooks/useCardOrder";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import { useTheme } from "~/hooks/useTheme";
import { requireUserId } from "~/lib/auth/auth.server";
import {
  getActiveProviderName,
  getMarketsCached,
  getMockProvider,
} from "~/lib/crypto/provider.server";
import { filterCoins, orderCoins } from "~/lib/order";

export const meta: MetaFunction = () => [{ title: "Tessera — Crypto Dashboard" }];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const refreshSeconds = clampRefresh(Number(process.env.REFRESH_SECONDS) || 30);
  const useDemo = new URL(request.url).searchParams.get("demo") === "1";

  try {
    const { coins, source } = useDemo
      ? await getMockProvider().getMarkets()
      : await getMarketsCached();
    return json({ coins, source, error: null as string | null, refreshSeconds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error — check your connection.";
    const source = useDemo ? ("mock" as const) : getActiveProviderName();
    return json({ coins: [], source, error: message, refreshSeconds });
  }
}

function clampRefresh(n: number): number {
  return Math.min(300, Math.max(10, n));
}

export default function Dashboard() {
  const { coins, error, refreshSeconds } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const navigation = useNavigation();

  const [theme, toggleTheme] = useTheme();
  const { refresh, auto, toggleAuto, isRefreshing } = useAutoRefresh(refreshSeconds);

  const [query, setQuery] = useState("");
  const [view, setView] = useLocalStorage<ViewMode>("cd_view", "grid", (raw) =>
    raw === "grid" || raw === "list" ? raw : undefined,
  );

  const ids = useMemo(() => coins.map((c) => c.id), [coins]);
  const order = useCardOrder(ids);

  // Client-side "last updated" timestamp (avoids SSR/client time mismatch).
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  useEffect(() => {
    if (coins.length) setLastUpdated(Date.now());
  }, [coins]);

  const visible = useMemo(
    () => filterCoins(orderCoins(coins, order.order), query),
    [coins, order.order, query],
  );

  const hasData = coins.length > 0;
  const isNavigating = navigation.state === "loading";
  const isLoading = !hasData && !error && isNavigating;
  const isError = !hasData && !!error;
  const isEmpty = hasData && visible.length === 0;
  const showGrid = hasData && !isEmpty && view === "grid";
  const showList = hasData && !isEmpty && view === "list";

  const updatedLabel = isRefreshing && hasData
    ? "Updating…"
    : lastUpdated
      ? `Updated ${new Date(lastUpdated).toLocaleTimeString("en-US")}`
      : "";

  return (
    <div className="app">
      <Header
        updatedLabel={updatedLabel}
        isRefreshing={isRefreshing || isNavigating}
        auto={auto}
        theme={theme}
        onRefresh={refresh}
        onToggleAuto={toggleAuto}
        onToggleTheme={toggleTheme}
      />

      <Controls query={query} view={view} onQueryChange={setQuery} onViewChange={setView} />

      <div className="meta-row">
        <span className="meta-row__text">
          {hasData ? `${visible.length} of ${coins.length} assets` : ""}
        </span>
        <span className="meta-row__text">⠿ drag a card to reorder</span>
      </div>

      <div className="body">
        {isLoading && <SkeletonGrid />}

        {isError && (
          <ErrorState
            message={error}
            onRetry={refresh}
            onLoadDemo={() => navigate("/dashboard?demo=1")}
          />
        )}

        {isEmpty && <EmptyState query={query} />}

        {showGrid && (
          <div className="grid">
            {visible.map((coin) => (
              <CoinCard key={coin.id} coin={coin} index={ids.indexOf(coin.id)} order={order} />
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
                </div>
                {visible.map((coin) => (
                  <CoinRow key={coin.id} coin={coin} index={ids.indexOf(coin.id)} order={order} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
