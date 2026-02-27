-- ============================================================================
-- TRIGGER MEJORADO PARA CREACIÓN DE PERFIL
-- ============================================================================
-- Este trigger:
-- 1. NO depende de raw_user_meta_data (siempre crea perfil básico)
-- 2. Verifica si el perfil ya existe
-- 3. Tiene manejo de errores explícito
-- ============================================================================

-- Eliminar el trigger anterior
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear función mejorada
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_exists BOOLEAN;
  v_user_id UUID := new.id;
  v_user_email TEXT := new.email;
BEGIN
  -- Verificar si el perfil ya existe
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = v_user_id
  ) INTO v_profile_exists;

  -- Si el perfil ya existe, no hacer nada (perfil se actualizó manualmente)
  IF v_profile_exists THEN
    RAISE NOTICE 'ℹ️  El perfil ya existe para el usuario: %', v_user_email;
    RETURN new;
  END IF;

  -- Insertar perfil básico (independientemente de metadata)
  BEGIN
    INSERT INTO profiles (id, email, nombre, apellido, telefono, rol, puntos)
    VALUES (
      v_user_id,
      v_user_email,
      'Sin nombre',              -- Se actualizá después
      'Sin apellido',
      'Sin teléfono',
      'clienta',               -- Por defecto
      0                         -- Por defecto
    );
    
    RAISE NOTICE '✅ Perfil creado para: %', v_user_email;
    RETURN new;
  EXCEPTION
    WHEN others THEN
      -- Si hay algún error, reportarlo explícitamente
      RAISE EXCEPTION
        USING ERRCODE = '55000'
        MESSAGE = 'Error creando perfil: ' || SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que el trigger existe y está activo
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table as tabla,
  action_statement::text as accion
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================================================
-- INSTRUCCIONES
-- ============================================================================
--
-- Este trigger garantiza:
-- 1. Creará un perfil para CADA usuario que se cree en auth.users
-- 2. El perfil tendrá valores por defecto (no depende de metadata)
-- 3. Si el perfil ya existe, no se duplicará (solo NOTICE)
-- 4. Si hay error, se lanzará una excepción clara
--
-- Para crear usuario admin:
-- 1. Crea el usuario desde Dashboard de Supabase Authentication
-- 2. Se creará automáticamente el perfil con valores por defecto
-- 3. Luego actualiza el perfil con datos reales:
--
--    UPDATE profiles 
--    SET nombre = 'Admin', 
--        apellido = 'Principal',
--        telefono = '+54 11 1234-5678',
--        rol = 'admin'
--    WHERE id = 'UUID_DEL_USUARIO';
--
-- ============================================================================
