'use client';

import React, { useState } from 'react';
import { FilterState, calculateDatePreset } from '@/core/filters';
import { Thresholds } from '@/core/manifest';
import { X, RotateCcw, Sliders, Calendar, Check, Search } from 'lucide-react';
import { StatusBand } from '@/core/colors';

interface FilterBarProps {
  filters: FilterState;
  availableSections: string[];
  latestDate?: string;
  isStudentMatrix?: boolean;
  showAlignToggle?: boolean;
  defaultThresholds: Thresholds;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  availableSections,
  latestDate,
  isStudentMatrix = false,
  showAlignToggle = false,
  defaultThresholds,
  onFilterChange,
  onReset,
}) => {
  const [showThresholdSliders, setShowThresholdSliders] = useState(false);

  const handleSectionToggle = (sec: string) => {
    const current = filters.sections;
    const next = current.includes(sec)
      ? current.filter((s) => s !== sec)
      : [...current, sec];
    onFilterChange({ sections: next });
  };

  const handlePresetChange = (preset: 'all' | 'last7' | 'last14' | 'thisMonth') => {
    const range = calculateDatePreset(preset, latestDate);
    onFilterChange({
      dateRange: {
        preset,
        start: range.start,
        end: range.end,
      },
    });
  };

  const handleBandToggle = (band: StatusBand) => {
    const current = filters.statusBands;
    const next = current.includes(band)
      ? current.filter((b) => b !== band)
      : [...current, band];
    onFilterChange({ statusBands: next });
  };

  const hasActiveFilters =
    filters.sections.length > 0 ||
    filters.dateRange.preset !== 'all' ||
    filters.statusBands.length > 0 ||
    filters.thresholds.atRisk !== defaultThresholds.atRisk ||
    filters.thresholds.critical !== defaultThresholds.critical ||
    filters.searchQuery.length > 0;

  return (
    <div className="space-y-3 rounded-go2x-lg border border-go2x-border bg-go2x-surface p-3.5 shadow-go2x-sm">
      {/* Top Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Sections Multi-Select Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-go2x-text-muted">Section:</span>
          {availableSections.map((sec) => {
            const isSelected = filters.sections.includes(sec);
            return (
              <button
                key={sec}
                type="button"
                onClick={() => handleSectionToggle(sec)}
                className={`rounded-go2x-full px-2.5 py-1 font-medium transition-all ${
                  isSelected
                    ? 'bg-go2x-accent text-go2x-accent-contrast shadow-sm'
                    : 'bg-go2x-surface-alt text-go2x-text hover:bg-go2x-border'
                }`}
              >
                {sec}
              </button>
            );
          })}
        </div>

        {/* Date Range Presets */}
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-go2x-text-muted" />
          <span className="font-semibold text-go2x-text-muted">Range:</span>
          {(['all', 'last7', 'last14', 'thisMonth'] as const).map((preset) => {
            const isSelected = filters.dateRange.preset === preset;
            const labels = {
              all: 'All',
              last7: 'Last 7d',
              last14: 'Last 14d',
              thisMonth: 'This Month',
            };
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetChange(preset)}
                className={`rounded-go2x-md px-2 py-1 font-medium transition-colors ${
                  isSelected
                    ? 'bg-go2x-accent text-go2x-accent-contrast'
                    : 'bg-go2x-surface-alt text-go2x-text hover:bg-go2x-border'
                }`}
              >
                {labels[preset]}
              </button>
            );
          })}
        </div>

        {/* Status Band Filter (Student-Matrix only) */}
        {isStudentMatrix && (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-go2x-text-muted">Status:</span>
            <button
              type="button"
              onClick={() => handleBandToggle('ok')}
              className={`flex items-center gap-1 rounded-go2x-md px-2 py-1 font-medium transition-colors ${
                filters.statusBands.includes('ok')
                  ? 'bg-go2x-ok text-white'
                  : 'bg-go2x-ok-soft text-go2x-ok-text hover:opacity-80'
              }`}
            >
              On Track (&ge;{filters.thresholds.atRisk}%)
            </button>
            <button
              type="button"
              onClick={() => handleBandToggle('warn')}
              className={`flex items-center gap-1 rounded-go2x-md px-2 py-1 font-medium transition-colors ${
                filters.statusBands.includes('warn')
                  ? 'bg-go2x-warn text-white'
                  : 'bg-go2x-warn-soft text-go2x-warn-text hover:opacity-80'
              }`}
            >
              Needs Attention
            </button>
            <button
              type="button"
              onClick={() => handleBandToggle('bad')}
              className={`flex items-center gap-1 rounded-go2x-md px-2 py-1 font-medium transition-colors ${
                filters.statusBands.includes('bad')
                  ? 'bg-go2x-bad text-white'
                  : 'bg-go2x-bad-soft text-go2x-bad-text hover:opacity-80'
              }`}
            >
              Mentoring Focus (&lt;{filters.thresholds.critical}%)
            </button>
          </div>
        )}

        {/* Actions: Thresholds Sliders toggle & Align Toggle */}
        <div className="flex items-center gap-2">
          {showAlignToggle && (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-go2x-text">
              <input
                type="checkbox"
                checked={filters.alignBySession}
                onChange={(e) => onFilterChange({ alignBySession: e.target.checked })}
                className="rounded border-go2x-border text-go2x-accent focus:ring-go2x-focus-ring"
              />
              Align by session #
            </label>
          )}

          <button
            type="button"
            onClick={() => setShowThresholdSliders((v) => !v)}
            className={`flex items-center gap-1 rounded-go2x-md border px-2 py-1 font-medium transition-colors ${
              showThresholdSliders
                ? 'border-go2x-accent bg-go2x-accent-soft text-go2x-accent'
                : 'border-go2x-border bg-go2x-surface-alt text-go2x-text hover:bg-go2x-border'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Thresholds
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 rounded-go2x-md px-2 py-1 font-medium text-go2x-bad-text hover:bg-go2x-bad-soft transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Threshold Sliders Panel (collapsible) */}
      {showThresholdSliders && (
        <div className="flex flex-wrap items-center gap-6 rounded-go2x-md border border-go2x-border bg-go2x-surface-alt p-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-24 font-medium text-go2x-text">
              Target ({filters.thresholds.atRisk}%):
            </span>
            <input
              type="range"
              min={50}
              max={95}
              value={filters.thresholds.atRisk}
              onChange={(e) =>
                onFilterChange({
                  thresholds: {
                    ...filters.thresholds,
                    atRisk: Number(e.target.value),
                  },
                })
              }
              className="h-1.5 cursor-pointer rounded-lg bg-go2x-border accent-go2x-accent"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="w-24 font-medium text-go2x-text">
              Low ({filters.thresholds.critical}%):
            </span>
            <input
              type="range"
              min={30}
              max={70}
              value={filters.thresholds.critical}
              onChange={(e) =>
                onFilterChange({
                  thresholds: {
                    ...filters.thresholds,
                    critical: Number(e.target.value),
                  },
                })
              }
              className="h-1.5 cursor-pointer rounded-lg bg-go2x-border accent-go2x-bad"
            />
          </div>

          <span className="text-[11px] text-go2x-text-muted">
            Live recompute applied across all metrics and charts
          </span>
        </div>
      )}

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-go2x-text-muted">Active filters:</span>
          {filters.sections.map((sec) => (
            <span
              key={sec}
              className="inline-flex items-center gap-1 rounded-go2x-md bg-go2x-accent-soft px-2 py-0.5 font-medium text-go2x-accent"
            >
              Sec {sec}
              <button
                type="button"
                onClick={() => handleSectionToggle(sec)}
                className="hover:opacity-75"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {filters.dateRange.preset !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-go2x-md bg-go2x-accent-soft px-2 py-0.5 font-medium text-go2x-accent">
              {filters.dateRange.preset}
              <button
                type="button"
                onClick={() => handlePresetChange('all')}
                className="hover:opacity-75"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.statusBands.map((band) => (
            <span
              key={band}
              className="inline-flex items-center gap-1 rounded-go2x-md bg-go2x-surface-alt px-2 py-0.5 font-medium text-go2x-text uppercase"
            >
              {band}
              <button
                type="button"
                onClick={() => handleBandToggle(band)}
                className="hover:opacity-75"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
