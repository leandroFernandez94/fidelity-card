import 'dotenv/config';
import { db, closeDb } from '../src/db/index.ts';
import { premios } from '../src/db/schema/index.ts';
import { eq } from 'drizzle-orm';

const PREMIOS_SEED = [
  {
    nombre: 'Esmaltado Gratis',
    descripcion: 'Un esmaltado semipermanente totalmente gratis en tu próxima visita.',
    puntos_requeridos: 100,
    activo: true
  },
  {
    nombre: '50% Descuento en Kapping',
    descripcion: 'Obtén un 50% de descuento en tu servicio de Kapping Gel.',
    puntos_requeridos: 75,
    activo: true
  },
  {
    nombre: 'Manicura Rusa Express',
    descripcion: 'Canjea tus puntos por una manicura rusa de mantenimiento.',
    puntos_requeridos: 150,
    activo: true
  },
  {
    nombre: 'Decoración de 2 uñas',
    descripcion: 'Nail art gratis en dos uñas de tu elección.',
    puntos_requeridos: 30,
    activo: true
  },
  {
    nombre: 'Kit de cuidado en casa',
    descripcion: 'Aceite de cutículas y lima profesional para el hogar.',
    puntos_requeridos: 50,
    activo: true
  }
];

async function seedPremios() {
  console.log('🌱 Iniciando seed de premios...');
  try {
    for (const premio of PREMIOS_SEED) {
      const existing = await db.select().from(premios).where(eq(premios.nombre, premio.nombre)).limit(1);
      
      if (existing.length > 0) {
        await db.update(premios).set({
          descripcion: premio.descripcion,
          puntos_requeridos: premio.puntos_requeridos,
          activo: premio.activo
        }).where(eq(premios.nombre, premio.nombre));
      } else {
        await db.insert(premios).values(premio);
      }
    }
    console.log('✅ Premios creados o actualizados con éxito.');
  } catch (error) {
    console.error('❌ Error en seed de premios:', error);
  } finally {
    await closeDb();
  }
}

seedPremios();
