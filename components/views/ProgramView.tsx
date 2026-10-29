'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProgramConfig, Manifest } from '@/core/manifest';
import { BatchCard } from '@/components/nav/BatchCard';
import { computeTrend5v5 as computeCoeTrend } from '@/plugins/class-level/metrics';
import { computeTrend5v5 as computeMatrixTrend } from '@/plugins/student-matrix/metrics';
import { ArrowLeftRight } from 'lucide-react';

interface ProgramViewProps {
  program: ProgramConfig;
  manifest: Manifest;
  batchData: Record<string, any>;
  showArchived: boolean;
}

export const ProgramView: React.FC<ProgramViewProps> = ({
  program,
  manifest,
  batchData,
  showArchived,
}) => {
  const router = useRouter();
  const activeBatches = program.batches.filter(
    (b) => b.status === 'active' || b.status === undefined
  );
  const displayedBatches = showArchived ? program.batches : activeBatches;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-go2x-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-go2x-text">{program.label} Program</h1>
          <p className="text-xs text-go2x-text-muted mt-1">
            {program.description || 'Program batches and classes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/${program.id}/compare`)}
            className="flex items-center gap-1.5 rounded-go2x-md bg-go2x-accent px-3 py-1.5 text-xs font-semibold text-go2x-accent-contrast shadow-sm hover:opacity-90 transition-opacity"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Compare Batches
          </button>
        </div>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayedBatches.map((batch) => {
          const bInfo = batchData[batch.id];
          const records = bInfo?.records || [];

          let pres = 0;
          let elig = 0;
          let lastDate = '';
          let riskCount = 0;
          const riskLabel =
            program.type === 'class-level' ? 'Classes <50%' : 'Students <50%';

          if (program.type === 'class-level') {
            const filled = records.filter((r: any) => r.status === 'filled');
            filled.forEach((r: any) => {
              pres += r.present;
              elig += r.total;
              if (r.date > lastDate) lastDate = r.date;
              if (r.pct !== null && r.pct < 50) riskCount++;
            });
          } else {
            const eligible = records.filter(
              (r: any) => r.status === 'present' || r.status === 'absent'
            );
            eligible.forEach((r: any) => {
              if (r.status === 'present') pres += 1;
              elig += 1;
              if (r.date > lastDate) lastDate = r.date;
            });
            const studentMap = new Map<string, { pres: number; elig: number }>();
            eligible.forEach((r: any) => {
              if (!studentMap.has(r.studentId))
                studentMap.set(r.studentId, { pres: 0, elig: 0 });
              const item = studentMap.get(r.studentId)!;
              if (r.status === 'present') item.pres += 1;
              item.elig += 1;
            });
            studentMap.forEach((v) => {
              const p = v.elig > 0 ? (v.pres / v.elig) * 100 : 0;
              if (p < 50) riskCount++;
            });
          }

          const overallPct = elig > 0 ? (pres / elig) * 100 : null;
          const batchTrend =
            program.type === 'class-level'
              ? computeCoeTrend(records)
              : computeMatrixTrend(records);

          return (
            <BatchCard
              key={batch.id}
              batch={batch}
              program={program}
              overallPct={overallPct}
              trend5v5={batchTrend}
              riskCount={riskCount}
              riskLabel={riskLabel}
              lastDate={lastDate}
              hasErrors={!!bInfo?.error}
            />
          );
        })}
      </div>
    </div>
  );
};
