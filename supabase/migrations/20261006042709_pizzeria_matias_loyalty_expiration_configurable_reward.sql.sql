/*
# Pizzería Matias - Expiración de Sellos y Premio Configurable

## Descripción
1. Agrega columnas `last_stamp_at` y `last_order_at` a `loyalty_cards` para rastrear
   la última actividad del cliente y permitir la expiración automática de sellos
   después de 30 días sin pedidos.
2. Agrega la configuración `loyalty_reward_name` a `store_settings` para que el
   administrador pueda cambiar el nombre del premio de lealtad (ej: "Pizza Chica
   Hawaiana GRATIS" por "Molletes" o cualquier otro producto).

## Tablas modificadas
1. `loyalty_cards`
   - `last_stamp_at` (timestamptz, default now()) — fecha del último sello acumulado
   - `last_order_at` (timestamptz, default now()) — fecha del último pedido realizado
2. `store_settings`
   - Nueva clave: `loyalty_reward_name` (valor por defecto: "Pizza Chica Hawaiana GRATIS")

## Seguridad
- Sin cambios en RLS. Las políticas existentes de `loyalty_cards` cubren los nuevos
  columnos (anon + authenticated CRUD).
- La nueva clave en `store_settings` se inserta con ON CONFLICT DO NOTHING.
*/

-- ============================================================
-- LEALTAD: COLUMNAS DE EXPIRACIÓN
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loyalty_cards' AND column_name = 'last_stamp_at'
  ) THEN
    ALTER TABLE loyalty_cards ADD COLUMN last_stamp_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loyalty_cards' AND column_name = 'last_order_at'
  ) THEN
    ALTER TABLE loyalty_cards ADD COLUMN last_order_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ============================================================
-- PREMIO DE LEALTAD CONFIGURABLE
-- ============================================================
INSERT INTO store_settings (key, value) VALUES
('loyalty_reward_name', 'Pizza Chica Hawaiana GRATIS')
ON CONFLICT (key) DO NOTHING;
