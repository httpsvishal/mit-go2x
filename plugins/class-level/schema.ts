import { z } from 'zod';

export const CoeRawRowSchema = z
  .object({
    Date: z.string(),
    Period: z.coerce.number(),
    Section: z.string(),
    Status: z.enum(['Filled', 'Not Filled', 'filled', 'not filled', 'Pending', 'pending']).transform((s) => {
      const lower = s.toLowerCase();
      return lower === 'filled' ? ('filled' as const) : ('pending' as const);
    }),
    Present: z.coerce.number().default(0),
    Absent: z.coerce.number().default(0),
    Leave: z.coerce.number().default(0),
    'Total Marked': z.coerce.number().default(0),
    Weekday: z.string().optional(),
    'Paper Code': z.string().optional(),
    'Staff Name': z.string().optional(),
    'Attendance %': z.union([z.number(), z.null()]).optional(),
  })
  .strip(); // Unknown columns (phone, email, etc.) are strictly dropped

export const CoeRawSchema = z.array(CoeRawRowSchema);

export type CoeRawRow = z.infer<typeof CoeRawRowSchema>;

export interface ClassRecord {
  programId: string;
  batchId: string;
  date: string;
  weekday: string;
  period: number;
  section: string;
  status: 'filled' | 'pending';
  present: number;
  absent: number;
  leave: number;
  total: number;
  pct: number | null;
  paperCode?: string;
  staff?: string;
}
