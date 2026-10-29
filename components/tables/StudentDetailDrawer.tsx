'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { StudentMetric } from '@/plugins/student-matrix/metrics';
import { maskName } from '@/core/mask';
import { formatPct } from '@/core/format';

interface StudentDetailDrawerProps {
  student: StudentMetric;
  batchAveragePct?: number | null;
  maskNames: boolean;
  onClose: () => void;
}

export const StudentDetailDrawer: React.FC<StudentDetailDrawerProps> = ({
  student,
  batchAveragePct,
  maskNames,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // Find last attended date
  const attendedSessions = student.last10Strip.filter((s) => s.status === 'present');
  const lastAttendedDate =
    attendedSessions.length > 0
      ? attendedSessions[attendedSessions.length - 1].date
      : 'No sessions attended';

  const maskedName = maskName(student.name, maskNames);

  const handleCopySummary = async () => {
    const summary = [
      `Student Follow-Up Summary:`,
      `Name: ${maskedName}`,
      `Roll No: ${student.rollNo}`,
      `Section: ${student.section}`,
      `Attendance: ${formatPct(student.pct)} (${student.present}/${student.eligible})`,
      `Current Absence Streak: ${student.currentStreak} sessions`,
      `Last Attended: ${lastAttendedDate}`,
      `Status: ${student.statusBand.toUpperCase()}`,
    ].join('\n');

    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-go2x-surface p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-go2x-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-go2x-text">{maskedName}</h2>
              <p className="text-xs text-go2x-text-muted">
                Roll No: {student.rollNo} • Section {student.section}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-go2x-md p-1.5 text-go2x-text-muted hover:bg-go2x-surface-alt hover:text-go2x-text"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-go2x-md border border-go2x-border bg-go2x-surface-alt p-3">
              <span className="text-xs text-go2x-text-muted">Attendance Rate</span>
              <p className="mt-1 text-2xl font-bold text-go2x-text tabular-nums">
                {formatPct(student.pct)}
              </p>
              <span className="text-[11px] text-go2x-text-muted">
                {student.present} of {student.eligible} attended
              </span>
            </div>

            <div className="rounded-go2x-md border border-go2x-border bg-go2x-surface-alt p-3">
              <span className="text-xs text-go2x-text-muted">Current Streak</span>
              <p className="mt-1 text-2xl font-bold text-go2x-bad tabular-nums">
                {student.currentStreak} missed
              </p>
              <span className="text-[11px] text-go2x-text-muted">
                Longest: {student.longestStreak}
              </span>
            </div>
          </div>

          {/* Batch vs Student Comparison */}
          {batchAveragePct !== undefined && batchAveragePct !== null && student.pct !== null && (
            <div className="rounded-go2x-md border border-go2x-border p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-go2x-text">
                <span>Comparison to Batch Average</span>
                <span className="text-go2x-accent tabular-nums">
                  {formatPct(batchAveragePct)}
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-go2x-surface-alt">
                <div
                  className="absolute bottom-0 top-0 w-0.5 bg-go2x-text"
                  style={{ left: `${Math.min(100, Math.max(0, batchAveragePct))}%` }}
                  title="Batch Average"
                />
                <div
                  className="h-full rounded-full bg-go2x-accent"
                  style={{ width: `${Math.min(100, Math.max(0, student.pct))}%` }}
                />
              </div>
              <p className="text-[11px] text-go2x-text-muted">
                {student.pct >= batchAveragePct
                  ? `+${(student.pct - batchAveragePct).toFixed(1)} pts above batch average`
                  : `${(student.pct - batchAveragePct).toFixed(1)} pts below batch average`}
              </p>
            </div>
          )}

          {/* Movement Details */}
          {student.movementPts !== null && (
            <div className="rounded-go2x-md border border-go2x-border p-3 text-xs space-y-1">
              <span className="font-semibold text-go2x-text">Progress Over Time (First Half vs Second Half):</span>
              <p className="text-go2x-text-muted">
                First half: {formatPct(student.firstHalfPct)} → Second half: {formatPct(student.secondHalfPct)}
              </p>
              <p
                className={`font-semibold ${
                  student.movement === 'improved'
                    ? 'text-go2x-ok-text'
                    : student.movement === 'declined'
                    ? 'text-go2x-bad-text'
                    : 'text-go2x-text-muted'
                }`}
              >
                Movement: {student.movementPts > 0 ? '+' : ''}
                {student.movementPts.toFixed(1)} pts ({student.movement})
              </p>
            </div>
          )}

          {/* Recent Sessions Timeline */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-go2x-text-muted">
              Recent Session Attendance
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {student.last10Strip.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-go2x-sm bg-go2x-surface-alt px-3 py-1.5 text-xs"
                >
                  <span className="tabular-nums text-go2x-text">{item.date}</span>
                  <span
                    className={`font-semibold uppercase text-[11px] ${
                      item.status === 'present'
                        ? 'text-go2x-ok-text'
                        : item.status === 'absent'
                        ? 'text-go2x-bad-text'
                        : 'text-go2x-text-muted'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-go2x-border pt-4 mt-6">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex w-full items-center justify-center gap-2 rounded-go2x-md bg-go2x-accent py-2.5 text-xs font-semibold text-go2x-accent-contrast shadow-md hover:opacity-90 transition-opacity"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied Follow-up Summary!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Follow-up Summary
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
