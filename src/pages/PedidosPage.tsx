import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle, Clock, Pizza, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { useStore } from '@/store/StoreContext';
import { useLoyaltyCard } from '@/hooks/useData';
import type { Order } from '@/types';
import { ORDER_STEPS } from '@/types';
import { LoyaltyCardComponent } from '@/components/LoyaltyCardComponent';

const STEP_ICONS = [Clock, Pizza, Truck, CheckCircle];
const STEP_COLORS = ['bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500'];

function getStepIndex(status: string): number {
  const idx = ORDER_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export function PedidosPage() {
  const { customerPhone, settings } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { card, loading: loyaltyLoading, refetch: refetchLoyalty } = useLoyaltyCard(customerPhone || null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (data) setOrders(data as Order[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh loyalty card when orders change
  useEffect(() => {
    refetchLoyalty();
  }, [orders, refetchLoyalty]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-gray-900">Mis Pedidos</h2>

      {/* Tarjeta de Lealtad */}
      {customerPhone && card && !loyaltyLoading && (
        <LoyaltyCardComponent
          stamps={card.stamps}
          rewardClaimed={card.reward_claimed}
          rewardName={settings?.loyalty_reward_name || 'Pizza Chica Hawaiana GRATIS'}
        />
      )}

      {!customerPhone && (
        <div className="rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 p-4 text-white shadow-lg">
          <p className="text-sm font-bold">Tarjeta de Lealtad</p>
          <p className="mt-1 text-xs text-white/80">
            Realiza tu primer pedido con tu teléfono para empezar a acumular
            sellos.
          </p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <ClipboardList className="h-10 w-10 text-gray-300" />
          </div>
          <p className="mt-4 text-base font-bold text-gray-700">
            No tienes pedidos aún
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Tus pedidos aparecerán aquí
          </p>
        </div>
      ) : (
        orders.map((order) => {
          const date = new Date(order.created_at);
          const dateStr = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
          const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
          const currentStep = getStepIndex(order.status);

          return (
            <div key={order.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{dateStr}</p>
                  <p className="text-xs text-gray-400">Hora del pedido: {timeStr} hrs</p>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600">
                  {ORDER_STEPS[currentStep].label}
                </span>
              </div>

              {/* Línea de tiempo */}
              <div className="mt-4">
                <div className="relative flex items-center justify-between">
                  <div className="absolute left-3.5 right-3.5 top-4 h-1 rounded-full bg-gray-200" />
                  <div
                    className="absolute left-3.5 top-4 h-1 rounded-full bg-green-500 transition-all duration-500"
                    style={{
                      width: `calc(${(currentStep / (ORDER_STEPS.length - 1)) * 100}% - ${currentStep === 0 ? 0 : 7}px)`,
                    }}
                  />
                  {ORDER_STEPS.map((step, idx) => {
                    const Icon = STEP_ICONS[idx];
                    const isDone = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={step.key} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                            isDone ? `${STEP_COLORS[idx]} text-white` : 'bg-gray-200 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-offset-1' : ''} ${
                            isCurrent && idx === 0 ? 'ring-amber-200'
                            : isCurrent && idx === 1 ? 'ring-blue-200'
                            : isCurrent && idx === 2 ? 'ring-purple-200'
                            : isCurrent && idx === 3 ? 'ring-green-200'
                            : ''
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span
                          className={`mt-1.5 text-center text-[9px] font-medium leading-tight ${
                            isDone ? 'text-gray-700' : 'text-gray-400'
                          }`}
                          style={{ maxWidth: '60px' }}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items */}
              <div className="mt-4 space-y-1 border-t border-gray-100 pt-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                      {item.quantity}
                    </span>
                    <span className="flex-1 text-gray-600">
                      {item.name}
                      {item.size_label !== 'Único' && ` (${item.size_label})`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600">
                  {order.order_type === 'comedor' ? 'Comedor' : order.order_type === 'recoger' ? 'Para Recoger' : 'A Domicilio'}
                </span>
                {order.payment_method && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600">
                    Pago: {order.payment_method === 'efectivo' ? 'Efectivo' : order.payment_method === 'tarjeta' ? 'Tarjeta' : 'Transferencia'}
                  </span>
                )}
              </div>

              {/* Total */}
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-base font-black text-red-600">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
