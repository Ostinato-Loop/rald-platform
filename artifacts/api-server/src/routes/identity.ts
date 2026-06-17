import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { eq, or, and, gte, lte, sql, isNotNull, isNull } from "drizzle-orm";
import { db, raldUsersTable, raldAliasesTable } from "@workspace/db";
import type { AliasResolution } from "@workspace/db";
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
import { requireAuth, requireAdmin } from "../middlewares/auth";
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

  const aliasResolution: AliasResolution = {
    walletId: user.walletId,
    username: user.username,
    raldEmail: user.raldEmail,
    trustScore: user.trustScore ?? 0,
    kycTier: user.kycTier ?? 1,
  };

  await db
    .insert(raldAliasesTable)
    .values({
      alias: aliasHandle,
      aliasType: "username",
      userId: user.id,
      status: "active",
      resolvedTo: aliasResolution,
    })
    .catch((err) => logger.error({ err }, "Failed to create primary ALIA alias after signup"));

  await publishIdentityCreated(user).catch((err) =>
    logger.error({ err }, "Event publish failed after signup"),
  );

  const token = signJwt({ sub: user.id, username: user.username, email: user.email, role: user.role ?? "user" });

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

  const token = signJwt({ sub: user.id, username: user.username, email: user.email, role: user.role ?? "user" });

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

const adminUserListSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  suspended: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  kycTier: z.coerce.number().int().min(1).max(3).optional(),
  createdAfter: z.string().datetime({ offset: true }).optional(),
  createdBefore: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(["createdAt", "username", "trustScore", "kycTier"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

router.get("/admin", requireAdmin, async (req: Request, res: Response) => {
  const parsed = adminUserListSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params", issues: parsed.error.issues });
    return;
  }

  const { role, suspended, kycTier, createdAfter, createdBefore, limit, offset, sortBy, sortDir } =
    parsed.data;

  const filters = [];
  if (role) filters.push(eq(raldUsersTable.role, role));
  if (kycTier !== undefined) filters.push(eq(raldUsersTable.kycTier, kycTier));
  if (createdAfter) filters.push(gte(raldUsersTable.createdAt, new Date(createdAfter)));
  if (createdBefore) filters.push(lte(raldUsersTable.createdAt, new Date(createdBefore)));
  if (suspended === true) filters.push(isNotNull(raldUsersTable.suspended));
  if (suspended === false) filters.push(isNull(raldUsersTable.suspended));

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const col =
    sortBy === "username" ? raldUsersTable.username :
    sortBy === "trustScore" ? raldUsersTable.trustScore :
    sortBy === "kycTier" ? raldUsersTable.kycTier :
    raldUsersTable.createdAt;

  const orderClause = sortDir === "asc" ? sql`${col} asc` : sql`${col} desc`;

  const [users, [countRow]] = await Promise.all([
    db
      .select({
        id: raldUsersTable.id,
        username: raldUsersTable.username,
        email: raldUsersTable.email,
        raldEmail: raldUsersTable.raldEmail,
        aliasHandle: raldUsersTable.aliasHandle,
        walletId: raldUsersTable.walletId,
        role: raldUsersTable.role,
        trustScore: raldUsersTable.trustScore,
        kycTier: raldUsersTable.kycTier,
        activatedProducts: raldUsersTable.activatedProducts,
        suspended: raldUsersTable.suspended,
        createdAt: raldUsersTable.createdAt,
        updatedAt: raldUsersTable.updatedAt,
      })
      .from(raldUsersTable)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(raldUsersTable)
      .where(whereClause),
  ]);

  const total = countRow?.total ?? 0;

  res.json({
    users,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + users.length < total,
    },
  });
});

const setRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

router.post("/admin/:userId/set-role", requireAdmin, async (req: Request, res: Response) => {
  const raw = req.params["userId"];
  const targetId = Array.isArray(raw) ? raw[0]! : raw!;
  const adminId = req.jwtPayload!.sub;

  const parsed = setRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }

  const { role } = parsed.data;

  if (targetId === adminId) {
    res.status(422).json({ error: "An admin cannot change their own role" });
    return;
  }

  const [user] = await db
    .select({ id: raldUsersTable.id, username: raldUsersTable.username, role: raldUsersTable.role })
    .from(raldUsersTable)
    .where(eq(raldUsersTable.id, targetId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: `User "${targetId}" not found` });
    return;
  }

  if (user.role === role) {
    res.json({ message: `User is already "${role}"`, userId: targetId, role });
    return;
  }

  await db
    .update(raldUsersTable)
    .set({ role, updatedAt: new Date() })
    .where(eq(raldUsersTable.id, targetId));

  logger.info(
    { adminId, targetId, username: user.username, previousRole: user.role, newRole: role },
    "Admin changed user role",
  );

  res.json({ userId: targetId, username: user.username, previousRole: user.role, role });
});

export default router;
