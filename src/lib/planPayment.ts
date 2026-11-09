import { supabase } from '@/lib/supabase';

export const PLAN_PAYMENT_FIELDS = [
  { key: 'plan_bank_name', label: 'Banco' },
  { key: 'plan_bank_clabe', label: 'CLABE interbancaria' },
  { key: 'plan_bank_card', label: 'Número de tarjeta' },
  { key: 'plan_oxxo_convenio', label: 'Convenio OXXO / tiendas' },
] as const;

export const PLAN_PAYMENT_LEGEND_KEY = 'plan_payment_legend';

export const PLAN_DEPOSIT_STORES = ['OXXO', 'Chedraui', 'Kiosco', 'Farmacias Ahorro', 'Waldos', '7-Eleven'];

export const PLAN_DEPOSIT_STORES_KEY = 'plan_deposit_stores';

export function parseDepositStores(value: string | undefined): string[] {
  const selected = (value ?? '').split(',').map((store) => store.trim());
  return PLAN_DEPOSIT_STORES.filter((store) => selected.includes(store));
}

export const PLAN_PAYMENT_KEYS: string[] = [
  ...PLAN_PAYMENT_FIELDS.map((field) => field.key),
  PLAN_PAYMENT_LEGEND_KEY,
  PLAN_DEPOSIT_STORES_KEY,
];

export async function fetchPlanPaymentSettings(): Promise<Record<string, string> | null> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('key, value')
    .in('key', PLAN_PAYMENT_KEYS);
  if (error || !data) return null;
  const result: Record<string, string> = {};
  data.forEach((row) => {
    result[row.key] = row.value;
  });
  return result;
}

export function hasPlanPaymentInfo(settings: Record<string, string>): boolean {
  return PLAN_PAYMENT_KEYS.some((key) => (settings[key] ?? '').trim() !== '');
}
