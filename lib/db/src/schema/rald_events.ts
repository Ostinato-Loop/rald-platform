import { pgTable, text, boolean, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const RALD_EVENT_TYPES = [
  "identity.created",
  "identity.updated",
  "identity.suspended",
  "identity.reactivated",
  "wallet.provision_requested",
  "mail.provision_requested",
  "alias.provision_requested",
] as const;

export type RaldEventType = (typeof RALD_EVENT_TYPES)[number];

export const raldEventsTable = pgTable("rald_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").$type<RaldEventType>().notNull(),
  producer: text("producer").notNull().default("rald-identity"),
  payload: jsonb("payload").notNull().default({}),
  processed: boolean("processed").notNull().default(false),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RaldEvent = typeof raldEventsTable.$inferSelect;
export type InsertRaldEvent = typeof raldEventsTable.$inferInsert;
