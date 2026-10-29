'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BatchConfig, ProgramConfig } from '@/core/manifest';
import { useRouter } from 'next/navigation';
import { useDashboardStore } from '@/core/store';
import { ChevronDown, Search, Check, Layers, ArrowLeftRight } from 'lucide-react';
import { formatPct } from '@/core/format';

interface BatchSwitcherProps {
  program: ProgramConfig;
  currentBatchId?: string;
  currentSubPage?: string;
}

export const BatchSwitcher: React.FC<BatchSwitcherProps> = ({
  program,
  currentBatchId,
  currentSubPage = 'overview',
}) => {
  const router = useRouter();
  const { batchData, loadBatch, setCurrentBatch, showArchived, toggleShowArchived } =
    useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeBatches = program.batches
    .filter((b) => b.status === 'active' || b.status === undefined)
    .sort((a, b) => a.order - b.order);

  const archivedBatches = program.batches
    .filter((b) => b.status === 'archived')
    .sort((a, b) => a.order - b.order);

  const displayedBatches = showArchived
    ? [...activeBatches, ...archivedBatches]
    : activeBatches;

  // Keyboard navigation: [ and ] for prev/next batch, / to focus search, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          setIsOpen(false);
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === '[' || e.key === ']') {
        e.preventDefault();
        const currentIndex = displayedBatches.findIndex((b) => b.id === currentBatchId);
        if (currentIndex === -1) return;

        let nextIndex = e.key === '[' ? currentIndex - 1 : currentIndex + 1;
        if (nextIndex < 0) nextIndex = displayedBatches.length - 1;
        if (nextIndex >= displayedBatches.length) nextIndex = 0;

        const nextBatch = displayedBatches[nextIndex];
        if (nextBatch) {
          switchBatch(nextBatch.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayedBatches, currentBatchId]);

  const switchBatch = (batchId: string) => {
    setCurrentBatch(batchId, currentSubPage);
    const targetSub = currentSubPage === 'overview' ? '' : currentSubPage;
    router.push(`/${program.id}/${batchId}/${targetSub}`);
    setIsOpen(false);
  };

  const handleCompareClick = () => {
    router.push(`/${program.id}/compare`);
    setIsOpen(false);
  };

  const prefetchBatch = (bId: string) => {
    loadBatch(program.id, bId);
  };

  const currentBatch = program.batches.find((b) => b.id === currentBatchId);

  // If <= 6 batches and not using search, show horizontal scrollable pill tabs
  const usePillTabs = program.batches.length <= 6 && !showArchived;

  if (usePillTabs) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        {displayedBatches.map((b) => {
          const isSelected = b.id === currentBatchId;
          const bInfo = batchData[b.id];
          const hasError = bInfo?.error;

          return (
            <button
              key={b.id}
              type="button"
              onMouseEnter={() => prefetchBatch(b.id)}
              onClick={() => switchBatch(b.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-go2x-md px-2.5 py-1 text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-go2x-accent text-go2x-accent-contrast shadow-sm'
                  : 'bg-go2x-surface-alt text-go2x-text hover:bg-go2x-border'
              }`}
            >
              <span>{b.label}</span>
              {hasError ? (
                <span className="h-1.5 w-1.5 rounded-full bg-go2x-bad" title="Data issue" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-go2x-ok" />
              )}
            </button>
          );
        })}

        {/* Compare All Option */}
        <button
          type="button"
          onClick={handleCompareClick}
          className="flex shrink-0 items-center gap-1 rounded-go2x-md border border-dashed border-go2x-border px-2 py-1 text-xs font-medium text-go2x-text-muted hover:border-go2x-accent hover:text-go2x-text"
        >
          <ArrowLeftRight className="h-3 w-3" />
          Compare
        </button>
      </div>
    );
  }

  // Combobox dropdown for >6 batches or dropdown view
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-go2x-md border border-go2x-border bg-go2x-surface px-3 py-1.5 text-xs font-semibold text-go2x-text shadow-sm hover:bg-go2x-surface-alt"
      >
        <Layers className="h-3.5 w-3.5 text-go2x-accent" />
        <span>{currentBatch?.label || 'Select Batch'}</span>
        <ChevronDown className="h-3.5 w-3.5 text-go2x-text-muted" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-9 z-50 w-72 rounded-go2x-md border border-go2x-border bg-go2x-surface p-2 shadow-2xl space-y-2">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-go2x-text-muted" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search batches... (press /)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-go2x-sm border border-go2x-border bg-go2x-surface-alt py-1.5 pl-8 pr-3 text-xs text-go2x-text placeholder:text-go2x-text-muted focus:border-go2x-accent focus:outline-none"
            />
          </div>

          {/* Compare Entry */}
          <button
            type="button"
            onClick={handleCompareClick}
            className="flex w-full items-center justify-between rounded-go2x-sm px-2.5 py-1.5 text-xs font-semibold text-go2x-accent hover:bg-go2x-accent-soft"
          >
            <span className="flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              All batches (compare)
            </span>
          </button>

          <div className="max-h-56 overflow-y-auto space-y-1">
            {/* Active Batches Group */}
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-go2x-text-muted">
              Active Batches
            </div>
            {activeBatches
              .filter((b) => b.label.toLowerCase().includes(search.toLowerCase()))
              .map((b) => {
                const isSelected = b.id === currentBatchId;
                const hasError = batchData[b.id]?.error;

                return (
                  <button
                    key={b.id}
                    type="button"
                    onMouseEnter={() => prefetchBatch(b.id)}
                    onClick={() => switchBatch(b.id)}
                    className={`flex w-full items-center justify-between rounded-go2x-sm px-2.5 py-1.5 text-xs transition-colors ${
                      isSelected
                        ? 'bg-go2x-accent text-go2x-accent-contrast font-bold'
                        : 'text-go2x-text hover:bg-go2x-surface-alt'
                    }`}
                  >
                    <span className="truncate">{b.label}</span>
                    <div className="flex items-center gap-1.5">
                      {hasError ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-go2x-bad" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-go2x-ok" />
                      )}
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}

            {/* Archived Batches Group */}
            {archivedBatches.length > 0 && (
              <>
                <div className="mt-2 flex items-center justify-between border-t border-go2x-border px-2 pt-2 text-[10px] font-bold uppercase tracking-wider text-go2x-text-muted">
                  <span>Archived Batches</span>
                  <button
                    type="button"
                    onClick={toggleShowArchived}
                    className="text-go2x-accent hover:underline lowercase"
                  >
                    {showArchived ? 'hide' : 'show'}
                  </button>
                </div>
                {showArchived &&
                  archivedBatches
                    .filter((b) => b.label.toLowerCase().includes(search.toLowerCase()))
                    .map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => switchBatch(b.id)}
                        className="flex w-full items-center justify-between rounded-go2x-sm px-2.5 py-1.5 text-xs text-go2x-text-muted hover:bg-go2x-surface-alt"
                      >
                        <span className="truncate">{b.label} (archived)</span>
                      </button>
                    ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
