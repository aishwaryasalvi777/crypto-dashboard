import { Form } from "@remix-run/react";

import type { Theme } from "~/lib/theme";

interface HeaderProps {
  updatedLabel: string;
  isRefreshing: boolean;
  auto: boolean;
  theme: Theme;
  onRefresh: () => void;
  onToggleAuto: () => void;
  onToggleTheme: () => void;
}

export function Header({
  updatedLabel,
  isRefreshing,
  auto,
  theme,
  onRefresh,
  onToggleAuto,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand__mark">◆</div>
        <div>
          <div className="brand__title">Tessera</div>
          <div className="brand__sub">Crypto Dashboard</div>
        </div>
      </div>

      <div className="header__actions">
        <span className="header__updated">{updatedLabel}</span>

        <button type="button" className="icon-btn" title="Refresh now" onClick={onRefresh}>
          <span className={isRefreshing ? "spin" : undefined}>↻</span>
        </button>

        <button
          type="button"
          className="auto-btn"
          title="Toggle auto-refresh"
          aria-pressed={auto}
          onClick={onToggleAuto}
        >
          <span>Auto</span>
          <span className="switch" data-on={auto}>
            <span className="switch__knob" />
          </span>
        </button>

        <button
          type="button"
          className="icon-btn"
          title="Toggle theme"
          onClick={onToggleTheme}
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>

        <Form method="post" action="/logout">
          <button type="submit" className="logout-btn" title="Log out">
            Log out
          </button>
        </Form>
      </div>
    </header>
  );
}
