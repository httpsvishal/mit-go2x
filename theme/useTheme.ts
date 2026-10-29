'use client';

import { useState, useEffect } from 'react';
import { go2xTheme, ColorScale, StatusColors } from './go2x.theme';

export interface ThemeContextValue {
  isDark: boolean;
  theme: ColorScale;
  status: StatusColors;
  toggleTheme: () => void;
  chartCategorical: string[];
}

export function useTheme(): ThemeContextValue {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Check initial system or stored theme
    const stored = localStorage.getItem('go2x-theme');
    if (stored === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else if (stored === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('go2x-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('go2x-theme', 'light');
      }
      return next;
    });
  };

  const theme = isDark ? go2xTheme.dark : go2xTheme.light;
  const status = isDark ? go2xTheme.status.dark : go2xTheme.status.light;

  return {
    isDark,
    theme,
    status,
    toggleTheme,
    chartCategorical: go2xTheme.chartCategorical,
  };
}
