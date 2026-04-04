export type Env = {
  PORT: number;
  NODE_ENV: 'development' | 'test' | 'production';
  JWT_SECRET: string;
};

export function getEnv(): Env {
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
