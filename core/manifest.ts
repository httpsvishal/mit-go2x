import { z } from 'zod';

export function parseJsonWithNan(text: string): any {
  // Replace unquoted NaN tokens from pandas/python exports with null
  const sanitized = text.replace(/:\s*NaN\b/g, ': null');
  return JSON.parse(sanitized);
}

export const ThresholdsSchema = z.object({
  atRisk: z.number().default(75),
  critical: z.number().default(50),
});

export const SettingsSchema = z.object({
  thresholds: ThresholdsSchema.default({ atRisk: 75, critical: 50 }),
  minSampleSize: z.number().default(5),
  streakAlert: z.number().default(3),
  lowTurnoutBelowPct: z.number().default(50),
  maskNamesDefault: z.boolean().default(false),
  productName: z.string().default('Go2X Attendance'),
});

export const BatchConfigSchema = z.object({
  id: z.string().min(1, 'Batch id is required'),
  label: z.string().min(1, 'Batch label is required'),
  status: z.enum(['active', 'archived']).default('active'),
  order: z.number().default(999),
  files: z.record(z.string()),
  where: z.record(z.any()).optional(),
  fieldMap: z.record(z.string()).optional(),
  thresholds: ThresholdsSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

export const ProgramConfigSchema = z.object({
  id: z.string().min(1, 'Program id is required'),
  label: z.string().min(1, 'Program label is required'),
  type: z.string().min(1, 'Program type is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  defaultBatch: z.string().optional(),
  batches: z.array(BatchConfigSchema).default([]),
});

export const ManifestSchema = z.object({
  schemaVersion: z.number().int().refine((v) => v === 1, {
    message: 'Unsupported schemaVersion: only version 1 is supported',
  }),
  generatedAt: z.string().optional(),
  settings: SettingsSchema.default({}),
  programs: z.array(ProgramConfigSchema).min(1, 'At least one program is required'),
});

export type Thresholds = z.infer<typeof ThresholdsSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type BatchConfig = z.infer<typeof BatchConfigSchema>;
export type ProgramConfig = z.infer<typeof ProgramConfigSchema>;
export type Manifest = z.infer<typeof ManifestSchema>;

export async function loadManifest(manifestPath = '/data/manifest.json'): Promise<Manifest> {
  const isNode = typeof window === 'undefined';
  let rawText: string;

  if (isNode) {
    const fs = await import('fs');
    const path = await import('path');
    let resolved = manifestPath;
    if (!path.isAbsolute(manifestPath) || manifestPath.startsWith('/data/')) {
      resolved = path.join(process.cwd(), 'public', manifestPath.replace(/^\//, ''));
    }
    rawText = fs.readFileSync(resolved, 'utf-8');
  } else {
    // Append cache-busting timestamp or generatedAt if available
    const res = await fetch(manifestPath);
    if (!res.ok) {
      throw new Error(`Failed to load manifest at ${manifestPath}: ${res.status} ${res.statusText}`);
    }
    rawText = await res.text();
  }

  const parsed = parseJsonWithNan(rawText);
  const validated = ManifestSchema.safeParse(parsed);
  if (!validated.success) {
    const formattedErrors = validated.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    throw new Error(`Manifest validation failed: ${formattedErrors}`);
  }

  return validated.data;
}
