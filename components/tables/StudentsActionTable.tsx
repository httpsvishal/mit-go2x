'use client';

import React, { useState, useMemo } from 'react';
import { StudentMetric } from '@/plugins/student-matrix/metrics';
import { maskName } from '@/core/mask';
import { formatPct } from '@/core/format';
import { Download, Search, Filter, ChevronRight, Copy, Check } from 'lucide-react';
import { StudentDetailDrawer } from './StudentDetailDrawer';

interface StudentsActionTableProps {
  students: StudentMetric[];
  batchAveragePct?: number | null;
  maskNames: boolean;
  batchLabel?: string;
}

export const StudentsActionTable: React.FC<StudentsActionTableProps> = ({
  students,
  batchAveragePct,
  maskNames,
  batchLabel,
}) => {
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'onTrack' | 'streak3' | 'streak5' | 'declined' | 'critical'>('all');
  const [sortField, setSortField] = useState<'status' | 'streak' | 'pct' | 'name'>('status');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentMetric | null>(null);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        // Quick filter
        if (quickFilter === 'onTrack' && s.statusBand !== 'ok') return false;
        if (quickFilter === 'streak3' && s.currentStreak < 3) return false;
        if (quickFilter === 'streak5' && s.currentStreak < 5) return false;
        if (quickFilter === 'declined' && s.movement !== 'declined') return false;
        if (quickFilter === 'critical' && s.statusBand !== 'bad') return false;

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const masked = maskName(s.name, maskNames).toLowerCase();
          const roll = s.rollNo.toLowerCase();
          const sec = s.section.toLowerCase();
          return masked.includes(q) || roll.includes(q) || sec.includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'status') {
          // Critical first, then streak descending
          const rank = { bad: 0, warn: 1, ok: 2, neutral: 3 };
          diff = rank[a.statusBand] - rank[b.statusBand];
          if (diff === 0) diff = b.currentStreak - a.currentStreak;
        } else if (sortField === 'streak') {
          diff = b.currentStreak - a.currentStreak;
        } else if (sortField === 'pct') {
          diff = (b.pct ?? 0) - (a.pct ?? 0);
        } else if (sortField === 'name') {
          diff = a.name.localeCompare(b.name);
        }
        return sortAsc ? -diff : diff;
      });
  }, [students, quickFilter, search, sortField, sortAsc, maskNames]);

  const handleExportCsv = () => {
    const headers = ['Roll No', 'Name', 'Section', 'Attendance %', 'Present', 'Absent', 'Eligible', 'Current Streak', 'Status'];
    const rows = filteredStudents.map((s) => [
      s.rollNo,
      `"${maskName(s.name, maskNames)}"`,
      s.section,
      s.pct !== null ? `${s.pct.toFixed(1)}%` : 'n/a',
      s.present,
      s.absent,
      s.eligible,
      s.currentStreak,
      s.statusBand.toUpperCase(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `follow_up_students_${batchLabel || 'batch'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3">
      {/* Search and Quick Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 items-center gap-2 min-w-[240px] max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-go2x-text-muted" />
            <input
              type="text"
              placeholder="Search student, roll no, or section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-go2x-md border border-go2x-border bg-go2x-surface py-1.5 pl-8 pr-3 text-xs text-go2x-text placeholder:text-go2x-text-muted focus:border-go2x-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-go2x-text-muted">Quick filters:</span>
          {[
            { id: 'all', label: 'All Students' },
            { id: 'onTrack', label: 'On Track (≥75%)' },
            { id: 'critical', label: 'Mentoring Focus (<50%)' },
            { id: 'streak3', label: 'Recent Absences (≥3)' },
            { id: 'declined', label: 'Declined >20 pts' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setQuickFilter(item.id as any)}
              className={`rounded-go2x-md px-2.5 py-1 font-medium transition-colors ${
                quickFilter === item.id
                  ? 'bg-go2x-accent text-go2x-accent-contrast'
                  : 'bg-go2x-surface border border-go2x-border text-go2x-text hover:bg-go2x-surface-alt'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CSV Export Button */}
        <button
          type="button"
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 rounded-go2x-md border border-go2x-border bg-go2x-surface px-3 py-1.5 font-medium text-go2x-text shadow-sm hover:bg-go2x-surface-alt transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV ({filteredStudents.length})
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-go2x-lg border border-go2x-border bg-go2x-surface shadow-go2x-sm">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-go2x-border bg-go2x-surface-alt text-go2x-text-muted">
              <th className="px-4 py-2.5 font-semibold">Student Name</th>
              <th className="px-3 py-2.5 font-semibold">Roll No</th>
              <th className="px-3 py-2.5 font-semibold">Sec</th>
              <th
                onClick={() => {
                  setSortField('pct');
                  setSortAsc(!sortAsc);
                }}
                className="cursor-pointer px-3 py-2.5 font-semibold hover:text-go2x-text"
              >
                Attendance %
              </th>
              <th className="px-3 py-2.5 font-semibold">Attended / Total</th>
              <th
                onClick={() => {
                  setSortField('streak');
                  setSortAsc(!sortAsc);
                }}
                className="cursor-pointer px-3 py-2.5 font-semibold hover:text-go2x-text"
              >
                Streak
              </th>
              <th className="px-3 py-2.5 font-semibold">Last 10 Sessions</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-go2x-border/60">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-go2x-text-muted">
                  No students found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => {
                const isCrit = s.statusBand === 'bad';
                const isWarn = s.statusBand === 'warn';

                return (
                  <tr
                    key={s.studentId}
                    onClick={() => setSelectedStudent(s)}
                    className="cursor-pointer transition-colors hover:bg-go2x-accent-soft/40"
                  >
                    <td className="px-4 py-2 font-medium text-go2x-text">
                      {maskName(s.name, maskNames)}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-go2x-text-muted">
                      {s.rollNo}
                    </td>
                    <td className="px-3 py-2 font-semibold text-go2x-text">
                      {s.section}
                    </td>
                    <td className="px-3 py-2 font-bold tabular-nums">
                      <span
                        className={
                          isCrit
                            ? 'text-go2x-bad-text'
                            : isWarn
                            ? 'text-go2x-warn-text'
                            : 'text-go2x-ok-text'
                        }
                      >
                        {formatPct(s.pct)}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-go2x-text-muted">
                      {s.present}/{s.eligible}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {s.currentStreak > 0 ? (
                        <span
                          className={`rounded px-1.5 py-0.5 font-bold ${
                            s.currentStreak >= 5
                              ? 'bg-go2x-bad text-white'
                              : s.currentStreak >= 3
                              ? 'bg-go2x-warn-soft text-go2x-warn-text'
                              : 'text-go2x-text-muted'
                          }`}
                        >
                          {s.currentStreak} missed
                        </span>
                      ) : (
                        <span className="text-go2x-text-muted">0</span>
                      )}
                    </td>
                    {/* Last 10 sessions strip */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {s.last10Strip.map((item, idx) => {
                          const bg =
                            item.status === 'present'
                              ? 'bg-go2x-ok'
                              : item.status === 'absent'
                              ? 'bg-go2x-bad'
                              : 'bg-go2x-border';
                          return (
                            <span
                              key={idx}
                              title={`${item.date}: ${item.status}`}
                              className={`h-3 w-2 rounded-sm ${bg}`}
                            />
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-go2x-md px-2 py-0.5 font-medium ${
                          isCrit
                            ? 'bg-go2x-bad-soft text-go2x-bad-text'
                            : isWarn
                            ? 'bg-go2x-warn-soft text-go2x-warn-text'
                            : 'bg-go2x-ok-soft text-go2x-ok-text'
                        }`}
                      >
                        {s.statusBand.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(s);
                        }}
                        className="text-go2x-accent hover:opacity-75"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Side Detail Drawer */}
      {selectedStudent && (
        <StudentDetailDrawer
          student={selectedStudent}
          batchAveragePct={batchAveragePct}
          maskNames={maskNames}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};
