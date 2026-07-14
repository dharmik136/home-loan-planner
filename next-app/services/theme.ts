const STORAGE_KEY = "khata-theme";
const CHANGE_EVENT = "khata-theme-change";

export type Theme = "light" | "dark";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : null;
}

export function getCurrentTheme(): Theme {
  return document.body.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.body.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent<Theme>(CHANGE_EVENT, { detail: theme }));
}

export function toggleTheme(): Theme {
  const next: Theme = getCurrentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

export function resolveInitialTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Keeps a component's theme state in sync with changes made anywhere else
 * (a different toggle button, another tab of the same origin, etc). */
export function subscribeToThemeChange(onChange: (theme: Theme) => void): () => void {
  const handler = (e: Event) => onChange((e as CustomEvent<Theme>).detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
