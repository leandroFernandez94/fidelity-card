-- VALIDACIÓN DE SINTAXIS DEL SCRIPT crear-admin-completo.sql
-- ============================================================================

-- Test 1: Validar bloque DO $$
DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_user_email TEXT := 'admin@tu-dominio.com';
  v_nombre TEXT := 'Jazmin';
  v_apellido TEXT := 'Bosque';
  v_telefono TEXT := '+34 673691594';
  v_password TEXT := 'Admin123456';
BEGIN
  RAISE NOTICE 'Test DO $$: Variables declaradas correctamente';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE 'Email: %', v_user_email;
END $$;

-- Test 2: Validar función handle_new_user
CREATE OR REPLACE FUNCTION test_handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_exists BOOLEAN;
  v_user_id UUID := new.id;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = v_user_id
  ) INTO v_profile_exists;

  IF v_profile_exists THEN
    RETURN new;
  END IF;

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

-- Test 3: Validar CREATE TRIGGER
DROP TRIGGER IF EXISTS test_trigger_validation ON auth.users;
CREATE TRIGGER test_trigger_validation
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION test_handle_new_user();

-- Test 4: Validar SELECTs
SELECT 'Test SELECT 1' as test;
SELECT 
  'admin@tu-dominio.com' as email,
  'Jazmin' as nombre,
  'Bosque' as apellido;

-- Limpieza
DROP TRIGGER IF EXISTS test_trigger_validation ON auth.users;
DROP FUNCTION IF EXISTS test_handle_new_user();
