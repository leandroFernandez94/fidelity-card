# ============================================================================
# COMANDOS SQL ÚTILES PARA ADMINISTRACIÓN
# ============================================================================
# Guarda estos comandos para usar en el SQL Editor de Supabase
# ============================================================================

-- ============================================================================
-- USUARIOS Y PERFILES
-- ============================================================================

-- Ver todos los usuarios con sus roles
SELECT 
  p.id,
  p.nombre,
  p.apellido,
  p.email,
  p.telefono,
  p.rol,
  p.puntos,
  p.created_at as registro,
  COUNT(c.id) as total_citas
FROM profiles p
LEFT JOIN citas c ON c.clienta_id = p.id
GROUP BY p.id
ORDER BY p.created_at DESC;

-- Ver solo usuarios admin
SELECT * FROM profiles WHERE rol = 'admin';

-- Ver solo clientas
SELECT 
  nombre,
  apellido,
  email,
  telefono,
  puntos
FROM profiles
WHERE rol = 'clienta'
ORDER BY puntos DESC
LIMIT 10;

-- Promover un usuario a admin
UPDATE profiles 
SET rol = 'admin' 
WHERE email = 'usuario@email.com';

-- Reasignar puntos a un usuario
UPDATE profiles 
SET puntos = 100 
WHERE email = 'usuario@email.com';

-- ============================================================================
-- CITAS
-- ============================================================================

-- Ver todas las citas ordenadas por fecha
SELECT 
  c.id,
  p.nombre || ' ' || p.apellido as clienta,
  c.fecha_hora,
  c.estado,
  c.puntos_ganados,
  array_length(c.servicio_ids, 1) as num_servicios
FROM citas c
JOIN profiles p ON p.id = c.clienta_id
ORDER BY c.fecha_hora DESC;

-- Ver citas de hoy
SELECT 
  p.nombre || ' ' || p.apellido as clienta,
  c.fecha_hora,
  c.estado
FROM citas c
JOIN profiles p ON p.id = c.clienta_id
WHERE DATE(c.fecha_hora) = CURRENT_DATE
ORDER BY c.fecha_hora;

-- Ver citas pendientes
SELECT 
  p.nombre || ' ' || p.apellido as clienta,
  c.fecha_hora,
  c.estado,
  c.notas
FROM citas c
JOIN profiles p ON p.id = c.clienta_id
WHERE c.estado IN ('pendiente', 'confirmada')
ORDER BY c.fecha_hora ASC;

-- Ver citas por fecha específica
SELECT * FROM citas 
WHERE DATE(fecha_hora) = '2026-02-15'
ORDER BY fecha_hora;

-- ============================================================================
-- ESTADÍSTICAS
-- ============================================================================

-- Total de puntos otorgados
SELECT SUM(puntos) as total_puntos FROM profiles;

-- Clientas con más puntos
SELECT 
  nombre,
  apellido,
  puntos
FROM profiles
WHERE rol = 'clienta'
ORDER BY puntos DESC
LIMIT 10;

-- Citas por estado
SELECT 
  estado,
  COUNT(*) as cantidad
FROM citas
GROUP BY estado
ORDER BY cantidad DESC;

-- Citas por mes del año actual
SELECT 
  EXTRACT(MONTH FROM fecha_hora) as mes,
  COUNT(*) as total_citas,
  SUM(puntos_ganados) as puntos_otorgados
FROM citas
WHERE EXTRACT(YEAR FROM fecha_hora) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY mes
ORDER BY mes;

-- ============================================================================
-- SERVICIOS
-- ============================================================================

-- Ver todos los servicios
SELECT 
  nombre,
  descripcion,
  precio,
  duracion_min,
  puntos_otorgados
FROM servicios
ORDER BY nombre;

-- Servicio más solicitado
SELECT 
  unnest(servicio_ids) as servicio_id,
  s.nombre,
  COUNT(*) as veces_solicitado
FROM citas c
JOIN servicios s ON s.id = unnest(c.servicio_ids)
GROUP BY servicio_id, s.nombre
ORDER BY veces_solicitado DESC;

-- ============================================================================
-- REFERIDOS
-- ============================================================================

-- Ver todos los referidos
SELECT 
  p1.nombre || ' ' || p1.apellido as referente,
  p2.nombre || ' ' || p2.apellido as referida,
  r.puntos_ganados,
  r.fecha
FROM referidos r
JOIN profiles p1 ON p1.id = r.referente_id
JOIN profiles p2 ON p2.id = r.referida_id
ORDER BY r.fecha DESC;

-- Clientas que más han referido
SELECT 
  p.nombre || ' ' || p.apellido as clienta,
  p.email,
  COUNT(r.id) as total_referidos,
  SUM(r.puntos_ganados) as puntos_por_referidos
FROM profiles p
LEFT JOIN referidos r ON r.referente_id = p.id
WHERE p.rol = 'clienta'
GROUP BY p.id
ORDER BY total_referidos DESC;

-- ============================================================================
-- LIMPIEZA Y MANTENIMIENTO
-- ============================================================================

-- Eliminar citas canceladas antiguas (más de 6 meses)
DELETE FROM citas 
WHERE estado = 'cancelada' 
  AND fecha_hora < NOW() - INTERVAL '6 months';

-- Eliminar recordatorios enviados antiguos (más de 1 mes)
DELETE FROM recordatorios 
WHERE enviado = true 
  AND fecha_envio < NOW() - INTERVAL '1 month';

-- Recalcular puntos de todas las citas (útil si hubo errores)
-- NOTA: Requiere lógica adicional en la aplicación

-- ============================================================================
-- DIAGNÓSTICO
-- ============================================================================

-- Ver usuarios sin perfil (error en trigger)
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE id NOT IN (SELECT id FROM profiles);

-- Ver citas sin clienta válida (integridad referencial)
SELECT * FROM citas 
WHERE clienta_id NOT IN (SELECT id FROM profiles);

-- Ver duplicados por email
SELECT email, COUNT(*) as duplicados
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- ============================================================================
-- BACKUP Y EXPORTACIÓN
-- ============================================================================

-- Exportar todos los perfiles
SELECT * FROM profiles;

-- Exportar todas las citas
SELECT * FROM citas;

-- Exportar todas las transacciones de puntos
SELECT 
  p.nombre || ' ' || p.apellido as clienta,
  c.fecha_hora,
  c.puntos_ganados as puntos,
  c.estado
FROM citas c
JOIN profiles p ON p.id = c.clienta_id
WHERE c.puntos_ganados > 0
ORDER BY c.fecha_hora DESC;

-- ============================================================================
-- REINICIO (¡CUIDADO! Solo para desarrollo/testing)
-- ============================================================================

-- Eliminar todos los datos (¡CUIDADO!)
-- DELETE FROM citas;
-- DELETE FROM referidos;
-- DELETE FROM recordatorios;
-- DELETE FROM profiles WHERE rol = 'clienta';
-- DELETE FROM servicios;
-- DELETE FROM premios;

-- Recrear todo desde cero (¡EXTREMO CUIDADO!)
-- DROP TABLE IF EXISTS recordatorios CASCADE;
-- DROP TABLE IF EXISTS referidos CASCADE;
-- DROP TABLE IF EXISTS premios CASCADE;
-- DROP TABLE IF EXISTS citas CASCADE;
-- DROP TABLE IF EXISTS servicios CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS handle_new_user();
