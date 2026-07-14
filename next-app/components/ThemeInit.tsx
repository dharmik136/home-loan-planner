'use client';

import { useEffect } from 'react';
import { applyTheme, resolveInitialTheme } from '../services/theme';

/**
 * Applies the stored/system theme preference on mount. This runs as a
 * useEffect (after hydration commits) rather than a pre-hydration <script>
 * because React re-asserts body's static className prop during hydration
 * regardless of suppressHydrationWarning, silently undoing any class an
 * earlier script added. Trade-off: a brief light-mode flash before this
 * fires, in exchange for the toggle actually working.
 */
export function ThemeInit() {
  useEffect(() => {
    applyTheme(resolveInitialTheme());
  }, []);

  return null;
}
