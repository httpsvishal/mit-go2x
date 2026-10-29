'use client';

import React from 'react';
import { BatchConfig, ProgramConfig } from '@/core/manifest';
import { useRouter } from 'next/navigation';
import { formatPct, formatDelta, formatDateShort } from '@/core/format';
import { ArrowRight, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface BatchCardProps {
  batch: BatchConfig;
  program: ProgramConfig;
  overallPct: number | null;
  trend5v5: number | null;
  riskCount: number;
  riskLabel: string;
  lastDate: string;
  hasErrors?: boolean;
}

export const BatchCard: React.FC<BatchCardProps> = ({
  batch,
  program,
  overallPct,
  trend5v5,
  riskCount,
  riskLabel,
  lastDate,
  hasErrors = false,
}) => {
  const router = useRouter();
  const delta = formatDelta(trend5v5);

  const isArchived = batch.status === 'archived';

  return (
    <div
      onClick={() => router.push(`/${program.id}/${batch.id}`)}
      className="group flex cursor-pointer flex-col justify-between rounded-go2x-lg border border-go2x-border bg-go2x-surface p-5 shadow-go2x-sm transition-all hover:border-go2x-accent hover:shadow-go2x-md"
    >
      <div className="space-y-3">
        {/* Header: Label, Status, Health Dot */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-go2x-text group-hover:text-go2x-accent transition-colors">
              {batch.label}
            </h3>
            <span className="text-[11px] text-go2x-text-muted">
              Last data: {formatDateShort(lastDate)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-go2x-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                isArchived
                  ? 'bg-go2x-surface-alt text-go2x-text-muted'
                  : 'bg-go2x-ok-soft text-go2x-ok-text'
              }`}
            >
              {batch.status || 'Active'}
            </span>
            {/* Health status dot (Commented down per user request) */}
            {/*
            <span
              className={`h-2 w-2 rounded-full ${
                hasErrors ? 'bg-go2x-bad' : 'bg-go2x-ok'
              }`}
              title={hasErrors ? 'Data health warnings' : 'Healthy'}
            />
            */}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 gap-3 rounded-go2x-md bg-go2x-surface-alt p-3">
          <div>
            <span className="text-[11px] text-go2x-text-muted">Attendance</span>
            <p className="mt-0.5 text-xl font-bold text-go2x-text tabular-nums">
              {formatPct(overallPct)}
            </p>
            {delta.direction !== 'none' && (
              <span
                className={`flex items-center text-[11px] font-semibold tabular-nums ${
                  delta.status === 'ok'
                    ? 'text-go2x-ok-text'
                    : delta.status === 'bad'
                    ? 'text-go2x-bad-text'
                    : 'text-go2x-text-muted'
                }`}
              >
                {delta.direction === 'up' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {delta.text}
              </span>
            )}
          </div>

          <div className="border-l border-go2x-border pl-3">
            <span className="text-[11px] text-go2x-text-muted">{riskLabel}</span>
            <p className="mt-0.5 text-xl font-bold text-go2x-bad tabular-nums">
              {riskCount}
            </p>
            <span className="text-[10px] text-go2x-text-muted">Requires follow-up</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end text-xs font-semibold text-go2x-accent">
        <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Open Overview <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
};
