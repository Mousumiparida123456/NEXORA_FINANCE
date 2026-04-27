import { pgTable, text, serial, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Accounts Table
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'savings', 'checking', 'investment'
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  accountNumber: text("account_number").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions Table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'credit', 'debit'
  description: text("description"),
  category: text("category"), // 'food', 'transport', 'salary', etc.
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertAccountSchema = createInsertSchema(accounts);
export const selectAccountSchema = createSelectSchema(accounts);
export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);

// Types
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Account = z.infer<typeof selectAccountSchema>;
export type NewAccount = z.infer<typeof insertAccountSchema>;
export type Transaction = z.infer<typeof selectTransactionSchema>;
export type NewTransaction = z.infer<typeof insertTransactionSchema>;
