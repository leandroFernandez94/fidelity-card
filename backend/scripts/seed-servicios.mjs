import 'dotenv/config';
import { db, closeDb } from '../src/db/index.ts';
import { servicios } from '../src/db/schema/index.ts';
import { eq } from 'drizzle-orm';

const SERVICIOS_SEED = [
  {
    nombre: 'Manicura rusa + semipermanente sin nivelación',
    codigo: 'MANI_SIN_NIVELACION',
    precio: 30,
    duracion_min: 60,
    puntos_otorgados: 15
  },
  {
    nombre: 'Manicura francesa',
    codigo: 'MANI_FRANCESA',
    precio: 35,
    duracion_min: 90,
    puntos_otorgados: 17
  },
  {
    nombre: 'Nivelación + semipermanente',
    codigo: 'NIVELACION_SEMI',
    precio: 40,
    duracion_min: 120,
    puntos_otorgados: 20
  },
  {
    nombre: 'Manicura rusa + refuerzo gel + semipermanente',
    codigo: 'REFUERZO_GEL_SEMI',
    precio: 50,
    duracion_min: 120,
    puntos_otorgados: 25
  },
  {
    nombre: 'Retiro acrílico/gel + refuerzo + semipermanente',
    codigo: 'RETIRO_REFUERZO_SEMI',
    precio: 55,
    duracion_min: 150,
    puntos_otorgados: 27
  },
  {
    nombre: 'Pedicura completa + semipermanente',
    codigo: 'PEDI_COMPLETA_SEMI',
    precio: 45,
    duracion_min: 90,
    puntos_otorgados: 22
  },
  {
    nombre: 'Pedicura sin durezas + semipermanente',
    codigo: 'PEDI_SIN_DUREZAS_SEMI',
    precio: 35,
    duracion_min: 60,
    puntos_otorgados: 17
  },
  {
    nombre: 'Pedicura completa sin esmaltar',
    codigo: 'PEDI_COMPLETA_SIN_ESMALTAR',
    precio: 30,
    duracion_min: 45,
    puntos_otorgados: 15
  }
];

async function seedServicios() {
  console.log('🌱 Iniciando seed de servicios...');
  try {
    for (const servicio of SERVICIOS_SEED) {
      const existing = await db.select().from(servicios).where(eq(servicios.nombre, servicio.nombre)).limit(1);

      if (existing.length > 0) {
        await db.update(servicios).set({
          codigo: servicio.codigo,
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
