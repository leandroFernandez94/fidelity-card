import type { ErrorHandler } from 'elysia';

export function createErrorHandler(nodeEnv: string): ErrorHandler {
  return ({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 422;
      return { error: 'validation_error' };
    }

    if (nodeEnv !== 'test') {
      console.error(`[api] error code=${code}`, error);
    }

    set.status = 500;
    return {
      error: 'internal_server_error',
    };
  };
}
