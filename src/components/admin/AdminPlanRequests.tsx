import { useCallback, useEffect, useState } from 'react';
import { Check, Eye, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TICKET_BUCKET } from '@/lib/paymentTicket';
import type { PlanRequest, PlanRequestStatus } from '@/types';

const STATUS_STYLE: Record<PlanRequestStatus, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  aprobada: { label: 'Aprobada', className: 'bg-green-50 text-green-700 ring-green-200' },
  rechazada: { label: 'Rechazada', className: 'bg-red-50 text-red-700 ring-red-200' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' });
}

export function AdminPlanRequests() {
  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoadError(false);
    const { data, error } = await supabase
      .from('solicitudes_plan')
      .select('id, email, status, ticket_path, created_at, reviewed_at, planes_suscripcion(nombre)')
      .order('created_at', { ascending: false });
    if (error) {
      setLoadError(true);
    } else {
      setRequests((data as unknown as PlanRequest[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (request: PlanRequest, status: 'aprobada' | 'rechazada') => {
    setBusyId(request.id);
    setActionError(null);
    const { error } = await supabase
      .from('solicitudes_plan')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', request.id);
    setBusyId(null);
    if (error) {
      setActionError('No se pudo actualizar la solicitud. Intenta de nuevo.');
      return;
    }
    fetchRequests();
  };

  const viewTicket = async (request: PlanRequest) => {
    setActionError(null);
    const { data, error } = await supabase.storage
      .from(TICKET_BUCKET)
      .createSignedUrl(request.ticket_path, 300);
    if (error || !data?.signedUrl) {
      setActionError('No pudimos abrir el comprobante.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pb-6">
      <div>
        <h2 className="text-base font-black text-gray-900">Solicitudes de plan</h2>
        <p className="text-xs text-gray-500">Revisa el comprobante antes de aprobar y extender el acceso.</p>
      </div>

      {loadError && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          No pudimos cargar las solicitudes. Intenta de nuevo.
        </p>
      )}

      {actionError && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{actionError}</p>
      )}

      {!loadError && requests.length === 0 && (
        <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-500 ring-1 ring-gray-100">
          Aún no hay solicitudes de plan.
        </p>
      )}

      <ul className="space-y-3">
        {requests.map((request) => {
          const style = STATUS_STYLE[request.status];
          const busy = busyId === request.id;
          return (
            <li key={request.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{request.email}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {request.planes_suscripcion?.nombre ?? 'Plan eliminado'} · {formatDate(request.created_at)}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${style.className}`}>
                  {style.label}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => viewTicket(request)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver comprobante
                </button>
                {request.status === 'pendiente' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateStatus(request, 'rechazada')}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => updateStatus(request, 'aprobada')}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Aprobar
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
