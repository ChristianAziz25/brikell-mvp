// Script to deploy the claim_pdf_job SQL function to Supabase
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sql = fs.readFileSync(
  path.join(__dirname, '../supabase/migrations/20240114_claim_pdf_job.sql'),
  'utf8'
);

// Use direct connection (not pooler) for DDL operations
const connectionString = process.env.DATABASE_URL?.replace(':6543', ':5432').replace('?pgbouncer=true', '');

if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('Connecting to Supabase database...');

  const client = await pool.connect();

  try {
    console.log('Deploying claim_pdf_job function...');
    await client.query(sql);
    console.log('✓ Function deployed successfully!');
  } catch (error) {
    console.error('Error deploying function:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
