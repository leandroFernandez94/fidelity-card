import { Elysia } from 'elysia';

import { authModule, requireAdmin, requireAuth } from './modules/auth';

type Env = {
  PORT: number;
  NODE_ENV: 'development' | 'test' | 'production';
  JWT_SECRET: string;
};

function getEnv(): Env {
  const portRaw = process.env.PORT;
  const port = portRaw ? Number(portRaw) : 3001;

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid PORT: ${String(portRaw)}`);
  }

  const nodeEnvRaw = process.env.NODE_ENV;
  const nodeEnv = (nodeEnvRaw || 'development') as Env['NODE_ENV'];
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${String(nodeEnvRaw)}`);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required');
  }

  return { PORT: port, NODE_ENV: nodeEnv, JWT_SECRET: jwtSecret };
}

const env = getEnv();

const app = new Elysia()
  .onError(({ code, error, set }) => {
    if (env.NODE_ENV !== 'test') {
      console.error(`[api] error code=${code}`, error);
    }

    set.status = 500;
    return {
      error: 'internal_server_error'
    };
  })
  .use(
    authModule({
      jwtSecret: env.JWT_SECRET,
      nodeEnv: env.NODE_ENV,
    })
  )
  .get('/api/health', () => ({ ok: true }))
  .get('/api/_protected', ({ auth, status }) => {
    const denied = requireAuth({ auth, status });
    if (denied) return denied;

    return { ok: true, sub: auth.sub, rol: auth.rol };
  })
  .get('/api/_admin', ({ auth, status }) => {
    const denied = requireAdmin({ auth, status });
    if (denied) return denied;

    return { ok: true };
  })
  .listen(env.PORT);

if (env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${app.server?.port}`);
}
