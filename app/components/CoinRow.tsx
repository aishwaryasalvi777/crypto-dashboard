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

interface CoinRowProps {
  coin: Coin;
  index: number;
  order: CardOrder;
}

/** List-view row mirroring the table grid columns. */
export function CoinRow({ coin, index, order }: CoinRowProps) {
  const positive = isPositive(coin.change24h);
  const sparkColor = positive ? "#16a34a" : "#ef4444";

  return (
    <div className="row" {...dragProps(coin.id, order)}>
      <span className="drag-handle" aria-hidden>
        ⠿
      </span>
      <div className="row__asset">
        <div className="avatar" style={{ width: 30, height: 30, fontSize: 13, background: avatarColor(index) }}>
          {avatarLetter(coin.symbol)}
        </div>
        <div className="coin-id">
          <div className="coin-id__name">{coin.name}</div>
          <div className="coin-id__symbol">{coin.symbol}</div>
        </div>
      </div>
      <Sparkline prices={coin.sparkline} color={sparkColor} width={110} height={30} />
      <span className="row__price right">{formatUsd(coin.priceUsd)}</span>
      <span className="row__change right" data-positive={positive}>
        {formatChange(coin.change24h)}
      </span>
      <span className="row__btc right">{formatBtc(coin.priceBtc)}</span>
    </div>
  );
}
