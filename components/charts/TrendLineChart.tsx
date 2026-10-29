'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ChartProps } from '@/core/registry';
import { formatPct, formatDateShort } from '@/core/format';
import { useTheme } from '@/theme/useTheme';

export const TrendLineChart: React.FC<ChartProps> = ({
  records,
  batch,
  thresholds,
  filters,
  batchDataMap,
  batchesInView,
}) => {
  const { theme, status: statusColors, chartCategorical } = useTheme();

  // Check if we are rendering multi-batch comparison
  const isMultiBatch = batchesInView && batchesInView.length > 1 && batchDataMap;

  if (isMultiBatch) {
    // Collect all unique dates or session numbers
    const allDatesSet = new Set<string>();
    const batchSeriesMap: Record<string, Map<string, number | null>> = {};

    batchesInView.forEach((b) => {
      const bRecords = batchDataMap[b.id] || [];
      const isClassLevel = bRecords.length > 0 && 'period' in bRecords[0];
      const dateMap = new Map<string, { pres: number; elig: number }>();

      bRecords.forEach((r: any) => {
        const d = r.date;
        if (!dateMap.has(d)) dateMap.set(d, { pres: 0, elig: 0 });
        const item = dateMap.get(d)!;

        if (isClassLevel) {
          if (r.status === 'filled') {
            item.pres += r.present;
            item.elig += r.total;
          }
        } else {
          if (r.status === 'present' || r.status === 'absent') {
            if (r.status === 'present') item.pres += 1;
            item.elig += 1;
          }
        }
      });

      const series = new Map<string, number | null>();
      dateMap.forEach((v, d) => {
        allDatesSet.add(d);
        series.set(d, v.elig > 0 ? (v.pres / v.elig) * 100 : null);
      });
      batchSeriesMap[b.id] = series;
    });

    const sortedDates = Array.from(allDatesSet).sort();

    const chartData = sortedDates.map((date, idx) => {
      const point: any = {
        date,
        displayLabel: filters.alignBySession ? `S${idx + 1}` : formatDateShort(date),
      };
      batchesInView.forEach((b) => {
        point[b.id] = batchSeriesMap[b.id]?.get(date) ?? null;
      });
      return point;
    });

    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} opacity={0.6} />
            <XAxis
              dataKey="displayLabel"
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
              content={({ active, payload, label }) => {
                if (!active || !payload) return null;
                return (
                  <div className="rounded-go2x-md border border-go2x-border bg-go2x-surface p-2 shadow-go2x-md text-xs space-y-1">
                    <p className="font-semibold text-go2x-text">{label}</p>
                    {payload.map((p: any) => (
                      <div key={p.dataKey} className="flex items-center justify-between gap-4">
                        <span style={{ color: p.color }}>{p.name}:</span>
                        <span className="font-medium text-go2x-text">
                          {formatPct(p.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={thresholds.atRisk}
              stroke={statusColors.warn}
              strokeDasharray="4 4"
              label={{
                value: `Target (${thresholds.atRisk}%)`,
                position: 'insideTopRight',
                fill: statusColors.warnText,
                fontSize: 10,
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            {batchesInView.map((b, i) => (
              <Line
                key={b.id}
                type="monotone"
                dataKey={b.id}
                name={b.label}
                stroke={chartCategorical[i % chartCategorical.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Single batch trend line
  const isClassLevel = records.length > 0 && 'period' in records[0];
  const dateMap = new Map<string, { pres: number; elig: number }>();

  records.forEach((r) => {
    const d = r.date;
    if (!dateMap.has(d)) dateMap.set(d, { pres: 0, elig: 0 });
    const item = dateMap.get(d)!;

    if (isClassLevel) {
      if (r.status === 'filled') {
        item.pres += r.present;
        item.elig += r.total;
      }
    } else {
      if (r.status === 'present' || r.status === 'absent') {
        if (r.status === 'present') item.pres += 1;
        item.elig += 1;
      }
    }
  });

  const sortedDates = Array.from(dateMap.keys()).sort();

  // Compute raw % and 3-session rolling average
  const chartData = sortedDates.map((date, idx) => {
    const item = dateMap.get(date)!;
    const rawPct = item.elig > 0 ? (item.pres / item.elig) * 100 : null;

    // Rolling average over current + prior 2 sessions
    let rollingSum = 0;
    let rollingCount = 0;
    for (let k = Math.max(0, idx - 2); k <= idx; k++) {
      const prevItem = dateMap.get(sortedDates[k])!;
      if (prevItem.elig > 0) {
        rollingSum += (prevItem.pres / prevItem.elig) * 100;
        rollingCount++;
      }
    }
    const rollingAvg = rollingCount > 0 ? rollingSum / rollingCount : null;

    return {
      date,
      displayLabel: filters.alignBySession ? `S${idx + 1}` : formatDateShort(date),
      rawPct,
      rollingAvg,
      eligible: item.elig,
      present: item.pres,
      isLowTurnout: rawPct !== null && rawPct < thresholds.critical,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-go2x-text-muted">
        No trend data available for current selection
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-go2x-text-muted">
        <span>Day-by-day trend with 3-day rolling average</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-go2x-text-muted opacity-40" />
            Daily rate
          </span>
          <span className="flex items-center gap-1 font-medium text-go2x-text">
            <span className="inline-block h-2 w-4 rounded-full bg-go2x-accent" />
            3-day average
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} opacity={0.6} />
            <XAxis
              dataKey="displayLabel"
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
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-go2x-md border border-go2x-border bg-go2x-surface p-2.5 shadow-go2x-md text-xs space-y-1">
                    <p className="font-semibold text-go2x-text">
                      {label} ({d.date})
                    </p>
                    <div className="flex justify-between gap-4 text-go2x-text-muted">
                      <span>Daily attendance:</span>
                      <span className="font-semibold text-go2x-text">
                        {formatPct(d.rawPct)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-go2x-text-muted">
                      <span>3-day average:</span>
                      <span className="font-semibold text-go2x-accent">
                        {formatPct(d.rollingAvg)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-go2x-text-muted">
                      <span>Present / Total:</span>
                      <span className="text-go2x-text">
                        {d.present} / {d.eligible}
                      </span>
                    </div>
                    {d.isLowTurnout && (
                      <p className="mt-1 font-medium text-go2x-bad-text">
                        Low attendance day (&lt;{thresholds.critical}%)
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={thresholds.atRisk}
              stroke={statusColors.warn}
              strokeDasharray="4 4"
              label={{
                value: `Target (${thresholds.atRisk}%)`,
                position: 'insideTopRight',
                fill: statusColors.warnText,
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="rawPct"
              stroke={theme.textMuted}
              strokeWidth={1.5}
              strokeOpacity={0.4}
              dot={{ r: 2, fill: theme.textMuted }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="rollingAvg"
              stroke={theme.accent}
              strokeWidth={2.5}
              dot={{ r: 3, fill: theme.accent }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
