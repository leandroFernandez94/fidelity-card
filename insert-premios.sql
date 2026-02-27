-- ============================================================================
-- INSERTAR PREMIOS FALTANTES
-- ============================================================================
-- Este script inserta los premios de ejemplo manualmente
-- ============================================================================

-- Insertar premios de ejemplo
INSERT INTO premios (nombre, descripcion, puntos_requeridos, activo) VALUES
('Manicura Gratis', 'Canjea una manicura gel gratis', 100, true),
('Pedicura Spa Gratis', 'Canjea una pedicura spa gratis', 80, true),
('Nails Art Gratis', 'Canjea un diseño de nails art gratis', 60, true),
('20% Descuento', 'Descuento del 20% en cualquier servicio', 50, true),
('Manicura + Pedicura', 'Canjea un combo completo', 150, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT * FROM premios;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Deberías ver 5 premios insertados correctamente
-- ============================================================================
