import { z } from 'zod';

export const MatrixRawRowSchema = z
  .object({
    year: z.string().optional(),
    section: z.string(),
    name: z.string(),
    roll_no: z.coerce.string(),
    date: z.string(),
    status: z.enum(['present', 'absent', 'late_joining', 'no_record']),
    sheet_overall_pct: z.number().optional(),
  })
  .strip(); // Unknown columns (phone, email, etc.) are strictly dropped

export const MatrixRawSchema = z.array(MatrixRawRowSchema);

export type MatrixRawRow = z.infer<typeof MatrixRawRowSchema>;

export interface StudentSession {
  programId: string;
  batchId: string;
  studentId: string; // roll_no, fallback name
  rollNo: string;
  name: string;
  section: string;
  date: string;
  status: 'present' | 'absent' | 'late_joining' | 'no_record';
}
