'use client';

import React from 'react';
import { ChartProps } from '@/core/registry';
import { formatPct } from '@/core/format';
import { getStatusBand } from '@/core/colors';
import { useTheme } from '@/theme/useTheme';

export const SectionLeagueChart: React.FC<ChartProps> = ({
  records,
  batch,
  thresholds,
  filters,
  onFilterChange,
}) => {
  const { status: statusColors } = useTheme();

  // Aggregate by section from records (works for both class-level and student-matrix)
  const isClassLevel = records.length > 0 && 'period' in records[0];
  const sectionMap = new Map<string, { present: number; eligible: number; count: number }>();

  for (const r of records) {
    const sec = r.section;
    if (!sectionMap.has(sec)) {
      sectionMap.set(sec, { present: 0, eligible: 0, count: 0 });
    }
    const item = sectionMap.get(sec)!;

    if (isClassLevel) {
      if (r.status === 'filled') {
        item.present += r.present;
        item.eligible += r.total;
        item.count += 1;
      }
    } else {
      if (r.status === 'present' || r.status === 'absent') {
        if (r.status === 'present') item.present += 1;
        item.eligible += 1;
        item.count += 1;
      }
    }
  }

  // Calculate overall %
  let totalPres = 0;
  let totalElig = 0;
  sectionMap.forEach((v) => {
    totalPres += v.present;
    totalElig += v.eligible;
  });
  const overallPct = totalElig > 0 ? (totalPres / totalElig) * 100 : null;

  const minSample = batch.meta?.minSampleSize || 5;

  const sectionsData = Array.from(sectionMap.entries())
    .map(([section, data]) => {
      const pct = data.eligible > 0 ? (data.present / data.eligible) * 100 : 0;
      const isSmall = data.count < minSample;
      return {
        section,
        pct,
        count: data.count,
        isSmall,
        band: getStatusBand(pct, thresholds),
      };
    })
    .sort((a, b) => b.pct - a.pct);

  const toggleSection = (sec: string) => {
    if (!onFilterChange) return;
    const current = filters.sections;
    const next = current.includes(sec)
      ? current.filter((s) => s !== sec)
      : [...current, sec];
    onFilterChange({ sections: next });
  };

  if (sectionsData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-go2x-text-muted">
        No section data available for current selection
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-go2x-text-muted">
        <span>Section rank by attendance %</span>
        {overallPct !== null && (
          <span className="font-medium text-go2x-text">
            Batch average: {formatPct(overallPct)}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {sectionsData.map((item) => {
          const isSelected = filters.sections.includes(item.section);
          const barColor =
            item.band === 'ok'
              ? statusColors.ok
              : item.band === 'warn'
              ? statusColors.warn
              : statusColors.bad;

          return (
            <div
              key={item.section}
              onClick={() => toggleSection(item.section)}
              role="button"
              tabIndex={0}
              aria-label={`Filter by Section ${item.section}: ${formatPct(item.pct)}`}
              className={`group flex cursor-pointer items-center gap-3 rounded-go2x-md p-1.5 transition-colors ${
                isSelected
                  ? 'bg-go2x-accent-soft ring-1 ring-go2x-accent'
                  : 'hover:bg-go2x-surface-alt'
              }`}
            >
              <div className="w-8 text-right font-medium text-go2x-text">
                {item.section}
              </div>

              <div className="relative h-6 flex-1 overflow-hidden rounded-go2x-sm bg-go2x-surface-alt">
                {/* Average marker line */}
                {overallPct !== null && (
                  <div
                    className="absolute bottom-0 top-0 z-10 w-0.5 border-r border-dashed border-go2x-text opacity-70"
                    style={{ left: `${Math.min(100, Math.max(0, overallPct))}%` }}
                    title={`Batch average: ${formatPct(overallPct)}`}
                  />
                )}

                {/* Progress bar */}
                <div
                  className={`h-full transition-all duration-base ${
                    item.isSmall
                      ? 'bg-stripes opacity-75'
                      : ''
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, item.pct))}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>

              <div className="flex w-28 items-center justify-between text-xs tabular-nums">
                <span className="font-semibold text-go2x-text">
                  {formatPct(item.pct)}
                </span>
                <span className="text-go2x-text-muted">
                  (n={item.count})
                  {item.isSmall && (
                    <span
                      className="ml-1 text-[10px] text-go2x-warn-text"
                      title="Small sample size"
                    >
                      *
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
