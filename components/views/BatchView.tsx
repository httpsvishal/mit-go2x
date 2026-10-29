'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProgramConfig, BatchConfig, Manifest } from '@/core/manifest';
import { FilterState } from '@/core/filters';
import { MetricContext, registry } from '@/core/registry';
import { FilterBar } from '@/components/filters/FilterBar';
import { KpiRow } from '@/components/kpi/KpiRow';
import { InsightsRail } from '@/components/insights/InsightsRail';
import { SectionRangeChart } from '@/components/charts/SectionRangeChart';
import { SectionScorecardTable } from '@/components/tables/SectionScorecardTable';
import { SessionTurnoutChart } from '@/components/charts/SessionTurnoutChart';
import { WeekdayPatternChart } from '@/components/charts/WeekdayPatternChart';
import { ParetoChart } from '@/components/charts/ParetoChart';
import { StudentsActionTable } from '@/components/tables/StudentsActionTable';
import { ClassScatterChart } from '@/components/charts/ClassScatterChart';
import { ClassesTable } from '@/components/tables/ClassesTable';
import { ClassImpactHighlights } from '@/components/insights/ClassImpactHighlights';
import { BookOpen, ArrowRight } from 'lucide-react';
import { AssessmentInsightsView } from '@/components/assessments/AssessmentInsightsView';

interface BatchViewProps {
  program: ProgramConfig;
  batch: BatchConfig;
  manifest: Manifest;
  batchData: Record<string, any>;
  filters: FilterState;
  maskNames: boolean;
  subPage: string;
  layoutConfig: any;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
}

export const BatchView: React.FC<BatchViewProps> = ({
  program,
  batch,
  manifest,
  batchData,
  filters,
  maskNames,
  subPage,
  layoutConfig,
  onFilterChange,
  onResetFilters,
}) => {
  const router = useRouter();
  const bInfo = batchData[batch.id];
  const rawRecords = bInfo?.records || [];

  // Apply client-side filters (section, date range, status bands)
  const availableSections: string[] = Array.from(
    new Set<string>(rawRecords.map((r: any) => String(r.section)))
  ).sort();
  const latestDate = rawRecords.reduce(
    (max: string, r: any) => (r.date > max ? r.date : max),
    ''
  );

  const filteredRecords = rawRecords.filter((r: any) => {
    // Section filter
    if (filters.sections.length > 0 && !filters.sections.includes(r.section)) {
      return false;
    }
    // Date range filter
    if (filters.dateRange.start && r.date < filters.dateRange.start) return false;
    if (filters.dateRange.end && r.date > filters.dateRange.end) return false;
    return true;
  });

  const isClassLevel = program.type === 'class-level';

  // Build metric context
  const metricContext: MetricContext = {
    records: filteredRecords,
    allRecords: rawRecords,
    batch,
    program,
    filters,
    thresholds: filters.thresholds,
    manifest,
    maskNames,
  };

  const hasAssessments = Boolean(batch.files?.testResults || batch.id === 'coe-3y');

  // Sub-pages available for this program type (Data Health commented down per user request)
  const subPages = [
    { id: 'overview', label: 'Overview' },
    { id: 'sections', label: 'Sections' },
    { id: 'trends', label: 'Trends & Sessions' },
    ...(isClassLevel
      ? [{ id: 'periods', label: 'Periods & Classes' }]
      : [{ id: 'students', label: 'Students List' }]),
    ...(hasAssessments ? [{ id: 'assessments', label: 'Test Results & Insights' }] : []),
    /*
    { id: 'data-health', label: 'Data Health' },
    */
  ];

  // Read declarative KPI layout (balanced for positive impact and actionable focus)
  const defaultKpiIds = isClassLevel
    ? ['overallPct', 'completeness', 'activeClasses', 'peakPeriod', 'pendingEntries']
    : ['overallPct', 'regularAttendees', 'topAttendees', 'activeEngagements', 'supportFocus'];

  const kpiIds =
    layoutConfig?.pages?.overview?.[program.type]?.kpis || defaultKpiIds;

  // Resolve chart components from registry
  const SectionLeagueChartComp = registry.getChart('sectionLeague', program.type)?.component;
  const TrendLineChartComp = registry.getChart('trendLine', program.type)?.component;
  const PeriodProfileChartComp = registry.getChart('periodProfile', program.type)?.component;
  const StudentHistogramChartComp = registry.getChart('studentHistogram', program.type)?.component;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header & Horizontal Sub-page Tabs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-go2x-text">
              {batch.label}
            </h1>
            <p className="text-xs text-go2x-text-muted mt-0.5">
              {program.label} • {filteredRecords.length} records loaded
            </p>
          </div>
        </div>

        {/* Horizontal Sub-page Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-go2x-border pb-1 text-xs font-semibold">
          {subPages.map((sp) => {
            const isSelected = subPage === sp.id || (subPage === '' && sp.id === 'overview');
            return (
              <button
                key={sp.id}
                type="button"
                onClick={() =>
                  router.push(
                    `/${program.id}/${batch.id}/${sp.id === 'overview' ? '' : sp.id}`
                  )
                }
                className={`rounded-go2x-md px-3 py-1.5 transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-go2x-accent text-go2x-accent-contrast shadow-sm'
                    : 'text-go2x-text-muted hover:bg-go2x-surface-alt hover:text-go2x-text'
                }`}
              >
                {sp.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        availableSections={availableSections}
        latestDate={latestDate}
        isStudentMatrix={!isClassLevel}
        defaultThresholds={manifest.settings.thresholds}
        onFilterChange={onFilterChange}
        onReset={onResetFilters}
      />

      {/* SUB-PAGE 1: OVERVIEW */}
      {(subPage === 'overview' || subPage === '') && (
        <div className="space-y-6">
          {/* Row 1: KPI Cards */}
          <KpiRow
            kpiIds={kpiIds}
            context={metricContext}
            programSlug={program.id}
            batchSlug={batch.id}
          />

          {/* Assessment Highlights Banner (for batches with test results like COE 3rd Year) */}
          {hasAssessments && (
            <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-go2x-accent/15 text-go2x-accent">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-go2x-text">
                        Web Development Assessment Insights Available
                      </h3>
                      <span className="rounded-full bg-go2x-ok-soft px-2 py-0.5 text-[10px] font-semibold text-go2x-ok-text border border-go2x-border">
                        314 Examinees
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-go2x-text-muted leading-relaxed">
                      Standardized test conducted on Oct 28: Avg score <span className="font-semibold text-go2x-text">38.8%</span> (35.0/90 pts). HTML leads at <span className="font-semibold text-go2x-ok-text">43.2%</span> while JavaScript needs remedial attention at <span className="font-semibold text-go2x-warn-text">33.2%</span>. 27 students scored ≥90%.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/${program.id}/${batch.id}/assessments`)}
                  className="inline-flex items-center gap-1.5 rounded-go2x-md bg-go2x-accent px-3 py-1.5 text-xs font-semibold text-white shadow-go2x-sm hover:opacity-90 transition-opacity"
                >
                  <span>Explore Test Insights</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Main Visuals Grid: Left Charts, Right Insights Rail */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Section League Table */}
              <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm">
                <div className="mb-2">
                  <h3 className="text-sm font-bold text-go2x-text">
                    Section Performance & Leadership
                  </h3>
                  <p className="text-xs text-go2x-text-muted mt-0.5">
                    Compares attendance across sections to highlight leading sections and focused support areas
                  </p>
                </div>
                {SectionLeagueChartComp && (
                  <SectionLeagueChartComp
                    records={filteredRecords}
                    batch={batch}
                    program={program}
                    thresholds={filters.thresholds}
                    filters={filters}
                    maskNames={maskNames}
                    onFilterChange={onFilterChange}
                  />
                )}
              </div>

              {/* Trend Line Chart */}
              <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm">
                <div className="mb-2">
                  <h3 className="text-sm font-bold text-go2x-text">
                    Attendance Trend Over Time
                  </h3>
                  <p className="text-xs text-go2x-text-muted mt-0.5">
                    Daily class attendance and 3-day rolling trend
                  </p>
                </div>
                {TrendLineChartComp && (
                  <TrendLineChartComp
                    records={filteredRecords}
                    batch={batch}
                    program={program}
                    thresholds={filters.thresholds}
                    filters={filters}
                    maskNames={maskNames}
                    onFilterChange={onFilterChange}
                  />
                )}
              </div>
            </div>

            {/* Right Rail: Insights & Breakdown */}
            <div className="space-y-6">
              <InsightsRail
                programType={program.type}
                context={metricContext}
                programSlug={program.id}
                batchSlug={batch.id}
              />

              {/* Secondary Distribution / Profile Chart */}
              <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm">
                {isClassLevel ? (
                  <>
                    <h3 className="text-sm font-bold text-go2x-text mb-1">
                      Period Attendance Profile
                    </h3>
                    {PeriodProfileChartComp && (
                      <PeriodProfileChartComp
                        records={filteredRecords}
                        batch={batch}
                        program={program}
                        thresholds={filters.thresholds}
                        filters={filters}
                        maskNames={maskNames}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-bold text-go2x-text mb-1">
                      Student Attendance Breakdown
                    </h3>
                    {StudentHistogramChartComp && (
                      <StudentHistogramChartComp
                        records={filteredRecords}
                        batch={batch}
                        program={program}
                        thresholds={filters.thresholds}
                        filters={filters}
                        maskNames={maskNames}
                        onFilterChange={onFilterChange}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGE 2: SECTIONS */}
      {subPage === 'sections' && (
        <div className="space-y-6">
          {/* Section Range Dumbbell Chart */}
          {/* <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm">
            <h3 className="text-sm font-bold text-go2x-text mb-2">
              Section Attendance Range (Lowest to Highest)
            </h3>
            <SectionRangeChart
              data={availableSections.map((sec) => {
                const secRecs = filteredRecords.filter((r: any) => r.section === sec);
                let pres = 0;
                let elig = 0;
                let lowest: number | null = null;
                let highest: number | null = null;

                if (isClassLevel) {
                  const filled = secRecs.filter((r: any) => r.status === 'filled');
                  filled.forEach((r: any) => {
                    pres += r.present;
                    elig += r.total;
                  });
                  const pcts = filled.map((r: any) => r.pct).filter((p: any) => p !== null);
                  if (pcts.length > 0) {
                    lowest = Math.min(...pcts);
                    highest = Math.max(...pcts);
                  }
                } else {
                  const studentMap = new Map<string, { pres: number; elig: number }>();
                  secRecs.forEach((r: any) => {
                    if (r.status === 'present' || r.status === 'absent') {
                      if (!studentMap.has(r.studentId)) studentMap.set(r.studentId, { pres: 0, elig: 0 });
                      const it = studentMap.get(r.studentId)!;
                      if (r.status === 'present') it.pres++;
                      it.elig++;
                    }
                  });
                  const pcts = Array.from(studentMap.values()).map(
                    (v) => (v.elig > 0 ? (v.pres / v.elig) * 100 : 0)
                  );
                  if (pcts.length > 0) {
                    lowest = Math.min(...pcts);
                    highest = Math.max(...pcts);
                  }
                  pres = secRecs.filter((r: any) => r.status === 'present').length;
                  elig = secRecs.filter((r: any) => r.status === 'present' || r.status === 'absent').length;
                }

                return {
                  section: sec,
                  count: secRecs.length,
                  pooled: elig > 0 ? (pres / elig) * 100 : null,
                  median: lowest !== null && highest !== null ? (lowest + highest) / 2 : null,
                  lowest,
                  highest,
                };
              })}
            />
          </div> */}

          {/* Section Scorecard Table */}
          <SectionScorecardTable
            isClassLevel={isClassLevel}
            batchLabel={batch.label}
            data={availableSections.map((sec) => {
              const secRecs = filteredRecords.filter((r: any) => r.section === sec);
              let pres = 0;
              let elig = 0;
              let belowTarget = 0;
              let critical = 0;
              let lowest: number | null = null;
              let highest: number | null = null;

              if (isClassLevel) {
                const filled = secRecs.filter((r: any) => r.status === 'filled');
                filled.forEach((r: any) => {
                  pres += r.present;
                  elig += r.total;
                  if (r.pct !== null && r.pct < 50) belowTarget++;
                });
                critical = secRecs.filter((r: any) => r.status === 'pending').length;
                const pcts = filled.map((r: any) => r.pct).filter((p: any) => p !== null);
                if (pcts.length > 0) {
                  lowest = Math.min(...pcts);
                  highest = Math.max(...pcts);
                }
              } else {
                const studentMap = new Map<string, { pres: number; elig: number }>();
                secRecs.forEach((r: any) => {
                  if (r.status === 'present' || r.status === 'absent') {
                    if (!studentMap.has(r.studentId)) studentMap.set(r.studentId, { pres: 0, elig: 0 });
                    const it = studentMap.get(r.studentId)!;
                    if (r.status === 'present') it.pres++;
                    it.elig++;
                  }
                });
                studentMap.forEach((v) => {
                  const p = v.elig > 0 ? (v.pres / v.elig) * 100 : 0;
                  if (p < 75) belowTarget++;
                  if (p < 50) critical++;
                });
                const pcts = Array.from(studentMap.values()).map(
                  (v) => (v.elig > 0 ? (v.pres / v.elig) * 100 : 0)
                );
                if (pcts.length > 0) {
                  lowest = Math.min(...pcts);
                  highest = Math.max(...pcts);
                }
                pres = secRecs.filter((r: any) => r.status === 'present').length;
                elig = secRecs.filter((r: any) => r.status === 'present' || r.status === 'absent').length;
              }

              const pooled = elig > 0 ? (pres / elig) * 100 : null;

              return {
                section: sec,
                count: secRecs.length,
                pct: pooled,
                mean: pooled,
                median: pooled,
                lowest,
                highest,
                belowTarget,
                critical,
                isSmallSample: secRecs.length < (manifest.settings.minSampleSize || 5),
                sparkline: [],
              };
            })}
          />
        </div>
      )}

      {/* SUB-PAGE 3: TRENDS & SESSIONS */}
      {subPage === 'trends' && (
        <div className="space-y-6">
          {/* Session Turnout Chart */}
          <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm">
            <h3 className="text-sm font-bold text-go2x-text mb-2">
              Daily Attendance Rate
            </h3>
            <SessionTurnoutChart
              data={Array.from(
                new Set<string>(filteredRecords.map((r: any) => String(r.date)))
              )
                .sort()
                .map((date, idx) => {
                  const dRecs = filteredRecords.filter((r: any) => r.date === date);
                  let pres = 0;
                  let elig = 0;
                  if (isClassLevel) {
                    dRecs
                      .filter((r: any) => r.status === 'filled')
                      .forEach((r: any) => {
                        pres += r.present;
                        elig += r.total;
                      });
                  } else {
                    pres = dRecs.filter((r: any) => r.status === 'present').length;
                    elig = dRecs.filter((r: any) => r.status === 'present' || r.status === 'absent').length;
                  }
                  const pct = elig > 0 ? (pres / elig) * 100 : null;
                  return {
                    date,
                    sessionNumber: idx + 1,
                    eligible: elig,
                    present: pres,
                    pct,
                    isLowTurnout: pct !== null && pct < 50,
                  };
                })}
            />
          </div>

          {/* Weekday Pattern Chart */}
          <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm">
            <h3 className="text-sm font-bold text-go2x-text mb-2">
              Day of Week Attendance Pattern
            </h3>
            <WeekdayPatternChart
              data={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                const wRecs = filteredRecords.filter((r: any) => {
                  if (r.weekday) return r.weekday.toLowerCase() === day.toLowerCase();
                  const d = new Date(r.date + 'T00:00:00Z');
                  const map: Record<number, string> = {
                    1: 'Monday',
                    2: 'Tuesday',
                    3: 'Wednesday',
                    4: 'Thursday',
                    5: 'Friday',
                  };
                  return map[d.getUTCDay()] === day;
                });
                let pres = 0;
                let elig = 0;
                if (isClassLevel) {
                  wRecs
                    .filter((r: any) => r.status === 'filled')
                    .forEach((r: any) => {
                      pres += r.present;
                      elig += r.total;
                    });
                } else {
                  pres = wRecs.filter((r: any) => r.status === 'present').length;
                  elig = wRecs.filter((r: any) => r.status === 'present' || r.status === 'absent').length;
                }
                const sessions = new Set(wRecs.map((r: any) => r.date)).size;
                return {
                  weekday: day,
                  sessions,
                  pct: elig > 0 ? (pres / elig) * 100 : null,
                };
              })}
            />
          </div>
        </div>
      )}

      {/* SUB-PAGE 4: STUDENTS ACTION LIST (Student-matrix only) */}
      {subPage === 'students' && !isClassLevel && (
        <div className="space-y-6">
          {/* Pareto of Absences */}
          <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm">
            <h3 className="text-sm font-bold text-go2x-text mb-1">
              Targeted Mentoring & Recovery Priority
            </h3>
            <p className="text-xs text-go2x-text-muted mb-2">
              Focusing outreach on these 25 students will deliver 80% of total attendance recovery across the batch
            </p>
            <ParetoChart
              maskNames={maskNames}
              data={(() => {
                const studentMap = new Map<string, { roll: string; name: string; absent: number; pres: number; elig: number }>();
                filteredRecords.forEach((r: any) => {
                  if (!studentMap.has(r.studentId)) {
                    studentMap.set(r.studentId, {
                      roll: r.rollNo,
                      name: r.name,
                      absent: 0,
                      pres: 0,
                      elig: 0,
                    });
                  }
                  const it = studentMap.get(r.studentId)!;
                  if (r.status === 'absent') {
                    it.absent++;
                    it.elig++;
                  } else if (r.status === 'present') {
                    it.pres++;
                    it.elig++;
                  }
                });

                const sorted = Array.from(studentMap.entries())
                  .map(([id, d]) => ({
                    studentId: id,
                    name: d.name,
                    rollNo: d.roll,
                    absent: d.absent,
                    pct: d.elig > 0 ? (d.pres / d.elig) * 100 : 0,
                  }))
                  .sort((a, b) => b.absent - a.absent);

                const totalAbs = sorted.reduce((a, b) => a + b.absent, 0);
                let running = 0;
                return sorted.slice(0, 25).map((s) => {
                  running += s.absent;
                  return {
                    ...s,
                    cumulativePct: totalAbs > 0 ? (running / totalAbs) * 100 : 0,
                  };
                });
              })()}
            />
          </div>

          {/* Students Action Table */}
          <StudentsActionTable
            batchLabel={batch.label}
            maskNames={maskNames}
            students={(() => {
              const studentMap = new Map<string, any[]>();
              filteredRecords.forEach((r: any) => {
                if (!studentMap.has(r.studentId)) studentMap.set(r.studentId, []);
                studentMap.get(r.studentId)!.push(r);
              });

              return Array.from(studentMap.entries()).map(([id, recs]) => {
                const sorted = [...recs].sort((a, b) => a.date.localeCompare(b.date));
                const first = sorted[0];
                let pres = 0;
                let abs = 0;
                let late = 0;
                let noRec = 0;
                for (const r of sorted) {
                  if (r.status === 'present') pres++;
                  else if (r.status === 'absent') abs++;
                  else if (r.status === 'late_joining') late++;
                  else if (r.status === 'no_record') noRec++;
                }
                const elig = pres + abs;
                const pct = elig > 0 ? (pres / elig) * 100 : null;

                // Current streak
                let streak = 0;
                for (let i = sorted.length - 1; i >= 0; i--) {
                  if (sorted[i].status === 'absent') streak++;
                  else if (sorted[i].status === 'present') break;
                }

                // Movement
                const elRecs = sorted.filter((r) => r.status === 'present' || r.status === 'absent');
                let movement: 'improved' | 'declined' | 'stable' = 'stable';
                let movementPts: number | null = null;
                let firstHalfPct: number | null = null;
                let secondHalfPct: number | null = null;

                if (elRecs.length >= 2) {
                  const half = Math.floor(elRecs.length / 2);
                  const h1 = elRecs.slice(0, half);
                  const h2 = elRecs.slice(half);
                  const p1 = (h1.filter((r) => r.status === 'present').length / h1.length) * 100;
                  const p2 = (h2.filter((r) => r.status === 'present').length / h2.length) * 100;
                  firstHalfPct = p1;
                  secondHalfPct = p2;
                  movementPts = p2 - p1;
                  if (movementPts > 20) movement = 'improved';
                  else if (movementPts < -20) movement = 'declined';
                }

                return {
                  studentId: id,
                  rollNo: first.rollNo,
                  name: first.name,
                  section: first.section,
                  batchId: first.batchId,
                  present: pres,
                  absent: abs,
                  eligible: elig,
                  lateJoining: late,
                  noRecord: noRec,
                  pct,
                  statusBand: pct === null ? 'neutral' : pct >= 75 ? 'ok' : pct >= 50 ? 'warn' : 'bad',
                  currentStreak: streak,
                  longestStreak: streak,
                  last10Strip: sorted.slice(-10).map((r) => ({ date: r.date, status: r.status })),
                  firstHalfPct,
                  secondHalfPct,
                  movement,
                  movementPts,
                };
              });
            })()}
          />
        </div>
      )}

      {/* SUB-PAGE 5: PERIODS & CLASSES (Class-level only) */}
      {subPage === 'periods' && isClassLevel && (
        <div className="space-y-6">
          {/* Class Scatter Chart */}
          <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm">
            <h3 className="text-sm font-bold text-go2x-text mb-2">
              Class Attendance by Date & Period
            </h3>
            <ClassScatterChart records={filteredRecords} />
          </div>

          {/* Classes Table */}
          <ClassesTable records={filteredRecords} />
        </div>
      )}

      {/* SUB-PAGE: TEST RESULTS & ASSESSMENTS */}
      {subPage === 'assessments' && (
        <AssessmentInsightsView batch={batch} maskNames={maskNames} />
      )}

      {/* SUB-PAGE 6: DATA HEALTH (Accessible if directly visited, with health comments noted) */}
      {subPage === 'data-health' && (
        <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-6 shadow-go2x-sm space-y-4">
          <h2 className="text-lg font-bold text-go2x-text">
            Data Health & Validation for {batch.label}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-go2x-surface-alt p-3 rounded-go2x-md text-xs">
            <div>Raw Rows: {bInfo?.rawCount || 0}</div>
            <div>Valid Records: {rawRecords.length}</div>
            <div>Deduplicated: {bInfo?.dedupeCount || 0}</div>
            <div>Sections: {availableSections.length}</div>
          </div>

          {(() => {
            const plugin = registry.getPlugin(program.type);
            const checks = plugin ? plugin.dataQualityChecks : [];
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                {checks.map((chk) => {
                  const res = chk.run(bInfo?.rawRows || [], rawRecords, batch);
                  return (
                    <div
                      key={chk.id}
                      className="rounded-go2x-md border border-go2x-border p-3 space-y-1 bg-go2x-surface"
                    >
                      <div className="flex items-center justify-between font-semibold text-go2x-text">
                        <span>{res.name}</span>
                        <span
                          className={
                            res.affectedCount > 0 && res.severity === 'error'
                              ? 'text-go2x-bad-text'
                              : res.affectedCount > 0 && res.severity === 'warning'
                              ? 'text-go2x-warn-text'
                              : 'text-go2x-ok-text'
                          }
                        >
                          {res.affectedCount} issue(s)
                        </span>
                      </div>
                      <p className="text-[11px] text-go2x-text-muted">{res.explanation}</p>
                      {res.details && res.details.length > 0 && (
                        <ul className="text-[10px] space-y-0.5 text-go2x-text pt-1">
                          {res.details.map((d, i) => (
                            <li key={i}>• {d}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
