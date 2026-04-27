import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import { resolve } from "path";
import fs from "fs";

const paths = [
  resolve(__dirname, "../../../.env"),
  resolve(process.cwd(), "../../.env"),
  resolve(process.cwd(), ".env"),
  "C:/Users/HP/Desktop/NEXORA_FINANCE-main/NEXORA_FINANCE-main/.env"
];

for (const p of paths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    if (process.env.DATABASE_URL) break;
  }
}
console.log("DB_URL present:", !!process.env.DATABASE_URL);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
