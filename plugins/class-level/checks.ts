import { DataCheck, DataCheckResult } from '@/core/registry';
import { BatchConfig } from '@/core/manifest';
import { ClassRecord } from './schema';

export const classLevelChecks: DataCheck[] = [
  {
    id: 'coe-pending-entries',
    name: 'Pending Class Entries',
    appliesTo: ['class-level'],
    run(_raw: any[], records: ClassRecord[], _batch: BatchConfig): DataCheckResult {
      const pending = records.filter((r) => r.status === 'pending');
      const details = pending.slice(0, 5).map(
        (r) => `${r.date} P${r.period} Sec ${r.section} (pending)`
      );
      if (pending.length > 5) {
        details.push(`...and ${pending.length - 5} more`);
      }

      return {
        id: 'coe-pending-entries',
        name: 'Pending Class Entries',
        severity: pending.length > 5 ? 'error' : pending.length > 0 ? 'warning' : 'info',
        explanation: 'Classes marked as Not Filled or pending submission by trainers.',
        affectedCount: pending.length,
        details,
      };
    },
  },
  {
    id: 'coe-zero-present-anomalies',
    name: 'Zero-Present Anomalies',
    appliesTo: ['class-level'],
    run(_raw: any[], records: ClassRecord[], _batch: BatchConfig): DataCheckResult {
      const anomalies = records.filter(
        (r) => r.status === 'filled' && r.present === 0 && r.total > 0
      );
      const details = anomalies.map(
        (r) => `${r.date} P${r.period} Sec ${r.section}: 0 of ${r.total} present`
      );

      return {
        id: 'coe-zero-present-anomalies',
        name: 'Zero-Present Anomalies',
        severity: anomalies.length > 0 ? 'warning' : 'info',
        explanation: 'Classes where present was marked as 0 despite total class strength being non-zero (possible marking error).',
        affectedCount: anomalies.length,
        details,
      };
    },
  },
  {
    id: 'coe-sum-mismatch',
    name: 'Attendance Total Sum Consistency',
    appliesTo: ['class-level'],
    run(raw: any[], _records: ClassRecord[], _batch: BatchConfig): DataCheckResult {
      const mismatches: string[] = [];
      for (let i = 0; i < raw.length; i++) {
        const r = raw[i];
        if (r.Status === 'Filled' || r.Status === 'filled') {
          const p = Number(r.Present) || 0;
          const a = Number(r.Absent) || 0;
          const l = Number(r.Leave) || 0;
          const totalMarked = Number(r['Total Marked']) || 0;
          if (totalMarked > 0 && p + a + l !== totalMarked) {
            mismatches.push(
              `Row ${i + 1} (${r.Date} P${r.Period} Sec ${r.Section}): Marked ${totalMarked} != P(${p}) + A(${a}) + L(${l})`
            );
          }
        }
      }

      return {
        id: 'coe-sum-mismatch',
        name: 'Attendance Total Sum Consistency',
        severity: mismatches.length > 0 ? 'error' : 'info',
        explanation: 'Verifies whether Total Marked equals Present + Absent + Leave.',
        affectedCount: mismatches.length,
        details: mismatches.slice(0, 5),
      };
    },
  },
  {
    id: 'coe-section-strength-variance',
    name: 'Section Strength Variance',
    appliesTo: ['class-level'],
    run(_raw: any[], records: ClassRecord[], _batch: BatchConfig): DataCheckResult {
      const sectionTotals = new Map<string, Set<number>>();
      for (const r of records.filter((r) => r.status === 'filled')) {
        if (!sectionTotals.has(r.section)) {
          sectionTotals.set(r.section, new Set());
        }
        sectionTotals.get(r.section)!.add(r.total);
      }

      const varying: string[] = [];
      for (const [sec, totals] of sectionTotals.entries()) {
        if (totals.size > 1) {
          varying.push(
            `Section ${sec} total marked ranges: ${Array.from(totals).join(', ')}`
          );
        }
      }

      return {
        id: 'coe-section-strength-variance',
        name: 'Section Strength Variance',
        severity: varying.length > 0 ? 'warning' : 'info',
        explanation: 'Identifies sections where total class strength fluctuates between sessions.',
        affectedCount: varying.length,
        details: varying,
      };
    },
  },
];
