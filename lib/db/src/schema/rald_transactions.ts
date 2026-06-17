import { pgTable, text, integer, timestamp, uuid, index } from "drizzle-orm/pg-core";

export const TX_TYPES = ["credit", "debit", "transfer_in", "transfer_out"] as const;
export type TxType = (typeof TX_TYPES)[number];

export const TX_STATUSES = ["completed", "failed", "pending"] as const;
export type TxStatus = (typeof TX_STATUSES)[number];

export const raldTransactionsTable = pgTable(
  "rald_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletId: text("wallet_id").notNull(),
    type: text("type").$type<TxType>().notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("KES"),
    reference: text("reference").notNull().unique(),
    description: text("description"),
    fromWalletId: text("from_wallet_id"),
    toWalletId: text("to_wallet_id"),
    status: text("status").$type<TxStatus>().notNull().default("completed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_rald_tx_wallet_id").on(t.walletId),
    index("idx_rald_tx_created_at").on(t.createdAt),
    index("idx_rald_tx_reference").on(t.reference),
  ],
);

export type RaldTransaction = typeof raldTransactionsTable.$inferSelect;
export type InsertRaldTransaction = typeof raldTransactionsTable.$inferInsert;
