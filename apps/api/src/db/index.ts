import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const databaseUrl =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV === 'test' ? 'postgres://localhost:5432/postgres' : undefined);

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required (see .env.example)');
}

export const pool = new Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool);

export async function closeDb(): Promise<void> {
  await pool.end();
}
