import { formatBtc, formatChange, formatUsd, isPositive } from "~/lib/crypto/format";
import type { Coin } from "~/lib/crypto/types";
import { CoinAvatar } from "./CoinAvatar";
import { dragProps, type DragControls } from "./dragProps";
import { Sparkline } from "./Sparkline";

interface CoinCardProps {
  coin: Coin;
  index: number;
  drag: DragControls;
  onRemove: (id: string) => void;
}

/** Grid-view card: avatar, name/symbol, USD price, 24h badge, sparkline, BTC rate, remove (×). */
export function CoinCard({ coin, index, drag, onRemove }: CoinCardProps) {
  const change = coin.change24h;
  const hasSpark = coin.sparkline.length > 0;
  const positive = isPositive(change ?? 0);
  const sparkColor = positive ? "#16a34a" : "#ef4444";

  return (
    <div className="card" {...dragProps(coin.id, drag)}>
      <div className="card__top">
        <CoinAvatar symbol={coin.symbol} index={index} size={34} />
        <div className="coin-id">
          <div className="coin-id__name">{coin.name}</div>
          <div className="coin-id__symbol">{coin.symbol}</div>
        </div>
        <button
          type="button"
          className="remove-btn"
          title={`Remove ${coin.name}`}
          aria-label={`Remove ${coin.name}`}
          draggable={false}
          onClick={() => onRemove(coin.id)}
        >
          ×
        </button>
      </div>

      <div className="card__price">{formatUsd(coin.priceUsd)}</div>

      {(change !== null || hasSpark) && (
        <div className="card__mid">
          {change !== null ? (
            <span className="change" data-positive={positive}>
              {formatChange(change)}
            </span>
          ) : (
            <span />
          )}
          {hasSpark && (
            <Sparkline prices={coin.sparkline} color={sparkColor} width={104} height={34} withArea />
          )}
        </div>
      )}

      <div className="card__btc">
        <span className="card__btc-label">vs BTC</span>
        <span className="card__btc-value">{formatBtc(coin.priceBtc)}</span>
      </div>
    </div>
  );
}
