'use client';

import React from 'react';
import { ProgramConfig } from '@/core/manifest';
import { useRouter } from 'next/navigation';

interface ProgramSwitchProps {
  programs: ProgramConfig[];
  currentProgramId: string;
  currentSubPage?: string;
}

export const ProgramSwitch: React.FC<ProgramSwitchProps> = ({
  programs,
  currentProgramId,
  currentSubPage = 'overview',
}) => {
  const router = useRouter();

  const handleProgramClick = (prog: ProgramConfig) => {
    if (prog.id === currentProgramId) return;

    const defaultBatch =
      prog.defaultBatch ||
      prog.batches.find((b) => b.status === 'active' || b.status === undefined)?.id ||
      prog.batches[0]?.id;

    // Check if current subPage applies to target program type
    let targetSub = currentSubPage;
    if (prog.type === 'class-level' && currentSubPage === 'students') {
      targetSub = 'overview';
    } else if (prog.type === 'student-matrix' && currentSubPage === 'periods') {
      targetSub = 'overview';
    }

    if (defaultBatch) {
      router.push(`/${prog.id}/${defaultBatch}/${targetSub === 'overview' ? '' : targetSub}`);
    } else {
      router.push(`/${prog.id}`);
    }
  };

  return (
    <div className="flex items-center rounded-go2x-full bg-go2x-surface-alt p-0.5 border border-go2x-border">
      {programs.map((prog) => {
        const isSelected = prog.id === currentProgramId;
        return (
          <button
            key={prog.id}
            type="button"
            onClick={() => handleProgramClick(prog)}
            className={`rounded-go2x-full px-2.5 py-1 text-xs font-semibold transition-all ${
              isSelected
                ? 'bg-go2x-accent text-go2x-accent-contrast shadow-sm'
                : 'text-go2x-text-muted hover:text-go2x-text'
            }`}
          >
            {prog.label}
          </button>
        );
      })}
    </div>
  );
};
