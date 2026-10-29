'use client';

import React, { useState } from 'react';
import { formatPct, formatDelta, formatDateShort } from '@/core/format';
import { Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface BatchScorecardItem {
  batchId: string;
  batchLabel: string;
  programId: string;
  programLabel: string;
  count: number; // Students or Classes
  sessions: number;
  overallPct: number | null;
  trend5v5: number | null;
  belowTarget: number;
  critical: number;
  completeness: number | null;
  lastDate: string;
  healthScore: number;
}

interface BatchScorecardTableProps {
  data: BatchScorecardItem[];
  programSlug: string;
}

export const BatchScorecardTable: React.FC<BatchScorecardTableProps> = ({
  data,
  programSlug,
}) => {
  const router = useRouter();
  const [sortField, setSortField] = useState<keyof BatchScorecardItem>('overallPct');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedData = [...data].sort((a, b) => {
    const valA = (a[sortField] as any) ?? -1;
    const valB = (b[sortField] as any) ?? -1;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleExportCsv = () => {
    const headers = [
      'Batch',
      'Program',
      'Tracked Count',
      'Sessions',
      'Attendance %',
      '5v5 Trend (pts)',
      'Below Target',
      'Critical / Low',
      'Completeness %',
      'Last Data Date',
      'Data Health Score',
    ];
    const rows = sortedData.map((d) => [
      `"${d.batchLabel}"`,
      `"${d.programLabel}"`,
      d.count,
      d.sessions,
      d.overallPct !== null ? `${d.overallPct.toFixed(1)}%` : 'n/a',
      d.trend5v5 !== null ? `${d.trend5v5.toFixed(1)}` : 'n/a',
      d.belowTarget,
      d.critical,
      d.completeness !== null ? `${d.completeness.toFixed(1)}%` : 'n/a',
      d.lastDate,
      d.healthScore,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `batch_scorecard_${programSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-go2x-text">Batch Comparison Table</span>
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
              <th className="px-4 py-2.5 font-semibold">Batch</th>
              <th className="px-3 py-2.5 font-semibold">Total Enrolled</th>
              <th className="px-3 py-2.5 font-semibold">Sessions</th>
              <th
                onClick={() => {
                  setSortField('overallPct');
                  setSortAsc(!sortAsc);
                }}
                className="cursor-pointer px-3 py-2.5 font-semibold hover:text-go2x-text"
              >
                Attendance %
              </th>
              <th className="px-3 py-2.5 font-semibold">5-Day Trend</th>
              <th className="px-3 py-2.5 font-semibold">Below 75%</th>
              <th className="px-3 py-2.5 font-semibold">Low (&lt;50%)</th>
              <th className="px-3 py-2.5 font-semibold">Classes Marked</th>
              <th className="px-3 py-2.5 font-semibold">Last Date</th>
              {/* <th className="px-3 py-2.5 font-semibold">Data Health</th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-go2x-border/60">
            {sortedData.map((b) => {
              const delta = formatDelta(b.trend5v5);
              return (
                <tr
                  key={b.batchId}
                  onClick={() => router.push(`/${b.programId}/${b.batchId}`)}
                  className="cursor-pointer transition-colors hover:bg-go2x-accent-soft/40"
                >
                  <td className="px-4 py-2 font-bold text-go2x-text">
                    {b.batchLabel}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-go2x-text-muted">
                    {b.count}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-go2x-text-muted">
                    {b.sessions}
                  </td>
                  <td className="px-3 py-2 font-bold tabular-nums text-go2x-text">
                    {formatPct(b.overallPct)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    <span
                      className={`font-semibold ${
                        delta.status === 'ok'
                          ? 'text-go2x-ok-text'
                          : delta.status === 'bad'
                          ? 'text-go2x-bad-text'
                          : 'text-go2x-text-muted'
                      }`}
                    >
                      {delta.text}
                    </span>
                  </td>
                  <td className="px-3 py-2 tabular-nums font-medium text-go2x-warn-text">
                    {b.belowTarget}
                  </td>
                  <td className="px-3 py-2 tabular-nums font-medium text-go2x-bad-text">
                    {b.critical}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-go2x-text-muted">
                    {formatPct(b.completeness)}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-go2x-text-muted">
                    {formatDateShort(b.lastDate)}
                  </td>
                  {/*
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-1.5 py-0.5 font-bold text-[10px] ${
                        b.healthScore >= 90
                          ? 'bg-go2x-ok-soft text-go2x-ok-text'
                          : b.healthScore >= 70
                          ? 'bg-go2x-warn-soft text-go2x-warn-text'
                          : 'bg-go2x-bad-soft text-go2x-bad-text'
                      }`}
                    >
                      {b.healthScore}/100
                    </span>
                  </td>
                  */}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
