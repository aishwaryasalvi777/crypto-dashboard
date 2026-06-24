export type ViewMode = "grid" | "list";

interface ControlsProps {
  query: string;
  view: ViewMode;
  countLabel: string;
  onQueryChange: (value: string) => void;
  onViewChange: (view: ViewMode) => void;
  onAddClick: () => void;
}

export function Controls({
  query,
  view,
  countLabel,
  onQueryChange,
  onViewChange,
  onAddClick,
}: ControlsProps) {
  return (
    <div className="controls">
      <button type="button" className="add-coin-btn" onClick={onAddClick}>
        <span className="add-coin-btn__plus" aria-hidden>
          +
        </span>
        <span>Add coin</span>
        <span className="add-coin-btn__shine" aria-hidden />
      </button>

      <span className="controls__count tabular">{countLabel}</span>

      <span className="controls__spacer" />

      <div className="search">
        <span className="search__icon" aria-hidden>
          ⌕
        </span>
        <input
          className="search__input"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Filter coins…"
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
