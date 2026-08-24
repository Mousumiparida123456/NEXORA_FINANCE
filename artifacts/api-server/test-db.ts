import dotenv from "dotenv";
import pg from "pg";

async function testDatabase() {
  dotenv.config({ path: ".env" });

  console.log("DATABASE_URL loaded:", !!process.env.DATABASE_URL);

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const result = await pool.query(`
      SELECT
        current_user,
        current_database(),
        COUNT(*) AS audit_count
      FROM public.sentinel_audit_logs
    `);

    console.log("DATABASE TEST RESULT:");
    console.log(result.rows);
  } catch (error) {
    console.error("DB ERROR:", error);
  } finally {
    await pool.end();
  }
}

testDatabase();
