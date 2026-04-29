import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import dotenv from "dotenv";
import { resolve } from "path";

// Load env from repo root first, then allow local api-server/.env overrides.
dotenv.config({ path: resolve(__dirname, "../../../.env") });
dotenv.config({ path: resolve(__dirname, "../../.env"), override: true });

// FORCE ALLOW SELF-SIGNED CERTIFICATES (FOR SUPABASE)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });
export * from "./schema";
export { eq, and, or, desc, asc, inArray, sql } from "drizzle-orm";
