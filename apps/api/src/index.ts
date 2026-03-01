import { Elysia } from 'elysia';

import { authContextModule } from './modules/auth-context';
import { registerAuthRoutes } from './modules/auth';
import { registerServiciosRoutes } from './modules/servicios';
import { registerCitasRoutes } from './modules/citas';
import { registerProfilesRoutes } from './modules/profiles';
import { registerReferidosRoutes } from './modules/referidos';
import { registerPremiosRoutes } from './modules/premios';

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

const authOptions = {
  jwtSecret: env.JWT_SECRET,
  nodeEnv: env.NODE_ENV,
} as const;

const app = new Elysia()
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 422;
      return { error: 'validation_error' };
    }

    if (env.NODE_ENV !== 'test') {
      console.error(`[api] error code=${code}`, error);
    }

    set.status = 500;
    return {
      error: 'internal_server_error'
    };
  })
  .use(authContextModule(authOptions))
  .get('/api/health', () => ({ ok: true }))
  .get('/api/_admin', ({ auth, status }) => {
    if (!auth) return status(401, { error: 'unauthorized' });
    if (auth.rol !== 'admin') return status(403, { error: 'forbidden' });
    return { ok: true };
  });

registerAuthRoutes(app, authOptions);
registerServiciosRoutes(app);
registerCitasRoutes(app);
registerProfilesRoutes(app);
registerReferidosRoutes(app);
registerPremiosRoutes(app);

app.listen(env.PORT);

if (env.NODE_ENV !== 'test') {
  console.log(`[api] listening on http://localhost:${app.server?.port}`);
}
