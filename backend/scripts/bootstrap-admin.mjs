// Bootstrap del usuario admin: crea o asegura el admin usando ADMIN_EMAIL/ADMIN_PASSWORD
// del entorno. Disenado para correr en el boot del contenedor (exit 0 si falta config,
// exit 1 solo ante errores reales de base de datos).
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, closeDb } from '../src/db/index.ts';
import { users, profiles } from '../src/db/schema/index.ts';

async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  // Sin credenciales configuradas: no es un error, simplemente no hay admin que asegurar.
  if (!email || !password) {
    console.log('ℹ️ ADMIN_EMAIL/ADMIN_PASSWORD not set, skipping admin bootstrap.');
    return 0;
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!existing) {
    // Alta inicial: users + profiles en una sola transaccion.
    const passwordHash = await bcrypt.hash(password, 10);
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ email, password_hash: passwordHash })
        .returning();
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
    console.log(`✅ Admin user created: ${email}`);
    return 0;
  }

  // Ya existe: asegurar rol admin y rotar el hash si la password cambia.
  const passwordMatches = await bcrypt.compare(password, existing.password_hash);
  await db.transaction(async (tx) => {
    const [profile] = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.id, existing.id))
      .limit(1);
    if (!profile) {
      await tx.insert(profiles).values({
        id: existing.id,
        nombre: 'Admin',
        apellido: 'Test',
        telefono: '00000000',
        email,
        rol: 'admin',
        puntos: 0,
      });
    } else if (profile.rol !== 'admin') {
      await tx.update(profiles).set({ rol: 'admin' }).where(eq(profiles.id, existing.id));
    }
    if (!passwordMatches) {
      const newPasswordHash = await bcrypt.hash(password, 10);
      await tx
        .update(users)
        .set({ password_hash: newPasswordHash })
        .where(eq(users.id, existing.id));
    }
  });
  console.log(
    passwordMatches
      ? `✅ Admin user ensured (role admin): ${email}`
      : `🔄 Admin password rotated: ${email}`
  );
  return 0;
}

let exitCode = 0;
try {
  exitCode = await bootstrapAdmin();
} catch (error) {
  console.error('❌ Error bootstrapping admin:', error);
  exitCode = 1;
} finally {
  await closeDb();
}
if (exitCode !== 0) process.exit(exitCode);
