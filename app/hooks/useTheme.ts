import { useCallback, useEffect, useState } from "react";

import { DEFAULT_THEME, isTheme, THEME_STORAGE_KEY, type Theme } from "~/lib/theme";

/**
 * Theme state synced to <html data-theme> and localStorage. The pre-paint inline script
 * in root.tsx already set the attribute; on mount we read it back so the toggle icon is
 * correct, and writes flow attribute + storage together.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const fromDom = document.documentElement.getAttribute("data-theme");
    if (isTheme(fromDom)) {
      setTheme(fromDom);
      return;
    }
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (isTheme(stored)) setTheme(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return [theme, toggle];
}
