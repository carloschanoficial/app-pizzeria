/*
# Pizzería Matias - Mejoras de pedidos, pagos y seguimiento

## Descripción
Añade columnas a la tabla `orders` para soportar tipo de entrega (domicilio/recoger),
referencias de fachada, forma de pago y tipo de cambio. También agrega nuevas
configuraciones de tienda para datos bancarios y tipo de cambio USD.

## Cambios a tablas existentes
1. `orders` - Nuevas columnas:
   - `order_type` (text, default 'domicilio') - 'domicilio' o 'recoger'
   - `delivery_references` (text) - Referencias de la fachada/domicilio
   - `payment_method` (text, default 'efectivo') - 'efectivo', 'tarjeta', 'transferencia'
   - `exchange_rate` (numeric, default 1) - Tipo de cambio aplicado al pedido
   - `total_usd` (numeric, default 0) - Total convertido a USD si aplica

2. `store_settings` - Nuevas claves:
   - `bank_account` - Nombre del titular de la cuenta
   - `bank_clabe` - CLABE interbancaria
   - `bank_name` - Nombre del banco
   - `bank_card` - Número de tarjeta
   - `exchange_rate_usd` - Tipo de cambio USD→MXN

## Seguridad
- No se modifican políticas existentes. Las nuevas columnas son accesibles
  bajo las mismas políticas CRUD ya definidas para `orders`.
*/

-- Nuevas columnas en orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_type') THEN
    ALTER TABLE orders ADD COLUMN order_type text NOT NULL DEFAULT 'domicilio';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_references') THEN
    ALTER TABLE orders ADD COLUMN delivery_references text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
    ALTER TABLE orders ADD COLUMN payment_method text NOT NULL DEFAULT 'efectivo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'exchange_rate') THEN
    ALTER TABLE orders ADD COLUMN exchange_rate numeric(10,2) NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_usd') THEN
    ALTER TABLE orders ADD COLUMN total_usd numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Nuevas configuraciones de tienda
INSERT INTO store_settings (key, value) VALUES
('bank_account', 'Pizzería Matias S.A. de C.V.'),
('bank_clabe', '012 345 67890 1234567 8'),
('bank_name', 'BBVA'),
('bank_card', '4152 3169 0000 1234'),
('exchange_rate_usd', '18.50')
ON CONFLICT (key) DO NOTHING;
