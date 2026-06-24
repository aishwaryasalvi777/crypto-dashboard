import { Form } from "@remix-run/react";
import { useEffect, useState } from "react";

import type { Theme } from "~/lib/theme";

interface HeaderProps {
  userName: string;
  updatedLabel: string;
  isRefreshing: boolean;
  auto: boolean;
  theme: Theme;
  onRefresh: () => void;
  onToggleAuto: () => void;
  onToggleTheme: () => void;
}

export function Header({
  userName,
  updatedLabel,
  isRefreshing,
  auto,
  theme,
  onRefresh,
  onToggleAuto,
  onToggleTheme,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = (userName.trim().charAt(0) || "U").toUpperCase();
  const live = !isRefreshing;

  // Close the menu on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="header">
      <div className="brand">
        <div className="brand__mark">◈</div>
        <div>
          <div className="brand__title">Tessera</div>
          <div className="brand__sub">Crypto Dashboard</div>
        </div>
      </div>

      <div className="header__actions">
        <button type="button" className="icon-btn refresh-btn" title="Refresh now" onClick={onRefresh}>
          <span className={isRefreshing ? "spin" : undefined}>↻</span>
          <span className="live-dot" data-live={live} />
        </button>

        <div className="profile">
          <button
            type="button"
            className="profile__btn"
            title="Account"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="avatar avatar--sm">{initial}</span>
            <span className="profile__caret" data-open={menuOpen}>⌄</span>
          </button>

          {menuOpen && (
            <>
              <div className="profile__scrim" onClick={() => setMenuOpen(false)} />
              <div className="menu" role="menu">
                <div className="menu__head">
                  <span className="avatar">{initial}</span>
                  <div className="menu__id">
                    <div className="menu__name">Hi, {userName}!</div>
                    <div className="menu__sub">Signed in</div>
                  </div>
                </div>

                <div className="menu__body">
                  <div className="menu__label">Preferences</div>

                  <button type="button" className="menu__item" onClick={onToggleAuto}>
                    <span className="menu__icon">↻</span>
                    <span className="menu__text">
                      <span>Auto-refresh</span>
                      <span className="menu__meta">
                        <span className="live-dot live-dot--inline" data-live={live} />
                        {updatedLabel || "Loading…"}
                      </span>
                    </span>
                    <span className="switch" data-on={auto}>
                      <span className="switch__knob" />
                    </span>
                  </button>

                  <button type="button" className="menu__item" onClick={onToggleTheme}>
                    <span className="menu__icon">{theme === "dark" ? "☀" : "☾"}</span>
                    <span className="menu__text-flat">Dark mode</span>
                    <span className="switch" data-on={theme === "dark"}>
                      <span className="switch__knob" />
                    </span>
                  </button>

                  <span className="menu__divider" />

                  <Form method="post" action="/logout">
                    <button type="submit" className="menu__item menu__item--danger">
                      <span className="menu__icon">⎋</span>Log out
                    </button>
                  </Form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
