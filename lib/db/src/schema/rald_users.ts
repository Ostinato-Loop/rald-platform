import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const raldUsersTable = pgTable("rald_users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  raldEmail: text("rald_email").unique(),
  aliasHandle: text("alias_handle").unique(),
  walletId: text("wallet_id").unique(),
  role: text("role").$type<UserRole>().notNull().default("user"),
  trustScore: integer("trust_score").notNull().default(0),
  kycTier: integer("kyc_tier").notNull().default(1),
  activatedProducts: jsonb("activated_products")
    .$type<string[]>()
    .notNull()
    .default([]),
  kycDocuments: jsonb("kyc_documents")
    .$type<{ type: string; reference: string; submittedAt: string }[]>()
    .notNull()
    .default([]),
  suspended: text("suspended"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RaldUser = typeof raldUsersTable.$inferSelect;
export type InsertRaldUser = typeof raldUsersTable.$inferInsert;
export type PublicRaldUser = Omit<RaldUser, "passwordHash">;
