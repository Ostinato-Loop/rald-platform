import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, raldAliasesTable, raldUsersTable } from "@workspace/db";
import type { AliasType, AliasResolution } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const createAliasSchema = z.object({
  alias: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9_.]+@rald$/, "Alias must be in the format username@rald"),
  aliasType: z.enum(["username", "rald_email", "phone", "email", "business", "school"]),
});

router.get("/resolve/:alias", async (req: Request, res: Response) => {
  const rawAlias = Array.isArray(req.params["alias"])
    ? req.params["alias"][0]
    : req.params["alias"];

  if (!rawAlias) {
    res.status(400).json({ error: "Alias is required" });
    return;
  }

  const alias = decodeURIComponent(rawAlias).toLowerCase().trim();

  const [record] = await db
    .select()
    .from(raldAliasesTable)
    .where(and(eq(raldAliasesTable.alias, alias), eq(raldAliasesTable.status, "active")))
    .limit(1);

  if (!record) {
    res.status(404).json({ error: "Alias not found or inactive" });
    return;
  }

  res.json({
    alias: record.alias,
    aliasType: record.aliasType,
    resolvedTo: record.resolvedTo,
  });
});

router.get("/aliases", requireAuth, async (req: Request, res: Response) => {
  const userId = req.jwtPayload!.sub;

  const aliases = await db
    .select()
    .from(raldAliasesTable)
    .where(eq(raldAliasesTable.userId, userId));

  res.json({ aliases });
});

router.post("/aliases", requireAuth, async (req: Request, res: Response) => {
  const userId = req.jwtPayload!.sub;

  const parsed = createAliasSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }

  const { alias, aliasType } = parsed.data;

  const existing = await db
    .select({ id: raldAliasesTable.id })
    .from(raldAliasesTable)
    .where(eq(raldAliasesTable.alias, alias))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Alias already taken" });
    return;
  }

  const [user] = await db
    .select()
    .from(raldUsersTable)
    .where(eq(raldUsersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const resolvedTo: AliasResolution = {
    walletId: user.walletId,
    username: user.username,
    raldEmail: user.raldEmail,
    trustScore: user.trustScore ?? 0,
    kycTier: user.kycTier ?? 1,
  };

  const [newAlias] = await db
    .insert(raldAliasesTable)
    .values({
      alias,
      aliasType: aliasType as AliasType,
      userId,
      status: "active",
      resolvedTo,
    })
    .returning();

  if (!newAlias) {
    res.status(500).json({ error: "Failed to create alias" });
    return;
  }

  logger.info({ userId, alias, aliasType }, "ALIA alias created");
  res.status(201).json(newAlias);
});

router.patch("/aliases/:id/status", requireAuth, async (req: Request, res: Response) => {
  const userId = req.jwtPayload!.sub;
  const id = Array.isArray(req.params["id"]) ? req.params["id"][0]! : req.params["id"]!;
  const statusSchema = z.object({
    status: z.enum(["active", "suspended", "archived"]),
  });

  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }

  const [existing] = await db
    .select({ id: raldAliasesTable.id, userId: raldAliasesTable.userId })
    .from(raldAliasesTable)
    .where(and(eq(raldAliasesTable.id, id), eq(raldAliasesTable.userId, userId)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Alias not found" });
    return;
  }

  const [updated] = await db
    .update(raldAliasesTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(raldAliasesTable.id, id))
    .returning();

  res.json(updated);
});

export default router;
