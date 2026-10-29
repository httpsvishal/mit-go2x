import { InsightRule, MetricContext } from '@/core/registry';
import {
  computeOverallPct,
  computeTrend5v5,
  computeSectionAggregates,
  computePeriodAggregates,
  computeCompleteness,
  computePendingEntries,
} from './metrics';

export const classLevelInsights: InsightRule[] = [
  {
    id: 'coe-pending-classes',
    appliesTo: ['class-level'],
    evaluate(ctx: MetricContext) {
      const pending = computePendingEntries(ctx.records);
      const completeness = computeCompleteness(ctx.records);
      if (pending.length === 0) return null;

      return {
        id: 'coe-pending-classes',
        text: `${pending.length} class entries are pending; entry completeness is ${completeness?.toFixed(1) || '0.0'}%.`,
        severity: pending.length > 5 ? 'critical' : 'warn',
        link: { page: 'periods' },
      };
    },
  },
  {
    id: 'coe-lowest-period',
    appliesTo: ['class-level'],
    evaluate(ctx: MetricContext) {
      const periods = computePeriodAggregates(ctx.records).filter(
        (p) => p.pct !== null && p.filled > 0
      );
      if (periods.length < 2) return null;

      const sorted = [...periods].sort((a, b) => a.pct! - b.pct!);
      const worst = sorted[0];
      const best = sorted[sorted.length - 1];
      const gap = best.pct! - worst.pct!;

      if (gap < 10) return null;

      return {
        id: 'coe-lowest-period',
        text: `Period ${worst.period} has the lowest attendance (${worst.pct!.toFixed(1)}%), ${gap.toFixed(1)} pts below Period ${best.period}.`,
        severity: gap > 20 ? 'critical' : 'warn',
        link: { page: 'periods' },
      };
    },
  },
  {
    id: 'coe-worst-section',
    appliesTo: ['class-level'],
    evaluate(ctx: MetricContext) {
      const overall = computeOverallPct(ctx.records);
      if (overall === null) return null;

      const sections = computeSectionAggregates(
        ctx.records,
        ctx.manifest.settings.minSampleSize || 5
      ).filter((s) => s.pct !== null && !s.isSmallSample);

      if (sections.length < 2) return null;

      const sorted = [...sections].sort((a, b) => a.pct! - b.pct!);
      const worst = sorted[0];
      const gap = overall - worst.pct!;

      if (gap <= 0) return null;

      return {
        id: 'coe-worst-section',
        text: `Section ${worst.section} is ${gap.toFixed(1)} pts below the batch average and has ${worst.classesBelow50} classes below 50%.`,
        severity: gap > 15 ? 'critical' : 'warn',
        link: { page: 'sections', filters: { sections: [worst.section] } },
      };
    },
  },
  {
    id: 'coe-trend-movement',
    appliesTo: ['class-level'],
    evaluate(ctx: MetricContext) {
      const delta = computeTrend5v5(ctx.records);
      if (delta === null || Math.abs(delta) < 3) return null;

      const direction = delta > 0 ? 'higher' : 'lower';
      return {
        id: 'coe-trend-movement',
        text: `Attendance in the last 5 sessions is ${Math.abs(delta).toFixed(1)} pts ${direction} than the 5 sessions before.`,
        severity: delta < -5 ? 'critical' : delta > 0 ? 'info' : 'warn',
        link: { page: 'trends' },
      };
    },
  },
  {
    id: 'coe-assessment-insight',
    appliesTo: ['class-level'],
    evaluate(ctx: MetricContext) {
      if (ctx.batch?.id !== 'coe-3y' && !ctx.batch?.files?.testResults) return null;
      return {
        id: 'coe-assessment-insight',
        text: 'COE 3rd Year Web Dev Test: 314 students participated with a 38.8% average score. JavaScript is the lowest-scoring domain (33.2%), while HTML leads at 43.2%.',
        severity: 'info',
        link: { page: 'assessments' },
      };
    },
  },
];
