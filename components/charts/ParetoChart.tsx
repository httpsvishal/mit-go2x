'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { maskName } from '@/core/mask';
import { formatPct } from '@/core/format';
import { useTheme } from '@/theme/useTheme';

export interface ParetoItem {
  studentId: string;
  name: string;
  rollNo: string;
  absent: number;
  pct: number | null;
  cumulativePct: number;
}

interface ParetoChartProps {
  data: ParetoItem[];
  maskNames: boolean;
}

export const ParetoChart: React.FC<ParetoChartProps> = ({ data, maskNames }) => {
  const { theme, status: statusColors } = useTheme();

  const chartData = data.map((d) => ({
    ...d,
    displayLabel: maskName(d.name, maskNames),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} opacity={0.6} />
          <XAxis
            dataKey="displayLabel"
            stroke={theme.textMuted}
            fontSize={10}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            yAxisId="absences"
            stroke={theme.textMuted}
            fontSize={12}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="cumulative"
            orientation="right"
            domain={[0, 100]}
            stroke={theme.textMuted}
            fontSize={12}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const d = payload[0].payload as ParetoItem & { displayLabel: string };
              return (
                <div className="rounded-go2x-md border border-go2x-border bg-go2x-surface p-2.5 shadow-go2x-md text-xs space-y-1">
                  <p className="font-semibold text-go2x-text">
                    {d.displayLabel} ({d.rollNo})
                  </p>
                  <div className="flex justify-between gap-4 text-go2x-text-muted">
                    <span>Missed classes:</span>
                    <span className="font-semibold text-go2x-bad">{d.absent}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-go2x-text-muted">
                    <span>Attendance %:</span>
                    <span className="text-go2x-text">{formatPct(d.pct)}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-go2x-text-muted">
                    <span>Total share of absences:</span>
                    <span className="font-semibold text-go2x-accent">
                      {formatPct(d.cumulativePct)}
                    </span>
                  </div>
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <ReferenceLine
            yAxisId="cumulative"
            y={80}
            stroke={statusColors.warn}
            strokeDasharray="3 3"
            label={{
              value: '80% Absences',
              position: 'insideTopRight',
              fill: statusColors.warnText,
              fontSize: 10,
            }}
          />
          <Bar
            yAxisId="absences"
            dataKey="absent"
            name="Classes Missed"
            fill={statusColors.bad}
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="cumulative"
            type="monotone"
            dataKey="cumulativePct"
            name="Running Total %"
            stroke={theme.accent}
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
