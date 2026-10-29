'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { formatPct } from '@/core/format';
import { useTheme } from '@/theme/useTheme';

export interface WeekdayPoint {
  weekday: string;
  sessions: number;
  pct: number | null;
}

interface WeekdayPatternChartProps {
  data: WeekdayPoint[];
}

export const WeekdayPatternChart: React.FC<WeekdayPatternChartProps> = ({ data }) => {
  const { theme } = useTheme();

  const chartData = data.map((d) => ({
    ...d,
    label: `${d.weekday} (n=${d.sessions})`,
    isSmallSample: d.sessions < 5,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} opacity={0.6} />
          <XAxis
            dataKey="label"
            stroke={theme.textMuted}
            fontSize={11}
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
              const d = payload[0].payload as WeekdayPoint & { isSmallSample: boolean };
              return (
                <div className="rounded-go2x-md border border-go2x-border bg-go2x-surface p-2.5 shadow-go2x-md text-xs space-y-1">
                  <p className="font-semibold text-go2x-text">{d.weekday}</p>
                  <div className="flex justify-between gap-4 text-go2x-text-muted">
                    <span>Average Attendance:</span>
                    <span className="font-semibold text-go2x-accent">
                      {formatPct(d.pct)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-go2x-text-muted">
                    <span>Sessions held:</span>
                    <span className="text-go2x-text">{d.sessions}</span>
                  </div>
                  {d.isSmallSample && (
                    <p className="text-[10px] text-go2x-warn-text">
                      * Fewer than 5 sessions recorded on this weekday
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.weekday}
                fill={theme.accent}
                fillOpacity={entry.isSmallSample ? 0.4 : 0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
