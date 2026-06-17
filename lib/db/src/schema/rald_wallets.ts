import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";

export const WALLET_STATUSES = ["active", "frozen", "closed"] as const;
export type WalletStatus = (typeof WALLET_STATUSES)[number];

export const raldWalletsTable = pgTable(
  "rald_wallets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    balance: integer("balance").notNull().default(0),
    currency: text("currency").notNull().default("NGN"),
    status: text("status").$type<WalletStatus>().notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_rald_wallets_user_id").on(t.userId),
    index("idx_rald_wallets_status").on(t.status),
  ],
);

export type RaldWallet = typeof raldWalletsTable.$inferSelect;
export type InsertRaldWallet = typeof raldWalletsTable.$inferInsert;
