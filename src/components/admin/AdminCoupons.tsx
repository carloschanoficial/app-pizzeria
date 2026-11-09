import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DiscountCoupon } from '@/types';
import { AdminCouponForm } from '@/components/admin/AdminCouponForm';

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCoupon | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoadError(false);
    const { data, error } = await supabase
      .from('cupones_descuento')
      .select('id, codigo, descuento_porcentaje, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      setLoadError(true);
    } else {
      setCoupons((data as DiscountCoupon[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const toggleActive = async (coupon: DiscountCoupon) => {
    setTogglingId(coupon.id);
    setActionError(null);
    const { error } = await supabase
      .from('cupones_descuento')
      .update({ is_active: !coupon.is_active })
      .eq('id', coupon.id);
    setTogglingId(null);
    if (error) {
      setActionError('No se pudo cambiar el estado del cupón. Intenta de nuevo.');
      return;
    }
    fetchCoupons();
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900">Cupones</h2>
          <p className="text-xs text-gray-500">Códigos de descuento para tus clientes.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-2 text-xs font-bold text-white shadow transition hover:bg-red-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </button>
      </div>

      {loadError && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          No pudimos cargar los cupones. Intenta de nuevo.
        </p>
      )}

      {actionError && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{actionError}</p>
      )}

      {!loadError && coupons.length === 0 && (
        <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-500 ring-1 ring-gray-100">
          Aún no hay cupones creados.
        </p>
      )}

      <ul className="space-y-3">
        {coupons.map((coupon) => (
          <li key={coupon.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold tracking-wider text-gray-900">{coupon.codigo}</p>
                <p className="mt-1 text-xs text-gray-500">{coupon.descuento_porcentaje}% de descuento</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={coupon.is_active}
                aria-label={`Cupón ${coupon.codigo} ${coupon.is_active ? 'activo' : 'desactivado'}`}
                onClick={() => toggleActive(coupon)}
                disabled={togglingId === coupon.id}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
                  coupon.is_active ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    coupon.is_active ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${
                  coupon.is_active
                    ? 'bg-green-50 text-green-700 ring-green-200'
                    : 'bg-gray-100 text-gray-600 ring-gray-200'
                }`}
              >
                {coupon.is_active ? 'Activo' : 'Desactivado'}
              </span>
              <button
                type="button"
                onClick={() => setEditingCoupon(coupon)}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {creating && (
        <AdminCouponForm
          existingCodes={coupons.map((c) => c.codigo)}
          onClose={() => setCreating(false)}
          onSaved={fetchCoupons}
        />
      )}

      {editingCoupon && (
        <AdminCouponForm
          existingCodes={coupons.map((c) => c.codigo)}
          coupon={editingCoupon}
          onClose={() => setEditingCoupon(null)}
          onSaved={fetchCoupons}
        />
      )}
    </div>
  );
}
