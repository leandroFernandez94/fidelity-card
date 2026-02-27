# 📋 Guía de Configuración de Supabase

Esta guía te llevará paso a paso a través de la configuración completa de Supabase para la aplicación Fidelity Card.

## Paso 1: Crear una cuenta en Supabase

1. Visita https://supabase.com
2. Haz clic en **"Start your project"**
3. Regístrate con:
   - **GitHub** (recomendado)
   - **Email**
   - **Google**

## Paso 2: Crear un nuevo proyecto

1. Después de iniciar sesión, haz clic en **"New Project"**
2. Completa la información:
   ```
   Name: fidelity-card
   Database Password: [Escribe una contraseña segura]
   Region: South America East (São Paulo)  - Más cercano a Argentina
   Pricing Plan: Free (Plan gratuito con 500MB)
   ```
3. Haz clic en **"Create new project"**
4. Espera 1-2 minutos mientras se crea el proyecto

## Paso 3: Obtener las credenciales del proyecto

1. Una vez que el proyecto esté listo, ve a **"Project Settings"** (icono de engranaje)
2. En el menú lateral, selecciona **"API"**
3. Copia estas dos claves:
   
   **Project URL**:
   ```
   https://xxxxxxxxxxxx.supabase.co
   ```
   
   **anon/public key**:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Paso 4: Configurar el archivo .env

1. Abre el archivo `.env` en la raíz del proyecto
2. Reemplaza con tus credenciales reales:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Guarda el archivo

## Paso 5: Ejecutar el script SQL

1. En el dashboard de Supabase, ve al menú lateral
2. Haz clic en **"SQL Editor"** (icono de código)
3. Haz clic en **"New query"**
4. Copia todo el contenido del archivo `supabase-setup.sql`
5. Pégalo en el editor
6. Haz clic en el botón **▶ Run** en la esquina superior derecha
7. Espera a que se complete (deberías ver "Success" en verde)

## Paso 6: Crear el usuario Admin

### Opción A: Desde el Dashboard de Supabase (Recomendada)

1. Ve a **"Authentication"** en el menú lateral
2. Haz clic en **"Add user"** → **"Create new user"**
3. Completa el formulario:
   ```
   Email: admin@tu-dominio.com
   Password: [Contraseña segura]
   Auto Confirm User: ✅ Marcar esta opción
   ```
4. Haz clic en **"Create User"**

### Opción B: Registrándose desde la aplicación

1. Abre tu aplicación en http://localhost:5173
2. Haz clic en **"Crear Cuenta"**
3. Regístrate con el email de admin
4. Ingresa al panel de Supabase para confirmar

## Paso 7: Asignar rol de Admin

1. En el SQL Editor de Supabase, crea una nueva query
2. Ejecuta este comando (reemplaza con tu email de admin):
   ```sql
   UPDATE profiles 
   SET rol = 'admin' 
   WHERE email = 'admin@tu-dominio.com';
   ```

3. Verifica que se actualizó correctamente:
   ```sql
   SELECT id, email, rol FROM profiles;
   ```

## Paso 8: Verificar la configuración

### Verificar tablas creadas

Ejecuta en el SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deberías ver estas tablas:
- profiles
- servicios
- citas
- referidos
- premios
- recordatorios

### Verificar servicios de ejemplo

```sql
SELECT nombre, precio, puntos_otorgados 
FROM servicios;
```

### Verificar premios de ejemplo

```sql
SELECT nombre, puntos_requeridos 
FROM premios;
```

## Paso 9: Probar la aplicación

1. Abre http://localhost:5173 en tu navegador
2. Haz clic en **"Iniciar Sesión"**
3. Ingresa con las credenciales de admin
4. Deberías ver el **Dashboard de administración**

## Paso 10: Probar como clienta

1. Haz clic en el logo para ir al inicio
2. Haz clic en **"Salir"**
3. Haz clic en **"Crear Cuenta"**
4. Regístrate con un email de prueba
5. Verifica que se creó el perfil correctamente en Supabase

## 📊 Estructura de la Base de Datos

```
fidelity-card (database)
└── public (schema)
    ├── profiles (tablas de usuarios)
    ├── servicios (catálogo de servicios)
    ├── citas (gestión de citas)
    ├── referidos (sistema de referidos)
    ├── premios (catálogo de premios)
    └── recordatorios (notificaciones)
```

## 🔐 Políticas de Seguridad (RLS)

La configuración incluye estas políticas de seguridad:

### Admin
- ✅ Leer todos los perfiles
- ✅ Actualizar cualquier perfil
- ✅ Crear/actualizar/eliminar servicios
- ✅ Ver todas las citas
- ✅ Crear/actualizar/eliminar citas
- ✅ Ver todos los referidos
- ✅ Gestionar premios y recordatorios

### Clienta
- ✅ Leer su propio perfil
- ✅ Actualizar su propio perfil
- ✅ Leer sus propias citas
- ✅ Leer sus propios referidos
- ✅ Leer servicios y premios (públicos)

## ❌ Solución de Problemas

### Error: "No se pueden leer los datos"
**Solución**: Verifica que las políticas RLS estén activas:
```sql
SELECT tablename, policyname, permissive 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Error: "Usuario no encontrado"
**Solución**: Verifica que el trigger esté funcionando:
```sql
SELECT * FROM profiles WHERE email = 'tu@email.com';
```

### Error: "No se puede crear cita"
**Solución**: Verifica que el rol sea admin:
```sql
SELECT email, rol FROM profiles WHERE email = 'tu_admin@email.com';
```

## 📱 Próximos pasos después de la configuración

1. **Crear más servicios** desde el panel admin
2. **Agregar clientas de prueba**
3. **Crear algunas citas**
4. **Probar el sistema de puntos**
5. **Configurar notificaciones** (opcional)

## 🎯 Checklist de Configuración

- [ ] Cuenta en Supabase creada
- [ ] Proyecto creado
- [ ] Credenciales copiadas
- [ ] Archivo .env configurado
- [ ] Script SQL ejecutado
- [ ] Usuario admin creado
- [ ] Rol de admin asignado
- [ ] Login como admin exitoso
- [ ] Tablas verificadas
- [ ] Servicios de ejemplo visibles
- [ ] Registro de clienta de prueba exitoso

## 📞 Ayuda

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica los logs en Supabase → Database → Logs
3. Verifica las políticas en Supabase → Database → Policies
4. Revisa el archivo `.env` para verificar credenciales
