import type { CardOrder } from "~/hooks/useCardOrder";
import { formatBtc, formatChange, formatUsd, isPositive } from "~/lib/crypto/format";
import type { Coin } from "~/lib/crypto/types";
import { CoinAvatar } from "./CoinAvatar";
import { dragProps } from "./dragProps";
import { Sparkline } from "./Sparkline";

interface CoinRowProps {
  coin: Coin;
  index: number;
  order: CardOrder;
}

/** List-view row mirroring the table grid columns. */
export function CoinRow({ coin, index, order }: CoinRowProps) {
  const change = coin.change24h;
  const hasSpark = coin.sparkline.length > 0;
  const positive = isPositive(change ?? 0);
  const sparkColor = positive ? "#16a34a" : "#ef4444";

  return (
    <div className="row" {...dragProps(coin.id, order)}>
      <span className="drag-handle" aria-hidden>
        ⠿
      </span>
      <div className="row__asset">
        <CoinAvatar symbol={coin.symbol} index={index} size={30} />
        <div className="coin-id">
          <div className="coin-id__name">{coin.name}</div>
          <div className="coin-id__symbol">{coin.symbol}</div>
        </div>
      </div>
      {hasSpark ? (
        <Sparkline prices={coin.sparkline} color={sparkColor} width={110} height={30} />
      ) : (
        <span />
      )}
      <span className="row__price right">{formatUsd(coin.priceUsd)}</span>
      {change !== null ? (
        <span className="row__change right" data-positive={positive}>
          {formatChange(change)}
        </span>
      ) : (
        <span className="row__btc right">—</span>
      )}
      <span className="row__btc right">{formatBtc(coin.priceBtc)}</span>
    </div>
  );
}
