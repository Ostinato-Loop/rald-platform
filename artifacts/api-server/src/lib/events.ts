import { db, raldEventsTable } from "@workspace/db";
import type { RaldEventType } from "@workspace/db";
import { logger } from "./logger";

export async function publishEvent(
  type: RaldEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(raldEventsTable).values({
      type,
      producer: "rald-identity",
      payload,
      processed: false,
    });
    logger.info({ eventType: type, payload }, "Event published");
  } catch (err) {
    logger.error({ err, eventType: type }, "Failed to publish event");
    throw err;
  }
}

export async function publishIdentityCreated(user: {
  id: string;
  username: string;
  email: string;
  raldEmail: string | null;
  aliasHandle: string | null;
  walletId: string | null;
}): Promise<void> {
  await publishEvent("identity.created", {
    userId: user.id,
    username: user.username,
    email: user.email,
    raldEmail: user.raldEmail,
    aliasHandle: user.aliasHandle,
    walletId: user.walletId,
    timestamp: new Date().toISOString(),
  });

  await publishEvent("alias.provision_requested", {
    userId: user.id,
    username: user.username,
    aliasHandle: user.aliasHandle,
    timestamp: new Date().toISOString(),
  });

  await publishEvent("wallet.provision_requested", {
    userId: user.id,
    walletId: user.walletId,
    username: user.username,
    timestamp: new Date().toISOString(),
  });

  await publishEvent("mail.provision_requested", {
    userId: user.id,
    raldEmail: user.raldEmail,
    username: user.username,
    timestamp: new Date().toISOString(),
  });
}

export async function publishIdentityUpdated(userId: string, changes: Record<string, unknown>): Promise<void> {
  await publishEvent("identity.updated", {
    userId,
    changes,
    timestamp: new Date().toISOString(),
  });
}

export async function publishIdentitySuspended(userId: string, reason: string): Promise<void> {
  await publishEvent("identity.suspended", {
    userId,
    reason,
    timestamp: new Date().toISOString(),
  });
}

export async function publishKycRequested(
  userId: string,
  currentTier: number,
  requestedTier: number,
  documents: { type: string; reference: string; submittedAt: string }[],
): Promise<void> {
  await publishEvent("identity.kyc_requested", {
    userId,
    currentTier,
    requestedTier,
    documents,
    timestamp: new Date().toISOString(),
  });
}
