import { BatchConfig, ProgramConfig } from '@/core/manifest';
import { MatrixRawRow, StudentSession } from './schema';

export function adaptMatrixRaw(
  rawRows: MatrixRawRow[],
  batch: BatchConfig,
  program: ProgramConfig
): { records: StudentSession[]; dedupeCount: number } {
  let rows = [...rawRows];

  // 1. Apply `where` filter
  if (batch.where && Object.keys(batch.where).length > 0) {
    rows = rows.filter((r) => {
      for (const [key, val] of Object.entries(batch.where!)) {
        if ((r as any)[key] !== val) return false;
      }
      return true;
    });
  }

  // 2. Apply fieldMap if provided
  if (batch.fieldMap && Object.keys(batch.fieldMap).length > 0) {
    rows = rows.map((r) => {
      const mapped: any = { ...r };
      for (const [origKey, newKey] of Object.entries(batch.fieldMap!)) {
        if (origKey in r) {
          mapped[newKey] = (r as any)[origKey];
        }
      }
      return mapped;
    });
  }

  // 3. Date range filter
  if (batch.startDate) {
    rows = rows.filter((r) => r.date >= batch.startDate!);
  }
  if (batch.endDate) {
    rows = rows.filter((r) => r.date <= batch.endDate!);
  }

  // 4. Deduplicate exact duplicate rows: same batch + student (roll_no) + date
  const seenKeys = new Set<string>();
  let dedupeCount = 0;
  const records: StudentSession[] = [];

  for (const r of rows) {
    const rollNo = (r.roll_no || '').trim();
    const name = (r.name || '').trim();
    const studentId = rollNo || name;
    const date = (r.date || '').trim();
    const dedupeKey = `${batch.id}_${studentId}_${date}`;

    if (seenKeys.has(dedupeKey)) {
      dedupeCount++;
      continue;
    }
    seenKeys.add(dedupeKey);

    records.push({
      programId: program.id,
      batchId: batch.id,
      studentId,
      rollNo,
      name,
      section: (r.section || '').trim().toUpperCase(),
      date,
      status: r.status,
    });
  }

  return { records, dedupeCount };
}
