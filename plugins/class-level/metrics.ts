import { ClassRecord } from './schema';

export interface SectionAggregate {
  section: string;
  scheduled: number;
  filled: number;
  pending: number;
  present: number;
  absent: number;
  leave: number;
  total: number;
  pct: number | null;
  mean: number | null;
  median: number | null;
  lowest: number | null;
  highest: number | null;
  classesBelow50: number;
  isSmallSample: boolean;
  sparkline: number[];
}

export interface PeriodAggregate {
  period: number;
  scheduled: number;
  filled: number;
  present: number;
  total: number;
  pct: number | null;
}

export interface WeekdayAggregate {
  weekday: string;
  sessions: number;
  filled: number;
  present: number;
  total: number;
  pct: number | null;
}

export function computeOverallPct(records: ClassRecord[]): number | null {
  const filled = records.filter((r) => r.status === 'filled');
  if (filled.length === 0) return null;

  const totalPresent = filled.reduce((acc, r) => acc + r.present, 0);
  const totalEligible = filled.reduce((acc, r) => acc + r.total, 0);

  if (totalEligible === 0) return null;
  return (totalPresent / totalEligible) * 100;
}

export function computeTrend5v5(records: ClassRecord[]): number | null {
  const filled = records.filter((r) => r.status === 'filled');
  if (filled.length === 0) return null;

  // Group by unique calendar date (session)
  const sessionDates = Array.from(new Set(filled.map((r) => r.date))).sort();
  if (sessionDates.length < 2) return null;

  const last5Dates = sessionDates.slice(-5);
  const prev5Dates = sessionDates.slice(
    Math.max(0, sessionDates.length - 10),
    sessionDates.length - 5
  );

  if (prev5Dates.length === 0) return null;

  const last5Records = filled.filter((r) => last5Dates.includes(r.date));
  const prev5Records = filled.filter((r) => prev5Dates.includes(r.date));

  const last5Pct = computeOverallPct(last5Records);
  const prev5Pct = computeOverallPct(prev5Records);

  if (last5Pct === null || prev5Pct === null) return null;
  return last5Pct - prev5Pct;
}

export function computeClassesBelow50(
  records: ClassRecord[],
  threshold = 50
): { count: number; pct: number | null } {
  const filled = records.filter((r) => r.status === 'filled');
  if (filled.length === 0) return { count: 0, pct: null };

  const below = filled.filter((r) => r.pct !== null && r.pct < threshold);
  const pct = (below.length / filled.length) * 100;
  return { count: below.length, pct };
}

export function computeCompleteness(records: ClassRecord[]): number | null {
  if (records.length === 0) return null;
  const filled = records.filter((r) => r.status === 'filled').length;
  return (filled / records.length) * 100;
}

export function computePendingEntries(records: ClassRecord[]): ClassRecord[] {
  return records.filter((r) => r.status === 'pending');
}

export function computeSectionAggregates(
  records: ClassRecord[],
  minSampleSize = 5
): SectionAggregate[] {
  const sections = Array.from(new Set(records.map((r) => r.section))).sort();

  return sections.map((sec) => {
    const secRecords = records.filter((r) => r.section === sec);
    const scheduled = secRecords.length;
    const filledRecords = secRecords.filter((r) => r.status === 'filled');
    const filled = filledRecords.length;
    const pending = scheduled - filled;

    const present = filledRecords.reduce((acc, r) => acc + r.present, 0);
    const absent = filledRecords.reduce((acc, r) => acc + r.absent, 0);
    const leave = filledRecords.reduce((acc, r) => acc + r.leave, 0);
    const total = filledRecords.reduce((acc, r) => acc + r.total, 0);
    const pct = total > 0 ? (present / total) * 100 : null;

    const classPcts = filledRecords
      .map((r) => r.pct)
      .filter((p): p is number => p !== null)
      .sort((a, b) => a - b);

    const lowest = classPcts.length > 0 ? classPcts[0] : null;
    const highest = classPcts.length > 0 ? classPcts[classPcts.length - 1] : null;

    let mean: number | null = null;
    let median: number | null = null;

    if (classPcts.length > 0) {
      mean = classPcts.reduce((a, b) => a + b, 0) / classPcts.length;
      const mid = Math.floor(classPcts.length / 2);
      median =
        classPcts.length % 2 !== 0
          ? classPcts[mid]
          : (classPcts[mid - 1] + classPcts[mid]) / 2;
    }

    const classesBelow50 = filledRecords.filter(
      (r) => r.pct !== null && r.pct < 50
    ).length;

    // Sparkline sorted by date
    const sortedFilled = [...filledRecords].sort((a, b) => a.date.localeCompare(b.date));
    const sparkline = sortedFilled
      .map((r) => r.pct)
      .filter((p): p is number => p !== null);

    return {
      section: sec,
      scheduled,
      filled,
      pending,
      present,
      absent,
      leave,
      total,
      pct,
      mean,
      median,
      lowest,
      highest,
      classesBelow50,
      isSmallSample: scheduled < minSampleSize,
      sparkline,
    };
  });
}

export function computePeriodAggregates(records: ClassRecord[]): PeriodAggregate[] {
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  return periods.map((period) => {
    const pRecords = records.filter((r) => r.period === period);
    const scheduled = pRecords.length;
    const filledRecords = pRecords.filter((r) => r.status === 'filled');
    const filled = filledRecords.length;

    const present = filledRecords.reduce((acc, r) => acc + r.present, 0);
    const total = filledRecords.reduce((acc, r) => acc + r.total, 0);
    const pct = total > 0 ? (present / total) * 100 : null;

    return {
      period,
      scheduled,
      filled,
      present,
      total,
      pct,
    };
  });
}

export function computePeriodGap(records: ClassRecord[]): number | null {
  const aggregates = computePeriodAggregates(records).filter(
    (a) => a.pct !== null && a.filled > 0
  );
  if (aggregates.length < 2) return null;

  const pcts = aggregates.map((a) => a.pct!);
  const max = Math.max(...pcts);
  const min = Math.min(...pcts);
  return max - min;
}

export function computeSectionGap(
  records: ClassRecord[],
  minSampleSize = 5
): number | null {
  const aggregates = computeSectionAggregates(records, minSampleSize).filter(
    (a) => a.pct !== null && !a.isSmallSample
  );
  if (aggregates.length < 2) return null;

  const pcts = aggregates.map((a) => a.pct!);
  const max = Math.max(...pcts);
  const min = Math.min(...pcts);
  return max - min;
}

export function computeWeekdayAggregates(records: ClassRecord[]): WeekdayAggregate[] {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return weekdays.map((weekday) => {
    const wRecords = records.filter((r) => r.weekday.toLowerCase() === weekday.toLowerCase());
    const sessions = new Set(wRecords.map((r) => r.date)).size;
    const filledRecords = wRecords.filter((r) => r.status === 'filled');
    const filled = filledRecords.length;

    const present = filledRecords.reduce((acc, r) => acc + r.present, 0);
    const total = filledRecords.reduce((acc, r) => acc + r.total, 0);
    const pct = total > 0 ? (present / total) * 100 : null;

    return {
      weekday,
      sessions,
      filled,
      present,
      total,
      pct,
    };
  });
}

export function computeZeroPresentAnomalies(records: ClassRecord[]): ClassRecord[] {
  return records.filter(
    (r) => r.status === 'filled' && r.present === 0 && r.total > 0
  );
}
