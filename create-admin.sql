-- ============================================================================
-- CREAR USUARIO ADMIN DESDE SQL
-- ============================================================================
-- Este script crea un usuario admin directamente desde el SQL Editor
-- Reemplaza los valores entre corchetes con tus datos reales
-- ============================================================================

-- 1. Crear el usuario en auth (necesita un password seguro)
-- NOTA: Este comando debe ejecutarse como superusuario
-- Alternativamente, crea el usuario desde el panel de Supabase Authentication

-- 2. Insertar el perfil directamente en la tabla profiles
-- Reemplaza estos valores con los del usuario admin:
INSERT INTO profiles (
  id,
  email,
  nombre,
  apellido,
  telefono,
  rol,
  puntos,
  created_at
) VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::uuid,  -- Reemplaza con el UUID real del usuario
  'admin@tu-dominio.com',                      -- Email del admin
  'Admin',                                    -- Nombre
  'Principal',                                 -- Apellido
  '+54 11 1234-5678',                     -- Teléfono
  'admin',                                    -- Rol
  0,                                          -- Puntos iniciales
  NOW()                                       -- Fecha de creación
);

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- OPCIÓN 1 (Recomendada): Desde el Dashboard de Supabase
-- 1. Ve a Authentication → Add user → Create new user
-- 2. Crea el usuario con email y password
-- 3. Marca "Auto Confirm User"
-- 4. Copia el UUID del usuario (se ve en la URL al hacer clic en el usuario)
-- 5. Reemplaza 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' con ese UUID en el script de arriba
-- 6. Ejecuta el INSERT INTO profiles

-- OPCIÓN 2: Si ya creaste el usuario desde la app
-- 1. Busca el UUID del usuario en auth.users:
--    SELECT id, email FROM auth.users WHERE email = 'tu_admin@email.com';
-- 2. Reemplaza el UUID en el script de arriba
-- 3. Ejecuta el INSERT INTO profiles
-- 4. El perfil debería haberse creado automáticamente por el trigger

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que el perfil se creó con rol de admin
SELECT 
  id,
  email,
  nombre,
  apellido,
  rol,
  puntos,
  created_at
FROM profiles
WHERE rol = 'admin';

-- Verificar que el usuario existe en auth
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'admin@tu-dominio.com';
