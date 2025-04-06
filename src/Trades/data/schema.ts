import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  openDate: z.string(),
  closeDate: z.string(),
  symbol: z.string(),
  side: z.string(),
  entry: z.number(),
  exit: z.number(),
  qty: z.number(),
  pnl: z.number(),
  status: z.string(),
  tradeId: z.string(),
});

export type Task = z.infer<typeof taskSchema>;
