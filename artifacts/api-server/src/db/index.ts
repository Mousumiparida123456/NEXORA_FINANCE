import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import dotenv from "dotenv";
import { resolve } from "path";
import * as schema from "./schema";

const { Pool } = pg;

dotenv.config({ path: resolve(__dirname, "../../../.env") });
dotenv.config({ path: resolve(process.cwd(), ".env"), override: true });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in environment variables!");
  process.env.DATABASE_URL = "postgresql://postgres:dummy@localhost:5432/dummy";
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
export * from "./schema";
export { eq, and, or, desc, asc, inArray, sql } from "drizzle-orm";
