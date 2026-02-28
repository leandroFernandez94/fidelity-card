import 'dotenv/config';
import { db, closeDb } from '../apps/api/src/db/index.ts';
import { sql } from 'drizzle-orm';

try {
  const result = await db.execute(sql`select 1 as ok`);
  const ok = Array.isArray(result) ? result[0]?.ok : (result.rows?.[0]?.ok ?? null);
  console.log('[smoke-db] ok =', ok);
} finally {
  await closeDb();
}
