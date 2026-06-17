import { eq, and, lt } from "drizzle-orm";
import { db, raldEventsTable, raldAliasesTable, raldUsersTable, raldWalletsTable } from "@workspace/db";
import type { RaldEvent } from "@workspace/db";
import type { AliasResolution } from "@workspace/db";
import { logger } from "./logger";

const MAX_RETRIES = 3;
const POLL_INTERVAL_MS = 5000;
const BATCH_SIZE = 50;

let _running = false;
let _timer: ReturnType<typeof setTimeout> | null = null;

export function startEventBus(): void {
  if (_running) return;
  _running = true;
  logger.info("RALD Event Bus worker started");
  scheduleNext();
}

export function stopEventBus(): void {
  _running = false;
  if (_timer) {
    clearTimeout(_timer);
    _timer = null;
  }
  logger.info("RALD Event Bus worker stopped");
}

function scheduleNext(): void {
  if (!_running) return;
  _timer = setTimeout(async () => {
    try {
      await processBatch();
    } catch (err) {
      logger.error({ err }, "Event bus poll cycle failed");
    }
    scheduleNext();
  }, POLL_INTERVAL_MS);
}

async function processBatch(): Promise<void> {
  const events = await db
    .select()
    .from(raldEventsTable)
    .where(
      and(
        eq(raldEventsTable.processed, false),
        lt(raldEventsTable.retries, String(MAX_RETRIES)),
      ),
    )
    .orderBy(raldEventsTable.createdAt)
    .limit(BATCH_SIZE);

  if (events.length === 0) return;

  logger.info({ count: events.length }, "Event bus processing batch");

  for (const event of events) {
    await processEvent(event);
  }
}

async function processEvent(event: RaldEvent): Promise<void> {
  try {
    await dispatch(event);
    await db
      .update(raldEventsTable)
      .set({ processed: true, processedAt: new Date(), error: null })
      .where(eq(raldEventsTable.id, event.id));
    logger.info({ eventId: event.id, type: event.type }, "Event processed");
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const nextRetries = String(Number(event.retries) + 1);
    const deadLettered = Number(nextRetries) >= MAX_RETRIES;

    await db
      .update(raldEventsTable)
      .set({
        error: errorMsg,
        retries: nextRetries,
        ...(deadLettered ? { processed: true, processedAt: new Date() } : {}),
      })
      .where(eq(raldEventsTable.id, event.id));

    logger.error(
      { eventId: event.id, type: event.type, retries: nextRetries, deadLettered, err },
      "Event processing failed",
    );
  }
}

async function dispatch(event: RaldEvent): Promise<void> {
  const payload = event.payload as Record<string, unknown>;

  switch (event.type) {
    case "alias.provision_requested":
      await handleAliasProvision(payload);
      break;

    case "wallet.provision_requested":
      await handleWalletProvision(payload);
      break;

    case "mail.provision_requested":
      await handleMailProvision(payload);
      break;

    case "identity.created":
      logger.info({ userId: payload["userId"] }, "[fan-out] identity.created received");
      break;

    case "identity.updated":
      logger.info({ userId: payload["userId"] }, "[fan-out] identity.updated received");
      break;

    case "identity.suspended":
      logger.info({ userId: payload["userId"] }, "[fan-out] identity.suspended received");
      break;

    case "identity.reactivated":
      logger.info({ userId: payload["userId"] }, "[fan-out] identity.reactivated received");
      break;

    case "identity.kyc_approved":
      logger.info(
        {
          userId: payload["userId"],
          previousTier: payload["previousTier"],
          newTier: payload["newTier"],
          adminId: payload["adminId"],
        },
        "[fan-out] identity.kyc_approved — user KYC tier updated",
      );
      break;

    case "identity.kyc_requested":
      logger.info(
        {
          userId: payload["userId"],
          currentTier: payload["currentTier"],
          requestedTier: payload["requestedTier"],
          documentsCount: Array.isArray(payload["documents"]) ? payload["documents"].length : 0,
        },
        "[fan-out] identity.kyc_requested — queued for compliance review",
      );
      break;

    default:
      logger.warn({ type: event.type }, "Event bus: no handler for event type");
  }
}

async function handleAliasProvision(payload: Record<string, unknown>): Promise<void> {
  const userId = payload["userId"] as string;
  const aliasHandle = payload["aliasHandle"] as string;
  const username = payload["username"] as string;

  if (!userId || !aliasHandle) {
    throw new Error("alias.provision_requested missing userId or aliasHandle");
  }

  const [existing] = await db
    .select({ id: raldAliasesTable.id })
    .from(raldAliasesTable)
    .where(eq(raldAliasesTable.alias, aliasHandle))
    .limit(1);

  if (existing) {
    logger.info({ aliasHandle }, "Alias already exists — provision is a no-op");
    return;
  }

  const [user] = await db
    .select()
    .from(raldUsersTable)
    .where(eq(raldUsersTable.id, userId))
    .limit(1);

  if (!user) throw new Error(`User ${userId} not found for alias provisioning`);

  const resolvedTo: AliasResolution = {
    walletId: user.walletId,
    username: user.username,
    raldEmail: user.raldEmail,
    trustScore: user.trustScore ?? 0,
    kycTier: user.kycTier ?? 1,
  };

  await db.insert(raldAliasesTable).values({
    alias: aliasHandle,
    aliasType: "username",
    userId,
    status: "active",
    resolvedTo,
  });

  logger.info({ userId, aliasHandle, username }, "Alias provisioned via event bus");
}

async function handleWalletProvision(payload: Record<string, unknown>): Promise<void> {
  const userId = payload["userId"] as string;
  const walletId = payload["walletId"] as string;

  if (!userId || !walletId) {
    throw new Error("wallet.provision_requested missing userId or walletId");
  }

  const [existing] = await db
    .select({ id: raldWalletsTable.id })
    .from(raldWalletsTable)
    .where(eq(raldWalletsTable.id, walletId))
    .limit(1);

  if (existing) {
    logger.info({ walletId }, "Wallet already exists — provision is a no-op");
    return;
  }

  await db.insert(raldWalletsTable).values({
    id: walletId,
    userId,
    balance: 0,
    currency: "NGN",
    status: "active",
  });

  logger.info({ userId, walletId }, "PayRald wallet provisioned via event bus");
}

async function handleMailProvision(payload: Record<string, unknown>): Promise<void> {
  const userId = payload["userId"] as string;
  const raldEmail = payload["raldEmail"] as string;

  logger.info(
    { userId, raldEmail },
    "[stub] mail.provision_requested — RALD Mail service would be called here",
  );
}
