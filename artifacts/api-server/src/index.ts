import dotenv from "dotenv";
import { resolve } from "path";

// Load env from repo root first, then allow local api-server/.env overrides.
dotenv.config({ path: resolve(__dirname, "../../../.env") });
dotenv.config({ path: resolve(__dirname, "../.env"), override: true });

// Use require to ensure these are only loaded AFTER dotenv.config()
const { pool } = require("./db");
const app = require("../api/index").default;

const PORT = Number(process.env.PORT) || 9999;

app.listen(PORT, "0.0.0.0", () => {
  const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  console.log(`
NEXORA_ENGINE_V2.2_SERVER
URL: http://localhost:${PORT}
Environment: ${process.env.NODE_ENV || "development"}
Active Routes: /api/v1/dashboard, /api/v1/analytics/predict, /api/v1/ai/insights
SMTP: ${smtpReady ? "configured" : "NOT CONFIGURED"}`);

  // DB Connection Heartbeat + Self-Healing Schema
  pool.query('SELECT 1').then(async () => {
    console.log("Database Connected Successfully");
    try {
      // Self-heal: Add production security columns if missing
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password text');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token text');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts integer DEFAULT 0');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_until timestamp');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token text');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires timestamp');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_income numeric(15, 2) DEFAULT \'0.00\'');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS financial_goals text');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_level text DEFAULT \'medium\'');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS savings_goal integer DEFAULT 15000');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS invest_style text DEFAULT \'balanced\'');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id serial PRIMARY KEY,
          user_id integer NOT NULL REFERENCES users(id),
          data jsonb NOT NULL DEFAULT '{}'::jsonb,
          updated_at timestamp NOT NULL DEFAULT now()
        )
      `);
      await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS user_preferences_user_id_unique ON user_preferences(user_id)');
      console.log("Database Schema Verified & Healed");
    } catch (e) {
      console.warn("Schema verification notice:", e instanceof Error ? e.message : String(e));
    }
  }).catch((err: any) => {
    console.error("DATABASE CONNECTION FAILED:", err.message);
  });
});
