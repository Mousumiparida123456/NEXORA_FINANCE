process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:mousumi%4005P@db.vsfxpjaamspwhyyvdnzr.supabase.co:5432/postgres?sslmode=require', ssl: { rejectUnauthorized: false } });
pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'").then(res => { console.log(JSON.stringify(res.rows, null, 2)); pool.end(); }).catch(e => { console.error(e); pool.end(); });
