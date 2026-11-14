import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { ORDER_STEPS } from '@/types';

interface AdminOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  total: number;
  status: string;
  created_at: string;
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  domicilio: 'A Domicilio',
  recoger: 'Para Recoger',
  comedor: 'Comedor',
};

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('id, customer_name, customer_phone, order_type, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (fetchError) {
      setError('No se pudieron cargar los pedidos. Intenta de nuevo.');
    } else {
      setError(null);
      setOrders((data as AdminOrder[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const changeStatus = async (order: AdminOrder, status: string) => {
    if (order.status === status || updatingId) return;
    if (status === 'entregado' && !window.confirm('¿Marcar como entregado? Esto suma el sello de lealtad y el abono de la olla al cliente.')) {
      return;
    }
    setUpdatingId(order.id);
    setError(null);
    const { data, error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', order.id)
      .select('id');
    if (updateError || !data?.length) {
      setError('No se pudo actualizar el pedido. Intenta de nuevo.');
    } else {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-4 px-4 py-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-black text-gray-900">
          <ClipboardList className="h-5 w-5 text-red-600" />
          Pedidos recientes
        </h2>
        <button
          onClick={fetchOrders}
          className="rounded-full bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
          aria-label="Actualizar pedidos"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
      )}

      {!loading && orders.length === 0 && !error && (
        <p className="py-10 text-center text-sm text-gray-400">Aún no hay pedidos.</p>
      )}

      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">{order.customer_name}</p>
              <p className="text-xs text-gray-500">
                {order.customer_phone} · {ORDER_TYPE_LABELS[order.order_type] ?? order.order_type}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(order.created_at).toLocaleString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                })}
              </p>
            </div>
            <span className="flex-shrink-0 text-sm font-black text-red-600">{formatPrice(order.total)}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ORDER_STEPS.map((step) => {
              const active = order.status === step.key;
              return (
                <button
                  key={step.key}
                  disabled={updatingId === order.id}
                  onClick={() => changeStatus(order, step.key)}
                  className={`rounded-xl border-2 px-2 py-2 text-xs font-bold transition disabled:opacity-50 ${
                    active
                      ? 'border-red-600 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
