/**
 * Theme contract. The actual color values live as CSS custom properties under
 * `[data-theme="…"]` in `app/styles/app.css` (single source of truth, see CLAUDE.md §2 Styling).
 * This module only owns the *type* and persistence key so the toggle stays type-safe.
 */
export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "cd_theme";
export const DEFAULT_THEME: Theme = "dark";

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/**
 * Inline script injected into <head> to apply the persisted theme before first paint,
 * avoiding a light/dark flash. Kept tiny and dependency-free on purpose.
 */
export const themeBootstrapScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='dark'&&t!=='light')t='${DEFAULT_THEME}';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','${DEFAULT_THEME}');}})();`;
