-- ============================================================================
-- DIAGNÓSTICO Y LIMPIEZA DE PROBLEMAS DE CREACIÓN DE USUARIOS
-- ============================================================================

-- Paso 1: Verificar si hay múltiples triggers en auth.users
-- ============================================================================
SELECT '=== 1. TRIGGERS EN AUTH.USERS ===' as info;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table as tabla,
  action_statement::text as accion,
  enabled
FROM information_schema.triggers
WHERE event_object_table = 'auth.users'
ORDER BY trigger_name;

-- Paso 2: Verificar estado de la tabla profiles
-- ============================================================================
SELECT '=== 2. ESTADO DE TABLA PROFILES ===' as info;
SELECT 
  table_name,
  table_type,
  is_insertable_into,
  is_typed
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Paso 3: Verificar columnas de profiles
-- ============================================================================
SELECT '=== 3. COLUMNAS DE PROFILES ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Paso 4: Verificar funciones relacionadas
-- ============================================================================
SELECT '=== 4. FUNCIONES EN PUBLIC ===' as info;
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name LIKE '%new_user%'
ORDER BY routine_name;

-- Paso 5: Eliminar triggers en conflicto (si los hay)
-- ============================================================================
DO $$
DECLARE
  trigger_to_drop TEXT;
BEGIN
  -- Buscar triggers viejos o duplicados
  FOR trigger_to_drop IN (
    -- Si existe más de un trigger con nombre similar, eliminarlo
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE event_object_table = 'auth.users'
      AND trigger_name ILIKE '%auth_user%'
    ORDER BY trigger_name
    LIMIT 1 OFFSET 1  -- Eliminar el segundo si hay más de uno
  )
  LOOP
    EXIT WHEN trigger_to_drop IS NULL;
    
    RAISE NOTICE '🗑️  Eliminando trigger en conflicto: %', trigger_to_drop;
    EXECUTE format('DROP TRIGGER IF EXISTS %s ON auth.users', trigger_to_drop);
  END LOOP;
END $$;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Deberías ver:
-- 1. Solo un trigger en auth.users (on_auth_user_created)
-- 2. Tabla profiles tipo BASE TABLE
-- 3. Todas las columnas esperadas
-- 4. Función handle_new_user existente
--
-- Si ves algo diferente, indica:
-- - Más de un trigger en auth.users
-- - Tabla profiles tipo VIEW
-- - Algún error en columnas
-- - Función handle_new_user faltante
--
-- ============================================================================
-- LIMPIEZA COMPLETA (¡CUIDADO - Solo si es necesario!)
-- ============================================================================
-- Descomenta y ejecuta estas líneas SOLO SI hay problemas:

-- -- ELIMINAR TRIGGERS CONFLICTO
-- DO $$
-- BEGIN
--   FOR trigger_name IN (
--     SELECT trigger_name FROM information_schema.triggers 
--     WHERE event_object_table = 'auth.users' AND trigger_name ILIKE '%auth_user%'
--   )
--   LOOP
--     RAISE NOTICE 'Eliminando: %', trigger_name;
--     EXECUTE format('DROP TRIGGER IF EXISTS %s ON auth.users', trigger_name);
--   END LOOP;
-- END $$;

-- -- RECREAR FUNCIÓN COMPLETAMENTE
-- DROP FUNCTION IF EXISTS handle_new_user CASCADE;
-- -- Ejecuta el trigger mejorado completo desde trigger-mejorado.sql
--
-- ============================================================================
