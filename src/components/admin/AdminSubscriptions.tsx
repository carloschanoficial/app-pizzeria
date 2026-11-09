import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AdminSubscription } from '@/types';
import { AdminSubscriptionForm } from '@/components/admin/AdminSubscriptionForm';

type Status = 'active' | 'inactive' | 'expired';

function getStatus(sub: AdminSubscription): Status {
  if (!sub.is_active) return 'inactive';
  if (new Date(sub.expires_at).getTime() <= Date.now()) return 'expired';
  return 'active';
}

const STATUS_STYLE: Record<Status, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-green-50 text-green-700 ring-green-200' },
  inactive: { label: 'Desactivado', className: 'bg-gray-100 text-gray-600 ring-gray-200' },
  expired: { label: 'Vencido', className: 'bg-red-50 text-red-700 ring-red-200' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' });
}

export function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<AdminSubscription | null | 'new'>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoadError(false);
    const { data, error } = await supabase
      .from('administradores')
      .select('id, email, expires_at, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      setLoadError(true);
    } else {
      setSubscriptions((data as AdminSubscription[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const toggleActive = async (sub: AdminSubscription) => {
    setTogglingId(sub.id);
    setActionError(null);
    const { error } = await supabase
      .from('administradores')
      .update({ is_active: !sub.is_active })
      .eq('id', sub.id);
    setTogglingId(null);
    if (error) {
      setActionError('No se pudo cambiar el estado. Intenta de nuevo.');
      return;
    }
    fetchSubscriptions();
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900">Suscripciones</h2>
          <p className="text-xs text-gray-500">Administradores con acceso al panel.</p>
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
          No pudimos cargar las suscripciones. Intenta de nuevo.
        </p>
      )}

      {actionError && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{actionError}</p>
      )}

      {!loadError && subscriptions.length === 0 && (
        <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-500 ring-1 ring-gray-100">
          Aún no hay administradores registrados.
        </p>
      )}

      <ul className="space-y-3">
        {subscriptions.map((sub) => {
          const status = getStatus(sub);
          const style = STATUS_STYLE[status];
          return (
            <li key={sub.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{sub.email}</p>
                  <p className="mt-1 text-xs text-gray-500">Vence el {formatDate(sub.expires_at)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${style.className}`}>
                  {style.label}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => toggleActive(sub)}
                  disabled={togglingId === sub.id}
                  className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                >
                  {sub.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => setEditing(sub)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {editing !== null && (
        <AdminSubscriptionForm
          subscription={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={fetchSubscriptions}
        />
      )}
    </div>
  );
}
