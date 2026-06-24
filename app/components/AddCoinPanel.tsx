import { useEffect, useMemo, useState } from "react";

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

const MAX_RESULTS = 50;

/** Centered modal to search the market catalog and add coins. Coins already tracked are excluded. */
export function AddCoinPanel({ catalog, has, onAdd, onClose }: AddCoinPanelProps) {
  const [query, setQuery] = useState("");

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const notAdded = useMemo(() => catalog.filter((c) => !has(c.id)), [catalog, has]);
  const results = useMemo(
    () => filterCoins(notAdded, query).slice(0, MAX_RESULTS),
    [notAdded, query],
  );

  const emptyMsg =
    notAdded.length === 0
      ? "You're already tracking every coin in the catalog."
      : `No coins match “${query}”.`;

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Add a coin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <div className="modal__title">Add a coin</div>
          <button type="button" className="modal__close" title="Close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal__search">
          <div className="search">
            <span className="search__icon" aria-hidden>
              ⌕
            </span>
            <input
              className="search__input"
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search coins to add…"
              aria-label="Search coins to add"
            />
          </div>
        </div>

        <div className="modal__list">
          {results.length === 0 ? (
            <div className="modal__empty">{emptyMsg}</div>
          ) : (
            results.map((coin, i) => (
              <button type="button" className="add-row" key={coin.id} onClick={() => onAdd(coin.id)}>
                <CoinAvatar symbol={coin.symbol} index={i} size={32} />
                <span className="coin-id" style={{ flex: 1 }}>
                  <span className="coin-id__name">{coin.name}</span>
                  <span className="coin-id__symbol">{coin.symbol}</span>
                </span>
                <span className="add-row__price tabular grotesk">{formatUsd(coin.priceUsd)}</span>
                <span className="add-row__cta">+ Add</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
