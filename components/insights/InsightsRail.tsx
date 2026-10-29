'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { registry, MetricContext, InsightItem } from '@/core/registry';
import { useRouter } from 'next/navigation';

interface InsightsRailProps {
  programType: string;
  context: MetricContext;
  programSlug: string;
  batchSlug?: string;
  maxItems?: number;
}

export const InsightsRail: React.FC<InsightsRailProps> = ({
  programType,
  context,
  programSlug,
  batchSlug,
  maxItems = 5,
}) => {
  const router = useRouter();
  const rules = registry.getInsightsForType(programType);

  const insights: InsightItem[] = [];
  for (const rule of rules) {
    const res = rule.evaluate(context);
    if (res) {
      insights.push(res);
      if (insights.length >= maxItems) break;
    }
  }

  if (insights.length === 0) {
    return (
      <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 text-xs text-go2x-text-muted">
        No major attendance issues detected.
      </div>
    );
  }

  return (
    <div className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm">
      <div className="flex items-center justify-between border-b border-go2x-border pb-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-go2x-text-muted">
          Key Notes & Alerts
        </h3>
        <span className="text-[11px] font-medium text-go2x-accent">
          {insights.length} active
        </span>
      </div>

      <ul className="mt-3 space-y-3">
        {insights.map((item) => {
          const isCritical = item.severity === 'critical';
          const isWarn = item.severity === 'warn';

          const handleViewClick = () => {
            if (!item.link) return;
            const targetPage = item.link.page;
            const basePath = batchSlug
              ? `/${programSlug}/${batchSlug}/${targetPage}`
              : `/${programSlug}/${targetPage}`;
            router.push(basePath);
          };

          return (
            <li
              key={item.id}
              className={`flex items-start gap-2.5 rounded-go2x-md p-2 text-xs transition-colors ${
                isCritical
                  ? 'bg-go2x-bad-soft text-go2x-bad-text'
                  : isWarn
                  ? 'bg-go2x-warn-soft text-go2x-warn-text'
                  : 'bg-go2x-surface-alt text-go2x-text'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isCritical ? (
                  <AlertCircle className="h-4 w-4 text-go2x-bad" />
                ) : isWarn ? (
                  <AlertTriangle className="h-4 w-4 text-go2x-warn" />
                ) : (
                  <Info className="h-4 w-4 text-go2x-accent" />
                )}
              </div>

              <div className="flex-1 leading-relaxed">
                <span>{item.text}</span>
                {item.link && (
                  <button
                    type="button"
                    onClick={handleViewClick}
                    className="ml-2 inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 hover:opacity-80"
                  >
                    View <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
