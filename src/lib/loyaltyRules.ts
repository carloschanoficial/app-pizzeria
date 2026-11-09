import type { CartItem, StoreSettings } from '@/types';
import { formatPrice } from '@/lib/format';

export function buildRewardCartItem(rewardName: string): CartItem {
  return {
    id: crypto.randomUUID(),
    product_id: 'reward',
    name: rewardName + ' (Premio de Lealtad)',
    image_url: null,
    base_price: 0,
    size: 'chica',
    size_label: 'Chica',
    size_price: 0,
    extras: [],
    notes: 'Premio por completar 6 pedidos',
    quantity: 1,
    unit_price: 0,
    discount_percent: 0,
    is_half_half: false,
    half_product_name: null,
    is_free_reward: true,
  };
}

export interface WalletRules {
  cashbackPerOrder: number;
  redeemThreshold: number;
}

function toAmount(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function getWalletRules(settings: StoreSettings | null): WalletRules {
  return {
    cashbackPerOrder: toAmount(settings?.wallet_cashback_per_order),
    redeemThreshold: toAmount(settings?.wallet_redeem_threshold),
  };
}

export function canRedeemBalance(balance: number, rules: WalletRules): boolean {
  return rules.redeemThreshold > 0 && balance >= rules.redeemThreshold;
}

export function buildLoyaltyRules(settings: StoreSettings | null): string[] {
  const rewardName = settings?.loyalty_reward_name?.trim() || 'tu premio';
  const { cashbackPerOrder, redeemThreshold } = getWalletRules(settings);

  const rules = [
    `Cada pedido suma 1 sello a tu tarjeta de lealtad. Al completar 6 sellos puedes reclamar ${rewardName}.`,
  ];
  if (cashbackPerOrder > 0) {
    rules.push(`Cada pedido suma ${formatPrice(cashbackPerOrder)} a tu Olla de Dinero.`);
  }
  if (redeemThreshold > 0) {
    rules.push(
      `Cuando tu saldo llegue a ${formatPrice(redeemThreshold)} podrás usarlo como descuento en tu siguiente compra.`,
    );
  }
  rules.push(
    'Si pasas un mes sin realizar ningún pedido, tus sellos y el saldo de tu Olla de Dinero se reiniciarán a cero.',
  );
  return rules;
}
