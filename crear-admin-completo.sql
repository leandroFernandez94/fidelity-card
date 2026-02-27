-- ============================================================================
-- CREAR USUARIO ADMIN - MÉTODO MANUAL Y SEGURO
-- ============================================================================
-- Este script:
-- 1. Deshabilita temporalmente el trigger problemático
-- 2. Crea usuario en auth.users
-- 3. Crea perfil en profiles
-- 4. Vuelve a recrear el trigger mejorado
-- ============================================================================

-- CONFIGURACIÓN - REEMPLAZA ESTOS VALORES
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_user_email TEXT := 'bosqueluciana95@gmail.com';      -- REEMPLAZAR
  v_nombre TEXT := 'Jazmin';
  v_apellido TEXT := 'Bosque';
  v_telefono TEXT := '+34 673691594';
  v_password TEXT := 'Admin123456';               -- REEMPLAZAR

BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE 'CONFIGURACIÓN DE USUARIO ADMIN';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Email: %', v_user_email;
  RAISE NOTICE 'Nombre: %', v_nombre;
  RAISE NOTICE 'Apellido: %', v_apellido;
  RAISE NOTICE 'Teléfono: %', v_telefono;
  RAISE NOTICE 'Password: %', '******';
  RAISE NOTICE '======================================';
  
  -- Paso 1: Verificar si el usuario ya existe
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_user_email) THEN
    RAISE EXCEPTION 'El usuario % ya existe en auth.users. Usa un email diferente.', v_user_email;
  END IF;
  
  RAISE NOTICE '✅ Usuario disponible, procediendo...';
  
  -- Paso 2: Deshabilitar trigger temporalmente (para evitar conflictos)
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  RAISE NOTICE '✅ Trigger deshabilitado';
  
  -- Paso 3: Crear usuario en auth.users
  -- NOTA: Supabase encriptará el password automáticamente
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_email,
    crypt(v_password, gen_salt('bf')),
    NOW(),
    NOW(),
    jsonb_build_object(
      'nombre', v_nombre,
      'apellido', v_apellido,
      'telefono', v_telefono,
      'rol', 'admin'
    ),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Usuario creado en auth.users con ID: %', v_user_id;
  
  -- Paso 4: Crear perfil en profiles
  -- Usamos metadata para pasar datos directamente
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
    v_user_email,
    v_nombre,
    v_apellido,
    v_telefono,
    'admin',
    0,
    NOW()
  );
  
  RAISE NOTICE '✅ Perfil de admin creado en profiles';

  -- Paso 5: Verificar que todo se creó correctamente
  RAISE NOTICE '======================================';
  RAISE NOTICE 'VERIFICACIÓN';
  RAISE NOTICE '======================================';

  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE NOTICE '✅ Usuario en auth.users: VERIFICADO';
  ELSE
    RAISE EXCEPTION '❌ ERROR: Usuario no encontrado en auth.users';
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
    RAISE NOTICE '✅ Perfil en profiles: VERIFICADO';
  ELSE
    RAISE EXCEPTION '❌ ERROR: Perfil no encontrado en profiles';
  END IF;
  
  -- Paso 7: Verificar usuario final
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'USUARIO CREADO EXITOSAMENTE';
  RAISE NOTICE '======================================';
  RAISE NOTICE '';
  
  -- Mostrar información de login
  RAISE NOTICE 'EMAIL PARA LOGIN: %', v_user_email;
  RAISE NOTICE 'PASSWORD PARA LOGIN: %', v_password;
  RAISE NOTICE '======================================';
  
  RAISE NOTICE '🎉 ¡ÉXITO! El usuario admin está listo.';
  RAISE NOTICE 'Ya puedes:';
  RAISE NOTICE '1. Ir a http://192.168.1.155:5175/';
  RAISE NOTICE '2. Hacer clic en "Iniciar Sesión"';
  RAISE NOTICE '3. Ingresa: %', v_user_email;
  RAISE NOTICE '4. Contraseña: %', v_password;
  RAISE NOTICE '======================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '======================================';
    RAISE NOTICE '❌ ERROR AL CREAR USUARIO';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Ocurrió un error. Revisa los logs para más detalles.';
    RAISE NOTICE '======================================';
END $$;

-- ============================================================================
-- RECERAR TRIGGER MEJORADO
-- ============================================================================

-- Función mejorada con verificación de duplicados
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_exists BOOLEAN;
  v_user_id UUID := new.id;
BEGIN
  -- Verificar si el perfil ya existe
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = v_user_id
  ) INTO v_profile_exists;

  -- Si ya existe, no hacer nada
  IF v_profile_exists THEN
    RETURN new;
  END IF;

  -- Insertar perfil con datos de metadata
  INSERT INTO profiles (id, email, nombre, apellido, telefono, rol, puntos)
  VALUES (
    v_user_id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nombre', 'Sin nombre'),
    COALESCE(new.raw_user_meta_data->>'apellido', 'Sin apellido'),
    COALESCE(new.raw_user_meta_data->>'telefono', 'Sin teléfono'),
    COALESCE(new.raw_user_meta_data->>'rol', 'clienta'),
    0
  );

  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error creando perfil' USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT '🔍 RESULTADO FINAL' as info;
SELECT 
  au.id as user_id,
  au.email,
  au.created_at as creado,
  au.email_confirmed_at as confirmado
FROM auth.users au
WHERE au.email = 'bosqueluciana95@gmail.com';

SELECT '👤 PERFIL CREADO' as info;
SELECT 
  id,
  email,
  nombre,
  apellido,
  rol,
  puntos,
  created_at
FROM profiles
WHERE email = 'bosqueluciana95@gmail.com';
