'use client';

import React, { useState } from 'react';
import { Info, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { KpiResult } from '@/core/registry';
import { formatPct, formatCount, formatDelta } from '@/core/format';

interface KpiCardProps {
  id: string;
  label: string;
  description: string;
  result: KpiResult;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  description,
  result,
  onClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const deltaInfo =
    result.delta !== undefined ? formatDelta(result.delta) : null;

  const displayVal =
    result.value === null
      ? 'n/a'
      : result.unit === '%'
      ? formatPct(result.value)
      : result.unit === 'pts'
      ? `${result.value > 0 ? '+' : ''}${result.value.toFixed(1)} pts`
      : formatCount(result.value);

  // Status colors
  const statusBorder =
    result.status === 'ok'
      ? 'border-go2x-ok/40'
      : result.status === 'warn'
      ? 'border-go2x-warn/40'
      : result.status === 'bad'
      ? 'border-go2x-bad/40'
      : 'border-go2x-border';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative flex flex-col justify-between rounded-go2x-lg border bg-go2x-surface p-4 shadow-go2x-sm transition-all duration-fast ${statusBorder} ${
        onClick
          ? 'cursor-pointer hover:border-go2x-accent hover:shadow-go2x-md'
          : ''
      }`}
    >
      {/* Header with info tooltip */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-go2x-text-muted">
          {label}
        </span>
        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip((v) => !v);
            }}
            aria-label={`Formula: ${description}`}
            className="rounded p-1 text-go2x-text-muted hover:bg-go2x-surface-alt hover:text-go2x-text"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-6 z-50 w-56 rounded-go2x-md border border-go2x-border bg-go2x-surface p-2.5 text-xs text-go2x-text shadow-go2x-md">
              <p className="font-semibold text-go2x-accent">Formula & Logic:</p>
              <p className="mt-1 text-go2x-text-muted">{description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Primary Value */}
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-go2x-text tabular-nums">
          {displayVal}
        </span>
      </div>

      {/* Delta and Sub-text */}
      <div className="mt-2 flex items-center justify-between text-xs">
        {deltaInfo && deltaInfo.direction !== 'none' ? (
          <span
            className={`flex items-center gap-0.5 font-semibold tabular-nums ${
              deltaInfo.status === 'ok'
                ? 'text-go2x-ok-text'
                : deltaInfo.status === 'bad'
                ? 'text-go2x-bad-text'
                : 'text-go2x-text-muted'
            }`}
          >
            {deltaInfo.direction === 'up' ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : deltaInfo.direction === 'down' ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            {deltaInfo.text}
          </span>
        ) : (
          <span className="text-go2x-text-muted">—</span>
        )}

        {result.sub && (
          <span className="text-right text-go2x-text-muted tabular-nums">
            {result.sub}
          </span>
        )}
      </div>
    </div>
  );
};
