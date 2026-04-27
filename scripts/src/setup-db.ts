import pg from 'pg';

const DATABASE_URL = "postgresql://postgres.vsfxpjaamspwhyyvdnzr:mousumi%4005P@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require&uselibpqcompat=true";

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
});

async function setup() {
  try {
    console.log("Connecting to Supabase...");
    const client = await pool.connect();
    console.log("Connected! Creating tables...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        account_number TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL REFERENCES accounts(id),
        amount DECIMAL(15, 2) NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        category TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Tables created successfully!");
    client.release();
  } catch (err) {
    console.error("Setup error:", err);
  } finally {
    await pool.end();
  }
}

setup();
