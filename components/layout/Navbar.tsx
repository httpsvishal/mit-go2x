'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ProgramConfig, BatchConfig, Manifest } from '@/core/manifest';
import { Breadcrumbs } from './Breadcrumbs';
import { ProgramSwitch } from './ProgramSwitch';
import { BatchSwitcher } from './BatchSwitcher';
import { useTheme } from '@/theme/useTheme';
import { useDashboardStore } from '@/core/store';
import { Sun, Moon, Eye, EyeOff, Activity } from 'lucide-react';

export interface NavbarProps {
  manifest?: Manifest | null;
  currentProgram?: ProgramConfig;
  currentBatch?: BatchConfig;
  currentSubPage?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  manifest,
  currentProgram,
  currentBatch,
  currentSubPage,
}) => {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { maskNames, toggleMaskNames, batchData } = useDashboardStore();

  const programSlug = currentProgram?.id;
  const batchSlug = currentBatch?.id;

  // Compute quick data-health status
  const batchesWithErrors = Object.entries(batchData).filter(([_, d]) => d.error);
  const hasHealthIssues = batchesWithErrors.length > 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 w-full border-b border-go2x-border bg-go2x-surface/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left Side: MIT Logo + Go2X Logo + Brand Badge & Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 font-bold tracking-tight text-go2x-text hover:opacity-85 transition-opacity"
            title="MIT <> Go2X Dashboard"
          >
            {/* MIT Logo */}
            <div className="relative h-10 w-10 flex-shrink-0">
              <Image
                src="/mit-logo.png"
                alt="MIT"
                fill
                sizes="40px"
                className="object-contain"
                priority
              />
            </div>

            <span className="text-go2x-text-muted/60 text-xs font-semibold select-none">×</span>

            {/* Go2X Logo */}
            <div className="relative h-6 w-16 flex-shrink-0">
              <Image
                src="/logo_noBg.png"
                alt="Go2X"
                fill
                sizes="64px"
                className="object-contain"
                priority
              />
            </div>

            <div className="hidden sm:block h-4 w-[1px] bg-go2x-border" />

            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-go2x-accent">
              Dashboard
            </span>
          </Link>

        </div>

        {/* Center: Program & Batch Switcher Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {manifest && manifest.programs.length > 1 && currentProgram && (
            <ProgramSwitch
              programs={manifest.programs}
              currentProgramId={currentProgram.id}
              currentSubPage={currentSubPage}
            />
          )}

          {currentProgram && (
            <BatchSwitcher
              program={currentProgram}
              currentBatchId={currentBatch?.id}
              currentSubPage={currentSubPage}
            />
          )}
        </div>

        {/* Right Side: Theme Toggle & Commented Features */}
        <div className="flex items-center gap-2">
          {/* 
            Mask Names Feature (Commented down per user request)
            ==================================================
            <button
              type="button"
              onClick={toggleMaskNames}
              title={maskNames ? 'Unmask student names' : 'Mask student names (PII protection)'}
              className={`flex items-center gap-1 rounded-go2x-md px-2.5 py-1 text-xs font-medium transition-colors ${
                maskNames
                  ? 'bg-go2x-accent-soft text-go2x-accent'
                  : 'text-go2x-text-muted hover:bg-go2x-surface-alt hover:text-go2x-text'
              }`}
            >
              {maskNames ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Masked</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mask</span>
                </>
              )}
            </button>
          */}

          {/* 
            Data Health Feature (Commented down per user request)
            ====================================================
            <button
              type="button"
              onClick={() => router.push('/data-health')}
              title="View Data Health"
              className={`flex items-center gap-1 rounded-go2x-md px-2 py-1 text-xs font-medium transition-colors ${
                hasHealthIssues
                  ? 'text-go2x-bad-text hover:bg-go2x-bad-soft'
                  : 'text-go2x-ok-text hover:bg-go2x-ok-soft'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Health</span>
            </button>
          */}

          {/* Light/Dark Mode Switch */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
            className="rounded-go2x-md p-1.5 text-go2x-text-muted hover:bg-go2x-surface-alt hover:text-go2x-text transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
