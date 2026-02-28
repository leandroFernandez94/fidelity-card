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
- **Registro y Login** con autenticación Supabase
- **Mis Citas** (ver próximas y pasadas)
- **Catálogo de Servicios** (ver todos los servicios disponibles)
- **Referir Amigas** (formulario de invitación y compartir enlace)
- **Ver Puntos** en navbar y dashboard
- **Responsive Design** para móvil y desktop

### Sistemas ✅
- **Sistema de Puntos** (calcula por servicios)
- **Autenticación completa** con roles (admin/clienta)
- **Navbar adaptativo** según rol y dispositivo móvil
- **Row Level Security** en Supabase
- **SQL completo** con triggers, RLS y políticas

## 📋 Guía de Configuración

La guía completa de configuración de Supabase está disponible en:
**[SETUP_SUPABASE.md](./SETUP_SUPABASE.md)**

### Resumen rápido:

1. **Crear cuenta en Supabase**: https://supabase.com
2. **Crear nuevo proyecto**: "fidelity-card"
3. **Copiar credenciales**: Settings → API (URL y anon key)
4. **Configurar .env**: Reemplazar con tus credenciales
5. **Ejecutar script SQL**: `supabase-setup.sql` en SQL Editor
6. **Crear usuario admin**: Authentication → Add user
7. **Asignar rol admin**: `UPDATE profiles SET rol = 'admin' WHERE email = '...'`

## 📁 Archivos de Configuración

| Archivo | Descripción |
|---------|-------------|
| `supabase-setup.sql` | Script completo de setup de Supabase |
| `verify-setup.sql` | Script de verificación de configuración |
| `sql-commands.sql` | Comandos SQL útiles para administración |
| `create-admin.sql` | Script para crear usuario admin desde SQL |
| `SETUP_SUPABASE.md` | Guía paso a paso completa |

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + Vite + TypeScript
- **Routing**: React Router v7
- **Backend/Database**: Supabase
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

3. Configurar Supabase (ver [SETUP_SUPABASE.md](./SETUP_SUPABASE.md)):
   - Crear proyecto en https://supabase.com
   - Ejecutar script `supabase-setup.sql`
   - Configurar archivo `.env` con credenciales

4. Iniciar servidor de desarrollo:
```bash
bun run dev
```

## 🗄️ Estructura SQL del Proyecto

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

### Row Level Security (RLS)
- ✅ Clientas solo ven sus propios datos
- ✅ Admins ven todos los datos
- ✅ Políticas granulares por tabla
- ✅ Protección contra accesos no autorizados

### Políticas Implementadas

#### Perfiles
- Users can read/update own profile
- Admins can read/update all profiles

#### Servicios
- Public read (todos pueden leer)
- Admins can insert/update/delete

#### Citas
- Users can read own citas
- Admins can read/insert/update/delete all citas

#### Referidos y Premios
- Users can read own referidos
- Admins can read all
- Public read premios

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
├── services/          # Conexión con Supabase
│   ├── supabase.ts
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
supabase-setup.sql     # Script principal de setup
verify-setup.sql      # Script de verificación
sql-commands.sql      # Comandos útiles
create-admin.sql      # Crear usuario admin
SETUP_SUPABASE.md     # Guía completa
.env.example          # Plantilla de variables
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

- [Guía de Configuración](./SETUP_SUPABASE.md)
- [Documentación de API](./API.md)
- [SQL Commands Útiles](./sql-commands.sql)
- [Supabase Dashboard](https://supabase.com/dashboard)

## 📄 Licencia

MIT
