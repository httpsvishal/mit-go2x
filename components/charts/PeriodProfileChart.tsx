'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts';
import { ChartProps } from '@/core/registry';
import { formatPct } from '@/core/format';
import { computePeriodAggregates, computeOverallPct } from '@/plugins/class-level/metrics';
import { useTheme } from '@/theme/useTheme';

export const PeriodProfileChart: React.FC<ChartProps> = ({
  records,
  thresholds,
}) => {
  const { theme, status: statusColors } = useTheme();

  const periodData = computePeriodAggregates(records as any);
  const overallPct = computeOverallPct(records as any);

  // Find best and worst filled periods
  const filledPeriods = periodData.filter((p) => p.pct !== null && p.filled > 0);
  let bestPeriod = -1;
  let worstPeriod = -1;

  if (filledPeriods.length > 0) {
    const sorted = [...filledPeriods].sort((a, b) => b.pct! - a.pct!);
    bestPeriod = sorted[0].period;
    worstPeriod = sorted[sorted.length - 1].period;
  }

  const chartData = periodData.map((p) => ({
    period: `P${p.period}`,
    periodNum: p.period,
    pct: p.pct ?? 0,
    filled: p.filled,
    scheduled: p.scheduled,
    present: p.present,
    total: p.total,
    isBest: p.period === bestPeriod && filledPeriods.length > 1,
    isWorst: p.period === worstPeriod && filledPeriods.length > 1,
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-go2x-text-muted">
        <span>Period attendance comparison</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-go2x-ok" /> Best period
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-go2x-bad" /> Worst period
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} opacity={0.6} />
            <XAxis
              dataKey="period"
              stroke={theme.textMuted}
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke={theme.textMuted}
              fontSize={12}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-go2x-md border border-go2x-border bg-go2x-surface p-2.5 shadow-go2x-md text-xs space-y-1">
                    <p className="font-semibold text-go2x-text">Period {d.periodNum}</p>
                    <div className="flex justify-between gap-4 text-go2x-text-muted">
                      <span>Attendance:</span>
                      <span className="font-semibold text-go2x-text">{formatPct(d.pct)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-go2x-text-muted">
                      <span>Students Present:</span>
                      <span className="text-go2x-text">{d.present} / {d.total}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-go2x-text-muted">
                      <span>Classes:</span>
                      <span className="text-go2x-text">{d.filled} marked ({d.scheduled} total)</span>
                    </div>
                  </div>
                );
              }}
            />
            {overallPct !== null && (
              <ReferenceLine
                y={overallPct}
                stroke={theme.accent}
                strokeDasharray="4 4"
                label={{
                  value: `Batch Avg (${formatPct(overallPct)})`,
                  position: 'insideTopRight',
                  fill: theme.accent,
                  fontSize: 10,
                }}
              />
            )}
            <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => {
                let color = theme.accent;
                if (entry.isBest) color = statusColors.ok;
                else if (entry.isWorst) color = statusColors.bad;
                return <Cell key={entry.period} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
