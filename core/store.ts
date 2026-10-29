import { create } from 'zustand';
import { Manifest, BatchConfig, ProgramConfig, loadManifest, Thresholds, parseJsonWithNan } from './manifest';
import { FilterState, defaultFilterState } from './filters';
import { registry } from './registry';
import { fetchWithCache } from './cache';

export interface BatchDataState {
  records: any[];
  rawRows: any[];
  rawCount: number;
  dedupeCount: number;
  loading: boolean;
  error?: string;
}

export interface DashboardStore {
  manifest: Manifest | null;
  manifestError: string | null;
  isLoadingManifest: boolean;

  batchData: Record<string, BatchDataState>;

  currentProgramId: string | null;
  currentBatchId: string | null;
  currentSubPage: string;

  filters: FilterState;
  maskNames: boolean;
  showArchived: boolean;
  toastMessage: string | null;

  // Actions
  initManifest: (manifestPath?: string) => Promise<Manifest | null>;
  loadBatch: (programId: string, batchId: string) => Promise<any[]>;
  loadAllBatchesInProgram: (programId: string) => Promise<void>;
  loadAllBatchesInManifest: () => Promise<void>;

  setCurrentProgram: (programId: string, targetSubPage?: string) => void;
  setCurrentBatch: (batchId: string, targetSubPage?: string) => { sectionCleared: boolean };
  setCurrentSubPage: (subPage: string) => void;

  setFilters: (newFilters: Partial<FilterState>) => void;
  resetFilters: () => void;
  toggleMaskNames: () => void;
  toggleShowArchived: () => void;
  setToast: (msg: string | null) => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  manifest: null,
  manifestError: null,
  isLoadingManifest: false,

  batchData: {},

  currentProgramId: null,
  currentBatchId: null,
  currentSubPage: 'overview',

  filters: defaultFilterState,
  maskNames: false,
  showArchived: false,
  toastMessage: null,

  initManifest: async (manifestPath = '/data/manifest.json') => {
    set({ isLoadingManifest: true, manifestError: null });
    try {
      const manifest = await loadManifest(manifestPath);
      const maskNamesDefault = manifest.settings.maskNamesDefault ?? false;
      const defaultThresholds = manifest.settings.thresholds ?? { atRisk: 75, critical: 50 };

      set((state) => ({
        manifest,
        isLoadingManifest: false,
        maskNames: maskNamesDefault,
        filters: {
          ...state.filters,
          thresholds: defaultThresholds,
        },
      }));
      return manifest;
    } catch (err: any) {
      set({
        isLoadingManifest: false,
        manifestError: err?.message || 'Failed to load manifest.json',
      });
      return null;
    }
  },

  loadBatch: async (programId: string, batchId: string) => {
    const { manifest, batchData } = get();
    if (!manifest) return [];

    // Already loaded
    if (batchData[batchId] && !batchData[batchId].error && !batchData[batchId].loading) {
      return batchData[batchId].records;
    }

    const program = manifest.programs.find((p) => p.id === programId);
    if (!program) {
      set((s) => ({
        batchData: {
          ...s.batchData,
          [batchId]: {
            records: [],
            rawRows: [],
            rawCount: 0,
            dedupeCount: 0,
            loading: false,
            error: `Program "${programId}" not found in manifest`,
          },
        },
      }));
      return [];
    }

    const batch = program.batches.find((b) => b.id === batchId);
    if (!batch) {
      set((s) => ({
        batchData: {
          ...s.batchData,
          [batchId]: {
            records: [],
            rawRows: [],
            rawCount: 0,
            dedupeCount: 0,
            loading: false,
            error: `Batch "${batchId}" not found in program "${programId}"`,
          },
        },
      }));
      return [];
    }

    const plugin = registry.getPlugin(program.type);
    if (!plugin) {
      set((s) => ({
        batchData: {
          ...s.batchData,
          [batchId]: {
            records: [],
            rawRows: [],
            rawCount: 0,
            dedupeCount: 0,
            loading: false,
            error: `No plugin registered for program type "${program.type}"`,
          },
        },
      }));
      return [];
    }

    // Set loading
    set((s) => ({
      batchData: {
        ...s.batchData,
        [batchId]: {
          records: [],
          rawRows: [],
          rawCount: 0,
          dedupeCount: 0,
          loading: true,
        },
      },
    }));

    try {
      // Determine file to fetch based on files in batch config
      const fileRole = Object.keys(batch.files)[0];
      const relPath = batch.files[fileRole];
      if (!relPath) {
        throw new Error(`Batch "${batchId}" has no files configured`);
      }

      const fileUrl = `/data/${relPath.replace(/^\//, '')}`;
      const rawText = await fetchWithCache(fileUrl, manifest.generatedAt);
      const parsedJson = parseJsonWithNan(rawText);

      // Validate with plugin schema
      const validateResult = plugin.schema.safeParse(parsedJson);
      if (!validateResult.success) {
        const errDetails = validateResult.error.errors
          .slice(0, 3)
          .map((e) => `[Row ${e.path.join('.')}]: ${e.message}`)
          .join(', ');
        throw new Error(`Schema validation error: ${errDetails}`);
      }

      const rawRows = validateResult.data;
      const { records, dedupeCount } = plugin.adapt(rawRows, batch, program);

      set((s) => ({
        batchData: {
          ...s.batchData,
          [batchId]: {
            records,
            rawRows,
            rawCount: rawRows.length,
            dedupeCount,
            loading: false,
          },
        },
      }));

      return records;
    } catch (err: any) {
      console.error(`Failed to load batch ${batchId}:`, err);
      set((s) => ({
        batchData: {
          ...s.batchData,
          [batchId]: {
            records: [],
            rawRows: [],
            rawCount: 0,
            dedupeCount: 0,
            loading: false,
            error: err?.message || 'Failed to load batch file',
          },
        },
      }));
      return [];
    }
  },

  loadAllBatchesInProgram: async (programId: string) => {
    const { manifest, loadBatch } = get();
    if (!manifest) return;
    const program = manifest.programs.find((p) => p.id === programId);
    if (!program) return;

    await Promise.all(
      program.batches.map((b) => loadBatch(programId, b.id))
    );
  },

  loadAllBatchesInManifest: async () => {
    const { manifest, loadBatch } = get();
    if (!manifest) return;
    const promises: Promise<any>[] = [];
    for (const prog of manifest.programs) {
      for (const b of prog.batches) {
        promises.push(loadBatch(prog.id, b.id));
      }
    }
    await Promise.all(promises);
  },

  setCurrentProgram: (programId: string, targetSubPage?: string) => {
    const { manifest } = get();
    if (!manifest) return;
    const program = manifest.programs.find((p) => p.id === programId);
    if (!program) return;

    // Pick default batch or first active batch
    const activeBatches = program.batches
      .filter((b) => b.status === 'active' || b.status === undefined)
      .sort((a, b) => a.order - b.order);

    const targetBatchId =
      program.defaultBatch || (activeBatches.length > 0 ? activeBatches[0].id : program.batches[0]?.id);

    set({
      currentProgramId: programId,
      currentBatchId: targetBatchId,
      currentSubPage: targetSubPage || 'overview',
    });
  },

  setCurrentBatch: (batchId: string, targetSubPage?: string) => {
    const { manifest, batchData, filters } = get();
    let sectionCleared = false;

    // Check if currently selected sections exist in new batch
    const newBatchData = batchData[batchId];
    if (newBatchData && newBatchData.records.length > 0 && filters.sections.length > 0) {
      const existingSections = new Set(newBatchData.records.map((r: any) => r.section));
      const validSections = filters.sections.filter((s) => existingSections.has(s));
      if (validSections.length !== filters.sections.length) {
        sectionCleared = true;
        set((s) => ({
          filters: {
            ...s.filters,
            sections: validSections,
          },
          toastMessage: 'Section filter cleared: not in this batch',
        }));
      }
    }

    set({
      currentBatchId: batchId,
      currentSubPage: targetSubPage || get().currentSubPage,
    });

    return { sectionCleared };
  },

  setCurrentSubPage: (subPage: string) => {
    set({ currentSubPage: subPage });
  },

  setFilters: (newFilters: Partial<FilterState>) => {
    set((s) => ({
      filters: { ...s.filters, ...newFilters },
    }));
  },

  resetFilters: () => {
    const { manifest } = get();
    const defaultThresholds = manifest?.settings.thresholds ?? { atRisk: 75, critical: 50 };
    set({
      filters: {
        ...defaultFilterState,
        thresholds: defaultThresholds,
      },
    });
  },

  toggleMaskNames: () => {
    set((s) => ({ maskNames: !s.maskNames }));
  },

  toggleShowArchived: () => {
    set((s) => ({ showArchived: !s.showArchived }));
  },

  setToast: (msg: string | null) => {
    set({ toastMessage: msg });
  },
}));
