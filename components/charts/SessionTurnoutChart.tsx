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
import { formatPct, formatDateShort } from '@/core/format';
import { useTheme } from '@/theme/useTheme';

export interface TurnoutPoint {
  date: string;
  sessionNumber: number;
  eligible: number;
  present: number;
  pct: number | null;
  isLowTurnout: boolean;
}

interface SessionTurnoutChartProps {
  data: TurnoutPoint[];
  criticalThreshold?: number;
  alignBySession?: boolean;
}

export const SessionTurnoutChart: React.FC<SessionTurnoutChartProps> = ({
  data,
  criticalThreshold = 50,
  alignBySession = false,
}) => {
  const { theme, status: statusColors } = useTheme();

  const chartData = data.map((d) => ({
    ...d,
    displayLabel: alignBySession ? `S${d.sessionNumber}` : formatDateShort(d.date),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} opacity={0.6} />
          <XAxis
            dataKey="displayLabel"
            stroke={theme.textMuted}
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            yAxisId="count"
            stroke={theme.textMuted}
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            yAxisId="pct"
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
              const d = payload[0].payload as TurnoutPoint;
              return (
                <div className="rounded-go2x-md border border-go2x-border bg-go2x-surface p-2.5 shadow-go2x-md text-xs space-y-1">
                  <p className="font-semibold text-go2x-text">
                    Session #{d.sessionNumber} ({d.date})
                  </p>
                  <div className="flex justify-between gap-4 text-go2x-text-muted">
                    <span>Attendance %:</span>
                    <span className="font-semibold text-go2x-accent">
                      {formatPct(d.pct)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-go2x-text-muted">
                    <span>Present:</span>
                    <span className="text-go2x-text">{d.present}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-go2x-text-muted">
                    <span>Total Enrolled:</span>
                    <span className="text-go2x-text">{d.eligible}</span>
                  </div>
                  {d.isLowTurnout && (
                    <p className="font-medium text-go2x-bad-text">
                      Low attendance (&lt;{criticalThreshold}%)
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <ReferenceLine
            yAxisId="pct"
            y={criticalThreshold}
            stroke={statusColors.bad}
            strokeDasharray="3 3"
          />
          <Bar
            yAxisId="count"
            dataKey="eligible"
            name="Total Students"
            fill={theme.surfaceAlt}
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="present"
            name="Present Count"
            stroke={statusColors.ok}
            strokeWidth={2}
            dot={{ r: 2 }}
          />
          <Line
            yAxisId="pct"
            type="monotone"
            dataKey="pct"
            name="Attendance %"
            stroke={theme.accent}
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
