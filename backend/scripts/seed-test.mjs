// Fixtures de test (NO production data): 3 clientas + citas completadas enlazadas
// a servicios del baseline por codigo natural. Idempotente: re-ejecutar resetea las
// entidades de fixture a un estado conocido. Requiere que las migraciones corrieron
// antes (el catalogo de servicios llega por migracion, no por seed).
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq, inArray } from 'drizzle-orm';
import { db, closeDb } from '../src/db/index.ts';
import { users, profiles, servicios, citas, citaServicios } from '../src/db/schema/index.ts';

// Marca en notas para identificar citas de fixture y poder re-seedear sin tocar citas reales.
const FIXTURE_NOTAS = 'fixture-seed-test';

const CLIENTAS_FIXTURE = [
  {
    email: 'maria.garcia@test.com',
    password: 'password123',
    nombre: 'María',
    apellido: 'García',
    telefono: '1122334455',
    puntos: 50,
  },
  {
    email: 'laura.perez@test.com',
    password: 'password123',
    nombre: 'Laura',
    apellido: 'Pérez',
    telefono: '1199887766',
    puntos: 120,
  },
  {
    email: 'ana.martinez@test.com',
    password: 'password123',
    nombre: 'Ana',
    apellido: 'Martínez',
    telefono: '1155443322',
    puntos: 15,
  },
];

// Citas por email de clienta: servicios por codigo natural, fechas pasadas relativas a ahora.
// NOTA: no referenciar MANI_FRANCESA ("Manicura francesa") — admin.spec.ts edita/borra el
// servicio alfabeticamente primero (locator con divs ancestros), y una cita referenciandolo
// hace que ese DELETE choque con la FK de cita_servicios (500) y falle el E2E.
const CITAS_FIXTURE = [
  { clientaEmail: 'maria.garcia@test.com', diasAtras: 3, codigos: ['MANI_SIN_NIVELACION'] },
  {
    clientaEmail: 'maria.garcia@test.com',
    diasAtras: 10,
    codigos: ['PEDI_COMPLETA_SEMI', 'RETIRO_REFUERZO_SEMI'],
  },
  {
    clientaEmail: 'laura.perez@test.com',
    diasAtras: 5,
    codigos: ['MANI_SIN_NIVELACION', 'PEDI_COMPLETA_SEMI'],
  },
];

/** Upsert de una clienta por email: si existe, resetea perfil y password al fixture. */
async function upsertClienta(clienta) {
  const [existing] = await db.select().from(users).where(eq(users.email, clienta.email)).limit(1);

  if (!existing) {
    const passwordHash = await bcrypt.hash(clienta.password, 10);
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ email: clienta.email, password_hash: passwordHash })
        .returning();
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
    console.log(`✅ Clienta creada: ${clienta.email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(clienta.password, 10);
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ password_hash: passwordHash })
      .where(eq(users.id, existing.id));
    await tx
      .update(profiles)
      .set({
        nombre: clienta.nombre,
        apellido: clienta.apellido,
        telefono: clienta.telefono,
        email: clienta.email,
        rol: 'clienta',
        puntos: clienta.puntos,
      })
      .where(eq(profiles.id, existing.id));
  });
  console.log(`♻️ Clienta reseteada a fixture: ${clienta.email}`);
}

/**
 * Crea una cita completada escribiendo AMBAS vias: citas.servicio_ids (legacy) y
 * filas en cita_servicios con snapshots de puntos del servicio actual.
 */
async function crearCitaFixture(clientaId, fecha, serviciosCita) {
  const puntosGanados = serviciosCita.reduce((acc, s) => acc + s.puntos_otorgados, 0);

  await db.transaction(async (tx) => {
    const [cita] = await tx
      .insert(citas)
      .values({
        clienta_id: clientaId,
        servicio_ids: serviciosCita.map((s) => s.id),
        fecha_hora: fecha,
        estado: 'completada',
        puntos_ganados: puntosGanados,
        puntos_utilizados: 0,
        notas: FIXTURE_NOTAS,
      })
      .returning();

    for (const servicio of serviciosCita) {
      await tx.insert(citaServicios).values({
        cita_id: cita.id,
        servicio_id: servicio.id,
        tipo: 'comprado',
        puntos_requeridos_snapshot: servicio.puntos_requeridos,
        puntos_otorgados_snapshot: servicio.puntos_otorgados,
      });
    }
  });
  console.log(
    `✅ Cita fixture creada (${serviciosCita.map((s) => s.codigo).join(', ')}, +${puntosGanados} pts)`
  );
}

async function seedTest() {
  console.log('🌱 Iniciando seed de fixtures de test...');

  // El catalogo de servicios llega por migracion: sin servicios no tiene sentido seguir.
  const totalServicios = await db.select({ id: servicios.id }).from(servicios);
  if (totalServicios.length === 0) {
    throw new Error('No hay servicios en la base de datos. Ejecuta las migraciones primero: bun run db:migrate');
  }

  // Lookups por clave natural (codigo) para no hardcodear IDs.
  const codigosNecesarios = [...new Set(CITAS_FIXTURE.flatMap((c) => c.codigos))];
  const serviciosEncontrados = await db
    .select()
    .from(servicios)
    .where(inArray(servicios.codigo, codigosNecesarios));
  const porCodigo = new Map(serviciosEncontrados.map((s) => [s.codigo, s]));
  const faltantes = codigosNecesarios.filter((codigo) => !porCodigo.has(codigo));
  if (faltantes.length > 0) {
    throw new Error(`Servicios del baseline no encontrados (codigo): ${faltantes.join(', ')}`);
  }

  // 1. Clientas: upsert con reset a valores de fixture.
  for (const clienta of CLIENTAS_FIXTURE) {
    await upsertClienta(clienta);
  }

  // 2. Citas: borrar fixtures previos (cascadea a cita_servicios) y recrear.
  const profileIdsPorEmail = new Map();
  for (const clienta of CLIENTAS_FIXTURE) {
    const [user] = await db.select().from(users).where(eq(users.email, clienta.email)).limit(1);
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    profileIdsPorEmail.set(clienta.email, profile.id);
  }
  await db.delete(citas).where(eq(citas.notas, FIXTURE_NOTAS));

  for (const citaFixture of CITAS_FIXTURE) {
    const clientaId = profileIdsPorEmail.get(citaFixture.clientaEmail);
    const fecha = new Date(Date.now() - citaFixture.diasAtras * 24 * 60 * 60 * 1000);
    const serviciosCita = citaFixture.codigos.map((codigo) => porCodigo.get(codigo));
    await crearCitaFixture(clientaId, fecha, serviciosCita);
  }

  console.log('🏁 Seed de fixtures de test completado.');
}

let exitCode = 0;
try {
  await seedTest();
} catch (error) {
  console.error('❌ Error en seed de fixtures:', error);
  exitCode = 1;
} finally {
  await closeDb();
}
if (exitCode !== 0) process.exit(exitCode);
