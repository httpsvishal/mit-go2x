'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { ClassRecord } from '@/plugins/class-level/schema';
import { formatPct, formatDateShort } from '@/core/format';
import { getSectionColor } from '@/core/colors';
import { useTheme } from '@/theme/useTheme';

interface ClassScatterChartProps {
  records: ClassRecord[];
  onSelectClass?: (record: ClassRecord) => void;
}

export const ClassScatterChart: React.FC<ClassScatterChartProps> = ({
  records,
  onSelectClass,
}) => {
  const { theme } = useTheme();

  const filledRecords = records.filter((r) => r.status === 'filled' && r.pct !== null);
  const dates = Array.from(new Set(filledRecords.map((r) => r.date))).sort();
  const dateIndexMap = new Map<string, number>();
  dates.forEach((d, i) => dateIndexMap.set(d, i));

  // Group by section for colored series
  const sections = Array.from(new Set(filledRecords.map((r) => r.section))).sort();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-go2x-text-muted">
        <span>Class sessions distribution by date, attendance %, and class strength</span>
        <span>{filledRecords.length} filled classes</span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} opacity={0.6} />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, Math.max(0, dates.length - 1)]}
              ticks={dates.map((_, i) => i)}
              tickFormatter={(idx) => formatDateShort(dates[idx])}
              stroke={theme.textMuted}
              fontSize={11}
              tickLine={false}
              angle={-45}
              textAnchor="end"
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 100]}
              stroke={theme.textMuted}
              fontSize={12}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <ZAxis type="number" dataKey="z" range={[40, 200]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const d = payload[0].payload.record as ClassRecord;
                return (
                  <div className="rounded-go2x-md border border-go2x-border bg-go2x-surface p-2.5 shadow-go2x-md text-xs space-y-1">
                    <p className="font-semibold text-go2x-text">
                      {d.date} — Period {d.period} (Section {d.section})
                    </p>
                    <div className="flex justify-between gap-4 text-go2x-text-muted">
                      <span>Attendance:</span>
                      <span className="font-semibold text-go2x-accent">{formatPct(d.pct)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-go2x-text-muted">
                      <span>Strength:</span>
                      <span className="text-go2x-text">{d.present} / {d.total}</span>
                    </div>
                    {d.staff && (
                      <div className="flex justify-between gap-4 text-go2x-text-muted">
                        <span>Staff:</span>
                        <span className="text-go2x-text">{d.staff}</span>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <ReferenceLine y={50} stroke="#dc2626" strokeDasharray="3 3" />
            {sections.map((sec) => {
              const secData = filledRecords
                .filter((r) => r.section === sec)
                .map((r) => ({
                  x: dateIndexMap.get(r.date) ?? 0,
                  y: r.pct ?? 0,
                  z: r.total,
                  record: r,
                }));

              return (
                <Scatter
                  key={sec}
                  name={`Section ${sec}`}
                  data={secData}
                  fill={getSectionColor(sec)}
                  cursor="pointer"
                  onClick={(entry: any) => onSelectClass?.(entry?.record ?? entry?.payload?.record)}
                />
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
