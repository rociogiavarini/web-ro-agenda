-- =========================================================
-- Sistema de Reservas – Rocío Giavarini Fotografía
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =========================================================

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_email text DEFAULT '',
  client_phone text NOT NULL,
  session_type text NOT NULL,
  pack_id text NOT NULL,
  pack_name text NOT NULL,
  pack_price numeric NOT NULL DEFAULT 0,
  backgrounds_qty integer NOT NULL DEFAULT 0,
  session_date date NOT NULL,
  session_time text DEFAULT '',
  notes text DEFAULT '',
  cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Allow public inserts (new bookings)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_insert_bookings"
  ON bookings FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public reads (for admin panel using anon key)
CREATE POLICY "allow_read_bookings"
  ON bookings FOR SELECT
  TO anon
  USING (true);

-- Allow updates (for status changes)
CREATE POLICY "allow_update_bookings"
  ON bookings FOR UPDATE
  TO anon
  USING (true);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_session_date ON bookings (session_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_session_type ON bookings (session_type);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings (created_at);

-- =========================================================
-- Fondos / Ambientaciones
-- =========================================================

CREATE TABLE IF NOT EXISTS backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  theme text NOT NULL DEFAULT 'vARIOS',
  image_data text NOT NULL, -- Base64 encoded image
  created_at timestamptz DEFAULT now()
);

-- =========================================================
-- Configuración Global (Costos Unitarios)
-- =========================================================
CREATE TABLE IF NOT EXISTS global_settings (
  id text PRIMARY KEY DEFAULT 'default',
  cost_13x18 numeric NOT NULL DEFAULT 0,
  cost_20x30 numeric NOT NULL DEFAULT 0,
  cost_fotolibro numeric NOT NULL DEFAULT 0,
  cost_imanes numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- =========================================================
-- Configuración de Packs (Precios y Costos dinámicos)
CREATE TABLE IF NOT EXISTS pack_configs (
  pack_id text PRIMARY KEY,
  price numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0, -- total cost
  cost_13x18 numeric DEFAULT 0,
  cost_20x30 numeric DEFAULT 0,
  cost_fotolibro numeric DEFAULT 0,
  cost_imanes numeric DEFAULT 0,
  cost_otros numeric DEFAULT 0,
  inclusions text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- Permisos públicos para simplificar el admin basado en frontend
ALTER TABLE backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_insert_bg" ON backgrounds FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow_read_bg" ON backgrounds FOR SELECT TO anon USING (true);
CREATE POLICY "allow_update_bg" ON backgrounds FOR UPDATE TO anon USING (true);
CREATE POLICY "allow_delete_bg" ON backgrounds FOR DELETE TO anon USING (true);

CREATE POLICY "allow_all_pack_configs" ON pack_configs FOR ALL TO anon USING (true);

CREATE POLICY "allow_all_global" ON global_settings FOR ALL TO anon USING (true);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_backgrounds_created_at ON backgrounds (created_at);
CREATE INDEX IF NOT EXISTS idx_backgrounds_theme ON backgrounds (theme);

-- Asegurar que las columnas existan si la tabla fue creada antes
BEGIN;
ALTER TABLE pack_configs ADD COLUMN IF NOT EXISTS cost_otros numeric DEFAULT 0;
ALTER TABLE pack_configs ADD COLUMN IF NOT EXISTS inclusions text DEFAULT '';
COMMIT;
