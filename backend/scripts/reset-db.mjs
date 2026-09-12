import 'dotenv/config';
import { db, closeDb } from '../src/db/index.ts';
import { sql } from 'drizzle-orm';

async function resetDb() {
  console.log('🧹 Iniciando reset de la base de datos...');
  try {
    // Obtiene dinamicamente las tablas del schema public (excluye el schema drizzle de migraciones)
    const result = await db.execute(
      sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    );

    if (result.rows.length === 0) {
      console.log('ℹ️ No hay tablas para truncar. Ejecuta las migraciones primero: bun run db:migrate');
      return;
    }

    const tables = result.rows.map((row) => `"${row.tablename}"`);
    await db.execute(
      sql.raw(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`)
    );

    console.log(`✅ Tablas truncadas: ${tables.join(', ')}`);
  } catch (error) {
    console.error('❌ Error en reset de la base de datos:', error);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

resetDb();
