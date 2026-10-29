'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  Download,
  Search,
  Users,
  Clock,
  ArrowUpDown,
  Filter,
  BarChart3,
  Code2,
  FileCode,
  Layers,
} from 'lucide-react';
import { BatchConfig } from '@/core/manifest';
import { maskName } from '@/core/mask';
import { formatPct } from '@/core/format';

interface StudentAssessmentRecord {
  slot: string;
  rank: number;
  overallRank: number;
  username: string;
  name: string;
  score: number;
  percentage: number;
  correct: number;
  wrong: number;
  unanswered: number;
  totalQuestions: number;
  durationMinutes: number;
  status: string;
  cssScore: number;
  cssCorrect: number;
  htmlScore: number;
  htmlCorrect: number;
  jsScore: number;
  jsCorrect: number;
}

interface AssessmentSummaryData {
  summary: {
    totalSubmissions: number;
    uniqueStudents: number;
    cohortSize: number;
    turnoutPct: number;
    avgScore: number;
    avgPercentage: number;
    medianScore: number;
    maxScore: number;
    minScore: number;
    avgDurationMinutes: number;
    subjects: {
      html: { name: string; maxMarks: number; avgMarks: number; avgPct: number };
      css: { name: string; maxMarks: number; avgMarks: number; avgPct: number };
      javascript: { name: string; maxMarks: number; avgMarks: number; avgPct: number };
    };
    slots: {
      slot1: {
        name: string;
        count: number;
        avgScore: number;
        avgPct: number;
        topScore: number;
        gte75: number;
        lt50: number;
      };
      slot2: {
        name: string;
        count: number;
        avgScore: number;
        avgPct: number;
        topScore: number;
        gte75: number;
        lt50: number;
      };
    };
    gradeDistribution: Array<{
      band: string;
      count: number;
      pct: number;
      color: string;
    }>;
    actionInsights: Array<{
      id: string;
      title: string;
      severity: 'critical' | 'warn' | 'ok' | 'info';
      text: string;
    }>;
  };
  records: StudentAssessmentRecord[];
}

interface AssessmentInsightsViewProps {
  batch: BatchConfig;
  maskNames: boolean;
}

export const AssessmentInsightsView: React.FC<AssessmentInsightsViewProps> = ({
  batch,
  maskNames,
}) => {
  const [data, setData] = useState<AssessmentSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof StudentAssessmentRecord>('overallRank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch('/data/coe/coe-3y/test_summary.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load test summary data');
        return res.json();
      })
      .then((jsonData) => {
        if (isMounted) {
          setData(jsonData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error loading assessment data');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter & sort records
  const filteredRecords = useMemo(() => {
    if (!data?.records) return [];

    return data.records.filter((r) => {
      // Slot filter
      if (selectedSlot !== 'all' && r.slot !== selectedSlot) return false;

      // Tier filter
      if (selectedTier === 'gte90' && r.percentage < 90) return false;
      if (selectedTier === 'gte75' && (r.percentage < 75 || r.percentage >= 90)) return false;
      if (selectedTier === '50-74' && (r.percentage < 50 || r.percentage >= 75)) return false;
      if (selectedTier === 'lt50' && r.percentage >= 50) return false;

      // Search query (username or name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = r.name.toLowerCase().includes(query);
        const matchesRoll = r.username.toLowerCase().includes(query);
        if (!matchesName && !matchesRoll) return false;
      }

      return true;
    });
  }, [data?.records, selectedSlot, selectedTier, searchQuery]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = (aVal as string).toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortAsc]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, page, pageSize]);

  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;

  const handleSort = (field: keyof StudentAssessmentRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'overallRank' || field === 'username');
    }
    setPage(1);
  };

  const exportCsv = () => {
    if (!sortedRecords || sortedRecords.length === 0) return;

    const headers = [
      'Rank',
      'Roll Number',
      'Name',
      'Slot',
      'Total Score (/90)',
      'Percentage (%)',
      'HTML Marks (/30)',
      'CSS Marks (/30)',
      'JS Marks (/30)',
      'Correct',
      'Wrong',
      'Unanswered',
      'Duration (Mins)',
      'Status',
    ];

    const rows = sortedRecords.map((r) => [
      r.overallRank,
      `"${r.username}"`,
      `"${maskName(r.name, maskNames)}"`,
      `"${r.slot}"`,
      r.score,
      r.percentage,
      r.htmlScore,
      r.cssScore,
      r.jsScore,
      r.correct,
      r.wrong,
      r.unanswered,
      r.durationMinutes,
      r.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `coe-3rd-year-assessment-results-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-go2x-lg border border-go2x-border bg-go2x-surface p-8 text-center text-sm text-go2x-text-muted">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-go2x-accent border-t-transparent" />
          <span>Loading COE 3rd Year Assessment Insights...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-6 text-center text-xs text-go2x-bad">
        Failed to load assessment data: {error || 'No data found'}
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-5 shadow-go2x-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-go2x-accent/15 text-go2x-accent">
                <BookOpen className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-go2x-text">
                Web Development Assessment: Results & Insights
              </h2>
            </div>
            <p className="text-xs text-go2x-text-muted">
              Standardized assessment across HTML, CSS, and JavaScript conducted on October 28, 2026 for {batch.label} (COE5)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-go2x-md border border-go2x-border bg-go2x-surface-alt px-3 py-1 font-semibold text-go2x-text">
              45 Questions • 90 Marks
            </span>
            <span className="rounded-go2x-md border border-go2x-ok/40 bg-go2x-ok-soft px-3 py-1 font-semibold text-go2x-ok-text">
              {summary.totalSubmissions} Submissions ({summary.turnoutPct}% Turnout)
            </span>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-go2x-md border border-go2x-border bg-go2x-surface px-3 py-1 font-medium text-go2x-text hover:border-go2x-accent hover:text-go2x-accent transition-colors shadow-go2x-sm"
              title="Download results as CSV"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* KPI 1: Overall Average */}
        <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-go2x-text-muted uppercase">Avg Batch Score</span>
            <BarChart3 className="h-4 w-4 text-go2x-accent" />
          </div>
          <p className="text-2xl font-bold text-go2x-text tabular-nums">
            {summary.avgPercentage}%
          </p>
          <p className="text-[11px] text-go2x-text-muted">
            {summary.avgScore} / 90 pts (Median: {summary.medianScore})
          </p>
        </div>

        {/* KPI 2: Test Turnout */}
        <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-go2x-text-muted uppercase">Turnout & Reach</span>
            <Users className="h-4 w-4 text-go2x-ok" />
          </div>
          <p className="text-2xl font-bold text-go2x-text tabular-nums">
            {summary.turnoutPct}%
          </p>
          <p className="text-[11px] text-go2x-text-muted">
            {summary.totalSubmissions} attempts ({summary.uniqueStudents} students)
          </p>
        </div>

        {/* KPI 3: Top Achievers */}
        <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-go2x-text-muted uppercase">Distinction (≥90%)</span>
            <Award className="h-4 w-4 text-go2x-ok" />
          </div>
          <p className="text-2xl font-bold text-go2x-ok-text tabular-nums">
            {summary.gradeDistribution[0]?.count || 0}
          </p>
          <p className="text-[11px] text-go2x-text-muted">
            3 perfect 100% scores (90/90)
          </p>
        </div>

        {/* KPI 4: Subject Leader */}
        <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-go2x-text-muted uppercase">Lead Subject</span>
            <Code2 className="h-4 w-4 text-go2x-accent" />
          </div>
          <p className="text-2xl font-bold text-go2x-text tabular-nums">
            HTML ({summary.subjects.html.avgPct}%)
          </p>
          <p className="text-[11px] text-go2x-text-muted">
            {summary.subjects.html.avgMarks} / 30 pts average
          </p>
        </div>

        {/* KPI 5: Support Cohort */}
        <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-go2x-text-muted uppercase">Remedial Focus</span>
            <AlertTriangle className="h-4 w-4 text-go2x-warn" />
          </div>
          <p className="text-2xl font-bold text-go2x-warn-text tabular-nums">
            {summary.slots.slot1.lt50 + summary.slots.slot2.lt50}
          </p>
          <p className="text-[11px] text-go2x-text-muted">
            Students &lt; 50% benchmark
          </p>
        </div>
      </div>

      {/* 3. Deep-Dive Analytics Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Card: Subject Mastery Comparison */}
        <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm space-y-4">
          <div className="flex items-center justify-between border-b border-go2x-border pb-2.5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-go2x-text">
                Subject Mastery Comparison
              </h3>
              <p className="text-[11px] text-go2x-text-muted">
                Sectional averages out of 30 marks per domain
              </p>
            </div>
            <FileCode className="h-4 w-4 text-go2x-accent" />
          </div>

          <div className="space-y-4 pt-1">
            {/* HTML */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-go2x-text">HTML (Structure & Tags)</span>
                <span className="font-bold text-go2x-text tabular-nums">
                  {summary.subjects.html.avgMarks}/30 ({summary.subjects.html.avgPct}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-go2x-surface-alt overflow-hidden border border-go2x-border/40">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${summary.subjects.html.avgPct}%` }}
                />
              </div>
              <p className="text-[10px] text-go2x-text-muted">
                Strongest domain. High accuracy on semantics and basic attributes.
              </p>
            </div>

            {/* CSS */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-go2x-text">CSS (Styling & Layout)</span>
                <span className="font-bold text-go2x-text tabular-nums">
                  {summary.subjects.css.avgMarks}/30 ({summary.subjects.css.avgPct}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-go2x-surface-alt overflow-hidden border border-go2x-border/40">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${summary.subjects.css.avgPct}%` }}
                />
              </div>
              <p className="text-[10px] text-go2x-text-muted">
                Solid fundamentals in flexbox and box model; pseudo-selectors need review.
              </p>
            </div>

            {/* JavaScript */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-go2x-text">JavaScript (Logic & Events)</span>
                <span className="font-bold text-go2x-warn-text tabular-nums">
                  {summary.subjects.javascript.avgMarks}/30 ({summary.subjects.javascript.avgPct}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-go2x-surface-alt overflow-hidden border border-go2x-border/40">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${summary.subjects.javascript.avgPct}%` }}
                />
              </div>
              <p className="text-[10px] text-go2x-warn-text">
                Lowest scoring module (-10 pts below HTML). Key target for revision labs.
              </p>
            </div>
          </div>
        </div>

        {/* Center Card: Grade Distribution Bands */}
        <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm space-y-4">
          <div className="flex items-center justify-between border-b border-go2x-border pb-2.5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-go2x-text">
                Cohort Performance Distribution
              </h3>
              <p className="text-[11px] text-go2x-text-muted">
                Student percentage tiers across 314 examinees
              </p>
            </div>
            <Layers className="h-4 w-4 text-go2x-accent" />
          </div>

          <div className="space-y-3 pt-1">
            {summary.gradeDistribution.map((tier) => (
              <div key={tier.band} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-go2x-text">{tier.band}</span>
                  <span className="font-semibold text-go2x-text tabular-nums">
                    {tier.count} students ({tier.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-go2x-surface-alt overflow-hidden border border-go2x-border/40">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${tier.pct}%`, backgroundColor: tier.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Slot 1 vs Slot 2 Comparison */}
        <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm space-y-4">
          <div className="flex items-center justify-between border-b border-go2x-border pb-2.5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-go2x-text">
                Slot Comparison (Morning vs Afternoon)
              </h3>
              <p className="text-[11px] text-go2x-text-muted">
                Variance across scheduled testing slots
              </p>
            </div>
            <Clock className="h-4 w-4 text-go2x-accent" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Slot 1 Box */}
            <div className="rounded-go2x-md border border-go2x-border bg-go2x-surface-alt p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-go2x-text">Slot 1</span>
                <span className="text-[10px] text-go2x-text-muted">Morning</span>
              </div>
              <p className="text-xl font-bold text-go2x-text tabular-nums">
                {summary.slots.slot1.avgPct}%
              </p>
              <div className="space-y-1 text-[11px] text-go2x-text-muted">
                <div>{summary.slots.slot1.count} Students</div>
                <div>Top Score: {summary.slots.slot1.topScore}/90</div>
                <div className="text-go2x-ok-text font-medium">{summary.slots.slot1.gte75} scored ≥75%</div>
                <div className="text-go2x-bad-text font-medium">{summary.slots.slot1.lt50} scored &lt;50%</div>
              </div>
            </div>

            {/* Slot 2 Box */}
            <div className="rounded-go2x-md border border-go2x-border bg-go2x-surface-alt p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-go2x-text">Slot 2</span>
                <span className="text-[10px] text-go2x-text-muted">Afternoon</span>
              </div>
              <p className="text-xl font-bold text-go2x-ok-text tabular-nums">
                {summary.slots.slot2.avgPct}%
              </p>
              <div className="space-y-1 text-[11px] text-go2x-text-muted">
                <div>{summary.slots.slot2.count} Students</div>
                <div>Top Score: {summary.slots.slot2.topScore}/90</div>
                <div className="text-go2x-ok-text font-medium">{summary.slots.slot2.gte75} scored ≥75%</div>
                <div className="text-go2x-bad-text font-medium">{summary.slots.slot2.lt50} scored &lt;50%</div>
              </div>
            </div>
          </div>

          <div className="rounded-go2x-md border border-go2x-border/80 bg-go2x-surface p-2.5 text-[11px] text-go2x-text-muted">
            <span className="font-semibold text-go2x-text">Observation: </span>
            Slot 2 outperformed Slot 1 by <span className="font-bold text-go2x-ok-text">+10.0 pts</span> in average percentage, with higher top-tier representation.
          </div>
        </div>
      </div>

      {/* 4. Actionable Faculty Insights & Recommendations Grid */}
      <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-5 shadow-go2x-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-go2x-border pb-2.5">
          <Sparkles className="h-4 w-4 text-go2x-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-go2x-text">
            Key Assessment Insights & Teaching Action Plan
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
          {summary.actionInsights.map((insight) => {
            const isCrit = insight.severity === 'critical';
            const isWarn = insight.severity === 'warn';
            const isOk = insight.severity === 'ok';

            return (
              <div
                key={insight.id}
                className={`rounded-go2x-md border p-3.5 space-y-2 transition-all ${
                  isCrit
                    ? 'border-go2x-bad/40 bg-go2x-bad-soft text-go2x-text'
                    : isWarn
                    ? 'border-go2x-warn/40 bg-go2x-warn-soft text-go2x-text'
                    : isOk
                    ? 'border-go2x-ok/40 bg-go2x-ok-soft text-go2x-text'
                    : 'border-go2x-border bg-go2x-surface-alt text-go2x-text'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {isCrit ? (
                    <AlertCircle className="h-4 w-4 text-go2x-bad shrink-0" />
                  ) : isWarn ? (
                    <AlertTriangle className="h-4 w-4 text-go2x-warn shrink-0" />
                  ) : isOk ? (
                    <CheckCircle className="h-4 w-4 text-go2x-ok shrink-0" />
                  ) : (
                    <Info className="h-4 w-4 text-go2x-accent shrink-0" />
                  )}
                  <span>{insight.title}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-go2x-text-muted">
                  {insight.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Searchable, Filterable Student Leaderboard Table */}
      <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-5 shadow-go2x-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-go2x-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-go2x-text">
              Student Performance Leaderboard
            </h3>
            <p className="text-xs text-go2x-text-muted">
              Displaying {sortedRecords.length} of {data.records.length} examinees
            </p>
          </div>

          {/* Controls: Search, Slot Filter, Tier Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-go2x-text-muted" />
              <input
                type="text"
                placeholder="Search name or roll no..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-go2x-md border border-go2x-border bg-go2x-surface-alt pl-8 pr-3 text-xs text-go2x-text placeholder-go2x-text-muted focus:border-go2x-accent focus:outline-none"
              />
            </div>

            {/* Slot Filter */}
            <select
              value={selectedSlot}
              onChange={(e) => {
                setSelectedSlot(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-go2x-md border border-go2x-border bg-go2x-surface-alt px-2.5 text-xs text-go2x-text focus:border-go2x-accent focus:outline-none"
            >
              <option value="all">All Slots</option>
              <option value="Slot 1">Slot 1 (Morning)</option>
              <option value="Slot 2">Slot 2 (Afternoon)</option>
            </select>

            {/* Tier Filter */}
            <select
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-go2x-md border border-go2x-border bg-go2x-surface-alt px-2.5 text-xs text-go2x-text focus:border-go2x-accent focus:outline-none"
            >
              <option value="all">All Score Bands</option>
              <option value="gte90">≥90% (Distinction)</option>
              <option value="gte75">75%–89% (Proficient)</option>
              <option value="50-74">50%–74% (Average)</option>
              <option value="lt50">&lt;50% (Needs Support)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-go2x-border bg-go2x-surface-alt text-[11px] font-semibold text-go2x-text-muted">
                <th
                  onClick={() => handleSort('overallRank')}
                  className="cursor-pointer px-3 py-2.5 hover:text-go2x-accent"
                >
                  <div className="flex items-center gap-1">
                    <span>Rank</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('username')}
                  className="cursor-pointer px-3 py-2.5 hover:text-go2x-accent"
                >
                  <div className="flex items-center gap-1">
                    <span>Roll No</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="cursor-pointer px-3 py-2.5 hover:text-go2x-accent"
                >
                  <div className="flex items-center gap-1">
                    <span>Student Name</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-3 py-2.5">Slot</th>
                <th
                  onClick={() => handleSort('score')}
                  className="cursor-pointer px-3 py-2.5 hover:text-go2x-accent"
                >
                  <div className="flex items-center gap-1">
                    <span>Score (/90)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('percentage')}
                  className="cursor-pointer px-3 py-2.5 hover:text-go2x-accent"
                >
                  <div className="flex items-center gap-1">
                    <span>Percentage</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('htmlScore')}
                  className="cursor-pointer px-3 py-2.5 hover:text-go2x-accent"
                >
                  <div className="flex items-center gap-1">
                    <span>HTML (/30)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cssScore')}
                  className="cursor-pointer px-3 py-2.5 hover:text-go2x-accent"
                >
                  <div className="flex items-center gap-1">
                    <span>CSS (/30)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('jsScore')}
                  className="cursor-pointer px-3 py-2.5 hover:text-go2x-accent"
                >
                  <div className="flex items-center gap-1">
                    <span>JS (/30)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('durationMinutes')}
                  className="cursor-pointer px-3 py-2.5 hover:text-go2x-accent"
                >
                  <div className="flex items-center gap-1">
                    <span>Duration</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-go2x-border">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-go2x-text-muted">
                    No student records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const isTop = r.percentage >= 90;
                  const isProficient = r.percentage >= 75 && r.percentage < 90;
                  const isLow = r.percentage < 50;

                  return (
                    <tr
                      key={`${r.slot}-${r.username}`}
                      className="transition-colors hover:bg-go2x-surface-alt/60"
                    >
                      <td className="px-3 py-2 font-bold tabular-nums">
                        {r.overallRank <= 3 ? (
                          <span className="inline-flex items-center gap-1 text-amber-500 font-extrabold">
                            <Award className="h-3.5 w-3.5" /> #{r.overallRank}
                          </span>
                        ) : (
                          <span className="text-go2x-text">#{r.overallRank}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-go2x-text-muted">
                        {r.username}
                      </td>
                      <td className="px-3 py-2 font-medium text-go2x-text">
                        {maskName(r.name, maskNames)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            r.slot === 'Slot 1'
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}
                        >
                          {r.slot}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-semibold text-go2x-text tabular-nums">
                        {r.score}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            isTop
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : isProficient
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                              : isLow
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {r.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2 tabular-nums font-mono text-go2x-text">
                        {r.htmlScore}
                      </td>
                      <td className="px-3 py-2 tabular-nums font-mono text-go2x-text">
                        {r.cssScore}
                      </td>
                      <td className="px-3 py-2 tabular-nums font-mono text-go2x-text">
                        {r.jsScore}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-go2x-text-muted tabular-nums">
                        {r.durationMinutes} min
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-go2x-border pt-3 text-xs text-go2x-text-muted">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 rounded border border-go2x-border bg-go2x-surface-alt px-2 text-xs text-go2x-text focus:outline-none"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Showing {sortedRecords.length > 0 ? (page - 1) * pageSize + 1 : 0}–
              {Math.min(page * pageSize, sortedRecords.length)} of {sortedRecords.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-go2x-border px-2.5 py-1 text-xs font-medium text-go2x-text hover:bg-go2x-surface-alt disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded border border-go2x-border px-2.5 py-1 text-xs font-medium text-go2x-text hover:bg-go2x-surface-alt disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
