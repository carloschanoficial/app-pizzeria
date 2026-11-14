import { useState, useEffect, useRef } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  ShoppingBag,
  Truck,
  Store,
  UtensilsCrossed,
  Banknote,
  CreditCard,
  Building2,
  Copy,
  Check,
  Gift,
} from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { formatPrice } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/hooks/useData';
import { buildRewardCartItem, getLoyaltyStampsRequired, getWalletRules } from '@/lib/loyaltyRules';
import { ClayPotIcon } from '@/components/ClayPotIcon';
import { isValidWhatsappNumber, normalizeWhatsappNumber } from '@/lib/whatsapp';
import { CouponInput } from '@/components/CouponInput';
import type { AppliedCoupon, CartItem, OrderType, PaymentMethod } from '@/types';

interface CartSheetProps {
  onClose: () => void;
  onOrderPlaced: () => void;
}

export function CartSheet({ onClose, onOrderPlaced }: CartSheetProps) {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    deliveryCost,
    cartTotal,
    settings,
    orderType,
    setOrderType,
    customerPhone,
    setCustomerPhone,
    addToCart,
  } = useStore();

  const [name, setName] = useState(() => localStorage.getItem('pm_customer_name') || '');
  const [phone, setPhone] = useState(customerPhone);
  const [address, setAddress] = useState(() => localStorage.getItem('pm_customer_address') || '');
  const [references, setReferences] = useState(() => localStorage.getItem('pm_customer_references') || '');
  const [loyaltyStamps, setLoyaltyStamps] = useState<number>(0);
  const [loyaltyRewardClaimed, setLoyaltyRewardClaimed] = useState(false);
  const [rewardDeclined, setRewardDeclined] = useState(false);
  const loyaltyFetched = useRef(false);
  const EXPIRY_DAYS = 30;
  const THIRTY_DAYS_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cashAmount, setCashAmount] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { wallet, refetch: refetchWallet, canRedeem, threshold: walletThreshold, cashback: walletCashback } = useWallet(phone.trim() || null, getWalletRules(settings));
  const walletBalance = wallet ? Number(wallet.balance) : 0;
  const walletDiscount = canRedeem ? Math.min(walletBalance, walletThreshold, cartTotal) : 0;
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const couponDiscount = appliedCoupon
    ? Math.min(Math.round(cartSubtotal * appliedCoupon.percent / 100), Math.max(cartTotal - walletDiscount, 0))
    : 0;
  const finalTotal = Math.max(cartTotal - walletDiscount - couponDiscount, 0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (loyaltyFetched.current || !phone.trim()) return;
    loyaltyFetched.current = true;
    supabase
      .from('loyalty_cards')
      .select('stamps, reward_claimed, last_stamp_at')
      .eq('customer_phone', phone.trim())
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const card = data as { stamps: number; reward_claimed: boolean; last_stamp_at: string | null };
          const now = Date.now();
          const lastStamp = card.last_stamp_at ? new Date(card.last_stamp_at).getTime() : 0;
          if (card.stamps > 0 && now - lastStamp > THIRTY_DAYS_MS) {
            setLoyaltyStamps(0);
            setLoyaltyRewardClaimed(false);
            supabase
              .from('loyalty_cards')
              .update({ stamps: 0, reward_claimed: false })
              .eq('customer_phone', phone.trim());
          } else {
            setLoyaltyStamps(card.stamps);
            setLoyaltyRewardClaimed(card.reward_claimed);
          }
        }
      });
  }, [phone, THIRTY_DAYS_MS]);

  useEffect(() => {
    if (name.trim()) localStorage.setItem('pm_customer_name', name.trim());
  }, [name]);
  useEffect(() => {
    if (phone.trim()) localStorage.setItem('pm_customer_phone', phone.trim());
  }, [phone]);
  useEffect(() => {
    if (address.trim()) localStorage.setItem('pm_customer_address', address.trim());
  }, [address]);
  useEffect(() => {
    if (references.trim()) localStorage.setItem('pm_customer_references', references.trim());
  }, [references]);

  const needsAddress = orderType === 'domicilio';
  const hasFreeReward = cart.some((c) => c.is_free_reward);
  const rewardName = settings?.loyalty_reward_name || 'Pizza Chica Hawaiana GRATIS';
  const stampsRequired = getLoyaltyStampsRequired(settings);
  const rewardPending = loyaltyStamps >= stampsRequired && !loyaltyRewardClaimed && !hasFreeReward && !rewardDeclined;
  const effectiveTotal = finalTotal;
  const change = cashAmount !== null ? cashAmount - effectiveTotal : null;

  const waNumber = normalizeWhatsappNumber(settings?.whatsapp_number ?? '');
  const whatsappReady = isValidWhatsappNumber(waNumber);

  const canCheckout =
    cart.length > 0 &&
    !rewardPending &&
    whatsappReady &&
    name.trim() &&
    phone.trim() &&
    (!needsAddress || (address.trim() && references.trim())) &&
    (paymentMethod !== 'efectivo' || (cashAmount !== null && cashAmount >= effectiveTotal));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildWhatsAppMessage = (updatedStamps: number) => {
    const divider = '--------------------';
    const lines: string[] = [];
    lines.push('- *¡Gracias por tu preferencia! Te estamos atendiendo...*');
    lines.push('');
    lines.push(divider);
    lines.push('- *Cliente:* ' + name);
    lines.push('- *Teléfono:* ' + phone);
    lines.push(
      '- *Tipo de Pedido:* ' +
        (orderType === 'domicilio' ? 'A Domicilio' : orderType === 'recoger' ? 'Para Recoger en Tienda' : 'Comedor')
    );
    if (needsAddress) {
      lines.push('- *Dirección:* ' + address);
      lines.push('- *Referencias:* ' + references);
    }
    lines.push('- *Forma de Pago:* ' + (paymentMethod === 'efectivo' ? 'Efectivo' : paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Transferencia / Depósito'));
    if (paymentMethod === 'efectivo' && cashAmount !== null) {
      lines.push('- *Paga con:* ' + formatPrice(cashAmount));
      if (change !== null && change > 0) {
        lines.push('- *Cambio:* ' + formatPrice(change));
      }
    }
    lines.push(divider);
    lines.push('- *Detalle del Pedido*');
    cart.forEach((item: CartItem) => {
      lines.push('');
      const sizeStr = item.size_label && item.size_label !== 'Único' ? ` (${item.size_label})` : '';
      const productName =
        item.is_half_half && item.half_product_name
          ? `Pizza Mitad ${item.name.replace(/^Pizza Mitad\/Mitad:\s*/, '').split(' / ')[0]} / Mitad ${item.half_product_name}`
          : item.name;
      const emoji = '';
      if (item.is_free_reward) {
        lines.push(`${emoji}${rewardName} $0 x ${item.quantity} = $0`);
      } else {
        const unitPrice = item.unit_price * (1 - (item.discount_percent || 0) / 100);
        lines.push(
          `${emoji}${productName}${sizeStr} ${formatPrice(unitPrice)} x ${item.quantity} = ${formatPrice(Math.round(unitPrice) * item.quantity)}`,
        );
      }
      if (item.extras.length > 0) {
        lines.push(`   Extras: ${item.extras.map((e) => e.name).join(', ')}`);
      }
      if (item.notes && !item.is_half_half && !item.is_free_reward) {
        lines.push(`   Notas: ${item.notes}`);
      }
    });
    lines.push('');
    lines.push(divider);
    lines.push('- *Resumen*');
    const now = new Date();
    const timeStr = now.toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    lines.push(`- Hora del pedido: ${timeStr}`);
    lines.push(`Subtotal: ${formatPrice(cartSubtotal)}`);
    lines.push(
      `Envío: ${orderType === 'domicilio' ? formatPrice(deliveryCost) : orderType === 'recoger' ? 'Gratis (Recoger en tienda)' : 'Gratis (Comedor)'}`,
    );

    if (appliedCoupon && couponDiscount > 0) {
      lines.push(`Cupón ${appliedCoupon.codigo} (${appliedCoupon.percent}%): -${formatPrice(couponDiscount)}`);
    }

    if (walletDiscount > 0) {
      lines.push(`Olla de Dinero utilizada: -${formatPrice(walletDiscount)}`);
      lines.push('¡Gracias por ser un cliente frecuente!');
    }
    lines.push(divider);
    lines.push(`*Total: ${formatPrice(effectiveTotal)}*`);

    if (updatedStamps >= stampsRequired && !loyaltyRewardClaimed && !hasFreeReward) {
      lines.push(`${updatedStamps}/${stampsRequired} ¡Reclama ${rewardName} EN TU PRÓXIMO PEDIDO!`);
    } else if (!loyaltyRewardClaimed && !hasFreeReward) {
      lines.push(`Tarjeta Lealtad: ${updatedStamps}/${stampsRequired}`);
    }

    if (paymentMethod === 'transferencia') {
      lines.push('');
      lines.push('--- Datos para Transferencia/Depósito ---');
      lines.push(`Banco: ${settings?.bank_name || ''}`);
      lines.push(`Titular: ${settings?.bank_account || ''}`);
      lines.push(`CLABE: ${settings?.bank_clabe || ''}`);
      lines.push(`Tarjeta: ${settings?.bank_card || ''}`);
    }
    return lines.join('\n');
  };

  const handleConfirmOrder = async () => {
    if (!canCheckout || submitting) return;

    if (paymentMethod === 'efectivo' && (cashAmount === null || cashAmount < effectiveTotal)) {
      window.alert('El monto con el que vas a pagar debe ser mayor o igual al total del pedido.');
      return;
    }

    setSubmitting(true);
    const updatedStamps = hasFreeReward ? 0 : Math.min(loyaltyStamps + 1, stampsRequired);

    try {
      if (phone.trim()) {
        try {
          await supabase.rpc('redeem_wallet_for_order', {
            p_phone: phone.trim(),
            p_requested: walletDiscount,
          });
          refetchWallet();
        } catch (e) {
          console.error('Error wallet:', e);
        }
      }

      try {
        await supabase.from('orders').insert({
          customer_name: name,
          customer_phone: phone,
          customer_address: needsAddress ? address : null,
          items: JSON.parse(JSON.stringify(cart)),
          subtotal: cartSubtotal,
          delivery_cost: deliveryCost,
          total: effectiveTotal,
          status: 'pendiente',
          order_type: orderType,
          delivery_references: needsAddress ? references : null,
          payment_method: paymentMethod,
          coupon_code: appliedCoupon?.codigo ?? null,
          coupon_discount_percent: appliedCoupon?.percent ?? null,
          coupon_discount_amount: couponDiscount > 0 ? couponDiscount : null,
          wallet_cashback: walletCashback,
        });
      } catch (e) {
        console.error('Error orden:', e);
      }

      if (phone.trim()) {
        setCustomerPhone(phone.trim());
      }
    } catch (err) {
      console.error('Error general:', err);
    } finally {
      setSubmitting(false);
      const message = buildWhatsAppMessage(updatedStamps);
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

      clearCart();
      onOrderPlaced();
      window.location.href = waUrl;
      onClose();
    }
  };

  const QUICK_CASH = [200, 500, 1000];

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-gray-50 animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-bold text-gray-900">
              {showCheckout ? 'Datos de Entrega' : 'Tu Carrito'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <ShoppingBag className="h-10 w-10 text-gray-300" />
            </div>
            <p className="mt-4 text-base font-bold text-gray-700">
              Tu carrito está vacío
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Agrega algunas pizzas deliciosas para empezar
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Ver Menú
            </button>
          </div>
        ) : !showCheckout ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="space-y-2.5">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100"
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                          {item.name}
                        </h3>
                        {item.is_free_reward && (
                          <Gift className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                        )}
                      </div>
                      {item.is_free_reward && (
                        <p className="text-[11px] font-bold text-green-600">
                          Premio de lealtad - GRATIS
                        </p>
                      )}
                      {item.is_half_half && item.half_product_name && (
                        <p className="text-[11px] font-medium text-orange-500">
                          Mitad: {item.half_product_name}
                        </p>
                      )}
                      {item.size_label !== 'Único' && (
                        <p className="text-[11px] text-gray-400">
                          {item.size_label}
                        </p>
                      )}
                      {item.extras.length > 0 && (
                        <p className="text-[11px] text-gray-400 line-clamp-1">
                          + {item.extras.map((e) => e.name).join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-gray-400 italic line-clamp-1">
                          "{item.notes}"
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 transition active:scale-90 hover:bg-gray-200"
                          >
                            <Minus className="h-3.5 w-3.5 text-gray-600" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white transition active:scale-90 hover:bg-red-700"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-red-600">
                            {item.is_free_reward
                              ? 'GRATIS'
                              : formatPrice(
                                  item.unit_price *
                                    item.quantity *
                                    (1 - (item.discount_percent || 0) / 100),
                                )}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-300 transition hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3 pb-5">
              <div className="mb-3">
                <CouponInput
                  applied={appliedCoupon}
                  onApply={setAppliedCoupon}
                  onRemove={() => setAppliedCoupon(null)}
                />
              </div>
              <div className="mb-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Envío{' '}
                    {orderType === 'recoger' && (
                      <span className="text-green-600">(Recoger)</span>
                    )}
                  </span>
                  <span className="font-medium text-gray-900">
                    {deliveryCost === 0 ? 'Gratis' : formatPrice(deliveryCost)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Cupón {appliedCoupon?.codigo}</span>
                    <span className="font-medium text-green-600">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-base font-black text-red-600">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
                {canRedeem && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 p-2">
                    <ClayPotIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs text-green-700">
                      Tienes {formatPrice(walletBalance)} en tu olla. Podrás usarlos al continuar.
                    </span>
                  </div>
                )}
              </div>
              {hasFreeReward && (
                <div className="mb-3 rounded-2xl bg-green-50 p-4 ring-1 ring-green-200">
                  <p className="text-sm font-bold text-green-800">
                    ¡Felicidades, completaste tu meta de lealtad!
                  </p>
                  <p className="mt-1 text-xs text-green-700">
                    Tu premio se aplicará a esta compra. ¡Gracias por tu preferencia!
                  </p>
                  <p className="mt-2 text-xs font-bold text-green-800">
                    Tarjeta aplicada: acumula en tus siguientes compras
                  </p>
                </div>
              )}
              {rewardPending && (
                <div className="mb-3 rounded-2xl bg-yellow-50 p-4 ring-1 ring-yellow-300">
                  <p className="text-sm font-bold text-gray-900">
                    Completaste {stampsRequired} pedidos. ¿Quieres reclamar tu premio en este pedido?
                  </p>
                  <button
                    onClick={() => addToCart(buildRewardCartItem(rewardName, stampsRequired))}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 py-3 text-sm font-black text-gray-900 transition active:scale-[0.98] hover:bg-yellow-300"
                  >
                    <Gift className="h-4 w-4" />
                    Reclamar {rewardName}
                  </button>
                  <button
                    onClick={() => setRewardDeclined(true)}
                    className="mt-2 w-full py-2 text-xs font-bold text-gray-600 underline underline-offset-2 transition hover:text-gray-900"
                  >
                    No quiero reclamarlo ahora
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowCheckout(true)}
                disabled={rewardPending}
                className="w-full rounded-full bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-[0.98] hover:bg-red-700 disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {loyaltyStamps >= stampsRequired && !loyaltyRewardClaimed && !hasFreeReward && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-yellow-50 p-4 ring-1 ring-yellow-300">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">Tienes un premio disponible</p>
                    <p className="truncate text-xs text-gray-600">{rewardName}</p>
                  </div>
                  <button
                    onClick={() => addToCart(buildRewardCartItem(rewardName, stampsRequired))}
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-yellow-400 px-4 py-2 text-xs font-black text-gray-900 transition active:scale-95 hover:bg-yellow-300"
                  >
                    <Gift className="h-4 w-4" />
                    Aplicar
                  </button>
                </div>
              )}
              {/* Tipo de pedido */}
              <div className="mb-4">
                <label className="text-sm font-bold text-gray-700">
                  Tipo de Pedido <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setOrderType('domicilio')}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 text-xs font-bold transition sm:flex-row sm:gap-2 sm:text-sm ${
                      orderType === 'domicilio'
                        ? 'border-red-600 bg-red-50 text-red-600'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    A Domicilio
                  </button>
                  <button
                    onClick={() => setOrderType('recoger')}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 text-xs font-bold transition sm:flex-row sm:gap-2 sm:text-sm ${
                      orderType === 'recoger'
                        ? 'border-red-600 bg-red-50 text-red-600'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    Para Recoger
                  </button>
                  <button
                    onClick={() => setOrderType('comedor')}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 text-xs font-bold transition sm:flex-row sm:gap-2 sm:text-sm ${
                      orderType === 'comedor'
                        ? 'border-red-600 bg-red-50 text-red-600'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <UtensilsCrossed className="h-4 w-4" />
                    Comedor
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-bold text-gray-700">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 55 1234 5678"
                    className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                  />
                </div>
                {needsAddress && (
                  <>
                    <div>
                      <label className="text-sm font-bold text-gray-700">
                        Dirección de entrega{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Calle, número, colonia..."
                        rows={2}
                        className="mt-1 w-full resize-none rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700">
                        Referencias de la Fachada{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={references}
                        onChange={(e) => setReferences(e.target.value)}
                        placeholder="Ej: Casa de 2 pisos, sin pintar, puerta negra..."
                        rows={2}
                        className="mt-1 w-full resize-none rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                      />
                    </div>
                  </>
                )}
                {!needsAddress && settings && (
                  <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3">
                    <Store className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                    <p className="text-xs text-blue-700">
                      Recoge tu pedido en:{' '}
                      <span className="font-bold">{settings.address}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Forma de pago */}
              <div className="mt-4">
                <label className="text-sm font-bold text-gray-700">
                  Forma de Pago <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 space-y-2">
                  {(
                    [
                      { key: 'efectivo', label: 'Efectivo', icon: Banknote },
                      { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                      { key: 'transferencia', label: 'Transferencia / Depósito', icon: Building2 },
                    ] as { key: PaymentMethod; label: string; icon: typeof Banknote }[]
                  ).map((method) => {
                    const Icon = method.icon;
                    const active = paymentMethod === method.key;
                    return (
                      <button
                        key={method.key}
                        onClick={() => setPaymentMethod(method.key)}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                          active
                            ? 'border-red-600 bg-red-50 text-red-600'
                            : 'border-gray-200 bg-white text-gray-600'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pago en efectivo - Cambio */}
              {paymentMethod === 'efectivo' && (
                <div className="mt-4 rounded-xl bg-white p-3.5 border-2 border-gray-200">
                  <label className="text-sm font-bold text-gray-700">
                    ¿Con cuánto vas a pagar? <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 flex gap-2">
                    {QUICK_CASH.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setCashAmount(amount)}
                        className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                          cashAmount === amount
                            ? 'border-red-600 bg-red-50 text-red-600'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="number"
                      value={cashAmount ?? ''}
                      onChange={(e) => setCashAmount(e.target.value ? Number(e.target.value) : null)}
                      placeholder="Otra cantidad..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-500"
                    />
                  </div>
                  {cashAmount !== null && (
                    <div className="mt-2 text-xs font-medium text-gray-600">
                      {change !== null && change >= 0 ? (
                        <span>Tu cambio aproximado: <strong className="text-red-600">{formatPrice(change)}</strong></span>
                      ) : (
                        <span className="text-red-600 font-bold">El monto es menor al total del pedido</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Transferencia - Datos bancarios */}
              {paymentMethod === 'transferencia' && settings && (
                <div className="mt-4 rounded-xl bg-blue-50 p-4 border border-blue-200">
                  <h4 className="text-sm font-bold text-blue-900 mb-2">Datos para Transferencia / Depósito</h4>
                  <div className="space-y-1 text-xs text-blue-800">
                    <p><strong>Banco:</strong> {settings.bank_name || 'No especificado'}</p>
                    <p><strong>Titular:</strong> {settings.bank_account || 'No especificado'}</p>
                    <p><strong>CLABE:</strong> {settings.bank_clabe || 'No especificada'}</p>
                    <p><strong>Tarjeta:</strong> {settings.bank_card || 'No especificada'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Checkout */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3 pb-5">
              <div className="mb-3 flex justify-between">
                <span className="text-base font-bold text-gray-900">Total a Pagar</span>
                <span className="text-base font-black text-red-600">
                  {formatPrice(effectiveTotal)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="rounded-full bg-gray-100 px-4 py-3.5 text-sm font-bold text-gray-600 transition hover:bg-gray-200"
                >
                  Volver
                </button>
                <button
                  onClick={handleConfirmOrder}
                  disabled={!canCheckout || submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green-600 py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-[0.98] hover:bg-green-700 disabled:opacity-50"
                >
                  <MessageCircle className="h-5 w-5" />
                  {submitting ? 'Procesando...' : 'Enviar Pedido por WhatsApp'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}