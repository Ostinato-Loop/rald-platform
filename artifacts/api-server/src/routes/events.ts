import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { db, raldEventsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const listQuerySchema = z.object({
  type: z.string().optional(),
  processed: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params", issues: parsed.error.issues });
    return;
  }

  const { type, processed, limit, offset } = parsed.data;

  const conditions = [];
  if (type !== undefined) conditions.push(eq(raldEventsTable.type, type as never));
  if (processed !== undefined) conditions.push(eq(raldEventsTable.processed, processed));

  const events = await db
    .select()
    .from(raldEventsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(raldEventsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [total] = await db
    .select({ count: count() })
    .from(raldEventsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json({ events, total: total?.count ?? 0, limit, offset });
});

router.get("/stats", requireAuth, async (_req: Request, res: Response) => {
  const rows = await db
    .select({
      type: raldEventsTable.type,
      processed: raldEventsTable.processed,
      count: count(),
    })
    .from(raldEventsTable)
    .groupBy(raldEventsTable.type, raldEventsTable.processed);

  const byType: Record<string, { total: number; processed: number; pending: number }> = {};

  for (const row of rows) {
    if (!byType[row.type]) byType[row.type] = { total: 0, processed: 0, pending: 0 };
    byType[row.type]!.total += Number(row.count);
    if (row.processed) byType[row.type]!.processed += Number(row.count);
    else byType[row.type]!.pending += Number(row.count);
  }

  const totalPending = Object.values(byType).reduce((s, v) => s + v.pending, 0);
  const totalProcessed = Object.values(byType).reduce((s, v) => s + v.processed, 0);

  res.json({ byType, totalPending, totalProcessed });
});

router.post("/:id/retry", requireAuth, async (req: Request, res: Response) => {
  const id = Array.isArray(req.params["id"]) ? req.params["id"][0]! : req.params["id"]!;

  const [event] = await db
    .select({ id: raldEventsTable.id, processed: raldEventsTable.processed })
    .from(raldEventsTable)
    .where(eq(raldEventsTable.id, id))
    .limit(1);

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  await db
    .update(raldEventsTable)
    .set({ processed: false, processedAt: null, error: null, retries: "0" })
    .where(eq(raldEventsTable.id, id));

  res.json({ ok: true, message: "Event queued for retry" });
});

export default router;
