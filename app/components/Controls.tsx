export type ViewMode = "grid" | "list";

interface ControlsProps {
  query: string;
  view: ViewMode;
  onQueryChange: (value: string) => void;
  onViewChange: (view: ViewMode) => void;
}

export function Controls({ query, view, onQueryChange, onViewChange }: ControlsProps) {
  return (
    <div className="controls">
      <div className="search">
        <span className="search__icon" aria-hidden>
          ⌕
        </span>
        <input
          className="search__input"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Filter by name or symbol…"
          aria-label="Filter cryptocurrencies by name or symbol"
        />
      </div>

      <div className="segmented" role="group" aria-label="View mode">
        <button
          type="button"
          className="seg"
          aria-pressed={view === "grid"}
          onClick={() => onViewChange("grid")}
        >
          ▦ Grid
        </button>
        <button
          type="button"
          className="seg"
          aria-pressed={view === "list"}
          onClick={() => onViewChange("list")}
        >
          ≣ List
        </button>
      </div>
    </div>
  );
}
