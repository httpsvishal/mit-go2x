'use client';

import React from 'react';
import { formatPct } from '@/core/format';
import { getSectionColor } from '@/core/colors';

export interface SectionRangeItem {
  section: string;
  lowest: number | null;
  highest: number | null;
  pooled: number | null;
  median: number | null;
  count: number;
}

interface SectionRangeChartProps {
  data: SectionRangeItem[];
}

export const SectionRangeChart: React.FC<SectionRangeChartProps> = ({ data }) => {
  const validData = data.filter((d) => d.pooled !== null && d.lowest !== null && d.highest !== null);

  if (validData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-go2x-text-muted">
        No range data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-go2x-text-muted">
        <span>Section attendance range: lowest to highest (line), average % (circle), middle (|)</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-go2x-accent" /> Average %
          </span>
          <span className="flex items-center gap-1 font-bold">
            | Middle
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {validData.map((d) => {
          const min = Math.min(100, Math.max(0, d.lowest ?? 0));
          const max = Math.min(100, Math.max(0, d.highest ?? 100));
          const pooled = Math.min(100, Math.max(0, d.pooled ?? 0));
          const median = d.median !== null ? Math.min(100, Math.max(0, d.median)) : null;
          const secColor = getSectionColor(d.section);

          return (
            <div key={d.section} className="flex items-center gap-3 text-xs">
              <div className="w-10 text-right font-semibold text-go2x-text">
                Sec {d.section}
              </div>

              <div className="relative h-6 flex-1">
                {/* Background track */}
                <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-go2x-surface-alt" />

                {/* Range bar (min to max) */}
                <div
                  className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
                  style={{
                    left: `${min}%`,
                    width: `${Math.max(2, max - min)}%`,
                    backgroundColor: secColor,
                    opacity: 0.7,
                  }}
                />

                {/* Min cap */}
                <div
                  className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-go2x-text-muted"
                  style={{ left: `${min}%` }}
                  title={`Lowest: ${formatPct(d.lowest)}`}
                />

                {/* Max cap */}
                <div
                  className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-go2x-text-muted"
                  style={{ left: `${max}%` }}
                  title={`Highest: ${formatPct(d.highest)}`}
                />

                {/* Median tick */}
                {median !== null && (
                  <div
                    className="absolute top-1/2 z-10 h-4 w-1 -translate-y-1/2 bg-go2x-text shadow-sm"
                    style={{ left: `${median}%` }}
                    title={`Median: ${formatPct(d.median)}`}
                  />
                )}

                {/* Average % dot */}
                <div
                  className="absolute top-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-go2x-surface shadow-sm"
                  style={{ left: `${pooled}%`, backgroundColor: secColor }}
                  title={`Average: ${formatPct(d.pooled)}`}
                />
              </div>

              <div className="flex w-28 items-center justify-between tabular-nums">
                <span className="font-semibold text-go2x-text">
                  {formatPct(d.pooled)}
                </span>
                <span className="text-[11px] text-go2x-text-muted">
                  [{formatPct(d.lowest)} - {formatPct(d.highest)}]
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
