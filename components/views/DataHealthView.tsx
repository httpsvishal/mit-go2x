'use client';

import React from 'react';
import { Manifest } from '@/core/manifest';
import { registry } from '@/core/registry';

interface DataHealthViewProps {
  manifest: Manifest;
  batchData: Record<string, any>;
}

export const DataHealthView: React.FC<DataHealthViewProps> = ({
  manifest,
  batchData,
}) => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex items-center justify-between border-b border-go2x-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-go2x-text">
            Global Data Health & Diagnostics
          </h1>
          <p className="text-xs text-go2x-text-muted mt-1">
            Automated validation checks across manifest structure, JSON schemas, duplicates, and marking anomalies.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {manifest.programs.map((prog) => (
          <div key={prog.id} className="space-y-3">
            <h2 className="text-base font-bold text-go2x-text">{prog.label} Program Batches</h2>
            <div className="space-y-3">
              {prog.batches.map((batch) => {
                const bInfo = batchData[batch.id];
                const plugin = registry.getPlugin(prog.type);
                const checks = plugin ? plugin.dataQualityChecks : [];

                return (
                  <div
                    key={batch.id}
                    className="rounded-go2x-lg border border-go2x-border bg-go2x-surface p-4 shadow-go2x-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-go2x-text">{batch.label}</span>
                        <span className="text-xs text-go2x-text-muted">({batch.id})</span>
                      </div>
                      {bInfo?.error ? (
                        <span className="rounded bg-go2x-bad-soft px-2 py-0.5 text-xs font-semibold text-go2x-bad-text">
                          Failed to load
                        </span>
                      ) : (
                        <span className="rounded bg-go2x-ok-soft px-2 py-0.5 text-xs font-semibold text-go2x-ok-text">
                          Valid JSON
                        </span>
                      )}
                    </div>

                    {bInfo?.error && (
                      <div className="rounded bg-go2x-bad-soft p-2.5 text-xs text-go2x-bad-text">
                        {bInfo.error}
                      </div>
                    )}

                    {bInfo && !bInfo.error && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-go2x-surface-alt p-2.5 rounded-go2x-md">
                        <div>Raw Rows: {bInfo.rawCount}</div>
                        <div>Valid Records: {bInfo.records.length}</div>
                        <div>Duplicates Removed: {bInfo.dedupeCount}</div>
                        <div>Status: Ready</div>
                      </div>
                    )}

                    {/* Plugin Data Checks */}
                    {bInfo && !bInfo.error && checks.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-semibold uppercase text-go2x-text-muted">
                          Quality Checks:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {checks.map((check) => {
                            const result = check.run(bInfo.rawRows, bInfo.records, batch);
                            return (
                              <div
                                key={check.id}
                                className={`p-2.5 rounded-go2x-md border ${
                                  result.severity === 'error'
                                    ? 'border-go2x-bad/40 bg-go2x-bad-soft/40'
                                    : result.severity === 'warning'
                                    ? 'border-go2x-warn/40 bg-go2x-warn-soft/40'
                                    : 'border-go2x-border bg-go2x-surface'
                                }`}
                              >
                                <div className="flex items-center justify-between font-semibold">
                                  <span>{result.name}</span>
                                  <span
                                    className={
                                      result.affectedCount > 0 && result.severity === 'error'
                                        ? 'text-go2x-bad-text'
                                        : result.affectedCount > 0 && result.severity === 'warning'
                                        ? 'text-go2x-warn-text'
                                        : 'text-go2x-ok-text'
                                    }
                                  >
                                    {result.affectedCount} issue(s)
                                  </span>
                                </div>
                                <p className="text-[11px] text-go2x-text-muted mt-1">
                                  {result.explanation}
                                </p>
                                {result.details && result.details.length > 0 && (
                                  <ul className="mt-1 space-y-0.5 text-[10px] text-go2x-text">
                                    {result.details.map((d, i) => (
                                      <li key={i}>• {d}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
