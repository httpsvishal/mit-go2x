import { KpiDefinition, MetricContext } from '@/core/registry';
import { formatPct } from '@/core/format';
import {
  computeOverallPct,
  computeTrend5v5,
  computeClassesBelow50,
  computePeriodGap,
  computeCompleteness,
  computePendingEntries,
  computeSectionAggregates,
  computeSectionGap,
  computePeriodAggregates,
} from './metrics';
import {
  computeOverallPct as computeMatrixOverallPct,
  computeTrend5v5 as computeMatrixTrend5v5,
} from '../student-matrix/metrics';

export const classLevelKpis: KpiDefinition[] = [
  {
    id: 'overallPct',
    label: 'Overall Attendance',
    description: 'Average student turnout across all marked classes',
    appliesTo: ['class-level', '*'],
    compute(ctx: MetricContext) {
      const isMatrix =
        ctx.program?.type === 'student-matrix' ||
        (ctx.records.length > 0 && 'studentId' in ctx.records[0]);
      const val = isMatrix
        ? computeMatrixOverallPct(ctx.records)
        : computeOverallPct(ctx.records);
      const delta = isMatrix
        ? computeMatrixTrend5v5(ctx.records)
        : computeTrend5v5(ctx.records);
      const status =
        val === null
          ? 'neutral'
          : val >= ctx.thresholds.atRisk
          ? 'ok'
          : val >= ctx.thresholds.critical
          ? 'warn'
          : 'bad';

      return {
        value: val,
        unit: '%',
        delta,
        status,
        drilldown: { page: 'trends' },
      };
    },
  },
  {
    id: 'trend5v5',
    label: 'Attendance Trend',
    description: 'Growth in attendance over the last 5 days compared to prior week',
    appliesTo: ['class-level', '*'],
    compute(ctx: MetricContext) {
      const isMatrix =
        ctx.program?.type === 'student-matrix' ||
        (ctx.records.length > 0 && 'studentId' in ctx.records[0]);
      const delta = isMatrix
        ? computeMatrixTrend5v5(ctx.records)
        : computeTrend5v5(ctx.records);
      const status =
        delta === null
          ? 'neutral'
          : delta >= 0
          ? 'ok'
          : delta >= -5
          ? 'warn'
          : 'bad';

      return {
        value: delta,
        unit: 'pts',
        status,
        drilldown: { page: 'trends' },
      };
    },
  },
  {
    id: 'completeness',
    label: 'Total Classes Conducted',
    description: 'Total class sessions conducted with attendance verified and recorded',
    appliesTo: ['class-level'],
    compute(ctx: MetricContext) {
      const val = computeCompleteness(ctx.records);
      const filled = ctx.records.filter((r) => r.status === 'filled').length;
      const status =
        val === null ? 'neutral' : val >= 90 ? 'ok' : val >= 80 ? 'warn' : 'bad';

      return {
        value: filled,
        unit: 'count',
        sub: `${val !== null ? val.toFixed(1) : '100.0'}% of ${ctx.records.length} scheduled`,
        status,
        drilldown: { page: 'periods' },
      };
    },
  },
  {
    id: 'activeClasses',
    label: 'High-Engagement Classes',
    description: 'Classes with solid student participation (≥50% turnout)',
    appliesTo: ['class-level'],
    compute(ctx: MetricContext) {
      const filled = ctx.records.filter((r) => r.status === 'filled');
      const above50 = filled.filter((r) => r.pct !== null && r.pct >= 50);
      const pct = filled.length > 0 ? (above50.length / filled.length) * 100 : 0;
      return {
        value: above50.length,
        unit: 'count',
        sub: `${pct.toFixed(1)}% of conducted`,
        status: above50.length > 0 ? 'ok' : 'neutral',
        drilldown: { page: 'periods' },
      };
    },
  },
  {
    id: 'peakPeriod',
    label: 'Peak Engagement Period',
    description: 'Period showing the highest student turnout throughout the day',
    appliesTo: ['class-level'],
    compute(ctx: MetricContext) {
      const periods = computePeriodAggregates(ctx.records).filter(
        (p) => p.pct !== null && p.filled > 0
      );
      if (periods.length === 0) {
        return { value: null, unit: '%', status: 'neutral' };
      }
      const sorted = [...periods].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
      const best = sorted[0];
      return {
        value: best.pct,
        unit: '%',
        sub: `Period ${best.period} (Highest)`,
        status: 'ok',
        drilldown: { page: 'periods' },
      };
    },
  },
  {
    id: 'pendingEntries',
    label: 'Submissions Due',
    description: 'Classes awaiting teacher submission to finalize records',
    appliesTo: ['class-level'],
    compute(ctx: MetricContext) {
      const pending = computePendingEntries(ctx.records);
      const status = pending.length === 0 ? 'ok' : pending.length > 5 ? 'bad' : 'warn';

      return {
        value: pending.length,
        unit: 'count',
        sub: pending.length > 0 ? 'Action to reach 100%' : 'All classes recorded',
        status,
        drilldown: { page: 'periods' },
      };
    },
  },
  {
    id: 'classesBelow50',
    label: 'Classes Below 50%',
    description: 'Number and % of classes with attendance under 50%',
    appliesTo: ['class-level'],
    compute(ctx: MetricContext) {
      const res = computeClassesBelow50(
        ctx.records,
        ctx.manifest.settings.lowTurnoutBelowPct || 50
      );
      const status =
        res.count === 0
          ? 'ok'
          : res.pct !== null && res.pct > 25
          ? 'bad'
          : 'warn';

      return {
        value: res.count,
        unit: 'count',
        sub: res.pct !== null ? `${res.pct.toFixed(1)}% of marked` : undefined,
        status,
        drilldown: { page: 'periods' },
      };
    },
  },
  {
    id: 'periodGap',
    label: 'Period Difference',
    description: 'Difference between highest and lowest period attendance',
    appliesTo: ['class-level'],
    compute(ctx: MetricContext) {
      const gap = computePeriodGap(ctx.records);
      const status =
        gap === null ? 'neutral' : gap > 25 ? 'bad' : gap > 15 ? 'warn' : 'ok';

      return {
        value: gap,
        unit: 'pts',
        status,
        drilldown: { page: 'periods' },
      };
    },
  },
  {
    id: 'sectionGap',
    label: 'Section Difference',
    description: 'Difference between highest and lowest section attendance',
    appliesTo: ['class-level', '*'],
    compute(ctx: MetricContext) {
      const gap = computeSectionGap(
        ctx.records,
        ctx.manifest.settings.minSampleSize || 5
      );
      const status =
        gap === null ? 'neutral' : gap > 20 ? 'bad' : gap > 10 ? 'warn' : 'ok';

      return {
        value: gap,
        unit: 'pts',
        status,
        drilldown: { page: 'sections' },
      };
    },
  },
  {
    id: 'sectionsBelowAvg',
    label: 'Sections Below Average',
    description: 'count of sections under the overall attendance %',
    appliesTo: ['class-level'],
    compute(ctx: MetricContext) {
      const overall = computeOverallPct(ctx.records);
      if (overall === null) {
        return { value: null, unit: 'count', status: 'neutral' };
      }
      const sections = computeSectionAggregates(
        ctx.records,
        ctx.manifest.settings.minSampleSize || 5
      );
      const below = sections.filter((s) => s.pct !== null && s.pct < overall).length;
      return {
        value: below,
        unit: 'count',
        sub: `of ${sections.length} sections`,
        status: below > sections.length / 2 ? 'warn' : 'ok',
        drilldown: { page: 'sections' },
      };
    },
  },
];
