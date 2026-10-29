'use client';

import React from 'react';
import { ProgramConfig } from '@/core/manifest';
import { useRouter } from 'next/navigation';
import { formatPct, formatDelta, formatDateShort } from '@/core/format';
import { GraduationCap, Rocket, ArrowRight, Activity, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface ProgramCardProps {
  program: ProgramConfig;
  overallPct: number | null;
  trend5v5: number | null;
  trackedCount: number;
  latestDate: string;
  hasErrors: boolean;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  overallPct,
  trend5v5,
  trackedCount,
  latestDate,
  hasErrors,
}) => {
  const router = useRouter();

  const activeBatches = program.batches
    .filter((b) => b.status === 'active' || b.status === undefined)
    .sort((a, b) => a.order - b.order);

  const delta = formatDelta(trend5v5);

  const isClassLevel = program.type === 'class-level';
  const countLabel = isClassLevel ? 'classes tracked' : 'students tracked';

  const defaultBatch =
    program.defaultBatch ||
    (activeBatches.length > 0 ? activeBatches[0].id : program.batches[0]?.id);

  return (
    <div className="flex flex-col justify-between rounded-go2x-xl border border-go2x-border bg-go2x-surface p-6 shadow-go2x-sm transition-all hover:border-go2x-accent/40 hover:shadow-go2x-md">
      <div className="space-y-4">
        {/* Header: Icon, Name, Active Badge, Health Dot */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-go2x-lg bg-go2x-accent-soft text-go2x-accent">
              {program.type === 'class-level' ? (
                <GraduationCap className="h-6 w-6" />
              ) : (
                <Rocket className="h-6 w-6" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-go2x-text">{program.label}</h2>
              <span className="text-xs text-go2x-text-muted">
                {activeBatches.length} active batch{activeBatches.length !== 1 ? 'es' : ''}
              </span>
            </div>
          </div>

          {/* Health status badge (Commented down per user request) */}
          {/*
          <span
            className={`flex items-center gap-1 rounded-go2x-full px-2 py-0.5 text-[11px] font-semibold ${
              hasErrors
                ? 'bg-go2x-bad-soft text-go2x-bad-text'
                : 'bg-go2x-ok-soft text-go2x-ok-text'
            }`}
          >
            <Activity className="h-3 w-3" />
            {hasErrors ? 'Data Issues' : 'Healthy'}
          </span>
          */}
        </div>

        {/* Description */}
        <p className="text-xs text-go2x-text-muted leading-relaxed">
          {program.description || 'Program attendance analytics'}
        </p>

        {/* Headline Stats Row */}
        <div className="grid grid-cols-2 gap-3 rounded-go2x-md border border-go2x-border bg-go2x-surface-alt p-3.5">
          <div>
            <span className="text-[11px] text-go2x-text-muted">Average Attendance</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-go2x-text tabular-nums">
                {formatPct(overallPct)}
              </span>
            </div>
            {delta.direction !== 'none' && (
              <span
                className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
                  delta.status === 'ok'
                    ? 'text-go2x-ok-text'
                    : delta.status === 'bad'
                    ? 'text-go2x-bad-text'
                    : 'text-go2x-text-muted'
                }`}
              >
                {delta.direction === 'up' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : delta.direction === 'down' ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {delta.text} (last 5)
              </span>
            )}
          </div>

          <div className="border-l border-go2x-border pl-3">
            <span className="text-[11px] text-go2x-text-muted">Tracked Scope</span>
            <p className="mt-1 text-2xl font-bold text-go2x-text tabular-nums">
              {trackedCount}
            </p>
            <span className="text-xs text-go2x-text-muted">
              {countLabel} • {formatDateShort(latestDate)}
            </span>
          </div>
        </div>

        {/* Batch Chips Row */}
        <div>
          <span className="text-[11px] font-semibold text-go2x-text-muted">Direct Batch Jump:</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {activeBatches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => router.push(`/${program.id}/${b.id}`)}
                className="rounded-go2x-md border border-go2x-border bg-go2x-surface px-2.5 py-1 text-xs font-medium text-go2x-text shadow-sm hover:border-go2x-accent hover:bg-go2x-accent-soft transition-colors"
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="mt-6 border-t border-go2x-border pt-4">
        <button
          type="button"
          onClick={() => router.push(`/${program.id}`)}
          className="flex w-full items-center justify-center gap-2 rounded-go2x-md bg-go2x-accent py-2.5 text-xs font-semibold text-go2x-accent-contrast shadow-sm hover:opacity-90 transition-opacity"
        >
          Open {program.label}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
