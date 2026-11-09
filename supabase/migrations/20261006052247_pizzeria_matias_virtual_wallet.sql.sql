/*
# Pizzería Matias - Monedero Virtual "Olla de Dinero"

## Descripción
Crea una tabla `virtual_wallets` para el monedero virtual de cada cliente
(identificado por teléfono, igual que las tarjetas de lealtad). Cada compra
acredita $0.50 MXN al saldo. Cuando el saldo alcanza $20.00 MXN, el cliente
puede canjearlo como descuento en su siguiente compra.

## Tabla nueva
1. `virtual_wallets`
   - `id` (uuid, PK)
   - `customer_phone` (text, unique) — teléfono del cliente
   - `balance` (numeric, default 0) — saldo acumulado en MXN
   - `last_credited_at` (timestamptz) — fecha del último abono
   - `created_at` (timestamptz, default now())

## Seguridad
- RLS habilitado con CRUD completo para anon + authenticated (app sin login).
- Las políticas siguen el mismo patrón que `loyalty_cards`.
*/

CREATE TABLE IF NOT EXISTS virtual_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone text UNIQUE NOT NULL,
  balance numeric(10,2) NOT NULL DEFAULT 0,
  last_credited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE virtual_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_wallets" ON virtual_wallets;
CREATE POLICY "anon_select_wallets" ON virtual_wallets FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_wallets" ON virtual_wallets;
CREATE POLICY "anon_insert_wallets" ON virtual_wallets FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_wallets" ON virtual_wallets;
CREATE POLICY "anon_update_wallets" ON virtual_wallets FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_wallets" ON virtual_wallets;
CREATE POLICY "anon_delete_wallets" ON virtual_wallets FOR DELETE
TO anon, authenticated USING (true);
