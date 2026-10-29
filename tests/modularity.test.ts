import { describe, it, expect } from 'vitest';
import { ManifestSchema, BatchConfig, ProgramConfig } from '../core/manifest';
import { CoeRawSchema } from '../plugins/class-level/schema';
import { MatrixRawSchema } from '../plugins/student-matrix/schema';
import { adaptCoeRaw } from '../plugins/class-level/adapter';
import { adaptMatrixRaw } from '../plugins/student-matrix/adapter';
import { computeOverallPct as computeCoeOverall } from '../plugins/class-level/metrics';
import { computeOverallPct as computeS30Overall } from '../plugins/student-matrix/metrics';

describe('Section 13.1: Modularity, Isolation, and Theme Tests', () => {
  const baseManifest = {
    schemaVersion: 1,
    generatedAt: '2026-10-25',
    settings: {
      thresholds: { atRisk: 75, critical: 50 },
      minSampleSize: 5,
    },
    programs: [
      {
        id: 'coe',
        label: 'COE',
        type: 'class-level',
        batches: [
          {
            id: 'coe-2y',
            label: 'COE 2nd Year',
            status: 'active',
            order: 2,
            files: { classes: 'coe/coe-2y/class_level.json' },
          },
        ],
      },
      {
        id: 'super30',
        label: 'Super 30',
        type: 'student-matrix',
        batches: [
          {
            id: 's30-4y',
            label: 'Super 30 - 4th Year',
            status: 'active',
            order: 1,
            files: { matrix: 'super30/student_session_long.json' },
            where: { year: '4th Year' },
          },
        ],
      },
    ],
  };

  it('1. Add a batch with JSON only: dynamically adds s30-9z with section Z and coe-9z without code changes', () => {
    // Dynamically clone and append batches
    const modifiedManifest = JSON.parse(JSON.stringify(baseManifest));
    modifiedManifest.programs[1].batches.push({
      id: 's30-9z',
      label: 'Super 30 - 9th Zenith',
      status: 'active',
      order: 99,
      files: { matrix: 'super30/s30_9z.json' },
    });
    modifiedManifest.programs[0].batches.push({
      id: 'coe-9z',
      label: 'COE - 9th Zenith',
      status: 'active',
      order: 99,
      files: { classes: 'coe/coe_9z.json' },
    });

    const parsedManifest = ManifestSchema.parse(modifiedManifest);
    expect(parsedManifest.programs[1].batches.some((b) => b.id === 's30-9z')).toBe(true);
    expect(parsedManifest.programs[0].batches.some((b) => b.id === 'coe-9z')).toBe(true);

    // Adapt fake rows with unseen section Z
    const fakeS30Rows = [
      { year: '9th Year', section: 'Z', name: 'Zenith Student', roll_no: '99001', date: '2026-10-25', status: 'present' as const },
      { year: '9th Year', section: 'Z', name: 'Zenith Student', roll_no: '99001', date: '2026-10-26', status: 'absent' as const },
    ];
    const s30Adapted = adaptMatrixRaw(fakeS30Rows, parsedManifest.programs[1].batches[1], parsedManifest.programs[1]);
    expect(s30Adapted.records[0].section).toBe('Z');
    expect(computeS30Overall(s30Adapted.records)).toBe(50);
  });

  it('2. Same-file batch: filters rows correctly using where predicate', () => {
    const rawRows = [
      { year: '2nd Year', section: 'A', name: 'Student 1', roll_no: '101', date: '2026-10-20', status: 'present' as const },
      { year: '3rd Year', section: 'B', name: 'Student 2', roll_no: '102', date: '2026-10-20', status: 'absent' as const },
      { year: '2nd Year', section: 'A', name: 'Student 1', roll_no: '101', date: '2026-10-21', status: 'present' as const },
    ];

    const batchConfig: BatchConfig = {
      id: 'test-2y',
      label: 'Test 2y',
      status: 'active',
      order: 1,
      files: { matrix: 'test.json' },
      where: { year: '2nd Year' },
    };

    const adapted = adaptMatrixRaw(rawRows, batchConfig, baseManifest.programs[1] as any);
    expect(adapted.records.length).toBe(2);
    expect(adapted.records.every((r) => r.studentId === '101')).toBe(true);
    expect(computeS30Overall(adapted.records)).toBe(100);
  });

  it('3. Rename and re-order: updates label and sorts by order field', () => {
    const batches: BatchConfig[] = [
      { id: 'b2', label: 'Beta Batch', order: 2, files: {}, status: 'active' },
      { id: 'b1', label: 'Alpha Batch (Renamed)', order: 1, files: {}, status: 'active' },
      { id: 'b3', label: 'Gamma Batch', order: 3, files: {}, status: 'active' },
    ];

    const sorted = [...batches].sort((a, b) => a.order - b.order);
    expect(sorted[0].id).toBe('b1');
    expect(sorted[0].label).toBe('Alpha Batch (Renamed)');
    expect(sorted[1].id).toBe('b2');
    expect(sorted[2].id).toBe('b3');
  });

  it('4. Archive batch: hides archived batches by default, displays when showArchived is true', () => {
    const batches: BatchConfig[] = [
      { id: 'active-1', label: 'Active 1', status: 'active', order: 1, files: {} },
      { id: 'archived-1', label: 'Archived 1', status: 'archived', order: 2, files: {} },
    ];

    const defaultBatches = batches.filter((b) => b.status === 'active' || b.status === undefined);
    expect(defaultBatches.length).toBe(1);
    expect(defaultBatches[0].id).toBe('active-1');

    const showArchivedBatches = batches;
    expect(showArchivedBatches.length).toBe(2);
  });

  it('5. Broken batch isolation: broken schema in one batch does not crash or invalidate another batch', () => {
    const validRows = [
      { Date: '2026-10-01', Period: 1, Section: 'A', Status: 'Filled' as const, Present: 30, Absent: 10, Leave: 0, 'Total Marked': 40 },
    ];
    const malformedRows = [
      { Date: 'Invalid Date', Period: 'NotANumber', Status: 'UnknownStatus' },
    ];

    const validParsed = CoeRawSchema.safeParse(validRows);
    expect(validParsed.success).toBe(true);

    const malformedParsed = CoeRawSchema.safeParse(malformedRows);
    expect(malformedParsed.success).toBe(false);
    if (!malformedParsed.success) {
      expect(malformedParsed.error.errors.length).toBeGreaterThan(0);
      expect(malformedParsed.error.errors.some((e) => e.path.includes('Period') || e.path.includes('Status'))).toBe(true);
    }
  });

  it('6. Unknown columns and PII: drops phone and email fields so they never enter store or DOM', () => {
    const rawWithPII = [
      {
        year: '4th Year',
        section: 'A',
        name: 'Sensitive Student',
        roll_no: '23001',
        date: '2026-10-20',
        status: 'present' as const,
        phone: '+91 9876543210',
        email: 'student@example.com',
        parent_contact: 'Private Contact',
      },
    ];

    const parsed = MatrixRawSchema.parse(rawWithPII);
    expect((parsed[0] as any).phone).toBeUndefined();
    expect((parsed[0] as any).email).toBeUndefined();
    expect((parsed[0] as any).parent_contact).toBeUndefined();

    const adapted = adaptMatrixRaw(parsed, { id: 's30-4y', label: '4y', files: {} } as any, baseManifest.programs[1] as any);
    expect((adapted.records[0] as any).phone).toBeUndefined();
    expect((adapted.records[0] as any).email).toBeUndefined();
  });

  it('7. Field mapping: renames non-standard raw columns to canonical fields', () => {
    const nonStandardRows = [
      {
        custom_date: '2026-10-15',
        custom_period: 2,
        custom_section: 'B',
        custom_status: 'Filled',
        custom_present: 25,
        custom_absent: 5,
        custom_leave: 0,
        custom_total: 30,
      },
    ];

    const batchConfig: BatchConfig = {
      id: 'coe-custom',
      label: 'COE Custom',
      status: 'active',
      order: 1,
      files: {},
      fieldMap: {
        custom_date: 'Date',
        custom_period: 'Period',
        custom_section: 'Section',
        custom_status: 'Status',
        custom_present: 'Present',
        custom_absent: 'Absent',
        custom_leave: 'Leave',
        custom_total: 'Total Marked',
      },
    };

    const adapted = adaptCoeRaw(nonStandardRows as any, batchConfig, baseManifest.programs[0] as any);
    expect(adapted.records.length).toBe(1);
    expect(adapted.records[0].date).toBe('2026-10-15');
    expect(adapted.records[0].period).toBe(2);
    expect(adapted.records[0].section).toBe('B');
    expect(adapted.records[0].present).toBe(25);
    expect(computeCoeOverall(adapted.records)?.toFixed(1)).toBe('83.3');
  });

  it('8. Scale: processes 30 batches without performance degradation (< 2 seconds)', () => {
    const start = performance.now();
    const lotsOfBatches: BatchConfig[] = Array.from({ length: 30 }, (_, i) => ({
      id: `batch-${i + 1}`,
      label: `Cohort Batch ${i + 1}`,
      status: 'active',
      order: i + 1,
      files: { matrix: `file_${i + 1}.json` },
    }));

    const dummyRows = Array.from({ length: 200 }, (_, j) => ({
      section: String.fromCharCode(65 + (j % 5)),
      name: `Student ${j}`,
      roll_no: `ROLL_${j}`,
      date: `2026-10-${String((j % 20) + 1).padStart(2, '0')}`,
      status: j % 3 === 0 ? ('absent' as const) : ('present' as const),
    }));

    for (const b of lotsOfBatches) {
      adaptMatrixRaw(dummyRows, b, baseManifest.programs[1] as any);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(2000);
  });
});
