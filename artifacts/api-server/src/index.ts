import dotenv from "dotenv";
import { resolve } from "path";

const envPath = resolve(__dirname, "../../../.env");
dotenv.config({ path: envPath });

// Use require to ensure these are only loaded AFTER dotenv.config()
const { pool } = require("./db");
const app = require("../api/index").default;

const PORT = Number(process.env.PORT) || 9999;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
🚀 NEXORA_ENGINE_V2.2_SERVER
📡 URL: http://localhost:${PORT}
🛠️  Environment: ${process.env.NODE_ENV || "development"}
🔗 Active Routes: /api/v1/dashboard, /api/v1/analytics/predict, /api/v1/ai/insights`);

  // DB Connection Heartbeat + Self-Healing Schema
  pool.query('SELECT 1').then(async () => {
    console.log("🟢 Database Connected Successfully");
    try {
      // Self-heal: Add production security columns if missing
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password text');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token text');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts integer DEFAULT 0');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_until timestamp');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token text');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires timestamp');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_income numeric(15, 2) DEFAULT \'0.00\'');
      console.log("✅ Database Schema Verified & Healed");
    } catch (e) {
      console.warn("⚠️ Schema verification notice:", e instanceof Error ? e.message : String(e));
    }
  }).catch((err: any) => {
    console.error("🔴 DATABASE CONNECTION FAILED:", err.message);
  });
});
