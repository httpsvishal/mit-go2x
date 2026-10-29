'use client';

import React from 'react';
import { KpiCard } from './KpiCard';
import { registry, MetricContext } from '@/core/registry';
import { useRouter } from 'next/navigation';

interface KpiRowProps {
  kpiIds: string[];
  context: MetricContext;
  programSlug: string;
  batchSlug?: string;
}

export const KpiRow: React.FC<KpiRowProps> = ({
  kpiIds,
  context,
  programSlug,
  batchSlug,
}) => {
  const router = useRouter();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {kpiIds.map((id) => {
        const def = registry.getKpi(id, context.program?.type);
        if (!def) return null;

        const result = def.compute(context);

        const handleCardClick = () => {
          if (!result.drilldown) return;
          const targetPage = result.drilldown.page;
          const basePath = batchSlug
            ? `/${programSlug}/${batchSlug}/${targetPage}`
            : `/${programSlug}/${targetPage}`;
          router.push(basePath);
        };

        return (
          <KpiCard
            key={id}
            id={id}
            label={def.label}
            description={def.description}
            result={result}
            onClick={result.drilldown ? handleCardClick : undefined}
          />
        );
      })}
    </div>
  );
};
