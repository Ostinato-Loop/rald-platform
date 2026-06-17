import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db, raldWalletsTable, raldTransactionsTable, raldAliasesTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router: IRouter = Router();

function generateRef(): string {
  return `ref_${crypto.randomBytes(8).toString("hex")}`;
}

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.jwtPayload!.sub;

  const [wallet] = await db
    .select()
    .from(raldWalletsTable)
    .where(eq(raldWalletsTable.userId, userId))
    .limit(1);

  if (!wallet) {
    res.status(404).json({ error: "Wallet not found. Please ensure PayRald is activated." });
    return;
  }

  res.json(wallet);
});

router.get("/transactions", requireAuth, async (req: Request, res: Response) => {
  const userId = req.jwtPayload!.sub;
  const limitSchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  });

  const parsed = limitSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params", issues: parsed.error.issues });
    return;
  }

  const [wallet] = await db
    .select({ id: raldWalletsTable.id })
    .from(raldWalletsTable)
    .where(eq(raldWalletsTable.userId, userId))
    .limit(1);

  if (!wallet) {
    res.status(404).json({ error: "Wallet not found" });
    return;
  }

  const txs = await db
    .select()
    .from(raldTransactionsTable)
    .where(eq(raldTransactionsTable.walletId, wallet.id))
    .orderBy(desc(raldTransactionsTable.createdAt))
    .limit(parsed.data.limit)
    .offset(parsed.data.offset);

  res.json({ transactions: txs });
});

const creditSchema = z.object({
  amount: z.number().int().min(1),
  currency: z.string().length(3).default("KES"),
  reference: z.string().min(1).max(128).optional(),
  description: z.string().max(255).optional(),
});

router.post("/credit", requireAuth, async (req: Request, res: Response) => {
  const userId = req.jwtPayload!.sub;
  const parsed = creditSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }

  const { amount, currency, description } = parsed.data;
  const reference = parsed.data.reference ?? generateRef();

  const [wallet] = await db
    .select()
    .from(raldWalletsTable)
    .where(eq(raldWalletsTable.userId, userId))
    .limit(1);

  if (!wallet) {
    res.status(404).json({ error: "Wallet not found" });
    return;
  }

  if (wallet.status !== "active") {
    res.status(403).json({ error: `Wallet is ${wallet.status}` });
    return;
  }

  const newBalance = wallet.balance + amount;

  await db
    .update(raldWalletsTable)
    .set({ balance: newBalance, updatedAt: new Date() })
    .where(eq(raldWalletsTable.id, wallet.id));

  const [tx] = await db
    .insert(raldTransactionsTable)
    .values({
      walletId: wallet.id,
      type: "credit",
      amount,
      currency,
      reference,
      description: description ?? "Credit",
      status: "completed",
    })
    .returning();

  logger.info({ userId, walletId: wallet.id, amount, newBalance }, "Wallet credited");
  res.status(201).json({ balance: newBalance, transaction: tx });
});

const debitSchema = z.object({
  amount: z.number().int().min(1),
  currency: z.string().length(3).default("KES"),
  reference: z.string().min(1).max(128).optional(),
  description: z.string().max(255).optional(),
});

router.post("/debit", requireAuth, async (req: Request, res: Response) => {
  const userId = req.jwtPayload!.sub;
  const parsed = debitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }

  const { amount, currency, description } = parsed.data;
  const reference = parsed.data.reference ?? generateRef();

  const [wallet] = await db
    .select()
    .from(raldWalletsTable)
    .where(eq(raldWalletsTable.userId, userId))
    .limit(1);

  if (!wallet) {
    res.status(404).json({ error: "Wallet not found" });
    return;
  }

  if (wallet.status !== "active") {
    res.status(403).json({ error: `Wallet is ${wallet.status}` });
    return;
  }

  if (wallet.balance < amount) {
    res.status(422).json({
      error: "Insufficient funds",
      balance: wallet.balance,
      required: amount,
    });
    return;
  }

  const newBalance = wallet.balance - amount;

  await db
    .update(raldWalletsTable)
    .set({ balance: newBalance, updatedAt: new Date() })
    .where(eq(raldWalletsTable.id, wallet.id));

  const [tx] = await db
    .insert(raldTransactionsTable)
    .values({
      walletId: wallet.id,
      type: "debit",
      amount,
      currency,
      reference,
      description: description ?? "Debit",
      status: "completed",
    })
    .returning();

  logger.info({ userId, walletId: wallet.id, amount, newBalance }, "Wallet debited");
  res.status(201).json({ balance: newBalance, transaction: tx });
});

const transferSchema = z.object({
  to: z.string().min(3),
  amount: z.number().int().min(1),
  currency: z.string().length(3).default("KES"),
  description: z.string().max(255).optional(),
});

router.post("/transfer", requireAuth, async (req: Request, res: Response) => {
  const userId = req.jwtPayload!.sub;
  const parsed = transferSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }

  const { to, amount, currency, description } = parsed.data;

  const [senderWallet] = await db
    .select()
    .from(raldWalletsTable)
    .where(eq(raldWalletsTable.userId, userId))
    .limit(1);

  if (!senderWallet) {
    res.status(404).json({ error: "Your wallet not found" });
    return;
  }

  if (senderWallet.status !== "active") {
    res.status(403).json({ error: `Your wallet is ${senderWallet.status}` });
    return;
  }

  if (senderWallet.balance < amount) {
    res.status(422).json({
      error: "Insufficient funds",
      balance: senderWallet.balance,
      required: amount,
    });
    return;
  }

  const aliasLookup = to.includes("@")
    ? to.toLowerCase()
    : `${to.toLowerCase()}@rald`;

  const [alias] = await db
    .select({ userId: raldAliasesTable.userId })
    .from(raldAliasesTable)
    .where(eq(raldAliasesTable.alias, aliasLookup))
    .limit(1);

  if (!alias) {
    res.status(404).json({ error: `Recipient alias "${aliasLookup}" not found` });
    return;
  }

  if (alias.userId === userId) {
    res.status(422).json({ error: "Cannot transfer to yourself" });
    return;
  }

  const [recipientWallet] = await db
    .select()
    .from(raldWalletsTable)
    .where(eq(raldWalletsTable.userId, alias.userId))
    .limit(1);

  if (!recipientWallet) {
    res.status(404).json({ error: "Recipient wallet not found" });
    return;
  }

  if (recipientWallet.status !== "active") {
    res.status(422).json({ error: "Recipient wallet is not active" });
    return;
  }

  const ref = generateRef();
  const desc = description ?? `Transfer to ${aliasLookup}`;

  await db
    .update(raldWalletsTable)
    .set({ balance: senderWallet.balance - amount, updatedAt: new Date() })
    .where(eq(raldWalletsTable.id, senderWallet.id));

  await db
    .update(raldWalletsTable)
    .set({ balance: recipientWallet.balance + amount, updatedAt: new Date() })
    .where(eq(raldWalletsTable.id, recipientWallet.id));

  const [outTx] = await db
    .insert(raldTransactionsTable)
    .values({
      walletId: senderWallet.id,
      type: "transfer_out",
      amount,
      currency,
      reference: `${ref}_out`,
      description: desc,
      fromWalletId: senderWallet.id,
      toWalletId: recipientWallet.id,
      status: "completed",
    })
    .returning();

  await db.insert(raldTransactionsTable).values({
    walletId: recipientWallet.id,
    type: "transfer_in",
    amount,
    currency,
    reference: `${ref}_in`,
    description: `Transfer from ${senderWallet.id}`,
    fromWalletId: senderWallet.id,
    toWalletId: recipientWallet.id,
    status: "completed",
  });

  logger.info(
    { userId, from: senderWallet.id, to: recipientWallet.id, amount },
    "Transfer completed",
  );

  res.status(201).json({
    senderBalance: senderWallet.balance - amount,
    transaction: outTx,
    to: aliasLookup,
  });
});

router.get("/admin/:walletId", requireAdmin, async (req: Request, res: Response) => {
  const raw = req.params["walletId"];
  const walletId = Array.isArray(raw) ? raw[0]! : raw!;

  const [wallet] = await db
    .select()
    .from(raldWalletsTable)
    .where(eq(raldWalletsTable.id, walletId))
    .limit(1);

  if (!wallet) {
    res.status(404).json({ error: `Wallet "${walletId}" not found` });
    return;
  }

  const txs = await db
    .select()
    .from(raldTransactionsTable)
    .where(eq(raldTransactionsTable.walletId, walletId))
    .orderBy(desc(raldTransactionsTable.createdAt))
    .limit(20);

  res.json({ wallet, recentTransactions: txs });
});

router.post("/admin/:walletId/freeze", requireAdmin, async (req: Request, res: Response) => {
  const raw = req.params["walletId"];
  const walletId = Array.isArray(raw) ? raw[0]! : raw!;

  const [wallet] = await db
    .select()
    .from(raldWalletsTable)
    .where(eq(raldWalletsTable.id, walletId))
    .limit(1);

  if (!wallet) {
    res.status(404).json({ error: `Wallet "${walletId}" not found` });
    return;
  }

  if (wallet.status === "closed") {
    res.status(422).json({ error: "Cannot freeze a closed wallet" });
    return;
  }

  if (wallet.status === "frozen") {
    res.json({ message: "Wallet is already frozen", wallet });
    return;
  }

  const [updated] = await db
    .update(raldWalletsTable)
    .set({ status: "frozen", updatedAt: new Date() })
    .where(eq(raldWalletsTable.id, walletId))
    .returning();

  logger.info(
    { adminId: req.jwtPayload!.sub, walletId },
    "Admin froze wallet",
  );

  res.json({ message: "Wallet frozen", wallet: updated });
});

router.post("/admin/:walletId/unfreeze", requireAdmin, async (req: Request, res: Response) => {
  const raw = req.params["walletId"];
  const walletId = Array.isArray(raw) ? raw[0]! : raw!;

  const [wallet] = await db
    .select()
    .from(raldWalletsTable)
    .where(eq(raldWalletsTable.id, walletId))
    .limit(1);

  if (!wallet) {
    res.status(404).json({ error: `Wallet "${walletId}" not found` });
    return;
  }

  if (wallet.status === "closed") {
    res.status(422).json({ error: "Cannot unfreeze a closed wallet" });
    return;
  }

  if (wallet.status === "active") {
    res.json({ message: "Wallet is already active", wallet });
    return;
  }

  const [updated] = await db
    .update(raldWalletsTable)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(raldWalletsTable.id, walletId))
    .returning();

  logger.info(
    { adminId: req.jwtPayload!.sub, walletId },
    "Admin unfroze wallet",
  );

  res.json({ message: "Wallet unfrozen", wallet: updated });
});

export default router;
