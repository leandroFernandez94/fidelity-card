-- ============================================================================
-- CONFIGURACIÓN COMPLETA DE SUPABASE PARA FIDELITY CARD
-- ============================================================================
-- Ejecuta este script completo en el SQL Editor de Supabase
-- ============================================================================

-- ============================================================================
-- 1. CREAR TABLAS
-- ============================================================================

-- Tabla de perfiles (extensión de auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'clienta')) DEFAULT 'clienta',
  puntos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de servicios
CREATE TABLE IF NOT EXISTS servicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio INTEGER NOT NULL,
  duracion_min INTEGER NOT NULL,
  puntos_otorgados INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de citas
CREATE TABLE IF NOT EXISTS citas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clienta_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  servicio_ids UUID[] NOT NULL,
  fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  puntos_ganados INTEGER DEFAULT 0,
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')) DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de referidos
CREATE TABLE IF NOT EXISTS referidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referente_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referida_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  puntos_ganados INTEGER NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de premios
CREATE TABLE IF NOT EXISTS premios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  puntos_requeridos INTEGER NOT NULL,
  activo BOOLEAN DEFAULT TRUE
);

-- Tabla de recordatorios
CREATE TABLE IF NOT EXISTS recordatorios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clienta_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cita_id UUID REFERENCES citas(id) ON DELETE CASCADE NOT NULL,
  enviado BOOLEAN DEFAULT FALSE,
  fecha_envio TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 2. CREAR TRIGGER PARA PERFIL AUTOMÁTICO (MEJORADO)
-- ============================================================================

-- Este trigger garantiza:
-- 1. Creará perfil para cada usuario en auth.users
-- 2. No depende de raw_user_meta_data (siempre crea perfil básico)
-- 3. Verifica si el perfil ya existe antes de insertar
-- 4. Tiene manejo de errores explícito
-- ============================================================================

-- Función mejorada para crear perfil
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

  -- Si el perfil ya existe, no hacer nada (se actualizó manualmente)
  IF v_profile_exists THEN
    RAISE NOTICE 'ℹ️  El perfil ya existe para: %', v_user_email;
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 3. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_rol ON profiles(rol);
CREATE INDEX IF NOT EXISTS idx_profiles_puntos ON profiles(puntos DESC);
CREATE INDEX IF NOT EXISTS idx_citas_clienta ON citas(clienta_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);
CREATE INDEX IF NOT EXISTS idx_referidos_referente ON referidos(referente_id);
CREATE INDEX IF NOT EXISTS idx_servicios_nombre ON servicios(nombre);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE referidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE premios ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordatorios ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. POLICIES DE SEGURIDAD
-- ============================================================================

-- POLICIAS PARA PROFILES
-- Usuarios pueden leer su propio perfil
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuarios o service role pueden insertar perfiles
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR auth.role() = 'service_role'
  );

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins pueden leer todos los perfiles
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Admins pueden actualizar cualquier perfil
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- POLICIAS PARA SERVICIOS
-- Cualquiera puede leer servicios (público)
CREATE POLICY "Public read servicios" ON servicios
  FOR SELECT USING (true);

-- Solo admins pueden insertar servicios
CREATE POLICY "Admins can insert servicios" ON servicios
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Solo admins pueden actualizar servicios
CREATE POLICY "Admins can update servicios" ON servicios
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Solo admins pueden eliminar servicios
CREATE POLICY "Admins can delete servicios" ON servicios
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- POLICIAS PARA CITAS
-- Clientas pueden leer sus propias citas
CREATE POLICY "Users can read own citas" ON citas
  FOR SELECT USING (clienta_id = auth.uid());

-- Admins pueden leer todas las citas
CREATE POLICY "Admins can read all citas" ON citas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Solo admins pueden insertar citas
CREATE POLICY "Admins can insert citas" ON citas
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Solo admins pueden actualizar citas
CREATE POLICY "Admins can update citas" ON citas
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Solo admins pueden eliminar citas
CREATE POLICY "Admins can delete citas" ON citas
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- POLICIAS PARA REFERIDOS
-- Usuarios pueden leer sus propios referidos
CREATE POLICY "Users can read own referidos" ON referidos
  FOR SELECT USING (referente_id = auth.uid());

-- Admins pueden leer todos los referidos
CREATE POLICY "Admins can read all referidos" ON referidos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- POLICIAS PARA PREMIOS
-- Cualquiera puede leer premios (público)
CREATE POLICY "Public read premios" ON premios
  FOR SELECT USING (true);

-- Solo admins pueden gestionar premios
CREATE POLICY "Admins can manage premios" ON premios
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- POLICIAS PARA RECORDATORIOS
-- Clientas pueden leer sus propios recordatorios
CREATE POLICY "Users can read own recordatorios" ON recordatorios
  FOR SELECT USING (clienta_id = auth.uid());

-- Admins pueden leer todos los recordatorios
CREATE POLICY "Admins can read all recordatorios" ON recordatorios
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- ============================================================================
-- 6. DATOS DE EJEMPLO
-- ============================================================================

-- Insertar servicios de ejemplo
INSERT INTO servicios (nombre, descripcion, precio, duracion_min, puntos_otorgados) VALUES
('Manicura Gel', 'Manicura permanente con gel de alta duración', 15000, 90, 15),
('Pedicura Spa', 'Pedicura completa con hidratación y masaje', 12000, 60, 12),
('Nails Art', 'Diseño personalizado en uñas', 8000, 45, 8),
('Manicura Rusa', 'Limpieza profunda de cutículas', 10000, 60, 10),
('French', 'Diseño clásico francés', 13000, 75, 13),
('Manicura Express', 'Manicura rápida sin esmalte', 5000, 30, 5),
('Diseño Personalizado', 'Diseño exclusivo según tu gusto', 12000, 90, 12)
ON CONFLICT DO NOTHING;

-- Insertar premios de ejemplo
INSERT INTO premios (nombre, descripcion, puntos_requeridos) VALUES
('Manicura Gratis', 'Canjea una manicura gel gratis', 100),
('Pedicura Spa Gratis', 'Canjea una pedicura spa gratis', 80),
('Nails Art Gratis', 'Canjea un diseño de nails art gratis', 60),
('20% Descuento', 'Descuento del 20% en cualquier servicio', 50),
('Manicura + Pedicura', 'Canjea un combo completo', 150)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CONFIGURACIÓN COMPLETADA
-- ============================================================================
-- Siguientes pasos:
-- 1. Crea tu cuenta de admin en el panel de Supabase Authentication
-- 2. Ejecuta: UPDATE profiles SET rol = 'admin' WHERE email = 'tu_admin@email.com';
-- 3. Copia la URL y el anon key del proyecto
-- 4. Actualiza tu archivo .env con las credenciales
-- 5. ¡Listo para usar la aplicación!
