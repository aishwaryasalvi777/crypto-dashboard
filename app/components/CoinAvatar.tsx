import { useState } from "react";

import { avatarColor, avatarLetter, coinIconUrl } from "~/lib/crypto/format";

interface CoinAvatarProps {
  symbol: string;
  /** Position in the list — selects the fallback background color. */
  index: number;
  size?: number;
}

/**
 * Coin avatar: shows the real logo (color SVG from a CDN) and gracefully falls back to a
 * colored circle with the ticker's initial if the icon fails to load. The colored circle is
 * always the background, so there's never a blank/broken-image gap.
 */
export function CoinAvatar({ symbol, index, size = 34 }: CoinAvatarProps) {
  const [failed, setFailed] = useState(false);
  const fontSize = Math.round(size * 0.41);

  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize, background: avatarColor(index) }}
    >
      {failed ? (
        avatarLetter(symbol)
      ) : (
        <img
          src={coinIconUrl(symbol)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: size, height: size, borderRadius: "50%", display: "block" }}
        />
      )}
    </div>
  );
}
