/**
 * Formatting helpers adhering to Go2X rules:
 * - One decimal for percentages (e.g. 69.5%)
 * - Missing data or division by zero returns "n/a", never NaN or 0%
 * - Integers for counts
 * - Signed "pts" for deltas (+2.4 pts, -1.8 pts)
 * - Dates format as "07 Oct"; full ISO in tooltips
 */

export function formatPct(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val) || !Number.isFinite(val)) {
    return 'n/a';
  }
  return `${val.toFixed(1)}%`;
}

export function formatCount(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return 'n/a';
  }
  return val.toLocaleString();
}

export interface FormattedDelta {
  text: string;
  direction: 'up' | 'down' | 'flat' | 'none';
  status: 'ok' | 'bad' | 'neutral';
}

export function formatDelta(
  delta: number | null | undefined,
  invertColors = false
): FormattedDelta {
  if (delta === null || delta === undefined || Number.isNaN(delta) || !Number.isFinite(delta)) {
    return { text: '—', direction: 'none', status: 'neutral' };
  }

  const rounded = Math.round(delta * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  const text = `${sign}${rounded.toFixed(1)} pts`;

  if (Math.abs(rounded) < 0.05) {
    return { text: '0.0 pts', direction: 'flat', status: 'neutral' };
  }

  const isPositive = rounded > 0;
  const direction: 'up' | 'down' = isPositive ? 'up' : 'down';
  const status: 'ok' | 'bad' = (isPositive && !invertColors) || (!isPositive && invertColors)
    ? 'ok'
    : 'bad';

  return { text, direction, status };
}

export function formatDateShort(isoDate: string | null | undefined): string {
  if (!isoDate) return 'n/a';
  try {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(Date.UTC(year, month, day));
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        timeZone: 'UTC',
      });
    }
    const d = new Date(isoDate);
    return isNaN(d.getTime())
      ? isoDate
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });
  } catch {
    return isoDate;
  }
}

export function formatDateFull(isoDate: string | null | undefined): string {
  if (!isoDate) return 'n/a';
  return isoDate;
}
