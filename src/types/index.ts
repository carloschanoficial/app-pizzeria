export type SizeKey = 'chica' | 'mediana' | 'grande' | 'familiar';

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export type SizePrices = Partial<Record<SizeKey, number>>;

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  sizes: SizePrices | null;
  discount_percent: number;
  is_bestseller: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ExtraIngredient {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  sort_order: number;
}

export interface CartItemExtra {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  image_url: string | null;
  base_price: number;
  size: SizeKey | null;
  size_label: string;
  size_price: number;
  extras: CartItemExtra[];
  notes: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  is_half_half: boolean;
  half_product_name: string | null;
  is_free_reward: boolean;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  bg_gradient: string;
  sort_order: number;
  is_active: boolean;
}

export interface LoyaltyCard {
  id: string;
  customer_phone: string;
  stamps: number;
  reward_claimed: boolean;
  created_at: string;
  last_stamp_at: string | null;
  last_order_at: string | null;
}

export interface VirtualWallet {
  id: string;
  customer_phone: string;
  balance: number;
  last_credited_at: string | null;
  created_at: string;
}

export interface CashRegisterShift {
  id: string;
  opening_float: number;
  cash_sales: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  expected_cash: number | null;
  counted_cash: number | null;
  cash_difference: number | null;
  cash_count: Record<string, number> | null;
}

export interface CashRegisterExpense {
  id: string;
  shift_id: string;
  description: string;
  amount: number;
  created_at: string;
}

export interface AdminSubscription {
  id: string;
  email: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  nombre: string;
  duracion_dias: number;
  precio: number;
  precio_original: number | null;
  descuento_porcentaje: number;
  es_prueba: boolean;
  is_active: boolean;
  created_at: string;
}

export type PlanRequestStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface PlanRequest {
  id: string;
  email: string;
  status: PlanRequestStatus;
  ticket_path: string;
  created_at: string;
  reviewed_at: string | null;
  planes_suscripcion: { nombre: string } | null;
}

export interface AppliedCoupon {
  codigo: string;
  percent: number;
}

export interface DiscountCoupon {
  id: string;
  codigo: string;
  descuento_porcentaje: number;
  is_active: boolean;
  created_at: string;
}

export interface StoreSettings {
  whatsapp_number: string;
  delivery_cost: string;
  is_open: string;
  address: string;
  business_name?: string;
  brand_logo?: string;
  brand_color?: string;
  schedule: string;
  admin_code: string;
  bank_account: string;
  bank_clabe: string;
  bank_name: string;
  bank_card: string;
  exchange_rate_usd: string;
  manual_override: string;
  manual_is_open: string;
  auto_schedule: string;
  loyalty_reward_name: string;
  loyalty_stamps_required?: string;
  wallet_cashback_per_order: string;
  wallet_redeem_threshold: string;
}

export type OrderType = 'domicilio' | 'recoger' | 'comedor';
export type ShiftSalesByType = Record<OrderType, number> & { deliveryFees: number };
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export interface Order {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  items: CartItem[];
  subtotal: number;
  delivery_cost: number;
  total: number;
  status: string;
  created_at: string;
  order_type: OrderType | null;
  delivery_references: string | null;
  payment_method: PaymentMethod | null;
  exchange_rate: number;
  total_usd: number;
}

export const SIZE_LABELS: Record<SizeKey, string> = {
  chica: 'Chica',
  mediana: 'Mediana',
  grande: 'Grande',
  familiar: 'Familiar',
};

export const SIZE_ORDER: SizeKey[] = ['chica', 'mediana', 'grande', 'familiar'];

export const ORDER_STEPS = [
  { key: 'pendiente', label: 'Pedido Recibido' },
  { key: 'en preparación', label: 'En Preparación' },
  { key: 'en camino', label: 'En Camino / Listo para Recoger' },
  { key: 'entregado', label: 'Entregado' },
] as const;
