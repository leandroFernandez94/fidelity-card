import { Elysia } from 'elysia';

import { getEnv } from './config/env';
import { getAuthOptions } from './config/auth';
import { createErrorHandler } from './middleware/error-handler';
import { authContextModule } from './modules/auth-context';
import { registerAuthRoutes } from './modules/auth';
import { registerServiciosRoutes } from './modules/servicios';
import { registerCitasRoutes } from './modules/citas';
import { registerProfilesRoutes } from './modules/profiles';
import { registerReferidosRoutes } from './modules/referidos';
import { registerPremiosRoutes } from './modules/premios';

const env = getEnv();
const authOptions = getAuthOptions(env);

const app = new Elysia()
  .onError(createErrorHandler(env.NODE_ENV))
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
