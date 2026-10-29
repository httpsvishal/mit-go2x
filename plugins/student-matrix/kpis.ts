import { KpiDefinition, MetricContext } from '@/core/registry';
import { formatPct } from '@/core/format';
import {
  computeOverallPct,
  computeTrend5v5,
  computeStudentMetrics,
  computeStudentsBelowTarget,
  computeCriticalStudents,
  computeAbsenceConcentration,
  computeActiveStreaks,
  computeMedianStudentPct,
  computeHighAttendees,
  computeSectionStudentAggregates,
} from './metrics';
import {
  computeOverallPct as computeCoeOverallPct,
  computeTrend5v5 as computeCoeTrend5v5,
} from '../class-level/metrics';

export const studentMatrixKpis: KpiDefinition[] = [
  {
    id: 'overallPct',
    label: 'Overall Attendance',
    description: 'Total present divided by total sessions across enrolled students',
    appliesTo: ['student-matrix', '*'],
    compute(ctx: MetricContext) {
      const isClassLevel =
        ctx.program?.type === 'class-level' ||
        (ctx.records.length > 0 && 'total' in ctx.records[0] && !('studentId' in ctx.records[0]));
      const val = isClassLevel
        ? computeCoeOverallPct(ctx.records)
        : computeOverallPct(ctx.records);
      const delta = isClassLevel
        ? computeCoeTrend5v5(ctx.records)
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
    appliesTo: ['student-matrix', '*'],
    compute(ctx: MetricContext) {
      const isClassLevel =
        ctx.program?.type === 'class-level' ||
        (ctx.records.length > 0 && 'total' in ctx.records[0] && !('studentId' in ctx.records[0]));
      const delta = isClassLevel
        ? computeCoeTrend5v5(ctx.records)
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
    id: 'regularAttendees',
    label: 'Regular Attendees (≥75%)',
    description: 'Students consistently attending and on-track for success',
    appliesTo: ['student-matrix'],
    compute(ctx: MetricContext) {
      const students = computeStudentMetrics(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.streakAlert
      );
      const regular = students.filter((s) => s.pct !== null && s.pct >= ctx.thresholds.atRisk);
      const pct = students.length > 0 ? (regular.length / students.length) * 100 : 0;
      return {
        value: regular.length,
        unit: 'count',
        sub: `${pct.toFixed(1)}% of batch`,
        status: 'ok',
        drilldown: { page: 'students', filters: { statusBands: ['ok'] } },
      };
    },
  },
  {
    id: 'topAttendees',
    label: 'Top Attendance (≥90%)',
    description: 'Students demonstrating exemplary attendance; multiple with 100% perfect record',
    appliesTo: ['student-matrix'],
    compute(ctx: MetricContext) {
      const students = computeStudentMetrics(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.streakAlert
      );
      const { gte90, exact100 } = computeHighAttendees(students);
      return {
        value: gte90,
        unit: 'count',
        sub: `${exact100} with 100% record`,
        status: 'ok',
        drilldown: { page: 'students' },
      };
    },
  },
  {
    id: 'activeEngagements',
    label: 'Class Attendances Logged',
    description: 'Total student attendances delivered across all sessions',
    appliesTo: ['student-matrix'],
    compute(ctx: MetricContext) {
      const present = ctx.records.filter((r) => r.status === 'present').length;
      const eligible = ctx.records.filter((r) => r.status === 'present' || r.status === 'absent').length;
      return {
        value: present,
        unit: 'count',
        sub: `${eligible} planned sessions`,
        status: 'ok',
        drilldown: { page: 'trends' },
      };
    },
  },
  {
    id: 'supportFocus',
    label: 'Mentoring Focus Group',
    description: 'Students who will benefit most from 1-on-1 check-ins to boost attendance',
    appliesTo: ['student-matrix'],
    compute(ctx: MetricContext) {
      const students = computeStudentMetrics(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.streakAlert
      );
      const count = computeCriticalStudents(students, ctx.thresholds.critical);
      const conc = computeAbsenceConcentration(students, ctx.thresholds.critical);
      const status = count > 10 ? 'warn' : count > 0 ? 'ok' : 'neutral';
      return {
        value: count,
        unit: 'count',
        sub: conc !== null ? `Mentoring recovers ${conc.toFixed(0)}% absences` : 'Active support list',
        status,
        drilldown: { page: 'students', filters: { statusBands: ['bad'] } },
      };
    },
  },
  {
    id: 'studentsBelowTarget',
    label: 'Below Target (<75%)',
    description: 'Number and % of students with attendance below 75%',
    appliesTo: ['student-matrix'],
    compute(ctx: MetricContext) {
      const students = computeStudentMetrics(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.streakAlert
      );
      const res = computeStudentsBelowTarget(students, ctx.thresholds.atRisk);
      const status =
        res.pct === null
          ? 'neutral'
          : res.pct > 50
          ? 'bad'
          : res.pct > 25
          ? 'warn'
          : 'ok';

      return {
        value: res.count,
        unit: 'count',
        sub: res.pct !== null ? `${res.pct.toFixed(1)}% of batch` : undefined,
        status,
        drilldown: { page: 'students', filters: { statusBands: ['warn', 'bad'] } },
      };
    },
  },
  {
    id: 'criticalStudents',
    label: 'Students <50%',
    description: 'Number of students with attendance under 50%',
    appliesTo: ['student-matrix'],
    compute(ctx: MetricContext) {
      const students = computeStudentMetrics(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.streakAlert
      );
      const count = computeCriticalStudents(students, ctx.thresholds.critical);
      const status = count > 10 ? 'bad' : count > 0 ? 'warn' : 'ok';

      return {
        value: count,
        unit: 'count',
        sub: 'Attendance < 50%',
        status,
        drilldown: { page: 'students', filters: { statusBands: ['bad'] } },
      };
    },
  },
  {
    id: 'absenceConcentration',
    label: 'Absence Share',
    description: 'Percentage of all missed classes caused by students with <50% attendance',
    appliesTo: ['student-matrix'],
    compute(ctx: MetricContext) {
      const students = computeStudentMetrics(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.streakAlert
      );
      const val = computeAbsenceConcentration(students, ctx.thresholds.critical);
      const status =
        val === null ? 'neutral' : val > 30 ? 'warn' : 'ok';

      return {
        value: val,
        unit: '%',
        sub: 'from students <50%',
        status,
        drilldown: { page: 'students', filters: { statusBands: ['bad'] } },
      };
    },
  },
  {
    id: 'activeStreaks',
    label: 'Consecutive Absences',
    description: 'Students missing 3 or more classes in a row',
    appliesTo: ['student-matrix'],
    compute(ctx: MetricContext) {
      const students = computeStudentMetrics(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.streakAlert
      );
      const res = computeActiveStreaks(
        students,
        ctx.manifest.settings.streakAlert || 3
      );
      const status = res.countGte5 > 0 ? 'bad' : res.count > 0 ? 'warn' : 'ok';

      return {
        value: res.count,
        unit: 'count',
        sub: res.countGte5 > 0 ? `${res.countGte5} severe (>= 5 in a row)` : undefined,
        status,
        drilldown: { page: 'students' },
      };
    },
  },
  {
    id: 'medianStudentPct',
    label: 'Middle Attendance (Median)',
    description: 'Middle student attendance score; average shown below',
    appliesTo: ['student-matrix'],
    compute(ctx: MetricContext) {
      const students = computeStudentMetrics(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.streakAlert
      );
      const { median, mean } = computeMedianStudentPct(students);
      const status =
        median === null
          ? 'neutral'
          : median >= ctx.thresholds.atRisk
          ? 'ok'
          : median >= ctx.thresholds.critical
          ? 'warn'
          : 'bad';

      return {
        value: median,
        unit: '%',
        sub: mean !== null ? `average: ${mean.toFixed(1)}%` : undefined,
        status,
        drilldown: { page: 'students' },
      };
    },
  },
  {
    id: 'highAttendees',
    label: 'Top Attendance (>=90%)',
    description: 'Students with 90% or higher attendance',
    appliesTo: ['student-matrix'],
    compute(ctx: MetricContext) {
      const students = computeStudentMetrics(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.streakAlert
      );
      const { gte90, exact100 } = computeHighAttendees(students);

      return {
        value: gte90,
        unit: 'count',
        sub: `${exact100} with 100%`,
        status: 'ok',
        drilldown: { page: 'students' },
      };
    },
  },
  {
    id: 'sectionGap',
    label: 'Section Difference',
    description: 'Difference between highest and lowest section attendance',
    appliesTo: ['student-matrix', '*'],
    compute(ctx: MetricContext) {
      const sections = computeSectionStudentAggregates(
        ctx.records,
        ctx.thresholds,
        ctx.manifest.settings.minSampleSize || 5
      ).filter((s) => s.pct !== null && !s.isSmallSample);

      if (sections.length < 2) {
        return { value: null, unit: 'pts', status: 'neutral' };
      }

      const pcts = sections.map((s) => s.pct!);
      const gap = Math.max(...pcts) - Math.min(...pcts);
      const status = gap > 20 ? 'bad' : gap > 10 ? 'warn' : 'ok';

      return {
        value: gap,
        unit: 'pts',
        status,
        drilldown: { page: 'sections' },
      };
    },
  },
];
