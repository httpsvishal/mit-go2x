import { Thresholds } from '@/core/manifest';
import { getStatusBand, StatusBand } from '@/core/colors';
import { StudentSession } from './schema';

export interface StudentMetric {
  studentId: string;
  rollNo: string;
  name: string;
  section: string;
  batchId: string;
  present: number;
  absent: number;
  eligible: number;
  lateJoining: number;
  noRecord: number;
  pct: number | null;
  statusBand: StatusBand;
  currentStreak: number;
  longestStreak: number;
  last10Strip: Array<{ date: string; status: StudentSession['status'] }>;
  firstHalfPct: number | null;
  secondHalfPct: number | null;
  movement: 'improved' | 'declined' | 'stable';
  movementPts: number | null;
}

export interface SectionStudentAggregate {
  section: string;
  studentsCount: number;
  eligible: number;
  present: number;
  absent: number;
  pct: number | null;
  mean: number | null;
  median: number | null;
  lowest: number | null;
  highest: number | null;
  belowTarget: number;
  critical: number;
  isSmallSample: boolean;
  sparkline: number[];
}

export interface SessionTurnout {
  date: string;
  sessionNumber: number;
  eligible: number;
  present: number;
  absent: number;
  pct: number | null;
  isLowTurnout: boolean;
}

export function computeOverallPct(records: StudentSession[]): number | null {
  const eligible = records.filter(
    (r) => r.status === 'present' || r.status === 'absent'
  );
  if (eligible.length === 0) return null;

  const present = eligible.filter((r) => r.status === 'present').length;
  return (present / eligible.length) * 100;
}

export function computeTrend5v5(records: StudentSession[]): number | null {
  const eligible = records.filter(
    (r) => r.status === 'present' || r.status === 'absent'
  );
  if (eligible.length === 0) return null;

  const sessionDates = Array.from(new Set(eligible.map((r) => r.date))).sort();
  if (sessionDates.length < 2) return null;

  const last5Dates = sessionDates.slice(-5);
  const prev5Dates = sessionDates.slice(
    Math.max(0, sessionDates.length - 10),
    sessionDates.length - 5
  );

  if (prev5Dates.length === 0) return null;

  const last5Records = eligible.filter((r) => last5Dates.includes(r.date));
  const prev5Records = eligible.filter((r) => prev5Dates.includes(r.date));

  const last5Pct = computeOverallPct(last5Records);
  const prev5Pct = computeOverallPct(prev5Records);

  if (last5Pct === null || prev5Pct === null) return null;
  return last5Pct - prev5Pct;
}

export function computeStudentMetrics(
  records: StudentSession[],
  thresholds: Thresholds = { atRisk: 75, critical: 50 },
  streakAlert = 3
): StudentMetric[] {
  const studentMap = new Map<string, StudentSession[]>();

  for (const r of records) {
    if (!studentMap.has(r.studentId)) {
      studentMap.set(r.studentId, []);
    }
    studentMap.get(r.studentId)!.push(r);
  }

  const results: StudentMetric[] = [];

  for (const [studentId, recs] of studentMap.entries()) {
    const sorted = [...recs].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];

    let present = 0;
    let absent = 0;
    let lateJoining = 0;
    let noRecord = 0;

    for (const r of sorted) {
      if (r.status === 'present') present++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'late_joining') lateJoining++;
      else if (r.status === 'no_record') noRecord++;
    }

    const eligible = present + absent;
    const pct = eligible > 0 ? (present / eligible) * 100 : null;
    const statusBand = getStatusBand(pct, thresholds);

    // Current streak (trailing absent streak in eligible sessions)
    let currentStreak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const st = sorted[i].status;
      if (st === 'absent') {
        currentStreak++;
      } else if (st === 'present') {
        break;
      }
    }

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    for (const r of sorted) {
      if (r.status === 'absent') {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else if (r.status === 'present') {
        tempStreak = 0;
      }
    }

    // Last 10 sessions strip
    const last10 = sorted.slice(-10).map((r) => ({
      date: r.date,
      status: r.status,
    }));

    // First half vs second half movement
    const eligibleRecs = sorted.filter(
      (r) => r.status === 'present' || r.status === 'absent'
    );
    let firstHalfPct: number | null = null;
    let secondHalfPct: number | null = null;
    let movement: 'improved' | 'declined' | 'stable' = 'stable';
    let movementPts: number | null = null;

    if (eligibleRecs.length >= 2) {
      const half = Math.floor(eligibleRecs.length / 2);
      const h1 = eligibleRecs.slice(0, half);
      const h2 = eligibleRecs.slice(half);

      const h1Pres = h1.filter((r) => r.status === 'present').length;
      const h2Pres = h2.filter((r) => r.status === 'present').length;

      firstHalfPct = h1.length > 0 ? (h1Pres / h1.length) * 100 : null;
      secondHalfPct = h2.length > 0 ? (h2Pres / h2.length) * 100 : null;

      if (firstHalfPct !== null && secondHalfPct !== null) {
        movementPts = secondHalfPct - firstHalfPct;
        if (movementPts > 20) movement = 'improved';
        else if (movementPts < -20) movement = 'declined';
      }
    }

    results.push({
      studentId,
      rollNo: first.rollNo,
      name: first.name,
      section: first.section,
      batchId: first.batchId,
      present,
      absent,
      eligible,
      lateJoining,
      noRecord,
      pct,
      statusBand,
      currentStreak,
      longestStreak,
      last10Strip: last10,
      firstHalfPct,
      secondHalfPct,
      movement,
      movementPts,
    });
  }

  return results;
}

export function computeStudentsBelowTarget(
  students: StudentMetric[],
  atRisk = 75
): { count: number; pct: number | null } {
  if (students.length === 0) return { count: 0, pct: null };
  const below = students.filter((s) => s.pct !== null && s.pct < atRisk);
  const pct = (below.length / students.length) * 100;
  return { count: below.length, pct };
}

export function computeCriticalStudents(
  students: StudentMetric[],
  critical = 50
): number {
  return students.filter((s) => s.pct !== null && s.pct < critical).length;
}

export function computeAbsenceConcentration(
  students: StudentMetric[],
  critical = 50
): number | null {
  const totalAbsences = students.reduce((acc, s) => acc + s.absent, 0);
  if (totalAbsences === 0) return null;

  const criticalAbsences = students
    .filter((s) => s.pct !== null && s.pct < critical)
    .reduce((acc, s) => acc + s.absent, 0);

  return (criticalAbsences / totalAbsences) * 100;
}

export function computeActiveStreaks(
  students: StudentMetric[],
  streakAlert = 3
): { count: number; countGte5: number } {
  const count = students.filter((s) => s.currentStreak >= streakAlert).length;
  const countGte5 = students.filter((s) => s.currentStreak >= 5).length;
  return { count, countGte5 };
}

export function computeMedianStudentPct(students: StudentMetric[]): {
  median: number | null;
  mean: number | null;
} {
  const pcts = students
    .map((s) => s.pct)
    .filter((p): p is number => p !== null)
    .sort((a, b) => a - b);

  if (pcts.length === 0) return { median: null, mean: null };

  const mean = pcts.reduce((a, b) => a + b, 0) / pcts.length;
  const mid = Math.floor(pcts.length / 2);
  const median =
    pcts.length % 2 !== 0 ? pcts[mid] : (pcts[mid - 1] + pcts[mid]) / 2;

  return { median, mean };
}

export function computeHighAttendees(students: StudentMetric[]): {
  gte90: number;
  exact100: number;
} {
  const gte90 = students.filter((s) => s.pct !== null && s.pct >= 90).length;
  const exact100 = students.filter((s) => s.pct !== null && s.pct === 100).length;
  return { gte90, exact100 };
}

export function computeStudentHistogram(students: StudentMetric[]): Array<{
  bin: string;
  label: string;
  count: number;
  status: StatusBand;
}> {
  let bin0_25 = 0;
  let bin25_50 = 0;
  let bin50_75 = 0;
  let bin75_90 = 0;
  let bin90_100 = 0;

  for (const s of students) {
    if (s.pct === null) continue;
    if (s.pct < 25) bin0_25++;
    else if (s.pct < 50) bin25_50++;
    else if (s.pct < 75) bin50_75++;
    else if (s.pct < 90) bin75_90++;
    else bin90_100++;
  }

  return [
    { bin: '<25', label: '<25%', count: bin0_25, status: 'bad' },
    { bin: '25-50', label: '25–50%', count: bin25_50, status: 'bad' },
    { bin: '50-75', label: '50–75%', count: bin50_75, status: 'warn' },
    { bin: '75-90', label: '75–90%', count: bin75_90, status: 'ok' },
    { bin: '90-100', label: '90–100%', count: bin90_100, status: 'ok' },
  ];
}

export function computeSectionStudentAggregates(
  records: StudentSession[],
  thresholds: Thresholds = { atRisk: 75, critical: 50 },
  minSampleSize = 5
): SectionStudentAggregate[] {
  const sections = Array.from(new Set(records.map((r) => r.section))).sort();
  const allStudents = computeStudentMetrics(records, thresholds);

  return sections.map((sec) => {
    const secRecords = records.filter((r) => r.section === sec);
    const secStudents = allStudents.filter((s) => s.section === sec);
    const studentsCount = secStudents.length;

    const eligible = secRecords.filter(
      (r) => r.status === 'present' || r.status === 'absent'
    ).length;
    const present = secRecords.filter((r) => r.status === 'present').length;
    const absent = secRecords.filter((r) => r.status === 'absent').length;
    const pct = eligible > 0 ? (present / eligible) * 100 : null;

    const studentPcts = secStudents
      .map((s) => s.pct)
      .filter((p): p is number => p !== null)
      .sort((a, b) => a - b);

    const lowest = studentPcts.length > 0 ? studentPcts[0] : null;
    const highest = studentPcts.length > 0 ? studentPcts[studentPcts.length - 1] : null;

    let mean: number | null = null;
    let median: number | null = null;

    if (studentPcts.length > 0) {
      mean = studentPcts.reduce((a, b) => a + b, 0) / studentPcts.length;
      const mid = Math.floor(studentPcts.length / 2);
      median =
        studentPcts.length % 2 !== 0
          ? studentPcts[mid]
          : (studentPcts[mid - 1] + studentPcts[mid]) / 2;
    }

    const belowTarget = secStudents.filter(
      (s) => s.pct !== null && s.pct < thresholds.atRisk
    ).length;
    const critical = secStudents.filter(
      (s) => s.pct !== null && s.pct < thresholds.critical
    ).length;

    // Trend sparkline by session date
    const sessionDates = Array.from(
      new Set(secRecords.map((r) => r.date))
    ).sort();
    const sparkline = sessionDates
      .map((d) => {
        const dRecs = secRecords.filter(
          (r) => r.date === d && (r.status === 'present' || r.status === 'absent')
        );
        if (dRecs.length === 0) return null;
        return (dRecs.filter((r) => r.status === 'present').length / dRecs.length) * 100;
      })
      .filter((p): p is number => p !== null);

    return {
      section: sec,
      studentsCount,
      eligible,
      present,
      absent,
      pct,
      mean,
      median,
      lowest,
      highest,
      belowTarget,
      critical,
      isSmallSample: studentsCount < minSampleSize,
      sparkline,
    };
  });
}

export function computeStudentMovement(students: StudentMetric[]): {
  declined: number;
  stable: number;
  improved: number;
} {
  let declined = 0;
  let stable = 0;
  let improved = 0;

  for (const s of students) {
    if (s.movement === 'improved') improved++;
    else if (s.movement === 'declined') declined++;
    else stable++;
  }

  return { declined, stable, improved };
}

export function computeParetoAbsences(students: StudentMetric[]): Array<{
  studentId: string;
  name: string;
  rollNo: string;
  absent: number;
  pct: number | null;
  cumulativePct: number;
}> {
  const sorted = [...students].sort((a, b) => b.absent - a.absent);
  const totalAbsences = sorted.reduce((acc, s) => acc + s.absent, 0);

  let running = 0;
  const results = [];

  for (const s of sorted.slice(0, 25)) {
    running += s.absent;
    const cumulativePct = totalAbsences > 0 ? (running / totalAbsences) * 100 : 0;
    results.push({
      studentId: s.studentId,
      name: s.name,
      rollNo: s.rollNo,
      absent: s.absent,
      pct: s.pct,
      cumulativePct,
    });
  }

  return results;
}

export function computeSessionTurnout(
  records: StudentSession[],
  lowTurnoutThreshold = 50
): SessionTurnout[] {
  const dates = Array.from(new Set(records.map((r) => r.date))).sort();

  return dates.map((date, idx) => {
    const dRecords = records.filter(
      (r) => r.date === date && (r.status === 'present' || r.status === 'absent')
    );
    const eligible = dRecords.length;
    const present = dRecords.filter((r) => r.status === 'present').length;
    const absent = eligible - present;
    const pct = eligible > 0 ? (present / eligible) * 100 : null;

    return {
      date,
      sessionNumber: idx + 1,
      eligible,
      present,
      absent,
      pct,
      isLowTurnout: pct !== null && pct < lowTurnoutThreshold,
    };
  });
}

export function computeWeekdayAggregates(records: StudentSession[]): Array<{
  weekday: string;
  sessions: number;
  eligible: number;
  present: number;
  pct: number | null;
}> {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekdayMap: Record<number, string> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  };

  return weekdays
    .map((weekday) => {
      const wRecords = records.filter((r) => {
        const d = new Date(r.date + 'T00:00:00Z');
        return weekdayMap[d.getUTCDay()] === weekday;
      });

      const eligibleRecords = wRecords.filter(
        (r) => r.status === 'present' || r.status === 'absent'
      );
      const sessions = new Set(wRecords.map((r) => r.date)).size;
      const eligible = eligibleRecords.length;
      const present = eligibleRecords.filter((r) => r.status === 'present').length;
      const pct = eligible > 0 ? (present / eligible) * 100 : null;

      return {
        weekday,
        sessions,
        eligible,
        present,
        pct,
      };
    })
    .filter((w) => w.sessions > 0);
}
