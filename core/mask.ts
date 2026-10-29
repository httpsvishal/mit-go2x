/**
 * Name masking utility for PII protection.
 * When maskNames is active, student names are masked across all UI views, tooltips, exports, and insights.
 */

export function maskName(name: string | undefined | null, shouldMask: boolean): string {
  if (!name) return '';
  if (!shouldMask) return name;

  const parts = name.trim().split(/\s+/);
  return parts
    .map((part) => {
      if (part.length <= 1) return part + '*';
      return part[0] + '***';
    })
    .join(' ');
}
