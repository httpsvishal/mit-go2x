import { go2xTheme } from '@/theme/go2x.theme';

/**
 * Deterministic section color generator.
 * Maps section string to a fixed index in chartCategorical so the section color never changes.
 */
export function getSectionColor(section: string): string {
  if (!section) return go2xTheme.chartCategorical[0];
  let hash = 0;
  for (let i = 0; i < section.length; i++) {
    hash = (hash << 5) - hash + section.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % go2xTheme.chartCategorical.length;
  return go2xTheme.chartCategorical[index];
}

export type StatusBand = 'ok' | 'warn' | 'bad' | 'neutral';

export function getStatusBand(
  pct: number | null | undefined,
  thresholds?: { atRisk?: number; critical?: number }
): StatusBand {
  if (pct === null || pct === undefined || isNaN(pct)) return 'neutral';
  const atRisk = thresholds?.atRisk ?? 75;
  const critical = thresholds?.critical ?? 50;
  if (pct >= atRisk) return 'ok';
  if (pct >= critical) return 'warn';
  return 'bad';
}

/**
 * Generates an accessible, color-blind friendly background color for heatmap cells,
 * centered around the atRisk threshold.
 */
export function getHeatmapColor(
  pct: number | null | undefined,
  thresholds?: { atRisk?: number; critical?: number }
): { bg: string; text: string } {
  if (pct === null || pct === undefined || isNaN(pct)) {
    return { bg: 'rgba(148, 163, 184, 0.1)', text: 'var(--go2x-text-muted)' };
  }

  const atRisk = thresholds?.atRisk ?? 75;
  const critical = thresholds?.critical ?? 50;

  if (pct >= atRisk) {
    // Green range (atRisk to 100)
    const ratio = Math.min(1, Math.max(0, (pct - atRisk) / Math.max(1, 100 - atRisk)));
    const alpha = 0.2 + ratio * 0.7; // 0.2 to 0.9
    return {
      bg: `rgba(22, 163, 74, ${alpha.toFixed(2)})`,
      text: alpha > 0.55 ? '#ffffff' : 'var(--go2x-text)',
    };
  } else if (pct >= critical) {
    // Amber range (critical to atRisk)
    const ratio = Math.min(1, Math.max(0, (pct - critical) / Math.max(1, atRisk - critical)));
    const alpha = 0.25 + (1 - ratio) * 0.45; // 0.25 to 0.7
    return {
      bg: `rgba(245, 158, 11, ${alpha.toFixed(2)})`,
      text: alpha > 0.55 ? '#ffffff' : 'var(--go2x-text)',
    };
  } else {
    // Red range (0 to critical)
    const ratio = Math.min(1, Math.max(0, pct / Math.max(1, critical)));
    const alpha = 0.4 + (1 - ratio) * 0.55; // 0.4 to 0.95
    return {
      bg: `rgba(220, 38, 38, ${alpha.toFixed(2)})`,
      text: '#ffffff',
    };
  }
}
