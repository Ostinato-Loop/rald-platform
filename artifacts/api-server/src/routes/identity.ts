import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { db, raldUsersTable } from "@workspace/db";
import {
  generateRaldId,
  buildWalletId,
  buildAliasHandle,
  buildRaldEmail,
  hashPassword,
  verifyPassword,
} from "../lib/crypto";
import { signJwt } from "../lib/jwt";
import {
  publishIdentityCreated,
  publishIdentityUpdated,
  publishIdentitySuspended,
} from "../lib/events";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const VALID_PRODUCTS = [
  "payrald",
  "messenger",
  "elimu",
  "dispatch",
  "mail",
  "alia",
  "crm",
  "control-center",
] as const;

const signupSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Username must be lowercase alphanumeric or underscore"),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Username must be lowercase alphanumeric or underscore")
    .optional(),
  displayName: z.string().min(1).max(100).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: "At least one field required" });

const activateProductSchema = z.object({
  product: z.enum(VALID_PRODUCTS),
});

function toPublicUser(user: typeof raldUsersTable.$inferSelect) {
  const { passwordHash: _ph, ...pub } = user;
  return pub;
}

router.post("/signup", async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }

  const { username, email, password } = parsed.data;

  const existing = await db
    .select({ id: raldUsersTable.id })
    .from(raldUsersTable)
    .where(or(eq(raldUsersTable.username, username), eq(raldUsersTable.email, email)))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Username or email already in use" });
    return;
  }

  const id = generateRaldId();
  const walletId = buildWalletId(id);
  const aliasHandle = buildAliasHandle(username);
  const raldEmail = buildRaldEmail(username);
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(raldUsersTable)
    .values({
      id,
      username,
      email,
      passwordHash,
      raldEmail,
      aliasHandle,
      walletId,
      trustScore: 0,
      kycTier: 1,
      activatedProducts: [],
    })
    .returning();

  if (!user) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }

  await publishIdentityCreated(user).catch((err) =>
    logger.error({ err }, "Event publish failed after signup"),
  );

  const token = signJwt({ sub: user.id, username: user.username, email: user.email });

  res.status(201).json({
    token,
    expiresIn: 3600,
    user: toPublicUser(user),
  });
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(raldUsersTable)
    .where(eq(raldUsersTable.email, email))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.suspended) {
    res.status(403).json({ error: "Account suspended", reason: user.suspended });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signJwt({ sub: user.id, username: user.username, email: user.email });

  res.json({
    token,
    expiresIn: 3600,
    user: toPublicUser(user),
  });
});

router.get("/profile", requireAuth, async (req: Request, res: Response) => {
  const userId = req.jwtPayload!.sub;

  const [user] = await db
    .select()
    .from(raldUsersTable)
    .where(eq(raldUsersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(toPublicUser(user));
});

router.patch("/profile", requireAuth, async (req: Request, res: Response) => {
  const userId = req.jwtPayload!.sub;
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }

  const { username } = parsed.data;

  if (username) {
    const conflict = await db
      .select({ id: raldUsersTable.id })
      .from(raldUsersTable)
      .where(eq(raldUsersTable.username, username))
      .limit(1);

    if (conflict.length > 0 && conflict[0]!.id !== userId) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }
  }

  const updates: Partial<typeof raldUsersTable.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (username) {
    updates.username = username;
    updates.aliasHandle = buildAliasHandle(username);
    updates.raldEmail = buildRaldEmail(username);
  }

  const [updated] = await db
    .update(raldUsersTable)
    .set(updates)
    .where(eq(raldUsersTable.id, userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await publishIdentityUpdated(userId, parsed.data).catch((err) =>
    logger.error({ err }, "Event publish failed after profile update"),
  );

  res.json(toPublicUser(updated));
});

router.post("/activate-product", requireAuth, async (req: Request, res: Response) => {
  const userId = req.jwtPayload!.sub;
  const parsed = activateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }

  const { product } = parsed.data;

  const [user] = await db
    .select({ id: raldUsersTable.id, activatedProducts: raldUsersTable.activatedProducts })
    .from(raldUsersTable)
    .where(eq(raldUsersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const current = user.activatedProducts ?? [];
  if (current.includes(product)) {
    res.json({ activatedProducts: current });
    return;
  }

  const next = [...current, product];

  await db
    .update(raldUsersTable)
    .set({ activatedProducts: next, updatedAt: new Date() })
    .where(eq(raldUsersTable.id, userId));

  await publishIdentityUpdated(userId, { activatedProduct: product }).catch((err) =>
    logger.error({ err }, "Event publish failed after product activation"),
  );

  res.json({ activatedProducts: next });
});

router.post("/suspend", requireAuth, async (req: Request, res: Response) => {
  const userId = req.jwtPayload!.sub;
  const { userId: targetId, reason } = req.body as { userId?: string; reason?: string };

  const id = targetId ?? userId;
  if (!reason) {
    res.status(400).json({ error: "Reason is required" });
    return;
  }

  await db
    .update(raldUsersTable)
    .set({ suspended: reason, updatedAt: new Date() })
    .where(eq(raldUsersTable.id, id));

  await publishIdentitySuspended(id, reason).catch((err) =>
    logger.error({ err }, "Event publish failed after suspension"),
  );

  res.json({ ok: true });
});

export default router;
