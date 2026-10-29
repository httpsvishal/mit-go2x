import React from 'react';
import { z } from 'zod';
import { BatchConfig, ProgramConfig, Manifest, Thresholds } from './manifest';
import { FilterState } from './filters';

export interface MetricContext {
  records: any[];
  allRecords?: any[];
  batch: BatchConfig;
  program: ProgramConfig;
  filters: FilterState;
  thresholds: Thresholds;
  manifest: Manifest;
  maskNames: boolean;
  batchesInView?: BatchConfig[];
  batchDataMap?: Record<string, any[]>;
}

export interface KpiResult {
  value: number | null;
  unit: '%' | 'count' | 'pts';
  delta?: number | null;
  sub?: string;
  sparkline?: number[];
  status?: 'ok' | 'warn' | 'bad' | 'neutral';
  drilldown?: { page: string; filters?: Partial<FilterState> };
}

export interface KpiDefinition {
  id: string;
  label: string;
  description: string;
  appliesTo: string[];
  compute(ctx: MetricContext): KpiResult;
}

export interface ChartProps {
  records: any[];
  batch: BatchConfig;
  program: ProgramConfig;
  thresholds: Thresholds;
  filters: FilterState;
  maskNames: boolean;
  onFilterChange?: (newFilters: Partial<FilterState>) => void;
  batchDataMap?: Record<string, any[]>;
  batchesInView?: BatchConfig[];
}

export interface ChartDefinition {
  id: string;
  title: string;
  subtitle: string;
  appliesTo: string[];
  component: React.ComponentType<ChartProps>;
  minRecords?: number;
}

export interface InsightItem {
  id: string;
  text: string;
  severity: 'info' | 'warn' | 'critical';
  link?: { page: string; filters?: Partial<FilterState> };
}

export interface InsightRule {
  id: string;
  appliesTo: string[];
  evaluate(ctx: MetricContext): InsightItem | null;
}

export interface PageDefinition {
  id: string;
  label: string;
  component: React.ComponentType<any>;
}

export interface DataCheckResult {
  id: string;
  name: string;
  severity: 'info' | 'warning' | 'error';
  explanation: string;
  affectedCount: number;
  details?: string[];
}

export interface DataCheck {
  id: string;
  name: string;
  appliesTo: string[];
  run(rawRows: any[], records: any[], batch: BatchConfig): DataCheckResult;
}

export interface ProgramTypePlugin<Raw = any, Rec = any> {
  type: string;
  schema: z.ZodType<any>;
  adapt(raw: any[], batch: BatchConfig, program: ProgramConfig): { records: Rec[]; dedupeCount: number };
  kpis: KpiDefinition[];
  charts: ChartDefinition[];
  insights: InsightRule[];
  pages: PageDefinition[];
  dataQualityChecks: DataCheck[];
}

class RegistryManager {
  private plugins = new Map<string, ProgramTypePlugin>();
  private pluginKpis = new Map<string, Map<string, KpiDefinition>>();
  private kpis = new Map<string, KpiDefinition>();
  private charts = new Map<string, ChartDefinition>();
  private insights = new Map<string, InsightRule>();
  private dataChecks = new Map<string, DataCheck>();

  registerPlugin(plugin: ProgramTypePlugin) {
    this.plugins.set(plugin.type, plugin);

    const kpiMap = new Map<string, KpiDefinition>();
    plugin.kpis.forEach((kpi) => {
      kpiMap.set(kpi.id, kpi);
      // Also register into global map with fallback
      this.kpis.set(kpi.id, kpi);
    });
    this.pluginKpis.set(plugin.type, kpiMap);

    plugin.charts.forEach((chart) => {
      this.charts.set(chart.id, chart);
    });

    plugin.insights.forEach((insight) => {
      this.insights.set(insight.id, insight);
    });

    plugin.dataQualityChecks.forEach((check) => {
      this.dataChecks.set(check.id, check);
    });
  }

  getPlugin(type: string): ProgramTypePlugin | undefined {
    return this.plugins.get(type);
  }

  getAllPlugins(): ProgramTypePlugin[] {
    return Array.from(this.plugins.values());
  }

  getKpi(id: string, programType?: string): KpiDefinition | undefined {
    if (programType && this.pluginKpis.has(programType)) {
      const scoped = this.pluginKpis.get(programType)!.get(id);
      if (scoped) return scoped;
    }

    // If no exact match in requested plugin, look across all plugins matching appliesTo
    for (const [pType, pMap] of this.pluginKpis.entries()) {
      const kpi = pMap.get(id);
      if (kpi && (!programType || kpi.appliesTo.includes(programType) || kpi.appliesTo.includes('*'))) {
        return kpi;
      }
    }

    return this.kpis.get(id);
  }

  getChart(id: string, programType?: string): ChartDefinition | undefined {
    if (programType && this.plugins.has(programType)) {
      const chart = this.plugins.get(programType)!.charts.find((c) => c.id === id);
      if (chart) return chart;
    }

    for (const plugin of this.plugins.values()) {
      const chart = plugin.charts.find((c) => c.id === id);
      if (chart && (!programType || chart.appliesTo.includes(programType) || chart.appliesTo.includes('*'))) {
        return chart;
      }
    }

    return this.charts.get(id);
  }

  getInsightsForType(type: string): InsightRule[] {
    const list: InsightRule[] = [];
    const seenIds = new Set<string>();

    const targetPlugin = this.plugins.get(type);
    if (targetPlugin) {
      targetPlugin.insights.forEach((ins) => {
        list.push(ins);
        seenIds.add(ins.id);
      });
    }

    for (const [pType, plugin] of this.plugins.entries()) {
      if (pType !== type) {
        plugin.insights.forEach((ins) => {
          if (!seenIds.has(ins.id) && (ins.appliesTo.includes(type) || ins.appliesTo.includes('*'))) {
            list.push(ins);
            seenIds.add(ins.id);
          }
        });
      }
    }

    return list;
  }

  getDataChecksForType(type: string): DataCheck[] {
    const list: DataCheck[] = [];
    const seenIds = new Set<string>();

    const targetPlugin = this.plugins.get(type);
    if (targetPlugin) {
      targetPlugin.dataQualityChecks.forEach((check) => {
        list.push(check);
        seenIds.add(check.id);
      });
    }

    for (const [pType, plugin] of this.plugins.entries()) {
      if (pType !== type) {
        plugin.dataQualityChecks.forEach((check) => {
          if (!seenIds.has(check.id) && (check.appliesTo.includes(type) || check.appliesTo.includes('*'))) {
            list.push(check);
            seenIds.add(check.id);
          }
        });
      }
    }

    return list;
  }
}

export const registry = new RegistryManager();
