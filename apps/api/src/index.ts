import { Elysia } from 'elysia';

type Env = {
  PORT: number;
  NODE_ENV: 'development' | 'test' | 'production';
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

  return { PORT: port, NODE_ENV: nodeEnv };
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
  .get('/api/health', () => ({ ok: true }))
  .listen(env.PORT);

if (env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${app.server?.port}`);
}
