import { BatchConfig, ProgramConfig } from '@/core/manifest';
import { CoeRawRow, ClassRecord } from './schema';

export function adaptCoeRaw(
  rawRows: CoeRawRow[],
  batch: BatchConfig,
  program: ProgramConfig
): { records: ClassRecord[]; dedupeCount: number } {
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
    rows = rows.filter((r) => r.Date >= batch.startDate!);
  }
  if (batch.endDate) {
    rows = rows.filter((r) => r.Date <= batch.endDate!);
  }

  // 4. Deduplicate exact duplicate rows: batch + date + period + section
  const seenKeys = new Set<string>();
  let dedupeCount = 0;
  const records: ClassRecord[] = [];

  for (const r of rows) {
    const section = (r.Section || '').trim().toUpperCase();
    const date = (r.Date || '').trim();
    const period = Number(r.Period);
    const dedupeKey = `${batch.id}_${date}_${period}_${section}`;

    if (seenKeys.has(dedupeKey)) {
      dedupeCount++;
      continue;
    }
    seenKeys.add(dedupeKey);

    const isFilled = (r.Status || '').toLowerCase() === 'filled';
    const present = Number(r.Present) || 0;
    const absent = Number(r.Absent) || 0;
    const leave = Number(r.Leave) || 0;
    const totalMarked = Number(r['Total Marked']) || 0;
    const total = isFilled ? (totalMarked > 0 ? totalMarked : present + absent + leave) : 0;
    const pct = isFilled && total > 0 ? (present / total) * 100 : null;

    records.push({
      programId: program.id,
      batchId: batch.id,
      date,
      weekday: r.Weekday || '',
      period,
      section,
      status: isFilled ? 'filled' : 'pending',
      present: isFilled ? present : 0,
      absent: isFilled ? absent : 0,
      leave: isFilled ? leave : 0,
      total,
      pct,
      paperCode: r['Paper Code'] || '',
      staff: r['Staff Name'] || '',
    });
  }

  return { records, dedupeCount };
}
