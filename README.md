# Fidelity Card - Aplicación de Manicura

Sistema de gestión de citas y fidelización para salón de manicura.

## 🚀 Funcionalidades Implementadas

### Admin ✅
- **Dashboard** con métricas en tiempo real
- **Gestión de Clientas** (ver lista, buscar, ver detalles)
- **Gestión de Citas** (ver lista, filtrar, actualizar estados)
- **Gestión de Servicios** (crear, editar, eliminar, CRUD completo)
- **Top Clientas** por puntos acumulados
- **Estadísticas** de citas y puntos

### Clienta ✅
- **Registro y Login** con autenticación propia
- **Mis Citas** (ver próximas y pasadas)
- **Catálogo de Servicios** (ver todos los servicios disponibles)
- **Referir Amigas** (formulario de invitación y compartir enlace)
- **Ver Puntos** en navbar y dashboard
- **Responsive Design** para móvil y desktop

### Sistemas ✅
- **Sistema de Puntos** (calcula por servicios)
- **Autenticación completa** con roles (admin/clienta)
- **Navbar adaptativo** según rol y dispositivo móvil

## 📋 Guía de Configuración

1. **Levantar Postgres**: `docker compose up -d`
2. **Configurar `.env`**: completar `DATABASE_URL` y `JWT_SECRET`
3. **Correr migraciones**: `bun run db:migrate`
4. **Levantar API**: `bun run api:dev`
5. **Levantar frontend**: `bun run dev`

## 📁 Archivos de Configuración

| Archivo | Descripción |
|---------|-------------|
| `docker-compose.yml` | Postgres local para desarrollo |
| `drizzle.config.ts` | Configuración de migraciones |
| `.env.example` | Plantilla de variables |

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + Vite + TypeScript
- **Routing**: React Router v7
- **Backend**: Bun + Elysia
- **Base de datos**: Postgres (Docker) + Drizzle ORM
- **Estilos**: Tailwind CSS v4
- **Formularios**: React Hook Form
- **Íconos**: Lucide React
- **Fechas**: date-fns

## 📦 Instalación

1. Clonar el repositorio
2. Instalar dependencias:
```bash
bun install
```

3. Configurar entorno:
   - Copiar `.env.example` a `.env`
   - Ajustar `DATABASE_URL` y `JWT_SECRET`
   - Levantar Postgres con `docker compose up -d`

4. Iniciar servidor de desarrollo:
```bash
bun run dev
```

## 🗄️ Estructura de Datos

### Tablas Principales

```sql
profiles     -- Perfiles de usuarios (admin/clienta)
servicios    -- Catálogo de servicios del salón
citas        -- Gestión de citas de clientas
referidos    -- Sistema de referidos y puntos
premios      -- Catálogo de premios a canjear
recordatorios -- Sistema de notificaciones
```

### Relaciones entre Tablas

```
profiles (1) ─── (N) citas
profiles (1) ─── (N) referidos (como referente)
profiles (1) ─── (N) referidos (como referida)
servicios (1) ─── (N) citas (a través de servicio_ids)
citas (1) ─── (N) recordatorios
```

## 🔐 Seguridad

- Autenticación propia con JWT en cookie httpOnly
- Roles `admin`/`clienta` validados en el backend

## 🚀 Scripts

```bash
# Desarrollo
bun run dev

# Build de producción
bun run build

# Preview del build
bun run preview

# Lint
bun run lint
```

## 📁 Estructura del Proyecto

```
src/
├── components/         # Componentes reutilizables
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── LoadingSpinner.tsx
│   └── Navbar.tsx
├── pages/             # Páginas principales
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Servicios.tsx
│   ├── MisCitas.tsx
│   └── Referidos.tsx
├── pages/admin/        # Páginas de administración
│   ├── Dashboard.tsx
│   ├── Clientas.tsx
│   ├── Citas.tsx
│   └── Servicios.tsx
├── hooks/             # Custom hooks
├── services/          # Cliente HTTP al backend
│   ├── api.ts
│   ├── profiles.ts
│   ├── servicios.ts
│   ├── citas.ts
│   ├── referidos.ts
│   └── puntos.ts
├── contexts/          # Auth context
│   └── AuthContext.tsx
├── utils/             # Utilidades
│   └── index.ts
└── types/             # TypeScript types
    └── index.ts

# Archivos de configuración
 docker-compose.yml   # Postgres local
 drizzle.config.ts    # Migraciones Drizzle
 .env.example         # Plantilla de variables
```

## 📊 Modelos de Datos

### Profile
```typescript
{
  id: string;           // UUID del usuario
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  rol: 'admin' | 'clienta';
  puntos: number;
  created_at: string;
}
```

### Servicio
```typescript
{
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_min: number;
  puntos_otorgados: number;
  created_at: string;
}
```

### Cita
```typescript
{
  id: string;
  clienta_id: string;
  servicio_ids: string[];
  fecha_hora: string;
  puntos_ganados: number;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  notas?: string;
  created_at: string;
}
```

## 📝 TODO

- [ ] Formulario de crear/editar citas
- [ ] Canje de premios
- [ ] Sistema de recordatorios in-app
- [ ] Calendario de citas
- [ ] Historial detallado de puntos por clienta
- [ ] Editar perfiles de clientas
- [ ] Exportar datos a PDF/Excel

## 🔗 Enlaces Útiles

- [Documentación de API](./API.md)

## 📄 Licencia

MIT
