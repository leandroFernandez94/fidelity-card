import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Repo root (e2e/ vive una nivel bajo la raiz).
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Guard: los E2E hacen db:reset, solo se permite contra bases locales. */
function assertLocalDatabase(): void {
  // Carga backend/.env sin sobreescribir variables ya presentes en el entorno.
  config({ path: path.join(repoRoot, 'backend', '.env') });

  const databaseUrl = process.env.DATABASE_URL ?? '';
  let host = '';
  try {
    // Normalizamos: WHATWG URL conserva los corchetes en IPv6 ([::1]) y no loweriza.
    host = databaseUrl
      ? new URL(databaseUrl).hostname.replace(/^\[|\]$/g, '').toLowerCase()
      : '';
  } catch {
    host = '';
  }

  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
  if (!localHosts.has(host)) {
    console.error(
      `[global-setup] Refusing to run E2E against non-local database (host: ${host || 'unknown'}). ` +
        'DATABASE_URL must point to localhost, 127.0.0.1 or ::1.'
    );
    process.exit(1);
  }
}

/** Corre un comando en la raiz del repo y falla ruidoso si sale != 0. */
function run(
  label: string,
  command: string,
  args: string[],
  env: Record<string, string | undefined> = process.env
): void {
  console.log(`[global-setup] ${label}...`);
  const result = spawnSync(command, args, { cwd: repoRoot, stdio: 'inherit', env });
  if (result.status !== 0) {
    console.error(`[global-setup] FAILED (exit ${result.status}): ${label}`);
    process.exit(result.status ?? 1);
  }
}

export default function globalSetup(): void {
  assertLocalDatabase();

  // Secuencia: DB limpia -> migraciones (traen el baseline) -> admin -> fixtures.
  run('Reset database', 'bun', ['run', 'db:reset']);
  run('Apply migrations', 'bun', ['run', 'db:migrate']);
  run('Bootstrap admin', 'bun', ['run', 'bootstrap:admin'], {
    ...process.env,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@test.com',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  });
  run('Seed test fixtures', 'bun', ['run', 'seed:test']);
}
