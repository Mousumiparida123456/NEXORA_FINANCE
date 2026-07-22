import express from "express";
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

  // DB Connection Heartbeat
  pool.query('SELECT 1').then(async () => {
    console.log("Database Connected Successfully");
  }).catch((err: any) => {
    console.error("DATABASE CONNECTION FAILED:", err.message);
  });
});

export default app;
