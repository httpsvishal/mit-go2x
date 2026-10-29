'use client';

import React from 'react';
import { TrendingUp, Award, CheckCircle2, Sparkles, Target } from 'lucide-react';
import { formatPct } from '@/core/format';
import { computeTrend5v5 as computeCoeTrend, computeCompleteness, computePeriodAggregates, computeSectionAggregates as computeCoeSections } from '@/plugins/class-level/metrics';
import { computeTrend5v5 as computeMatrixTrend, computeStudentMetrics, computeHighAttendees, computeCriticalStudents, computeAbsenceConcentration, computeSectionStudentAggregates } from '@/plugins/student-matrix/metrics';

interface ClassImpactHighlightsProps {
  records: any[];
  program: { id?: string; label?: string; type?: string } | any;
  batch: { id?: string; label?: string; meta?: any } | any;
  thresholds?: { atRisk?: number; critical?: number };
}

export const ClassImpactHighlights: React.FC<ClassImpactHighlightsProps> = ({
  records,
  program,
  batch,
  thresholds = { atRisk: 75, critical: 50 },
}) => {
  if (!records || records.length === 0) return null;

  const isClassLevel = program.type === 'class-level';

  // 1. Attendance Trend
  const trend = isClassLevel ? computeCoeTrend(records) : computeMatrixTrend(records);

  // 2. Section Leadership
  let bestSection = { section: '', pct: 0, count: 0 };
  if (isClassLevel) {
    const secAggs = computeCoeSections(records, 1).filter((s) => s.pct !== null);
    if (secAggs.length > 0) {
      const sorted = [...secAggs].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
      bestSection = {
        section: sorted[0].section,
        pct: sorted[0].pct ?? 0,
        count: sorted[0].filled,
      };
    }
  } else {
    const secAggs = computeSectionStudentAggregates(records, thresholds, 1).filter(
      (s) => s.pct !== null
    );
    if (secAggs.length > 0) {
      const sorted = [...secAggs].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
      bestSection = {
        section: sorted[0].section,
        pct: sorted[0].pct ?? 0,
        count: sorted[0].studentsCount,
      };
    }
  }

  // 3. Class Execution / Attendance Deliveries
  let executionTitle = '';
  let executionText = '';
  if (isClassLevel) {
    const completeness = computeCompleteness(records) ?? 0;
    const filled = records.filter((r) => r.status === 'filled').length;
    executionTitle = `Curriculum Delivery: ${completeness.toFixed(1)}%`;
    executionText = `${filled} of ${records.length} planned class sessions conducted with attendance verified and recorded.`;
  } else {
    const presentCount = records.filter((r) => r.status === 'present').length;
    const uniqueDates = new Set(records.map((r) => r.date)).size;
    executionTitle = `Classroom Engagements: ${presentCount}`;
    executionText = `${presentCount} student attendances logged across ${uniqueDates} sessions, maintaining active learning continuity.`;
  }

  // 4. Peak Engagement / Attendance Champions
  let engagementTitle = '';
  let engagementText = '';
  if (isClassLevel) {
    const periods = computePeriodAggregates(records).filter((p) => p.pct !== null && p.filled > 0);
    if (periods.length > 0) {
      const sorted = [...periods].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
      const best = sorted[0];
      engagementTitle = `Peak Engagement: Period ${best.period}`;
      engagementText = `Period ${best.period} reaches ${formatPct(best.pct)} turnout, demonstrating the highest student responsiveness during lecture hours.`;
    } else {
      engagementTitle = 'Consistent Participation';
      engagementText = 'Classes are maintaining regular attendance distribution across periods.';
    }
  } else {
    const students = computeStudentMetrics(records, thresholds);
    const { gte90, exact100 } = computeHighAttendees(students);
    const regularCount = students.filter((s) => s.pct !== null && s.pct >= thresholds.atRisk).length;
    engagementTitle = `Regular Attendees: ${regularCount} Students`;
    engagementText = `${regularCount} students meet or exceed the ${thresholds.atRisk}% benchmark, with ${gte90} students excelling at ≥90% (${exact100} with 100% record).`;
  }

  // 5. High-Impact Action Opportunity
  let actionTitle = '';
  let actionText = '';
  if (isClassLevel) {
    const pending = records.filter((r) => r.status === 'pending');
    if (pending.length > 0) {
      actionTitle = `Immediate Lift: ${pending.length} Submissions Due`;
      actionText = `Entering attendance for ${pending.length} remaining classes will achieve 100% record completion and boost final batch standings.`;
    } else {
      actionTitle = 'Complete Records (100%)';
      actionText = 'All scheduled classes have been recorded. Ongoing faculty engagement ensures high classroom accountability.';
    }
  } else {
    const students = computeStudentMetrics(records, thresholds);
    const critCount = computeCriticalStudents(students, thresholds.critical);
    const conc = computeAbsenceConcentration(students, thresholds.critical);
    if (critCount > 0 && conc !== null) {
      actionTitle = `Mentoring Focus: ${critCount} Students`;
      actionText = `Focused check-ins with ${critCount} students will recover ${conc.toFixed(0)}% of missed classes, unlocking substantial attendance lift across the batch.`;
    } else {
      actionTitle = 'Healthy Batch Retention';
      actionText = 'No severe attendance deficits detected. Proactive teacher encouragement continues to sustain high attendance.';
    }
  }

  return (
    <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-5 shadow-go2x-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-go2x-border pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-go2x-accent/15 text-go2x-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-go2x-text">
              Class Impact & Key Pointers
            </h3>
            <p className="text-[11px] text-go2x-text-muted">
              Evidence of positive progress, classroom engagement, and high-impact actions for {batch.label}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-go2x-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-go2x-accent border border-go2x-border">
          Positive Trajectory Focus
        </span>
      </div>

      {/* Pointers Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pointer 1: Trend */}
        <div className="rounded-go2x-md border border-go2x-border/80 bg-go2x-surface-alt p-3 space-y-1.5 transition-colors hover:border-go2x-accent/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-go2x-text">
            <TrendingUp className="h-4 w-4 text-go2x-accent flex-shrink-0" />
            <span className="truncate">
              {trend !== null && trend > 0
                ? `Weekly Gain: +${trend.toFixed(1)} pts`
                : trend !== null && trend === 0
                ? 'Steady Participation'
                : 'Attendance Trend'}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-go2x-text-muted">
            {trend !== null && trend > 0
              ? `Attendance has grown by +${trend.toFixed(1)} pts over the last 5 days, showing positive response to classroom teaching.`
              : 'Attendance rates remain steady across sessions with consistent student turnouts.'}
          </p>
        </div>

        {/* Pointer 2: Section Leadership */}
        <div className="rounded-go2x-md border border-go2x-border/80 bg-go2x-surface-alt p-3 space-y-1.5 transition-colors hover:border-go2x-accent/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-go2x-text">
            <Award className="h-4 w-4 text-go2x-accent flex-shrink-0" />
            <span className="truncate">
              {bestSection.section ? `Section ${bestSection.section} Leads (${formatPct(bestSection.pct)})` : 'Section Leadership'}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-go2x-text-muted">
            {bestSection.section
              ? `Section ${bestSection.section} sets the benchmark with ${formatPct(bestSection.pct)} attendance, demonstrating strong student participation.`
              : 'Sections demonstrate balanced participation across active class groups.'}
          </p>
        </div>

        {/* Pointer 3: Engagement & Execution */}
        <div className="rounded-go2x-md border border-go2x-border/80 bg-go2x-surface-alt p-3 space-y-1.5 transition-colors hover:border-go2x-accent/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-go2x-text">
            <CheckCircle2 className="h-4 w-4 text-go2x-ok flex-shrink-0" />
            <span className="truncate">{executionTitle}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-go2x-text-muted">
            {executionText}
          </p>
        </div>

        {/* Pointer 4: High-Impact Action */}
        <div className="rounded-go2x-md border border-go2x-border/80 bg-go2x-surface-alt p-3 space-y-1.5 transition-colors hover:border-go2x-accent/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-go2x-text">
            <Target className="h-4 w-4 text-go2x-accent flex-shrink-0" />
            <span className="truncate">{actionTitle}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-go2x-text-muted">
            {actionText}
          </p>
        </div>
      </div>
    </div>
  );
};
