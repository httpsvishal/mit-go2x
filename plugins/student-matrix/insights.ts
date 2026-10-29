import { InsightRule, MetricContext } from '@/core/registry';
import { maskName } from '@/core/mask';
import {
  computeOverallPct,
  computeTrend5v5,
  computeStudentMetrics,
  computeStudentsBelowTarget,
  computeCriticalStudents,
  computeAbsenceConcentration,
  computeActiveStreaks,
  computeSectionStudentAggregates,
  computeStudentMovement,
} from './metrics';

export const studentMatrixInsights: InsightRule[] = [
  {
    id: 's30-active-streaks',
    appliesTo: ['student-matrix'],
    evaluate(ctx: MetricContext) {
      const students = computeStudentMetrics(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.streakAlert
      );
      const streakAlert = ctx.manifest.settings.streakAlert || 3;
      const streaking = students.filter((s) => s.currentStreak >= streakAlert);

      if (streaking.length === 0) return null;

      const sampleNames = streaking
        .slice(0, 3)
        .map((s) => maskName(s.name, ctx.maskNames))
        .join(', ');
      const suffix = streaking.length > 3 ? ` and ${streaking.length - 3} others` : '';

      return {
        id: 's30-active-streaks',
        text: `${streaking.length} students have missed ${streakAlert}+ sessions in a row: ${sampleNames}${suffix}.`,
        severity: streaking.some((s) => s.currentStreak >= 5) ? 'critical' : 'warn',
        link: { page: 'students' },
      };
    },
  },
  {
    id: 's30-critical-concentration',
    appliesTo: ['student-matrix'],
    evaluate(ctx: MetricContext) {
      const students = computeStudentMetrics(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.streakAlert
      );
      const critCount = computeCriticalStudents(students, ctx.thresholds.critical);
      const concentration = computeAbsenceConcentration(students, ctx.thresholds.critical);

      if (critCount === 0 || concentration === null || concentration < 20) return null;

      return {
        id: 's30-critical-concentration',
        text: `${critCount} students (<50%) account for ${concentration.toFixed(1)}% of all missed classes in this batch.`,
        severity: concentration > 30 ? 'critical' : 'warn',
        link: { page: 'students', filters: { statusBands: ['bad'] } },
      };
    },
  },
  {
    id: 's30-student-decline',
    appliesTo: ['student-matrix'],
    evaluate(ctx: MetricContext) {
      const students = computeStudentMetrics(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.streakAlert
      );
      const { declined } = computeStudentMovement(students);

      if (declined === 0) return null;

      return {
        id: 's30-student-decline',
        text: `${declined} students declined by more than 20 pts between the first and second half of the term.`,
        severity: declined > 15 ? 'critical' : 'warn',
        link: { page: 'students' },
      };
    },
  },
  {
    id: 's30-worst-section',
    appliesTo: ['student-matrix'],
    evaluate(ctx: MetricContext) {
      const overall = computeOverallPct(ctx.records);
      if (overall === null) return null;

      const sections = computeSectionStudentAggregates(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.minSampleSize || 5
      ).filter((s) => s.pct !== null && !s.isSmallSample);

      if (sections.length < 2) return null;

      const sorted = [...sections].sort((a, b) => a.pct! - b.pct!);
      const worst = sorted[0];
      const gap = overall - worst.pct!;

      if (gap <= 0) return null;

      return {
        id: 's30-worst-section',
        text: `Section ${worst.section} is ${gap.toFixed(1)} pts below the batch average (${worst.pct!.toFixed(1)}%) with ${worst.belowTarget} students below target.`,
        severity: gap > 10 ? 'critical' : 'warn',
        link: { page: 'sections', filters: { sections: [worst.section] } },
      };
    },
  },
  {
    id: 's30-trend-movement',
    appliesTo: ['student-matrix'],
    evaluate(ctx: MetricContext) {
      const delta = computeTrend5v5(ctx.records);
      if (delta === null || Math.abs(delta) < 3) return null;

      const direction = delta > 0 ? 'higher' : 'lower';
      return {
        id: 's30-trend-movement',
        text: `Attendance in the last 5 days is ${Math.abs(delta).toFixed(1)} pts ${direction} than the 5 days before.`,
        severity: delta < -5 ? 'critical' : delta > 0 ? 'info' : 'warn',
        link: { page: 'trends' },
      };
    },
  },
];
