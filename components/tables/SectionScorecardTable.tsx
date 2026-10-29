'use client';

import React, { useState } from 'react';
import { formatPct } from '@/core/format';
import { Download } from 'lucide-react';

export interface SectionScorecardItem {
  section: string;
  count: number; // students or classes
  pct: number | null;
  mean: number | null;
  median: number | null;
  lowest: number | null;
  highest: number | null;
  belowTarget: number;
  critical: number;
  isSmallSample: boolean;
  sparkline: number[];
}

interface SectionScorecardTableProps {
  data: SectionScorecardItem[];
  isClassLevel?: boolean;
  batchLabel?: string;
  onSelectSection?: (section: string) => void;
}

export const SectionScorecardTable: React.FC<SectionScorecardTableProps> = ({
  data,
  isClassLevel = false,
  batchLabel,
  onSelectSection,
}) => {
  const [sortField, setSortField] = useState<keyof SectionScorecardItem>('pct');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedData = [...data].sort((a, b) => {
    const valA = (a[sortField] as any) ?? -1;
    const valB = (b[sortField] as any) ?? -1;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleExportCsv = () => {
    const countHeader = isClassLevel ? 'Classes' : 'Students';
    const riskHeader = isClassLevel ? 'Classes <50%' : 'Students <75%';
    const critHeader = isClassLevel ? 'Pending' : 'Critical <50%';

    const headers = ['Section', countHeader, 'Attendance %', 'Mean %', 'Median %', 'Lowest %', 'Highest %', riskHeader, critHeader, 'Small Sample'];
    const rows = sortedData.map((d) => [
      d.section,
      d.count,
      d.pct !== null ? `${d.pct.toFixed(1)}%` : 'n/a',
      d.mean !== null ? `${d.mean.toFixed(1)}%` : 'n/a',
      d.median !== null ? `${d.median.toFixed(1)}%` : 'n/a',
      d.lowest !== null ? `${d.lowest.toFixed(1)}%` : 'n/a',
      d.highest !== null ? `${d.highest.toFixed(1)}%` : 'n/a',
      d.belowTarget,
      d.critical,
      d.isSmallSample ? 'YES' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `section_scorecard_${batchLabel || 'batch'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-go2x-text">Section Scorecard Summary</span>
        <button
          type="button"
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 rounded-go2x-md border border-go2x-border bg-go2x-surface px-3 py-1.5 font-medium text-go2x-text shadow-sm hover:bg-go2x-surface-alt transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-go2x-lg border border-go2x-border bg-go2x-surface shadow-go2x-sm">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-go2x-border bg-go2x-surface-alt text-go2x-text-muted">
              <th className="px-4 py-2.5 font-semibold">Section</th>
              <th className="px-3 py-2.5 font-semibold">
                {isClassLevel ? 'Classes' : 'Students'}
              </th>
              <th
                onClick={() => {
                  setSortField('pct');
                  setSortAsc(!sortAsc);
                }}
                className="cursor-pointer px-3 py-2.5 font-semibold hover:text-go2x-text"
              >
                Attendance %
              </th>
              <th className="px-3 py-2.5 font-semibold">Average</th>
              <th className="px-3 py-2.5 font-semibold">Median</th>
              <th className="px-3 py-2.5 font-semibold">Lowest</th>
              <th className="px-3 py-2.5 font-semibold">Highest</th>
              <th className="px-3 py-2.5 font-semibold">
                {isClassLevel ? 'Below 50%' : 'Below 75%'}
              </th>
              <th className="px-3 py-2.5 font-semibold">
                {isClassLevel ? 'Waiting for Attendance' : 'Low (<50%)'}
              </th>
              <th className="px-3 py-2.5 font-semibold">Sample Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-go2x-border/60">
            {sortedData.map((d) => (
              <tr
                key={d.section}
                onClick={() => onSelectSection?.(d.section)}
                className="cursor-pointer transition-colors hover:bg-go2x-accent-soft/40"
              >
                <td className="px-4 py-2 font-bold text-go2x-text">
                  Section {d.section}
                </td>
                <td className="px-3 py-2 tabular-nums text-go2x-text-muted">
                  {d.count}
                </td>
                <td className="px-3 py-2 font-bold tabular-nums text-go2x-text">
                  {formatPct(d.pct)}
                </td>
                <td className="px-3 py-2 tabular-nums text-go2x-text-muted">
                  {formatPct(d.mean)}
                </td>
                <td className="px-3 py-2 tabular-nums text-go2x-text-muted">
                  {formatPct(d.median)}
                </td>
                <td className="px-3 py-2 tabular-nums text-go2x-text-muted">
                  {formatPct(d.lowest)}
                </td>
                <td className="px-3 py-2 tabular-nums text-go2x-text-muted">
                  {formatPct(d.highest)}
                </td>
                <td className="px-3 py-2 tabular-nums font-medium text-go2x-warn-text">
                  {d.belowTarget}
                </td>
                <td className="px-3 py-2 tabular-nums font-medium text-go2x-bad-text">
                  {d.critical}
                </td>
                <td className="px-3 py-2">
                  {d.isSmallSample ? (
                    <span className="rounded bg-go2x-warn-soft px-1.5 py-0.5 text-[10px] font-semibold text-go2x-warn-text">
                      Small n
                    </span>
                  ) : (
                    <span className="text-[10px] text-go2x-ok-text font-semibold">
                      Valid
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
