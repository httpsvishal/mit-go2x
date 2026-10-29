'use client';

import React from 'react';
import { ProgramConfig, Manifest } from '@/core/manifest';
import { FilterState } from '@/core/filters';
import { BatchScorecardTable } from '@/components/tables/BatchScorecardTable';
import { SectionHeatmap } from '@/components/charts/SectionHeatmap';
import { computeTrend5v5 as computeCoeTrend } from '@/plugins/class-level/metrics';
import { computeTrend5v5 as computeMatrixTrend } from '@/plugins/student-matrix/metrics';

interface CompareViewProps {
  program: ProgramConfig;
  manifest: Manifest;
  batchData: Record<string, any>;
  filters: FilterState;
}

export const CompareView: React.FC<CompareViewProps> = ({
  program,
  manifest,
  batchData,
  filters,
}) => {
  const activeBatches = program.batches.filter(
    (b) => b.status === 'active' || b.status === undefined
  );

  // Compute batch scorecard items
  const scorecardItems = activeBatches.map((b) => {
    const bInfo = batchData[b.id];
    const records = bInfo?.records || [];
    let pres = 0;
    let elig = 0;
    let lastDate = '';
    let sessions = 0;
    let belowTarget = 0;
    let critical = 0;
    let count = 0;
    let completeness = null;

    if (program.type === 'class-level') {
      const filled = records.filter((r: any) => r.status === 'filled');
      filled.forEach((r: any) => {
        pres += r.present;
        elig += r.total;
        if (r.date > lastDate) lastDate = r.date;
        if (r.pct !== null && r.pct < 50) critical++;
      });
      sessions = new Set(records.map((r: any) => r.date)).size;
      count = records.length;
      completeness = count > 0 ? (filled.length / count) * 100 : null;
    } else {
      const eligible = records.filter(
        (r: any) => r.status === 'present' || r.status === 'absent'
      );
      eligible.forEach((r: any) => {
        if (r.status === 'present') pres += 1;
        elig += 1;
        if (r.date > lastDate) lastDate = r.date;
      });
      sessions = new Set(records.map((r: any) => r.date)).size;

      const studentMap = new Map<string, { pres: number; elig: number }>();
      eligible.forEach((r: any) => {
        if (!studentMap.has(r.studentId))
          studentMap.set(r.studentId, { pres: 0, elig: 0 });
        const item = studentMap.get(r.studentId)!;
        if (r.status === 'present') item.pres += 1;
        item.elig += 1;
      });
      count = studentMap.size;
      studentMap.forEach((v) => {
        const p = v.elig > 0 ? (v.pres / v.elig) * 100 : 0;
        if (p < 75) belowTarget++;
        if (p < 50) critical++;
      });
    }

    const overallPct = elig > 0 ? (pres / elig) * 100 : null;
    const batchTrend =
      program.type === 'class-level'
        ? computeCoeTrend(records)
        : computeMatrixTrend(records);

    return {
      batchId: b.id,
      batchLabel: b.label,
      programId: program.id,
      programLabel: program.label,
      count,
      sessions,
      overallPct,
      trend5v5: batchTrend,
      belowTarget,
      critical,
      completeness,
      lastDate,
      healthScore: bInfo?.error ? 50 : 100,
    };
  });

  // Collect Section x Batch Heatmap cells
  const allSections = new Set<string>();
  const heatmapCells: any[] = [];

  activeBatches.forEach((b) => {
    const records = batchData[b.id]?.records || [];
    const secMap = new Map<string, { pres: number; elig: number }>();

    records.forEach((r: any) => {
      allSections.add(r.section);
      if (!secMap.has(r.section)) secMap.set(r.section, { pres: 0, elig: 0 });
      const item = secMap.get(r.section)!;

      if (program.type === 'class-level') {
        if (r.status === 'filled') {
          item.pres += r.present;
          item.elig += r.total;
        }
      } else {
        if (r.status === 'present' || r.status === 'absent') {
          if (r.status === 'present') item.pres += 1;
          item.elig += 1;
        }
      }
    });

    secMap.forEach((v, sec) => {
      heatmapCells.push({
        rowKey: sec,
        colKey: b.id,
        colLabel: b.label,
        pct: v.elig > 0 ? (v.pres / v.elig) * 100 : null,
        count: v.elig,
      });
    });
  });

  const sortedSections = Array.from(allSections).sort();
  const batchColumns = activeBatches.map((b) => ({ key: b.id, label: b.label }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex items-center justify-between border-b border-go2x-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-go2x-text">
            Compare Batches — {program.label}
          </h1>
          <p className="text-xs text-go2x-text-muted mt-1">
            Side-by-side comparison across all {activeBatches.length} active batches.
          </p>
        </div>
      </div>

      {/* Batch Scorecard Table */}
      <BatchScorecardTable data={scorecardItems} programSlug={program.id} />

      {/* Section x Batch Heatmap */}
      <div className="pt-4">
        <SectionHeatmap
          title="Section vs Batch Attendance Comparison"
          rows={sortedSections}
          columns={batchColumns}
          cells={heatmapCells}
          thresholds={filters.thresholds}
        />
      </div>
    </div>
  );
};
