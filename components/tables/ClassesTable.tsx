'use client';

import React, { useState } from 'react';
import { ClassRecord } from '@/plugins/class-level/schema';
import { formatPct } from '@/core/format';
import { Copy, Check, AlertCircle } from 'lucide-react';

interface ClassesTableProps {
  records: ClassRecord[];
}

export const ClassesTable: React.FC<ClassesTableProps> = ({ records }) => {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'best' | 'worst' | 'pending'>('best');

  const filled = records.filter((r) => r.status === 'filled' && r.pct !== null);
  const pending = records.filter((r) => r.status === 'pending');

  const bestClasses = [...filled].sort((a, b) => b.pct! - a.pct!).slice(0, 10);
  const worstClasses = [...filled].sort((a, b) => a.pct! - b.pct!).slice(0, 10);

  const displayList =
    tab === 'best' ? bestClasses : tab === 'worst' ? worstClasses : pending;

  const handleCopyPendingChecklist = async () => {
    const lines = pending.map(
      (r, i) => `${i + 1}. [ ] ${r.date} | Period ${r.period} | Section ${r.section} (Staff: ${r.staff || 'N/A'})`
    );
    const content = `Pending Class Entries Checklist (${pending.length} items):\n` + lines.join('\n');
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-go2x-border pb-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('best')}
            className={`rounded-go2x-md px-3 py-1 font-semibold transition-colors ${
              tab === 'best'
                ? 'bg-go2x-ok text-white'
                : 'bg-go2x-surface-alt text-go2x-text hover:bg-go2x-border'
            }`}
          >
            Top Attended Classes
          </button>
          <button
            type="button"
            onClick={() => setTab('worst')}
            className={`rounded-go2x-md px-3 py-1 font-semibold transition-colors ${
              tab === 'worst'
                ? 'bg-go2x-bad text-white'
                : 'bg-go2x-surface-alt text-go2x-text hover:bg-go2x-border'
            }`}
          >
            Classes Needing Follow-up
          </button>
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`rounded-go2x-md px-3 py-1 font-semibold transition-colors ${
              tab === 'pending'
                ? 'bg-go2x-warn text-white'
                : 'bg-go2x-surface-alt text-go2x-text hover:bg-go2x-border'
            }`}
          >
            Waiting for Attendance ({pending.length})
          </button>
        </div>

        {tab === 'pending' && pending.length > 0 && (
          <button
            type="button"
            onClick={handleCopyPendingChecklist}
            className="flex items-center gap-1.5 rounded-go2x-md border border-go2x-border bg-go2x-surface px-2.5 py-1 text-xs font-medium text-go2x-text shadow-sm hover:bg-go2x-surface-alt"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-go2x-ok" />
                Copied Checklist!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy as Checklist
              </>
            )}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-go2x-lg border border-go2x-border bg-go2x-surface shadow-go2x-sm">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-go2x-border bg-go2x-surface-alt text-go2x-text-muted">
              <th className="px-4 py-2.5 font-semibold">Date</th>
              <th className="px-3 py-2.5 font-semibold">Period</th>
              <th className="px-3 py-2.5 font-semibold">Section</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold">Attendance %</th>
              <th className="px-3 py-2.5 font-semibold">Present / Total</th>
              <th className="px-3 py-2.5 font-semibold">Staff / Paper</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-go2x-border/60">
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-go2x-text-muted">
                  No classes in this category.
                </td>
              </tr>
            ) : (
              displayList.map((c, i) => (
                <tr key={i} className="hover:bg-go2x-surface-alt transition-colors">
                  <td className="px-4 py-2 font-medium tabular-nums text-go2x-text">
                    {c.date} ({c.weekday})
                  </td>
                  <td className="px-3 py-2 font-semibold text-go2x-text">
                    Period {c.period}
                  </td>
                  <td className="px-3 py-2 font-bold text-go2x-text">
                    Section {c.section}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-2 py-0.5 font-medium uppercase text-[10px] ${
                        c.status === 'filled'
                          ? 'bg-go2x-ok-soft text-go2x-ok-text'
                          : 'bg-go2x-warn-soft text-go2x-warn-text'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-bold tabular-nums">
                    {c.pct !== null ? (
                      <span
                        className={
                          c.pct < 50
                            ? 'text-go2x-bad-text'
                            : c.pct < 75
                            ? 'text-go2x-warn-text'
                            : 'text-go2x-ok-text'
                        }
                      >
                        {formatPct(c.pct)}
                      </span>
                    ) : (
                      <span className="text-go2x-text-muted">n/a</span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-go2x-text-muted">
                    {c.present} / {c.total}
                  </td>
                  <td className="px-3 py-2 text-go2x-text-muted">
                    {c.staff || 'N/A'} {c.paperCode ? `(${c.paperCode})` : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
