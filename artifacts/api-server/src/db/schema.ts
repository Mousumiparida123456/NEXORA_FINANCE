import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    password: text("password"),
    refreshToken: text("refresh_token"),
    failedAttempts: integer("failed_attempts").default(0),
    lockUntil: timestamp("lock_until"),
    resetToken: text("reset_token"),
    resetTokenExpires: timestamp("reset_token_expires"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    monthlyIncome: numeric("monthly_income", { precision: 15, scale: 2 }).default("0.00"),
    profileImageUrl: text("profile_image_url"),
    financialGoals: text("financial_goals"),
    riskLevel: text("risk_level").default("medium"),
    savingsGoal: integer("savings_goal").default(15000),
    investStyle: text("invest_style").default("balanced"),
    twoFactorEnabled: boolean("two_factor_enabled").default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
  }),
);

export const accounts = pgTable(
  "accounts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    type: text("type").notNull(),
    balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
    accountNumber: text("account_number").notNull().unique(),
    plaidAccountId: text("plaid_account_id").unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
  }),
);

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    data: jsonb("data").notNull().default({}),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userUniqueIdx: uniqueIndex("user_preferences_user_id_unique").on(table.userId),
  }),
);

export const plaidItems = pgTable(
  "plaid_items",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    accessToken: text("access_token").notNull(),
    itemId: text("item_id").notNull().unique(),
    syncCursor: text("sync_cursor"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("plaid_items_user_id_idx").on(table.userId),
  }),
);

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id").notNull().references(() => accounts.id),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    type: text("type").notNull(),
    description: text("description"),
    category: text("category"),
    plaidTransactionId: text("plaid_transaction_id").unique(),
    pending: boolean("pending").default(false),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (table) => ({
    accountIdIdx: index("account_id_idx").on(table.accountId),
    timestampIdx: index("timestamp_idx").on(table.timestamp),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  plaidItems: many(plaidItems),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertAccountSchema = createInsertSchema(accounts);
export const selectAccountSchema = createSelectSchema(accounts);
export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);
export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export const selectUserPreferencesSchema = createSelectSchema(userPreferences);
export const insertPlaidItemSchema = createInsertSchema(plaidItems);
export const selectPlaidItemSchema = createSelectSchema(plaidItems);

export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Account = z.infer<typeof selectAccountSchema>;
export type NewAccount = z.infer<typeof insertAccountSchema>;
export type Transaction = z.infer<typeof selectTransactionSchema>;
export type NewTransaction = z.infer<typeof insertTransactionSchema>;
export type UserPreferences = z.infer<typeof selectUserPreferencesSchema>;
export type NewUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type PlaidItem = z.infer<typeof selectPlaidItemSchema>;
export type NewPlaidItem = z.infer<typeof insertPlaidItemSchema>;
