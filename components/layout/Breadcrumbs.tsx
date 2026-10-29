'use client';

import React from 'react';
import Link from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BreadcrumbsProps {
  programLabel?: string;
  programSlug?: string;
  batchLabel?: string;
  batchSlug?: string;
  subPageLabel?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  programLabel,
  programSlug,
  batchLabel,
  batchSlug,
  subPageLabel,
}) => {
  const router = useRouter();

  return (
    <nav className="flex items-center gap-1.5 text-xs text-go2x-text-muted whitespace-nowrap">
      <button
        type="button"
        onClick={() => router.push('/')}
        className="font-medium hover:text-go2x-text transition-colors"
      >
        Home
      </button>

      {programLabel && programSlug && (
        <>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <button
            type="button"
            onClick={() => router.push(`/${programSlug}`)}
            className="font-medium hover:text-go2x-text transition-colors"
          >
            {programLabel}
          </button>
        </>
      )}

      {batchLabel && batchSlug && (
        <>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <button
            type="button"
            onClick={() => router.push(`/${programSlug}/${batchSlug}`)}
            className={`font-semibold transition-colors ${
              subPageLabel ? 'hover:text-go2x-text' : 'text-go2x-text'
            }`}
          >
            {batchLabel}
          </button>
        </>
      )}

      {subPageLabel && (
        <>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="font-semibold text-go2x-text capitalize">
            {subPageLabel}
          </span>
        </>
      )}
    </nav>
  );
};
