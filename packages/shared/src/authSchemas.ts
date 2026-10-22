import { z } from 'zod';

export const SessionInputSchema = z.object({ initData: z.string().min(1).max(8192).optional() }).strict();

export type SessionInput = z.infer<typeof SessionInputSchema>;
