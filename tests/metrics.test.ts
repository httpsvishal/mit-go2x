import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseJsonWithNan } from '../core/manifest';
import { adaptCoeRaw } from '../plugins/class-level/adapter';
import { adaptMatrixRaw } from '../plugins/student-matrix/adapter';
import {
  computeOverallPct as computeCoeOverall,
  computeCompleteness,
  computeSectionAggregates as computeCoeSections,
  computePeriodAggregates as computeCoePeriods,
  computeZeroPresentAnomalies,
} from '../plugins/class-level/metrics';
import {
  computeOverallPct as computeS30Overall,
  computeStudentMetrics,
  computeStudentsBelowTarget,
  computeCriticalStudents,
  computeAbsenceConcentration,
  computeActiveStreaks,
  computeMedianStudentPct,
  computeHighAttendees,
  computeStudentHistogram,
  computeStudentMovement,
  computeSectionStudentAggregates,
} from '../plugins/student-matrix/metrics';
import { initPlugins } from '../plugins';
import { registry } from '../core/registry';

describe('Section 13: Reference Numbers Reproduction', () => {
  let coe2Raw: any[];
  let coe3Raw: any[];
  let s30Raw: any[];

  beforeAll(() => {
    const fixtureDir = path.join(process.cwd(), 'tests/fixtures');
    coe2Raw = parseJsonWithNan(
      fs.readFileSync(path.join(fixtureDir, 'coe/coe-2y/class_level.json'), 'utf8')
    );
    coe3Raw = parseJsonWithNan(
      fs.readFileSync(path.join(fixtureDir, 'coe/coe-3y/class_level.json'), 'utf8')
    );
    s30Raw = parseJsonWithNan(
      fs.readFileSync(path.join(fixtureDir, 'super30/student_session_long.json'), 'utf8')
    );
  });

  describe('Super 30 Reference Numbers', () => {
    const mockProg = { id: 'super30', label: 'Super 30', type: 'student-matrix' } as any;

    it('reproduces pooled totals across all three batches: 94 students, 1829 eligible, 1272 present, 69.5%', () => {
      const { records } = adaptMatrixRaw(s30Raw, { id: 'all', label: 'All', files: {} } as any, mockProg);

      expect(records.length).toBe(1912);

      const uniqueStudents = new Set(records.map((r) => r.studentId));
      expect(uniqueStudents.size).toBe(94);

      const eligible = records.filter((r) => r.status === 'present' || r.status === 'absent');
      expect(eligible.length).toBe(1829);

      const present = records.filter((r) => r.status === 'present');
      expect(present.length).toBe(1272);

      const overall = computeS30Overall(records);
      expect(overall?.toFixed(1)).toBe('69.5');
    });

    it('reproduces per-batch totals: s30-2y 69.9% (14 students), s30-3y 69.3% (30), s30-4y 69.6% (50)', () => {
      const b2 = adaptMatrixRaw(s30Raw, { id: 's30-2y', label: '2y', where: { year: '2nd Year' }, files: {} } as any, mockProg);
      const b3 = adaptMatrixRaw(s30Raw, { id: 's30-3y', label: '3y', where: { year: '3rd Year' }, files: {} } as any, mockProg);
      const b4 = adaptMatrixRaw(s30Raw, { id: 's30-4y', label: '4y', where: { year: '4th Year' }, files: {} } as any, mockProg);

      expect(new Set(b2.records.map((r) => r.studentId)).size).toBe(14);
      expect(computeS30Overall(b2.records)?.toFixed(1)).toBe('69.9');

      expect(new Set(b3.records.map((r) => r.studentId)).size).toBe(30);
      expect(computeS30Overall(b3.records)?.toFixed(1)).toBe('69.3');

      expect(new Set(b4.records.map((r) => r.studentId)).size).toBe(50);
      expect(computeS30Overall(b4.records)?.toFixed(1)).toBe('69.6');
    });

    it('reproduces section rankings: A 74.6% (10), D 74.2% (20), J 70.6% (12), C 69.0% (18), E 67.4% (2), B 66.6% (26), I 58.0% (6)', () => {
      const { records } = adaptMatrixRaw(s30Raw, { id: 'all', label: 'All', files: {} } as any, mockProg);
      const sections = computeSectionStudentAggregates(records, { atRisk: 75, critical: 50 }, 1);
      const secMap = Object.fromEntries(sections.map((s) => [s.section, { pct: s.pct?.toFixed(1), count: s.studentsCount }]));

      expect(secMap['A']).toEqual({ pct: '74.6', count: 10 });
      expect(secMap['D']).toEqual({ pct: '74.2', count: 20 });
      expect(secMap['J']).toEqual({ pct: '70.6', count: 12 });
      expect(secMap['C']).toEqual({ pct: '69.0', count: 18 });
      expect(secMap['E']).toEqual({ pct: '67.4', count: 2 });
      expect(secMap['B']).toEqual({ pct: '66.6', count: 26 });
      expect(secMap['I']).toEqual({ pct: '58.0', count: 6 });
    });

    it('reproduces risk counts: 55 below 75%, 15 below 50% (2/3/10 in 2y/3y/4y), 33.6% absence concentration', () => {
      const { records } = adaptMatrixRaw(s30Raw, { id: 'all', label: 'All', files: {} } as any, mockProg);
      const students = computeStudentMetrics(records, { atRisk: 75, critical: 50 });

      expect(computeStudentsBelowTarget(students, 75).count).toBe(55);
      expect(computeCriticalStudents(students, 50)).toBe(15);

      const b2 = adaptMatrixRaw(s30Raw, { id: 's30-2y', label: '2y', where: { year: '2nd Year' }, files: {} } as any, mockProg);
      const b3 = adaptMatrixRaw(s30Raw, { id: 's30-3y', label: '3y', where: { year: '3rd Year' }, files: {} } as any, mockProg);
      const b4 = adaptMatrixRaw(s30Raw, { id: 's30-4y', label: '4y', where: { year: '4th Year' }, files: {} } as any, mockProg);

      expect(computeCriticalStudents(computeStudentMetrics(b2.records), 50)).toBe(2);
      expect(computeCriticalStudents(computeStudentMetrics(b3.records), 50)).toBe(3);
      expect(computeCriticalStudents(computeStudentMetrics(b4.records), 50)).toBe(10);

      expect(computeAbsenceConcentration(students, 50)?.toFixed(1)).toBe('33.6');
    });

    it('reproduces median 70.6%, 16 students >= 90% (4 at 100%)', () => {
      const { records } = adaptMatrixRaw(s30Raw, { id: 'all', label: 'All', files: {} } as any, mockProg);
      const students = computeStudentMetrics(records);

      const { median } = computeMedianStudentPct(students);
      expect(median?.toFixed(1)).toBe('70.6');

      const high = computeHighAttendees(students);
      expect(high.gte90).toBe(16);
      expect(high.exact100).toBe(4);
    });

    it('reproduces student histogram: <25: 6, 25-50: 9, 50-75: 40, 75-90: 23, 90-100: 16', () => {
      const { records } = adaptMatrixRaw(s30Raw, { id: 'all', label: 'All', files: {} } as any, mockProg);
      const students = computeStudentMetrics(records);
      const hist = computeStudentHistogram(students);
      const map = Object.fromEntries(hist.map((h) => [h.bin, h.count]));

      expect(map).toEqual({
        '<25': 6,
        '25-50': 9,
        '50-75': 40,
        '75-90': 23,
        '90-100': 16,
      });
    });

    it('reproduces excluded cells: 16 late_joining, 67 no_record', () => {
      expect(s30Raw.filter((r) => r.status === 'late_joining').length).toBe(16);
      expect(s30Raw.filter((r) => r.status === 'no_record').length).toBe(67);
    });

    it('reproduces first 5 vs last 5 sessions per batch', () => {
      function getFirstAndLast5(year: string) {
        const rows = s30Raw.filter((r) => r.year === year);
        const dates = Array.from(new Set(rows.map((r) => r.date))).sort();
        const f5 = dates.slice(0, 5);
        const l5 = dates.slice(-5);

        const fRecs = rows.filter((r) => f5.includes(r.date) && (r.status === 'present' || r.status === 'absent'));
        const fPct = (fRecs.filter((r) => r.status === 'present').length / fRecs.length) * 100;

        const lRecs = rows.filter((r) => l5.includes(r.date) && (r.status === 'present' || r.status === 'absent'));
        const lPct = (lRecs.filter((r) => r.status === 'present').length / lRecs.length) * 100;

        return { fPct: fPct.toFixed(1), lPct: lPct.toFixed(1) };
      }

      expect(getFirstAndLast5('2nd Year')).toEqual({ fPct: '69.5', lPct: '60.0' });
      expect(getFirstAndLast5('3rd Year')).toEqual({ fPct: '62.2', lPct: '70.7' });
      expect(getFirstAndLast5('4th Year')).toEqual({ fPct: '70.2', lPct: '61.6' });
    });

    it('reproduces student movement: 22 declined, 62 stable, 10 improved', () => {
      const { records } = adaptMatrixRaw(s30Raw, { id: 'all', label: 'All', files: {} } as any, mockProg);
      const students = computeStudentMetrics(records);
      const movement = computeStudentMovement(students);

      expect(movement).toEqual({
        declined: 22,
        stable: 62,
        improved: 10,
      });
    });
  });

  describe('COE Reference Numbers', () => {
    const mockProg = { id: 'coe', label: 'COE', type: 'class-level' } as any;

    it('reproduces coe-2y: 48 scheduled, 47 filled, 1 pending (97.9%), 48.7% (1344 of 2758)', () => {
      const { records } = adaptCoeRaw(coe2Raw, { id: 'coe-2y', label: 'COE 2y', files: {} } as any, mockProg);

      expect(records.length).toBe(48);
      const filled = records.filter((r) => r.status === 'filled');
      expect(filled.length).toBe(47);
      expect(records.filter((r) => r.status === 'pending').length).toBe(1);

      expect(computeCompleteness(records)?.toFixed(1)).toBe('97.9');

      const pres = filled.reduce((a, b) => a + b.present, 0);
      const tot = filled.reduce((a, b) => a + b.total, 0);
      expect(pres).toBe(1344);
      expect(tot).toBe(2758);

      expect(computeCoeOverall(records)?.toFixed(1)).toBe('48.7');
    });

    it('reproduces coe-2y sections: J 55.0, D 52.8, A 51.0, I 50.8, C 46.1, B 38.9', () => {
      const { records } = adaptCoeRaw(coe2Raw, { id: 'coe-2y', label: 'COE 2y', files: {} } as any, mockProg);
      const sections = computeCoeSections(records, 1);
      const secMap = Object.fromEntries(sections.map((s) => [s.section, s.pct?.toFixed(1)]));

      expect(secMap).toEqual({
        J: '55.0',
        D: '52.8',
        A: '51.0',
        I: '50.8',
        C: '46.1',
        B: '38.9',
      });
    });

    it('reproduces coe-2y periods: 3 = 63.1, 1 = 60.0, 6 = 43.0, 8 = 38.5, 7 = 21.6', () => {
      const { records } = adaptCoeRaw(coe2Raw, { id: 'coe-2y', label: 'COE 2y', files: {} } as any, mockProg);
      const periods = computeCoePeriods(records).filter((p) => p.pct !== null);
      const perMap = Object.fromEntries(periods.map((p) => [p.period, p.pct?.toFixed(1)]));

      expect(perMap[3]).toBe('63.1');
      expect(perMap[1]).toBe('60.0');
      expect(perMap[6]).toBe('43.0');
      expect(perMap[8]).toBe('38.5');
      expect(perMap[7]).toBe('21.6');
    });

    it('reproduces coe-2y zero-present anomaly: 07 Oct, Period 1, Section C, 0 of 60', () => {
      const { records } = adaptCoeRaw(coe2Raw, { id: 'coe-2y', label: 'COE 2y', files: {} } as any, mockProg);
      const anomalies = computeZeroPresentAnomalies(records);

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].date).toBe('2026-10-07');
      expect(anomalies[0].period).toBe(1);
      expect(anomalies[0].section).toBe('C');
      expect(anomalies[0].present).toBe(0);
      expect(anomalies[0].total).toBe(60);
    });

    it('reproduces coe-3y: 49 scheduled, 49 filled, 0 pending (100.0%), 37.5% (1035 of 2758)', () => {
      const { records } = adaptCoeRaw(coe3Raw, { id: 'coe-3y', label: 'COE 3y', files: {} } as any, mockProg);

      expect(records.length).toBe(49);
      const filled = records.filter((r) => r.status === 'filled');
      expect(filled.length).toBe(49);
      expect(records.filter((r) => r.status === 'pending').length).toBe(0);

      expect(computeCompleteness(records)?.toFixed(1)).toBe('100.0');

      const pres = filled.reduce((a, b) => a + b.present, 0);
      const tot = filled.reduce((a, b) => a + b.total, 0);
      expect(pres).toBe(1035);
      expect(tot).toBe(2758);

      expect(computeCoeOverall(records)?.toFixed(1)).toBe('37.5');
    });

    it('reproduces coe-3y sections: C 47.4, B 45.6, D 38.9, A 33.2, I 28.9, J 25.7', () => {
      const { records } = adaptCoeRaw(coe3Raw, { id: 'coe-3y', label: 'COE 3y', files: {} } as any, mockProg);
      const sections = computeCoeSections(records, 1);
      const secMap = Object.fromEntries(sections.map((s) => [s.section, s.pct?.toFixed(1)]));

      expect(secMap).toEqual({
        C: '47.4',
        B: '45.6',
        D: '38.9',
        A: '33.2',
        I: '28.9',
        J: '25.7',
      });
    });

    it('reproduces coe-3y periods: 3 = 53.6, 1 = 39.6, 6 = 33.2, 8 = 21.0, 7 = 20.9', () => {
      const { records } = adaptCoeRaw(coe3Raw, { id: 'coe-3y', label: 'COE 3y', files: {} } as any, mockProg);
      const periods = computeCoePeriods(records).filter((p) => p.pct !== null);
      const perMap = Object.fromEntries(periods.map((p) => [p.period, p.pct?.toFixed(1)]));

      expect(perMap[3]).toBe('53.6');
      expect(perMap[1]).toBe('39.6');
      expect(perMap[6]).toBe('33.2');
      expect(perMap[8]).toBe('21.0');
      expect(perMap[7]).toBe('20.9');
    });

    it('reproduces coe-3y zero-present anomalies: 27 Oct P7 Sec D and 29 Oct P8 Sec A', () => {
      const { records } = adaptCoeRaw(coe3Raw, { id: 'coe-3y', label: 'COE 3y', files: {} } as any, mockProg);
      const anomalies = computeZeroPresentAnomalies(records);

      expect(anomalies.length).toBe(2);
      expect(anomalies[0].date).toBe('2026-10-27');
      expect(anomalies[0].period).toBe(7);
      expect(anomalies[0].section).toBe('D');
      expect(anomalies[0].present).toBe(0);
      expect(anomalies[0].total).toBe(61);

      expect(anomalies[1].date).toBe('2026-10-29');
      expect(anomalies[1].period).toBe(8);
      expect(anomalies[1].section).toBe('A');
      expect(anomalies[1].present).toBe(0);
      expect(anomalies[1].total).toBe(61);
    });

    it('verifies registry KPI definitions compute overallPct and trend5v5 correctly for COE without returning null', () => {
      initPlugins();
      const { records: coe2Records } = adaptCoeRaw(coe2Raw, { id: 'coe-2y', label: 'COE 2y', files: {} } as any, mockProg);
      const { records: coe3Records } = adaptCoeRaw(coe3Raw, { id: 'coe-3y', label: 'COE 3y', files: {} } as any, mockProg);

      const ctx2: any = {
        records: coe2Records,
        batch: { id: 'coe-2y', label: 'COE 2nd Year', status: 'active', order: 1, files: {} },
        program: { id: 'coe', label: 'COE', type: 'class-level', batches: [] },
        thresholds: { atRisk: 75, critical: 50 },
        filters: { sections: [], dateRange: { preset: 'all' }, statusBands: [] },
      };

      const ctx3: any = {
        records: coe3Records,
        batch: { id: 'coe-3y', label: 'COE 3rd Year', status: 'active', order: 2, files: {} },
        program: { id: 'coe', label: 'COE', type: 'class-level', batches: [] },
        thresholds: { atRisk: 75, critical: 50 },
        filters: { sections: [], dateRange: { preset: 'all' }, statusBands: [] },
      };

      const kpiOverall = registry.getKpi('overallPct', 'class-level');
      expect(kpiOverall).toBeDefined();
      const res2 = kpiOverall!.compute(ctx2);
      expect(res2.value?.toFixed(1)).toBe('48.7');
      expect(res2.delta).not.toBeNull();
      expect(res2.delta?.toFixed(1)).toBe('3.8');

      const res3 = kpiOverall!.compute(ctx3);
      expect(res3.value?.toFixed(1)).toBe('37.5');
      expect(res3.delta).not.toBeNull();
      expect(res3.delta?.toFixed(1)).toBe('-9.6');

      const kpiTrend = registry.getKpi('trend5v5', 'class-level');
      expect(kpiTrend).toBeDefined();
      const trendRes2 = kpiTrend!.compute(ctx2);
      expect(trendRes2.value?.toFixed(1)).toBe('3.8');
      const trendRes3 = kpiTrend!.compute(ctx3);
      expect(trendRes3.value?.toFixed(1)).toBe('-9.6');

      // Test completeness KPI returns Total Classes Conducted
      const kpiCompleteness = registry.getKpi('completeness', 'class-level');
      expect(kpiCompleteness).toBeDefined();
      expect(kpiCompleteness!.label).toBe('Total Classes Conducted');
      const compRes3 = kpiCompleteness!.compute(ctx3);
      expect(compRes3.value).toBe(49);
      expect(compRes3.unit).toBe('count');
      expect(compRes3.sub).toBe('100.0% of 49 scheduled');

      // Test fallback/generic lookup also works polymorphically
      const genericOverall = registry.getKpi('overallPct');
      expect(genericOverall!.compute(ctx2).value?.toFixed(1)).toBe('48.7');
      expect(genericOverall!.compute(ctx3).value?.toFixed(1)).toBe('37.5');
    });
  });

  describe('COE 3rd Year Assessment Results & Insights', () => {
    it('verifies assessment test summary data and insights integrity', () => {
      const summaryData = JSON.parse(
        fs.readFileSync('public/data/coe/coe-3y/test_summary.json', 'utf-8')
      );

      expect(summaryData.summary).toBeDefined();
      expect(summaryData.summary.totalSubmissions).toBe(314);
      expect(summaryData.summary.uniqueStudents).toBe(300);
      expect(summaryData.summary.avgScore).toBe(35.0);
      expect(summaryData.summary.avgPercentage).toBe(40.5);
      expect(summaryData.summary.maxScore).toBe(90.0);

      // Subject mastery verification
      expect(summaryData.summary.subjects.html.avgPct).toBe(43.2);
      expect(summaryData.summary.subjects.css.avgPct).toBe(40.1);
      expect(summaryData.summary.subjects.javascript.avgPct).toBe(33.2);

      // Slot 1 vs Slot 2
      expect(summaryData.summary.slots.slot1.count).toBe(150);
      expect(summaryData.summary.slots.slot2.count).toBe(164);
      expect(summaryData.summary.slots.slot2.avgPct).toBeGreaterThan(summaryData.summary.slots.slot1.avgPct);

      // Distinction students (score >= 90%)
      const topCount = summaryData.summary.gradeDistribution.find((g: any) => g.band.includes('≥90%'))?.count;
      expect(topCount).toBe(27);

      // Remedial count (score < 50%)
      const totalLt50 = summaryData.summary.slots.slot1.lt50 + summaryData.summary.slots.slot2.lt50;
      expect(totalLt50).toBe(183);
    });
  });
});

