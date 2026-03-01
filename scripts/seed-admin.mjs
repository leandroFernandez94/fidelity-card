import 'dotenv/config';
import { db, closeDb } from '../apps/api/src/db/index.ts';
import { users, profiles } from '../apps/api/src/db/schema/index.ts';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  const email = 'admin@test.com';
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existing.length > 0) {
      console.log('Admin user already exists. Updating role to admin just in case.');
      await db.update(profiles).set({ rol: 'admin' }).where(eq(profiles.id, existing[0].id));
      return;
    }

    await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({
        email,
        password_hash: passwordHash,
      }).returning();

      await tx.insert(profiles).values({
        id: user.id,
        nombre: 'Admin',
        apellido: 'Test',
        telefono: '00000000',
        email,
        rol: 'admin',
        puntos: 0,
      });
    });

    console.log('Admin user created successfully: admin@test.com / admin123');
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await closeDb();
  }
}

seedAdmin();
