'use client';

import { useEffect } from 'react';
import { applyTheme, resolveInitialTheme } from '../services/theme';

/** Keeps the body class and theme listeners synchronized after hydration. */
export function ThemeInit() {
  useEffect(() => {
    applyTheme(resolveInitialTheme());
  }, []);

  return null;
}
