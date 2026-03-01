import 'dotenv/config';
import { db, closeDb } from '../apps/api/src/db/index.ts';
import { users, profiles } from '../apps/api/src/db/schema/index.ts';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const CLIENTAS_SEED = [
  {
    email: 'maria.garcia@test.com',
    password: 'password123',
    nombre: 'María',
    apellido: 'García',
    telefono: '1122334455',
    puntos: 50
  },
  {
    email: 'laura.perez@test.com',
    password: 'password123',
    nombre: 'Laura',
    apellido: 'Pérez',
    telefono: '1199887766',
    puntos: 120
  },
  {
    email: 'ana.martinez@test.com',
    password: 'password123',
    nombre: 'Ana',
    apellido: 'Martínez',
    telefono: '1155443322',
    puntos: 15
  }
];

async function seedClientas() {
  console.log('🌱 Iniciando seed de clientas...');
  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    for (const clienta of CLIENTAS_SEED) {
      const existing = await db.select().from(users).where(eq(users.email, clienta.email)).limit(1);
      
      if (existing.length > 0) {
        console.log(`⚠️ Clienta ${clienta.email} ya existe. Actualizando perfil.`);
        await db.update(profiles).set({
          nombre: clienta.nombre,
          apellido: clienta.apellido,
          telefono: clienta.telefono,
          puntos: clienta.puntos
        }).where(eq(profiles.id, existing[0].id));
      } else {
        await db.transaction(async (tx) => {
          const [user] = await tx.insert(users).values({
            email: clienta.email,
            password_hash: passwordHash,
          }).returning();

          await tx.insert(profiles).values({
            id: user.id,
            nombre: clienta.nombre,
            apellido: clienta.apellido,
            telefono: clienta.telefono,
            email: clienta.email,
            rol: 'clienta',
            puntos: clienta.puntos,
          });
        });
        console.log(`✅ Clienta ${clienta.email} creada.`);
      }
    }
    console.log('🏁 Seed de clientas completado.');
  } catch (error) {
    console.error('❌ Error en seed de clientas:', error);
  } finally {
    await closeDb();
  }
}

seedClientas();
