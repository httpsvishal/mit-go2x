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
import { ChartProps } from '@/core/registry';
import {
  computeStudentMetrics,
  computeStudentHistogram,
} from '@/plugins/student-matrix/metrics';
import { useTheme } from '@/theme/useTheme';

export const StudentHistogramChart: React.FC<ChartProps> = ({
  records,
  thresholds,
  onFilterChange,
}) => {
  const { theme, status: statusColors } = useTheme();

  const students = computeStudentMetrics(records as any, thresholds);
  const histogram = computeStudentHistogram(students);

  const handleClick = (bin: string) => {
    if (!onFilterChange) return;
    if (bin === '<25' || bin === '25-50') {
      onFilterChange({ statusBands: ['bad'] });
    } else if (bin === '50-75') {
      onFilterChange({ statusBands: ['warn'] });
    } else {
      onFilterChange({ statusBands: ['ok'] });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-go2x-text-muted">
        <span>Number of students by attendance range (click to filter)</span>
        <span>Total students: {students.length}</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} opacity={0.6} />
            <XAxis
              dataKey="label"
              stroke={theme.textMuted}
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke={theme.textMuted}
              fontSize={12}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const d = payload[0].payload;
                const pct = students.length > 0 ? ((d.count / students.length) * 100).toFixed(1) : '0';
                return (
                  <div className="rounded-go2x-md border border-go2x-border bg-go2x-surface p-2.5 shadow-go2x-md text-xs space-y-1">
                    <p className="font-semibold text-go2x-text">Bracket: {d.label}</p>
                    <div className="flex justify-between gap-4 text-go2x-text-muted">
                      <span>Students:</span>
                      <span className="font-semibold text-go2x-text">
                        {d.count} ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(entry: any) => handleClick(entry?.bin ?? entry?.payload?.bin)}
            >
              {histogram.map((entry) => {
                const color =
                  entry.status === 'ok'
                    ? statusColors.ok
                    : entry.status === 'warn'
                    ? statusColors.warn
                    : statusColors.bad;
                return <Cell key={entry.bin} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
