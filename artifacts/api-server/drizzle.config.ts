import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../../.env") });
dotenv.config({ path: resolve(process.cwd(), ".env"), override: true });

export default defineConfig({
  schema: "../../lib/db/src/schema.ts",
  out: "../../lib/db/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
