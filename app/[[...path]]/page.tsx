'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDashboardStore } from '@/core/store';
import { initPlugins } from '@/plugins';
import { Navbar } from '@/components/layout/Navbar';
import { HomeView } from '@/components/views/HomeView';
import { ProgramView } from '@/components/views/ProgramView';
import { CompareView } from '@/components/views/CompareView';
import { BatchView } from '@/components/views/BatchView';
import { DataHealthView } from '@/components/views/DataHealthView';
import { parseFiltersFromParams, serializeFiltersToParams } from '@/core/filters';

// Bootstrap plugins
initPlugins();

interface PageProps {
  params: {
    path?: string[];
  };
}

export default function CatchAllDashboardPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    manifest,
    manifestError,
    isLoadingManifest,
    batchData,
    filters,
    maskNames,
    showArchived,
    initManifest,
    loadBatch,
    loadAllBatchesInProgram,
    loadAllBatchesInManifest,
    setCurrentProgram,
    setCurrentBatch,
    setCurrentSubPage,
    setFilters,
    resetFilters,
  } = useDashboardStore();

  const [layoutConfig, setLayoutConfig] = useState<any>(null);

  // 1. Initialise manifest and layout configuration
  useEffect(() => {
    initManifest();
    fetch('/data/layout.config.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => setLayoutConfig(cfg))
      .catch(() => {});
  }, [initManifest]);

  // 2. Resolve URL path against manifest
  const pathSegments = params.path || [];
  const routeLevel = pathSegments.length; // 0 = Home, 1 = Program or data-health, 2 = Batch or compare, 3 = Sub-page

  const isGlobalDataHealth = pathSegments[0] === 'data-health';
  const programSlug = !isGlobalDataHealth ? pathSegments[0] : undefined;
  const isCompare = pathSegments[1] === 'compare';
  const batchSlug = !isCompare ? pathSegments[1] : undefined;
  const subPage = pathSegments[2] || 'overview';

  const currentProgram = manifest?.programs.find((p) => p.id === programSlug);
  const currentBatch = currentProgram?.batches.find((b) => b.id === batchSlug);

  // 3. Load appropriate data when route changes
  useEffect(() => {
    if (!manifest) return;

    if (routeLevel === 0) {
      loadAllBatchesInManifest();
    } else if (currentProgram) {
      if (isCompare) {
        loadAllBatchesInProgram(currentProgram.id);
      } else if (currentBatch) {
        loadBatch(currentProgram.id, currentBatch.id);
      } else {
        loadAllBatchesInProgram(currentProgram.id);
      }
    }
  }, [manifest, routeLevel, currentProgram?.id, currentBatch?.id, isCompare]);

  // 4. Update current program/batch in store
  useEffect(() => {
    if (currentProgram) {
      setCurrentProgram(currentProgram.id, subPage);
    }
    if (currentBatch) {
      setCurrentBatch(currentBatch.id, subPage);
    }
    if (subPage) {
      setCurrentSubPage(subPage);
    }
  }, [currentProgram?.id, currentBatch?.id, subPage]);

  // 5. Update browser page title
  useEffect(() => {
    const prodName = manifest?.settings.productName || 'Dashboard';
    if (routeLevel === 0) {
      document.title = `Home | ${prodName}`;
    } else if (isGlobalDataHealth) {
      document.title = `Data Health | ${prodName}`;
    } else if (isCompare) {
      document.title = `Compare | ${currentProgram?.label} | ${prodName}`;
    } else if (currentBatch && currentProgram) {
      document.title = `${currentBatch.label} | ${currentProgram.label} | ${prodName}`;
    } else if (currentProgram) {
      document.title = `${currentProgram.label} | ${prodName}`;
    }
  }, [manifest, routeLevel, isGlobalDataHealth, isCompare, currentProgram, currentBatch]);

  // 6. Handle loading state
  if (isLoadingManifest) {
    return (
      <div className="flex h-screen items-center justify-center bg-go2x-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-go2x-accent border-t-transparent" />
          <span className="text-xs font-medium text-go2x-text-muted">
            Loading Go2X Dashboard...
          </span>
        </div>
      </div>
    );
  }

  // 7. Handle manifest error
  if (manifestError || !manifest) {
    return (
      <div className="flex h-screen items-center justify-center bg-go2x-bg p-4">
        <div className="max-w-md rounded-go2x-lg border border-go2x-bad/40 bg-go2x-bad-soft/30 p-6 text-center space-y-3">
          <h2 className="text-lg font-bold text-go2x-bad-text">Failed to Load Dashboard</h2>
          <p className="text-xs text-go2x-text-muted">
            {manifestError || 'Could not discover /data/manifest.json. Ensure the file is present.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-go2x-md bg-go2x-accent px-4 py-2 text-xs font-semibold text-go2x-accent-contrast shadow-sm hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 8. Handle 404 route resolution failure
  const isInvalidRoute =
    (programSlug && !currentProgram && !isGlobalDataHealth) ||
    (batchSlug && !currentBatch && !isCompare);

  if (isInvalidRoute) {
    return (
      <div className="min-h-screen bg-go2x-bg pt-16">
        <Navbar manifest={manifest} />
        <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
          <h2 className="text-xl font-bold text-go2x-text">Page Not Found</h2>
          <p className="text-xs text-go2x-text-muted">
            The requested program or batch was not found in the current manifest.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-go2x-md bg-go2x-accent px-4 py-2 text-xs font-semibold text-go2x-accent-contrast shadow-sm hover:opacity-90"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 9. Render Unified Shell with Single Navbar & Modular Views
  return (
    <div className="min-h-screen bg-go2x-bg pt-16">
      {/* Single Unified Navbar across all pages */}
      <Navbar
        manifest={manifest}
        currentProgram={currentProgram}
        currentBatch={currentBatch}
        currentSubPage={subPage}
      />

      {/* Main View Router */}
      <main>
        {routeLevel === 0 && (
          <HomeView manifest={manifest} batchData={batchData} />
        )}

        {isGlobalDataHealth && (
          <DataHealthView manifest={manifest} batchData={batchData} />
        )}

        {currentProgram && !currentBatch && !isCompare && (
          <ProgramView
            program={currentProgram}
            manifest={manifest}
            batchData={batchData}
            showArchived={showArchived}
          />
        )}

        {currentProgram && isCompare && (
          <CompareView
            program={currentProgram}
            manifest={manifest}
            batchData={batchData}
            filters={filters}
          />
        )}

        {currentProgram && currentBatch && (
          <BatchView
            program={currentProgram}
            batch={currentBatch}
            manifest={manifest}
            batchData={batchData}
            filters={filters}
            maskNames={maskNames}
            subPage={subPage}
            layoutConfig={layoutConfig}
            onFilterChange={setFilters}
            onResetFilters={resetFilters}
          />
        )}
      </main>
    </div>
  );
}
