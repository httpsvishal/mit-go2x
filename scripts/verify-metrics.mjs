import fs from 'fs';
import path from 'path';
import assert from 'assert';

function parseJsonWithNan(text) {
  const sanitized = text.replace(/:\s*NaN\b/g, ': null');
  return JSON.parse(sanitized);
}

const fixtureDir = path.join(process.cwd(), 'tests/fixtures');
const coe2Raw = parseJsonWithNan(fs.readFileSync(path.join(fixtureDir, 'coe/coe-2y/class_level.json'), 'utf8'));
const coe3Raw = parseJsonWithNan(fs.readFileSync(path.join(fixtureDir, 'coe/coe-3y/class_level.json'), 'utf8'));
const s30Raw = parseJsonWithNan(fs.readFileSync(path.join(fixtureDir, 'super30/student_session_long.json'), 'utf8'));

// 1. Adapter logic for COE
function adaptCoeRaw(rawRows, batch, program) {
  const records = [];
  let dedupeCount = 0;
  const seenKeys = new Set();

  for (const r of rawRows) {
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

function computeCompleteness(records) {
  if (records.length === 0) return null;
  const filled = records.filter((r) => r.status === 'filled').length;
  return (filled / records.length) * 100;
}

function computeCoeOverall(records) {
  const filled = records.filter((r) => r.status === 'filled');
  if (filled.length === 0) return null;
  const pres = filled.reduce((a, b) => a + b.present, 0);
  const tot = filled.reduce((a, b) => a + b.total, 0);
  return tot > 0 ? (pres / tot) * 100 : null;
}

function computeCoeSections(records) {
  const sections = Array.from(new Set(records.map((r) => r.section))).sort();
  return sections.map((sec) => {
    const secRecords = records.filter((r) => r.section === sec);
    const filledRecords = secRecords.filter((r) => r.status === 'filled');
    const pres = filledRecords.reduce((a, b) => a + b.present, 0);
    const tot = filledRecords.reduce((a, b) => a + b.total, 0);
    return {
      section: sec,
      pct: tot > 0 ? (pres / tot) * 100 : null,
    };
  });
}

function computeCoePeriods(records) {
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];
  return periods.map((period) => {
    const pRecords = records.filter((r) => r.period === period);
    const filledRecords = pRecords.filter((r) => r.status === 'filled');
    const pres = filledRecords.reduce((a, b) => a + b.present, 0);
    const tot = filledRecords.reduce((a, b) => a + b.total, 0);
    return {
      period,
      pct: tot > 0 ? (pres / tot) * 100 : null,
    };
  });
}

function computeZeroPresentAnomalies(records) {
  return records.filter((r) => r.status === 'filled' && r.present === 0 && r.total > 0);
}

function computeTrend5v5(records) {
  const filled = records.filter((r) => r.status === 'filled');
  if (filled.length === 0) return null;
  const sessionDates = Array.from(new Set(filled.map((r) => r.date))).sort();
  if (sessionDates.length < 2) return null;
  const last5Dates = sessionDates.slice(-5);
  const prev5Dates = sessionDates.slice(Math.max(0, sessionDates.length - 10), sessionDates.length - 5);
  if (prev5Dates.length === 0) return null;
  const last5Records = filled.filter((r) => last5Dates.includes(r.date));
  const prev5Records = filled.filter((r) => prev5Dates.includes(r.date));
  const last5Pct = computeCoeOverall(last5Records);
  const prev5Pct = computeCoeOverall(prev5Records);
  if (last5Pct === null || prev5Pct === null) return null;
  return last5Pct - prev5Pct;
}

const mockProg = { id: 'coe', label: 'COE', type: 'class-level' };

// Test coe-2y
console.log('Testing COE-2Y reproduction...');
const { records: rec2 } = adaptCoeRaw(coe2Raw, { id: 'coe-2y', label: 'COE 2y', files: {} }, mockProg);
assert.strictEqual(rec2.length, 48);
const filled2 = rec2.filter((r) => r.status === 'filled');
assert.strictEqual(filled2.length, 47);
assert.strictEqual(rec2.filter((r) => r.status === 'pending').length, 1);
assert.strictEqual(computeCompleteness(rec2)?.toFixed(1), '97.9');
assert.strictEqual(filled2.reduce((a, b) => a + b.present, 0), 1344);
assert.strictEqual(filled2.reduce((a, b) => a + b.total, 0), 2758);
assert.strictEqual(computeCoeOverall(rec2)?.toFixed(1), '48.7');

const secMap2 = Object.fromEntries(computeCoeSections(rec2).map((s) => [s.section, s.pct?.toFixed(1)]));
assert.deepStrictEqual(secMap2, {
  A: '51.0',
  B: '38.9',
  C: '46.1',
  D: '52.8',
  I: '50.8',
  J: '55.0',
});

const perMap2 = Object.fromEntries(computeCoePeriods(rec2).filter((p) => p.pct !== null).map((p) => [p.period, p.pct?.toFixed(1)]));
assert.strictEqual(perMap2[1], '60.0');
assert.strictEqual(perMap2[3], '63.1');
assert.strictEqual(perMap2[6], '43.0');
assert.strictEqual(perMap2[7], '21.6');
assert.strictEqual(perMap2[8], '38.5');

const anom2 = computeZeroPresentAnomalies(rec2);
assert.strictEqual(anom2.length, 1);
assert.strictEqual(anom2[0].date, '2026-10-07');
assert.strictEqual(anom2[0].period, 1);
assert.strictEqual(anom2[0].section, 'C');
assert.strictEqual(anom2[0].present, 0);
assert.strictEqual(anom2[0].total, 60);

const delta2 = computeTrend5v5(rec2);
assert.strictEqual(delta2?.toFixed(1), '3.8');

console.log('✓ COE-2Y tests PASSED.');

// Test coe-3y
console.log('Testing COE-3Y reproduction...');
const { records: rec3 } = adaptCoeRaw(coe3Raw, { id: 'coe-3y', label: 'COE 3y', files: {} }, mockProg);
assert.strictEqual(rec3.length, 49);
const filled3 = rec3.filter((r) => r.status === 'filled');
assert.strictEqual(filled3.length, 49);
assert.strictEqual(rec3.filter((r) => r.status === 'pending').length, 0);
assert.strictEqual(computeCompleteness(rec3)?.toFixed(1), '100.0');
assert.strictEqual(filled3.reduce((a, b) => a + b.present, 0), 1035);
assert.strictEqual(filled3.reduce((a, b) => a + b.total, 0), 2758);
assert.strictEqual(computeCoeOverall(rec3)?.toFixed(1), '37.5');

const secMap3 = Object.fromEntries(computeCoeSections(rec3).map((s) => [s.section, s.pct?.toFixed(1)]));
assert.deepStrictEqual(secMap3, {
  A: '33.2',
  B: '45.6',
  C: '47.4',
  D: '38.9',
  I: '28.9',
  J: '25.7',
});

const perMap3 = Object.fromEntries(computeCoePeriods(rec3).filter((p) => p.pct !== null).map((p) => [p.period, p.pct?.toFixed(1)]));
assert.strictEqual(perMap3[1], '39.6');
assert.strictEqual(perMap3[3], '53.6');
assert.strictEqual(perMap3[6], '33.2');
assert.strictEqual(perMap3[7], '20.9');
assert.strictEqual(perMap3[8], '21.0');

const anom3 = computeZeroPresentAnomalies(rec3);
assert.strictEqual(anom3.length, 2);
assert.strictEqual(anom3[0].date, '2026-10-27');
assert.strictEqual(anom3[0].period, 7);
assert.strictEqual(anom3[0].section, 'D');
assert.strictEqual(anom3[0].present, 0);
assert.strictEqual(anom3[0].total, 61);

assert.strictEqual(anom3[1].date, '2026-10-29');
assert.strictEqual(anom3[1].period, 8);
assert.strictEqual(anom3[1].section, 'A');
assert.strictEqual(anom3[1].present, 0);
assert.strictEqual(anom3[1].total, 61);

const delta3 = computeTrend5v5(rec3);
assert.strictEqual(delta3?.toFixed(1), '-9.6');

console.log('✓ COE-3Y tests PASSED.');

// 2. Super 30 verification
console.log('Testing Super 30 reproduction...');
const s30Eligible = s30Raw.filter((r) => r.status === 'present' || r.status === 'absent');
assert.strictEqual(s30Eligible.length, 1829);
const s30Present = s30Raw.filter((r) => r.status === 'present');
assert.strictEqual(s30Present.length, 1272);
assert.strictEqual(((s30Present.length / s30Eligible.length) * 100).toFixed(1), '69.5');
console.log('✓ Super 30 pooled tests PASSED.');

console.log('\nAll metric verifications passed with 100% accuracy!');
