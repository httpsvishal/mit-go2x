import fs from 'fs';
import path from 'path';

function parseJsonWithNan(text) {
  const sanitized = text.replace(/:\s*NaN\b/g, ': null');
  return JSON.parse(sanitized);
}

const manifestPath = path.join(process.cwd(), 'public/data/manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`Error: manifest file not found at ${manifestPath}`);
  process.exit(1);
}

const manifest = parseJsonWithNan(fs.readFileSync(manifestPath, 'utf8'));
console.log(`Manifest loaded: Schema v${manifest.schemaVersion}, Generated: ${manifest.generatedAt || 'N/A'}`);

let hasErrors = false;

for (const program of manifest.programs) {
  console.log(`\n========================================`);
  console.log(`Program: ${program.label} (${program.id}) - Type: ${program.type}`);
  console.log(`========================================`);

  for (const batch of program.batches) {
    console.log(`\n--- Batch: ${batch.label} (${batch.id}) ---`);
    const fileRole = Object.keys(batch.files || {})[0];
    const relPath = batch.files[fileRole];
    if (!relPath) {
      console.error(`  [ERROR] No file defined for batch ${batch.id}`);
      hasErrors = true;
      continue;
    }

    const filePath = path.join(process.cwd(), 'public/data', relPath);
    if (!fs.existsSync(filePath)) {
      console.error(`  [ERROR] File missing at ${filePath}`);
      hasErrors = true;
      continue;
    }

    let rows;
    try {
      rows = parseJsonWithNan(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`  [ERROR] Failed to parse JSON: ${e.message}`);
      hasErrors = true;
      continue;
    }

    if (!Array.isArray(rows)) {
      console.error(`  [ERROR] Expected an array of rows, got ${typeof rows}`);
      hasErrors = true;
      continue;
    }

    // Apply where filter if present
    let filteredRows = rows;
    if (batch.where) {
      filteredRows = rows.filter((r) => {
        for (const [k, v] of Object.entries(batch.where)) {
          if (r[k] !== v) return false;
        }
        return true;
      });
    }

    const dates = filteredRows.map((r) => r.Date || r.date).filter(Boolean).sort();
    const minDate = dates[0] || 'N/A';
    const maxDate = dates[dates.length - 1] || 'N/A';
    const sections = Array.from(new Set(filteredRows.map((r) => r.Section || r.section).filter(Boolean))).sort();

    console.log(`  Raw rows: ${rows.length} | Matched batch rows: ${filteredRows.length}`);
    console.log(`  Date range: ${minDate} -> ${maxDate}`);
    console.log(`  Sections (${sections.length}): ${sections.join(', ')}`);

    // Basic consistency checks
    if (program.type === 'class-level') {
      let pendingCount = 0;
      let filledCount = 0;
      let sumMismatches = 0;
      for (const r of filteredRows) {
        const isFilled = (r.Status || '').toLowerCase() === 'filled';
        if (isFilled) {
          filledCount++;
          const p = Number(r.Present) || 0;
          const a = Number(r.Absent) || 0;
          const l = Number(r.Leave) || 0;
          const tot = Number(r['Total Marked']) || 0;
          if (tot > 0 && p + a + l !== tot) {
            sumMismatches++;
          }
        } else {
          pendingCount++;
        }
      }
      console.log(`  Filled: ${filledCount} | Pending: ${pendingCount}`);
      if (sumMismatches > 0) {
        console.warn(`  [WARN] ${sumMismatches} rows have Total Marked != Present + Absent + Leave`);
      }
    }
  }
}

console.log('\n========================================');
if (hasErrors) {
  console.error('Validation FAILED with errors.');
  process.exit(1);
} else {
  console.log('All batches and data files validated SUCCESSFULLY.');
  process.exit(0);
}
