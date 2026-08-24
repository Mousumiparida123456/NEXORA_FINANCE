/**
 * NEXORA — Direct Supabase schema setup script
 */
const { Client } = require("pg");

const DATABASE_URL =
  "postgresql://postgres:mousumiparida05052005@[2406:da1a:b00:1302:6da8:949d:c706:70eb]:5432/postgres?sslmode=no-verify";

const SQL = `
-- Drop in safe order (children first)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS plaid_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS
CREATE TABLE users (
  id                   SERIAL PRIMARY KEY,
  email                TEXT UNIQUE NOT NULL,
  password             TEXT,
  refresh_token        TEXT,
  failed_attempts      INTEGER DEFAULT 0,
  lock_until           TIMESTAMPTZ,
  reset_token          TEXT,
  reset_token_expires  TIMESTAMPTZ,
  first_name           TEXT,
  last_name            TEXT,
  monthly_income       NUMERIC(15,2) DEFAULT 0.00,
  profile_image_url    TEXT,
  financial_goals      TEXT,
  risk_level           TEXT DEFAULT 'medium',
  savings_goal         INTEGER DEFAULT 15000,
  invest_style         TEXT DEFAULT 'balanced',
  two_factor_enabled   BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS email_idx ON users(email);

-- PLAID ITEMS
CREATE TABLE plaid_items (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  item_id      TEXT NOT NULL UNIQUE,
  sync_cursor  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS plaid_items_user_id_idx ON plaid_items(user_id);

-- ACCOUNTS
CREATE TABLE accounts (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type               TEXT NOT NULL,
  balance            NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  account_number     TEXT NOT NULL UNIQUE,
  plaid_account_id   TEXT UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS user_id_idx ON accounts(user_id);

-- USER PREFERENCES
CREATE TABLE user_preferences (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data        JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)
);

-- TRANSACTIONS
CREATE TABLE transactions (
  id                   SERIAL PRIMARY KEY,
  account_id           INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount               NUMERIC(15,2) NOT NULL,
  type                 TEXT NOT NULL,
  description          TEXT,
  category             TEXT,
  plaid_transaction_id TEXT UNIQUE,
  pending              BOOLEAN DEFAULT FALSE,
  timestamp            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS account_id_idx ON transactions(account_id);
CREATE INDEX IF NOT EXISTS timestamp_idx ON transactions(timestamp);
`;

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("🔗 Connecting to Supabase...");
    await client.connect();
    console.log("✅ Connected!\n");

    console.log("🗄️  Running schema SQL...");
    await client.query(SQL);
    console.log("✅ All tables created successfully!\n");

    // Verify
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log("📋 Tables in database:");
    res.rows.forEach((r) => console.log("   ✔", r.table_name));
    console.log("\n🎉 Database is ready!");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
