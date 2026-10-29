import { Thresholds } from './manifest';
import { StatusBand } from './colors';

export interface FilterState {
  sections: string[];
  dateRange: {
    start: string | null;
    end: string | null;
    preset?: 'all' | 'last7' | 'last14' | 'thisMonth';
  };
  statusBands: StatusBand[];
  thresholds: Thresholds;
  alignBySession: boolean;
  searchQuery: string;
}

export const defaultFilterState: FilterState = {
  sections: [],
  dateRange: {
    start: null,
    end: null,
    preset: 'all',
  },
  statusBands: [],
  thresholds: {
    atRisk: 75,
    critical: 50,
  },
  alignBySession: false,
  searchQuery: '',
};

export function calculateDatePreset(
  preset: 'all' | 'last7' | 'last14' | 'thisMonth',
  latestDateStr: string | null | undefined
): { start: string | null; end: string | null } {
  if (preset === 'all' || !latestDateStr) {
    return { start: null, end: null };
  }

  const latest = new Date(latestDateStr);
  if (isNaN(latest.getTime())) {
    return { start: null, end: null };
  }

  const endStr = latest.toISOString().split('T')[0];

  if (preset === 'last7') {
    const start = new Date(latest);
    start.setDate(start.getDate() - 6);
    return { start: start.toISOString().split('T')[0], end: endStr };
  }

  if (preset === 'last14') {
    const start = new Date(latest);
    start.setDate(start.getDate() - 13);
    return { start: start.toISOString().split('T')[0], end: endStr };
  }

  if (preset === 'thisMonth') {
    const start = new Date(latest.getFullYear(), latest.getMonth(), 1);
    return { start: start.toISOString().split('T')[0], end: endStr };
  }

  return { start: null, end: null };
}

export function parseFiltersFromParams(
  searchParams: URLSearchParams,
  defaultThresholds: Thresholds
): FilterState {
  const sectionsParam = searchParams.get('sec');
  const sections = sectionsParam ? sectionsParam.split(',').filter(Boolean) : [];

  const start = searchParams.get('start') || null;
  const end = searchParams.get('end') || null;
  const preset = (searchParams.get('preset') as any) || 'all';

  const bandsParam = searchParams.get('band');
  const statusBands = (bandsParam ? bandsParam.split(',') : []) as StatusBand[];

  const atRisk = searchParams.get('atRisk') ? Number(searchParams.get('atRisk')) : defaultThresholds.atRisk;
  const critical = searchParams.get('crit') ? Number(searchParams.get('crit')) : defaultThresholds.critical;

  const alignBySession = searchParams.get('align') === '1';
  const searchQuery = searchParams.get('q') || '';

  return {
    sections,
    dateRange: { start, end, preset },
    statusBands,
    thresholds: { atRisk, critical },
    alignBySession,
    searchQuery,
  };
}

export function serializeFiltersToParams(
  filters: FilterState,
  defaultThresholds: Thresholds
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.sections.length > 0) {
    params.set('sec', filters.sections.join(','));
  }
  if (filters.dateRange.preset && filters.dateRange.preset !== 'all') {
    params.set('preset', filters.dateRange.preset);
  }
  if (filters.dateRange.start) {
    params.set('start', filters.dateRange.start);
  }
  if (filters.dateRange.end) {
    params.set('end', filters.dateRange.end);
  }
  if (filters.statusBands.length > 0) {
    params.set('band', filters.statusBands.join(','));
  }
  if (filters.thresholds.atRisk !== defaultThresholds.atRisk) {
    params.set('atRisk', filters.thresholds.atRisk.toString());
  }
  if (filters.thresholds.critical !== defaultThresholds.critical) {
    params.set('crit', filters.thresholds.critical.toString());
  }
  if (filters.alignBySession) {
    params.set('align', '1');
  }
  if (filters.searchQuery) {
    params.set('q', filters.searchQuery);
  }

  return params;
}
