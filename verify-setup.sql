-- ============================================================================
-- SCRIPT DE VERIFICACIÓN DE CONFIGURACIÓN
-- ============================================================================
-- Ejecuta este script en el SQL Editor de Supabase para verificar
-- que la configuración se realizó correctamente
-- ============================================================================

-- 1. VERIFICAR TABLAS CREADAS
SELECT '=== TABLAS CREADAS ===' as info;
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columnas
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'servicios', 'citas', 'referidos', 'premios', 'recordatorios')
ORDER BY table_name;

-- 2. VERIFICAR RLS HABILITADO
SELECT '=== ROW LEVEL SECURITY (RLS) ===' as info;
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'servicios', 'citas', 'referidos', 'premios', 'recordatorios')
ORDER BY tablename;

-- 3. VERIFICAR POLICIAS CREADAS
SELECT '=== POLICIAS DE SEGURIDAD ===' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive as activa,
  roles,
  cmd as accion
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. VERIFICAR TRIGGER DE USUARIOS
SELECT '=== TRIGGER DE USUARIOS ===' as info;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table as tabla,
  action_statement::text as accion
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
  AND trigger_name = 'on_auth_user_created';

-- 5. VERIFICAR ÍNDICES CREADOS
SELECT '=== ÍNDICES CREADOS ===' as info;
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef::text
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'servicios', 'citas', 'referidos')
ORDER BY tablename, indexname;

-- 6. VERIFICAR DATOS DE EJEMPLO
SELECT '=== SERVICIOS DE EJEMPLO ===' as info;
SELECT 
  id,
  nombre,
  precio,
  puntos_otorgados,
  created_at
FROM servicios
ORDER BY nombre;

SELECT '=== PREMIOS DE EJEMPLO ===' as info;
SELECT 
  id,
  nombre,
  puntos_requeridos,
  activo
FROM premios
ORDER BY puntos_requeridos;

-- 7. VERIFICAR ESTRUCTURA DE TABLAS
SELECT '=== ESTRUCTURA DE TABLAS ===' as info;

-- Estructura de profiles
\d profiles

-- Estructura de servicios
\d servicios

-- Estructura de citas
\d citas

-- Estructura de referidos
\d referidos

-- ============================================================================
-- RESULTADOS ESPERADOS:
-- ============================================================================
-- TABLAS: 6 tablas creadas (profiles, servicios, citas, referidos, premios, recordatorios)
-- RLS: true para todas las tablas
-- POLICIAS: ~15 políticas creadas
-- TRIGGER: on_auth_user_created activo en auth.users
-- ÍNDICES: 7 índices creados
-- SERVICIOS: 7 servicios de ejemplo insertados
-- PREMIOS: 5 premios de ejemplo insertados
-- ============================================================================
