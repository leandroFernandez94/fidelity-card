import type { AuthContextOptions } from '../modules/auth-context';

import type { Env } from './env';

export function getAuthOptions(env: Env): AuthContextOptions {
  return {
    jwtSecret: env.JWT_SECRET,
    nodeEnv: env.NODE_ENV,
  };
}
