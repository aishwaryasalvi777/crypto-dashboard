import { useMemo, useState } from "react";

import { filterCoins } from "~/lib/order";
import { formatUsd } from "~/lib/crypto/format";
import type { Coin } from "~/lib/crypto/types";
import { CoinAvatar } from "./CoinAvatar";

interface AddCoinPanelProps {
  catalog: Coin[];
  /** Whether a coin id is already in the user's watchlist. */
  has: (id: string) => boolean;
  onAdd: (id: string) => void;
  onClose: () => void;
}

const MAX_RESULTS = 40;

/** Search the market catalog and add coins to the watchlist. Coins already added are excluded. */
export function AddCoinPanel({ catalog, has, onAdd, onClose }: AddCoinPanelProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const notAdded = catalog.filter((c) => !has(c.id));
    return filterCoins(notAdded, query).slice(0, MAX_RESULTS);
  }, [catalog, has, query]);

  return (
    <div className="add-panel">
      <div className="add-panel__head">
        <div className="search" style={{ flex: 1 }}>
          <span className="search__icon" aria-hidden>
            ⌕
          </span>
          <input
            className="search__input"
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search coins to add (name or symbol)…"
            aria-label="Search coins to add"
          />
        </div>
        <button type="button" className="icon-btn" title="Close" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>

      {results.length === 0 ? (
        <div className="add-panel__empty">No coins match “{query}”.</div>
      ) : (
        <div className="add-panel__list">
          {results.map((coin, i) => (
            <div className="add-row" key={coin.id}>
              <CoinAvatar symbol={coin.symbol} index={i} size={28} />
              <div className="coin-id" style={{ flex: 1 }}>
                <div className="coin-id__name">{coin.name}</div>
                <div className="coin-id__symbol">{coin.symbol}</div>
              </div>
              <span className="add-row__price tabular grotesk">{formatUsd(coin.priceUsd)}</span>
              <button type="button" className="add-row__btn" onClick={() => onAdd(coin.id)}>
                + Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
