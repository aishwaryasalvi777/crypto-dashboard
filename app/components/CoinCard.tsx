import type { CardOrder } from "~/hooks/useCardOrder";
import {
  avatarColor,
  avatarLetter,
  formatBtc,
  formatChange,
  formatUsd,
  isPositive,
} from "~/lib/crypto/format";
import type { Coin } from "~/lib/crypto/types";
import { dragProps } from "./dragProps";
import { Sparkline } from "./Sparkline";

interface CoinCardProps {
  coin: Coin;
  index: number;
  order: CardOrder;
}

/** Grid-view card: avatar, name/symbol, USD price, 24h badge, sparkline, BTC rate. */
export function CoinCard({ coin, index, order }: CoinCardProps) {
  const hasChange = coin.change24h !== null;
  const hasSpark = coin.sparkline.length > 0;
  const positive = isPositive(coin.change24h ?? 0);
  const sparkColor = positive ? "#16a34a" : "#ef4444";

  return (
    <div className="card" {...dragProps(coin.id, order)}>
      <div className="card__top">
        <div className="avatar" style={{ background: avatarColor(index) }}>
          {avatarLetter(coin.symbol)}
        </div>
        <div className="coin-id">
          <div className="coin-id__name">{coin.name}</div>
          <div className="coin-id__symbol">{coin.symbol}</div>
        </div>
        <span className="drag-handle" aria-hidden>
          ⠿
        </span>
      </div>

      <div className="card__price">{formatUsd(coin.priceUsd)}</div>

      {(hasChange || hasSpark) && (
        <div className="card__mid">
          {hasChange ? (
            <span className="change" data-positive={positive}>
              {formatChange(coin.change24h as number)}
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
