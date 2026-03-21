import 'dotenv/config';
import { db, closeDb } from '../src/db/index.ts';
import { servicios } from '../src/db/schema/index.ts';
import { eq } from 'drizzle-orm';

const SERVICIOS_SEED = [
  {
    nombre: 'Manicura Rusa',
    descripcion: 'Técnica de manicura en seco con torno para un acabado perfecto.',
    precio: 12000,
    duracion_min: 60,
    puntos_otorgados: 10
  },
  {
    nombre: 'Esmaltado Semipermanente',
    descripcion: 'Color duradero hasta por 21 días con brillo extremo.',
    precio: 8000,
    duracion_min: 45,
    puntos_otorgados: 5
  },
  {
    nombre: 'Kapping Gel',
    descripcion: 'Refuerzo de uña natural con gel para mayor resistencia.',
    precio: 15000,
    duracion_min: 90,
    puntos_otorgados: 15
  },
  {
    nombre: 'Uñas Esculpidas (Acrílico)',
    descripcion: 'Extensión de uñas con técnica de acrílico profesional.',
    precio: 22000,
    duracion_min: 120,
    puntos_otorgados: 25
  },
  {
    nombre: 'Remoción Profesional',
    descripcion: 'Retirado seguro de materiales anteriores sin dañar la uña natural.',
    precio: 4000,
    duracion_min: 30,
    puntos_otorgados: 2
  }
];

async function seedServicios() {
  console.log('🌱 Iniciando seed de servicios...');
  try {
    for (const servicio of SERVICIOS_SEED) {
      const existing = await db.select().from(servicios).where(eq(servicios.nombre, servicio.nombre)).limit(1);
      
      if (existing.length > 0) {
        await db.update(servicios).set({
          descripcion: servicio.descripcion,
          precio: servicio.precio,
          duracion_min: servicio.duracion_min,
          puntos_otorgados: servicio.puntos_otorgados
        }).where(eq(servicios.nombre, servicio.nombre));
      } else {
        await db.insert(servicios).values(servicio);
      }
    }
    console.log('✅ Servicios creados o actualizados con éxito.');
  } catch (error) {
    console.error('❌ Error en seed de servicios:', error);
  } finally {
    await closeDb();
  }
}

seedServicios();
