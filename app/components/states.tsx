/** Loading, error, and empty states — mirrors the design's three non-data screens. */

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <div className="skeleton-bar" style={{ width: 34, height: 34, borderRadius: "50%" }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-bar" style={{ height: 11, width: "60%" }} />
              <div className="skeleton-bar" style={{ height: 9, width: "36%", marginTop: 7 }} />
            </div>
          </div>
          <div className="skeleton-bar" style={{ height: 22, width: "55%" }} />
          <div className="skeleton-bar" style={{ height: 34, width: "100%", marginTop: 14 }} />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  onLoadDemo,
}: {
  message: string;
  onRetry: () => void;
  onLoadDemo: () => void;
}) {
  return (
    <div className="state">
      <div className="state__icon">!</div>
      <div className="state__title">Couldn&apos;t load live prices</div>
      <div className="state__msg">{message}</div>
      <div className="state__actions">
        <button type="button" className="btn-primary" onClick={onRetry}>
          Retry
        </button>
        <button type="button" className="btn-secondary" onClick={onLoadDemo}>
          Load demo data
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ query }: { query: string }) {
  return (
    <div className="empty">
      <div className="empty__title">No matches</div>
      <div className="empty__sub">
        Nothing matches “{query}”. Try another name or symbol.
      </div>
    </div>
  );
}
