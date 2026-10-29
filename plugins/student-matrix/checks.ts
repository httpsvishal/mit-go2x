import { DataCheck, DataCheckResult } from '@/core/registry';
import { BatchConfig } from '@/core/manifest';
import { StudentSession } from './schema';
import { computeStudentMetrics, computeSessionTurnout } from './metrics';

export const studentMatrixChecks: DataCheck[] = [
  {
    id: 's30-small-sections',
    name: 'Small Sample Sections',
    appliesTo: ['student-matrix'],
    run(_raw: any[], records: StudentSession[], batch: BatchConfig): DataCheckResult {
      const minSample = batch.meta?.minSampleSize || 5;
      const sectionStudents = new Map<string, Set<string>>();

      for (const r of records) {
        if (!sectionStudents.has(r.section)) {
          sectionStudents.set(r.section, new Set());
        }
        sectionStudents.get(r.section)!.add(r.studentId);
      }

      const smallSections: string[] = [];
      for (const [sec, students] of sectionStudents.entries()) {
        if (students.size < minSample) {
          smallSections.push(`Section ${sec} has only ${students.size} student(s) (threshold: ${minSample})`);
        }
      }

      return {
        id: 's30-small-sections',
        name: 'Small Sample Sections',
        severity: smallSections.length > 0 ? 'warning' : 'info',
        explanation: `Sections with fewer than ${minSample} students. Excluded from best/worst league rankings to avoid skew.`,
        affectedCount: smallSections.length,
        details: smallSections,
      };
    },
  },
  {
    id: 's30-late-joining-cells',
    name: 'Late-Joining Exclusions',
    appliesTo: ['student-matrix'],
    run(_raw: any[], records: StudentSession[], _batch: BatchConfig): DataCheckResult {
      const lateRecs = records.filter((r) => r.status === 'late_joining');
      const uniqueStudents = new Set(lateRecs.map((r) => r.studentId));

      return {
        id: 's30-late-joining-cells',
        name: 'Late-Joining Exclusions',
        severity: 'info',
        explanation: 'Late-joining cells are excluded from the denominator. Note: original sheets counted them as missed sessions, so sheet overall % may be lower.',
        affectedCount: lateRecs.length,
        details: [
          `${lateRecs.length} session records across ${uniqueStudents.size} student(s) marked as late_joining.`,
        ],
      };
    },
  },
  {
    id: 's30-low-turnout-sessions',
    name: 'Low Attendance Days',
    appliesTo: ['student-matrix'],
    run(_raw: any[], records: StudentSession[], batch: BatchConfig): DataCheckResult {
      const threshold = batch.thresholds?.critical || 50;
      const turnouts = computeSessionTurnout(records, threshold);
      const low = turnouts.filter((t) => t.isLowTurnout);

      const details = low.map(
        (t) => `Session #${t.sessionNumber} (${t.date}): attendance ${t.pct?.toFixed(1) || '0.0'}% (${t.present}/${t.eligible})`
      );

      return {
        id: 's30-low-turnout-sessions',
        name: 'Low Attendance Days',
        severity: low.length > 0 ? 'warning' : 'info',
        explanation: `Days where batch attendance dropped below ${threshold}%.`,
        affectedCount: low.length,
        details,
      };
    },
  },
  {
    id: 's30-zero-eligible-students',
    name: 'Students with No Eligible Sessions',
    appliesTo: ['student-matrix'],
    run(_raw: any[], records: StudentSession[], batch: BatchConfig): DataCheckResult {
      const students = computeStudentMetrics(records, batch.thresholds);
      const zeroEligible = students.filter((s) => s.eligible === 0);

      return {
        id: 's30-zero-eligible-students',
        name: 'Students with No Eligible Sessions',
        severity: zeroEligible.length > 0 ? 'warning' : 'info',
        explanation: 'Enrolled students who have 0 present and 0 absent records (all late_joining or no_record).',
        affectedCount: zeroEligible.length,
        details: zeroEligible.map((s) => `${s.rollNo} (${s.name}) - Section ${s.section}`),
      };
    },
  },
];
