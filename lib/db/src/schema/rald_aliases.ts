import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";

export const ALIAS_TYPES = [
  "username",
  "rald_email",
  "phone",
  "email",
  "business",
  "school",
] as const;

export type AliasType = (typeof ALIAS_TYPES)[number];

export const ALIAS_STATUSES = ["active", "suspended", "pending", "archived"] as const;
export type AliasStatus = (typeof ALIAS_STATUSES)[number];

export interface AliasResolution {
  walletId: string | null;
  username: string;
  raldEmail: string | null;
  trustScore: number;
  kycTier: number;
}

export const raldAliasesTable = pgTable(
  "rald_aliases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alias: text("alias").notNull().unique(),
    aliasType: text("alias_type").$type<AliasType>().notNull(),
    userId: text("user_id").notNull(),
    status: text("status").$type<AliasStatus>().notNull().default("active"),
    resolvedTo: jsonb("resolved_to").$type<AliasResolution>().notNull().default({} as AliasResolution),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_rald_aliases_user_id").on(t.userId),
    index("idx_rald_aliases_status").on(t.status),
  ],
);

export type RaldAlias = typeof raldAliasesTable.$inferSelect;
export type InsertRaldAlias = typeof raldAliasesTable.$inferInsert;
