-- ============================================================================
-- CREAR USUARIO ADMIN DIRECTAMENTE (SIN DEPENDER DEL TRIGGER)
-- ============================================================================
-- Este script crea el usuario en auth.users y el perfil en profiles
-- de forma manual, evitando cualquier problema con el trigger
-- ============================================================================

-- 1. Crear el usuario en auth.users manualmente
-- NOTA: Necesitas reemplazar los valores entre [CORCHETES]

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'admin@tu-dominio.com';  -- REEMPLAZAR ESTO
  v_password TEXT := 'TuContraseñaSegura123';   -- REEMPLAZAR ESTO
BEGIN
  -- Verificar si el usuario ya existe
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'El usuario % ya existe', v_email;
    RETURN;
  END IF;
  
  -- Crear el usuario directamente
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_email,
    crypt(v_password, gen_salt('bf')),
    NOW(),
    NOW(),
    '{"nombre": "Admin", "apellido": "Principal", "telefono": "+54 11 1234-5678"}',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_user_id;
  
  RAISE NOTICE 'Usuario creado con ID: %', v_user_id;
END $$;

-- 2. Insertar el perfil en la tabla profiles
-- Asegúrate de que la UUID en la línea 43 coincida con la que se creó arriba

-- REEMPLAZA [UUID_DEL_USUARIO] con el ID que apareció en el mensaje anterior
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
  [UUID_DEL_USUARIO],  -- REEMPLAZAR ESTO con el UUID que se mostró arriba
  'admin@tu-dominio.com',
  'Admin',
  'Principal',
  '+54 11 1234-5678',
  'admin',
  0,
  NOW()
);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver que el usuario se creó correctamente
SELECT 
  au.id as user_id,
  au.email,
  au.email_confirmed_at as confirmado,
  p.rol,
  p.created_at as perfil_creado
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE au.email = 'admin@tu-dominio.com';

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- 1. Ejecuta este script completo en el SQL Editor
-- 2. Verás un NOTICE con el UUID del usuario creado:
--    NOTICE:  Usuario creado con ID: xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxx
-- 3. COPIA ese UUID (lo que aparece en el mensaje NOTICE)
-- 4. REEMPLAZA [UUID_DEL_USUARIO] en la línea 43 con ese UUID
-- 5. Ejecuta de nuevo solo la parte del INSERT INTO profiles
-- 6. Opcional: Ve a Authentication en el dashboard y verás el usuario creado
-- ============================================================================
