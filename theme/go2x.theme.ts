/**
 * Go2X Design Tokens - Single Source of Truth
 * 
 * Styled with Go2X brand colors: Pure Black and Vibrant Orange (#ff6f00) sourced from logo_noBg.png.
 * All UI components, charts, and pages consume these tokens via CSS variables or useTheme().
 * No hard-coded hex colors, font names, or pixel radii outside /theme.
 */

export interface ColorScale {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentContrast: string;
  accentSoft: string;
  focusRing: string;
}

export interface StatusColors {
  ok: string;
  okText: string;
  okSoft: string;
  warn: string;
  warnText: string;
  warnSoft: string;
  bad: string;
  badText: string;
  badSoft: string;
  neutral: string;
  neutralText: string;
  neutralSoft: string;
}

export interface Go2xTheme {
  light: ColorScale;
  dark: ColorScale;
  status: {
    light: StatusColors;
    dark: StatusColors;
  };
  typography: {
    fontHeading: string;
    fontBody: string;
    fontMono: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
  };
  motion: {
    fast: string;
    base: string;
  };
  chartCategorical: string[];
}

export const go2xTheme: Go2xTheme = {
  light: {
    bg: '#ffffff',
    surface: '#fafafa',
    surfaceAlt: '#f2f2f2',
    border: 'rgba(0, 0, 0, 0.08)',
    text: '#000000', // Pure black text
    textMuted: '#525252',
    accent: '#ff6f00', // Go2X Brand Logo Orange
    accentContrast: '#ffffff',
    accentSoft: 'rgba(255, 111, 0, 0.08)',
    focusRing: '#ff6f00',
  },
  dark: {
    bg: '#000000', // Pure Black background
    surface: '#0d0d0d', // Deep black card surface
    surfaceAlt: '#1a1a1a', // Charcoal panel surface
    border: 'rgba(255, 255, 255, 0.08)', // Subtle translucent border
    text: '#ffffff', // Crisp white text
    textMuted: '#a3a3a3',
    accent: '#ff6f00', // Go2X Brand Logo Orange
    accentContrast: '#ffffff',
    accentSoft: 'rgba(255, 111, 0, 0.18)',
    focusRing: '#ff6f00',
  },
  status: {
    light: {
      ok: '#16a34a',
      okText: '#15803d',
      okSoft: '#dcfce7',
      warn: '#ff6f00', // Brand logo orange for at-risk
      warnText: '#b45309',
      warnSoft: '#fff7ed',
      bad: '#dc2626',
      badText: '#b91c1c',
      badSoft: '#fee2e2',
      neutral: '#64748b',
      neutralText: '#475569',
      neutralSoft: '#f1f5f9',
    },
    dark: {
      ok: '#22c55e',
      okText: '#86efac',
      okSoft: 'rgba(34, 197, 94, 0.2)',
      warn: '#ff6f00', // Brand logo orange for at-risk
      warnText: '#fdba74',
      warnSoft: 'rgba(255, 111, 0, 0.2)',
      bad: '#ef4444',
      badText: '#fca5a5',
      badSoft: 'rgba(239, 68, 68, 0.2)',
      neutral: '#94a3b8',
      neutralText: '#cbd5e1',
      neutralSoft: 'rgba(148, 163, 184, 0.2)',
    },
  },
  typography: {
    fontHeading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontBody: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  radii: {
    sm: '0.375rem', // 6px
    md: '0.625rem', // 10px
    lg: '0.875rem', // 14px
    xl: '1.125rem', // 18px
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  motion: {
    fast: '150ms',
    base: '250ms',
  },
  // Categorical palette anchored in Go2X Black & #ff6f00 Logo Orange
  chartCategorical: [
    '#ff6f00', // Go2X Brand Logo Orange (accent)
    '#171717', // Neutral Black / Dark Charcoal
    '#ea580c', // Deep Amber Orange
    '#0284c7', // Sky Blue
    '#16a34a', // Emerald Green
    '#f59e0b', // Warm Amber
    '#737373', // Neutral Slate
    '#9333ea', // Deep Purple
  ],
};
