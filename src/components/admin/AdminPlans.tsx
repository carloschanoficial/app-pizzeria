import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SubscriptionPlan } from '@/types';
import { AdminPlanForm } from '@/components/admin/AdminPlanForm';
import { computePlanPricing, formatPlanPrice } from '@/lib/subscriptionPricing';

function PlanPriceBreakdown({ plan }: { plan: SubscriptionPlan }) {
  const pricing = computePlanPricing(plan.precio, plan.precio_original, plan.descuento_porcentaje);
  return (
    <div className="mt-1 space-y-1 text-xs text-gray-500">
      <p>{plan.duracion_dias} días</p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {pricing.discount > 0 && (
          <>
            <span className="text-gray-400 line-through">{formatPlanPrice(pricing.base)}</span>
            <span className="rounded-full bg-green-50 px-2 py-0.5 font-bold text-green-700 ring-1 ring-green-200">
              {pricing.discount}% OFF
            </span>
          </>
        )}
        <span className="text-sm font-black text-gray-900">{formatPlanPrice(pricing.final)} final</span>
      </p>
    </div>
  );
}

export function AdminPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null | 'new'>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoadError(false);
    const { data, error } = await supabase
      .from('planes_suscripcion')
      .select('id, nombre, duracion_dias, precio, precio_original, descuento_porcentaje, es_prueba, is_active, created_at')
      .order('created_at', { ascending: true });
    if (error) {
      setLoadError(true);
    } else {
      setPlans((data as SubscriptionPlan[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const toggleActive = async (plan: SubscriptionPlan) => {
    setTogglingId(plan.id);
    setActionError(null);
    const { error } = await supabase
      .from('planes_suscripcion')
      .update({ is_active: !plan.is_active })
      .eq('id', plan.id);
    setTogglingId(null);
    if (error) {
      setActionError('No se pudo cambiar el estado del plan. Intenta de nuevo.');
      return;
    }
    fetchPlans();
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
          <h2 className="text-base font-black text-gray-900">Planes</h2>
          <p className="text-xs text-gray-500">Opciones de suscripción para administradores.</p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-2 text-xs font-bold text-white shadow transition hover:bg-red-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </button>
      </div>

      {loadError && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          No pudimos cargar los planes. Intenta de nuevo.
        </p>
      )}

      {actionError && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{actionError}</p>
      )}

      {!loadError && plans.length === 0 && (
        <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-500 ring-1 ring-gray-100">
          Aún no hay planes creados.
        </p>
      )}

      <ul className="space-y-3">
        {plans.map((plan) => (
          <li key={plan.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">{plan.nombre}</p>
                <PlanPriceBreakdown plan={plan} />
                {plan.es_prueba && (
                  <span className="mt-2 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
                    Prueba gratis
                  </span>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={plan.is_active}
                aria-label={`Plan ${plan.nombre} ${plan.is_active ? 'activo' : 'desactivado'}`}
                onClick={() => toggleActive(plan)}
                disabled={togglingId === plan.id}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
                  plan.is_active ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    plan.is_active ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${
                  plan.is_active
                    ? 'bg-green-50 text-green-700 ring-green-200'
                    : 'bg-gray-100 text-gray-600 ring-gray-200'
                }`}
              >
                {plan.is_active ? 'Activo' : 'Desactivado'}
              </span>
              <button
                onClick={() => setEditing(plan)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing !== null && (
        <AdminPlanForm
          plan={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={fetchPlans}
        />
      )}
    </div>
  );
}
