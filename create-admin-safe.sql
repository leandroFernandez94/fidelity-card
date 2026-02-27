-- ============================================================================
-- CREAR USUARIO ADMIN - VERSIÓN SEGURA CON TUS DATOS
-- ============================================================================
-- Este script crea el perfil de admin para un usuario existente en auth.users
-- ============================================================================

-- 1. Verificar la estructura de la tabla auth.users
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Crear el perfil de admin para el usuario existente
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'admin@tu-dominio.com';
BEGIN
  -- Buscar el usuario en auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE '⚠️  No se encontró usuario con email: %', v_email;
    RAISE NOTICE '💡 Primero crea el usuario desde el Dashboard de Supabase';
    RAISE NOTICE '📋  Authentication → Add user → Create new user';
    RAISE NOTICE '   Email: %', v_email;
    RAISE NOTICE '   Password: (tu contraseña)';
    RAISE NOTICE '   Auto Confirm User: ✅ Marcar esta casilla';
    RETURN;
  END IF;
  
  -- Verificar si ya tiene perfil
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
    RAISE NOTICE 'ℹ️  El usuario ya tiene un perfil';
    
    -- Actualizar a admin si no lo es
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND rol = 'admin') THEN
      UPDATE profiles 
      SET rol = 'admin'
      WHERE id = v_user_id;
      
      RAISE NOTICE '✅ Perfil actualizado a admin para: %', v_email;
    ELSE
      RAISE NOTICE '✅ El perfil ya es admin para: %', v_email;
    END IF;
  ELSE
    -- Crear el perfil
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
      v_user_id,
      v_email,
      'Jazmin',
      'Bosque',
      '+34 673691594',
      'admin',
      0,
      NOW()
    );
    
    RAISE NOTICE '✅ Perfil de admin creado para: %', v_email;
    RAISE NOTICE '   Nombre: Jazmin Bosque';
    RAISE NOTICE '   Teléfono: +34 673691594';
  END IF;
  
  RAISE NOTICE '🎉 Configuración completada! Ahora puedes hacer login en la app.';
END $$;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Verificar que el perfil de admin existe
SELECT 
  p.id,
  p.email,
  p.nombre,
  p.apellido,
  p.telefono,
  p.rol,
  p.puntos,
  p.created_at,
  au.email_confirmed_at as email_confirmado
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.rol = 'admin';

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- Si ves el mensaje "⚠️ No se encontró usuario":
-- 1. Ve a Authentication en el Dashboard de Supabase
-- 2. Haz clic en "Add user" → "Create new user"
-- 3. Email: admin@tu-dominio.com
-- 4. Password: (tu contraseña)
-- 5. Marca "Auto Confirm User": ✅
-- 6. Haz clic en "Create user"
-- 7. Ejecuta este script de nuevo
-- ============================================================================
