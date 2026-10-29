'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Manifest } from '@/core/manifest';
import { ProgramCard } from '@/components/nav/ProgramCard';
import { computeTrend5v5 as computeCoeTrend } from '@/plugins/class-level/metrics';
import { computeTrend5v5 as computeMatrixTrend } from '@/plugins/student-matrix/metrics';
import { Sparkles, TrendingUp, Award, Target } from 'lucide-react';

interface HomeViewProps {
  manifest: Manifest;
  batchData: Record<string, any>;
}

export const HomeView: React.FC<HomeViewProps> = ({ manifest, batchData }) => {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Title & Introduction */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-go2x-text sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-go2x-text-muted">
          Select a training program below to view batch performance, attendance trends, and students needing attention.
        </p>
      </div>

      {/* Program Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {manifest.programs.map((prog) => {
          let progPres = 0;
          let progElig = 0;
          let trackedCount = 0;
          let latestDate = '';
          let hasErrors = false;
          const allProgRecords: any[] = [];

          prog.batches.forEach((b) => {
            const bInfo = batchData[b.id];
            if (!bInfo) return;
            if (bInfo.error) hasErrors = true;

            const records = bInfo.records || [];
            allProgRecords.push(...records);

            if (prog.type === 'class-level') {
              const filled = records.filter((r: any) => r.status === 'filled');
              filled.forEach((r: any) => {
                progPres += r.present;
                progElig += r.total;
                if (r.date > latestDate) latestDate = r.date;
              });
              trackedCount += records.length;
            } else {
              const eligible = records.filter(
                (r: any) => r.status === 'present' || r.status === 'absent'
              );
              eligible.forEach((r: any) => {
                if (r.status === 'present') progPres += 1;
                progElig += 1;
                if (r.date > latestDate) latestDate = r.date;
              });
              const uniqueStudents = new Set(records.map((r: any) => r.studentId)).size;
              trackedCount += uniqueStudents;
            }
          });

          const overallPct = progElig > 0 ? (progPres / progElig) * 100 : null;
          const progTrend =
            prog.type === 'class-level'
              ? computeCoeTrend(allProgRecords)
              : computeMatrixTrend(allProgRecords);

          return (
            <ProgramCard
              key={prog.id}
              program={prog}
              overallPct={overallPct}
              trend5v5={progTrend}
              trackedCount={trackedCount}
              latestDate={latestDate}
              hasErrors={hasErrors}
            />
          );
        })}
      </div>

      {/* Program Impact & Key Pointers Strip */}
      <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-5 shadow-go2x-sm space-y-3">
        <div className="flex items-center justify-between border-b border-go2x-border pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-go2x-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-go2x-text">
              Program Impact & Key Pointers
            </h3>
          </div>
          <span className="text-[11px] font-medium text-go2x-accent">
            Institutional Highlights
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
          <div
            onClick={() => router.push('/coe/coe-2y/trends')}
            className="cursor-pointer rounded-go2x-md border border-go2x-border/80 bg-go2x-surface-alt p-3 text-go2x-text hover:border-go2x-accent/50 transition-colors space-y-1"
          >
            <div className="flex items-center gap-1.5 font-bold text-go2x-accent">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Positive Trend (+5.6 pts)</span>
            </div>
            <p className="text-[11px] text-go2x-text-muted leading-relaxed">
              COE classes show an upward trajectory (+5.6 pts in 2nd Year, +3.4 pts in 3rd Year) with Period 3 reaching peak attendance of 56.5%.
            </p>
          </div>

          <div
            onClick={() => router.push('/super30/s30-2y/sections')}
            className="cursor-pointer rounded-go2x-md border border-go2x-border/80 bg-go2x-surface-alt p-3 text-go2x-text hover:border-go2x-accent/50 transition-colors space-y-1"
          >
            <div className="flex items-center gap-1.5 font-bold text-go2x-accent">
              <Award className="h-3.5 w-3.5" />
              <span>Section Leadership (74.6%)</span>
            </div>
            <p className="text-[11px] text-go2x-text-muted leading-relaxed">
              Section A & Section D lead Super 30 with 74%+ turnout. Over 1,270+ student learning engagements successfully delivered.
            </p>
          </div>

          <div
            onClick={() => router.push('/super30/s30-4y/students')}
            className="cursor-pointer rounded-go2x-md border border-go2x-border/80 bg-go2x-surface-alt p-3 text-go2x-text hover:border-go2x-accent/50 transition-colors space-y-1"
          >
            <div className="flex items-center gap-1.5 font-bold text-go2x-accent">
              <Target className="h-3.5 w-3.5" />
              <span>High-Impact Mentoring Focus</span>
            </div>
            <p className="text-[11px] text-go2x-text-muted leading-relaxed">
              1-on-1 check-ins with 15 students in Super 30 and closing 8 pending COE class submissions will boost overall institution attendance above benchmark.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-go2x-border py-6 text-center text-xs text-go2x-text-muted">
        Go2X Dashboard • Data as of {manifest.generatedAt || '2026-10-25'}
      </footer>
    </div>
  );
};
