'use client';

import React from 'react';
import { formatPct, formatDateShort } from '@/core/format';
import { getHeatmapColor } from '@/core/colors';
import { Thresholds } from '@/core/manifest';

export interface HeatmapCell {
  rowKey: string; // e.g. section
  colKey: string; // e.g. batch or date
  colLabel: string;
  pct: number | null;
  count: number;
  isSmallSample?: boolean;
}

interface SectionHeatmapProps {
  title: string;
  rows: string[];
  columns: Array<{ key: string; label: string }>;
  cells: HeatmapCell[];
  thresholds: Thresholds;
  onCellClick?: (rowKey: string, colKey: string) => void;
}

export const SectionHeatmap: React.FC<SectionHeatmapProps> = ({
  title,
  rows,
  columns,
  cells,
  thresholds,
  onCellClick,
}) => {
  // Map cells by rowKey_colKey
  const cellMap = new Map<string, HeatmapCell>();
  cells.forEach((c) => cellMap.set(`${c.rowKey}_${c.colKey}`, c));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-go2x-text-muted">
        <span>{title}</span>
        <div className="flex items-center gap-2">
          <span>&lt;{thresholds.critical}% (Critical)</span>
          <span className="inline-block h-2 w-4 rounded-go2x-sm bg-go2x-bad" />
          <span className="inline-block h-2 w-4 rounded-go2x-sm bg-go2x-warn" />
          <span className="inline-block h-2 w-4 rounded-go2x-sm bg-go2x-ok" />
          <span>&gt;{thresholds.atRisk}% (Target)</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-go2x-md border border-go2x-border bg-go2x-surface">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-go2x-border bg-go2x-surface-alt">
              <th className="sticky left-0 z-20 min-w-[70px] bg-go2x-surface-alt px-3 py-2 text-left font-semibold text-go2x-text">
                Section
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="min-w-[90px] px-2 py-2 text-center font-medium text-go2x-text-muted"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="border-b border-go2x-border/50">
                <td className="sticky left-0 z-10 bg-go2x-surface px-3 py-2 font-semibold text-go2x-text">
                  {row}
                </td>
                {columns.map((col) => {
                  const cell = cellMap.get(`${row}_${col.key}`);
                  if (!cell || cell.pct === null) {
                    return (
                      <td
                        key={col.key}
                        className="p-1 text-center text-go2x-text-muted opacity-40"
                      >
                        —
                      </td>
                    );
                  }

                  const { bg, text } = getHeatmapColor(cell.pct, thresholds);

                  return (
                    <td
                      key={col.key}
                      onClick={() => onCellClick?.(row, col.key)}
                      className="p-1"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        style={{ backgroundColor: bg, color: text }}
                        className={`flex h-9 cursor-pointer flex-col items-center justify-center rounded-go2x-sm transition-transform hover:scale-105 ${
                          cell.isSmallSample ? 'border border-dashed border-go2x-text-muted' : ''
                        }`}
                        title={`Section ${row}, ${col.label}: ${formatPct(cell.pct)} (n=${cell.count})`}
                      >
                        <span className="font-semibold tabular-nums">
                          {formatPct(cell.pct)}
                        </span>
                        <span className="text-[10px] opacity-80 tabular-nums">
                          n={cell.count}
                          {cell.isSmallSample && '*'}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
