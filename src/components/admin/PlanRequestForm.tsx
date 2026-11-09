import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Check, ImagePlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SubscriptionPlan } from '@/types';
import { computePlanPricing, formatPlanPrice } from '@/lib/subscriptionPricing';
import { TICKET_BUCKET, ticketExtension, validateTicketFile } from '@/lib/paymentTicket';

interface PlanRequestFormProps {
  email: string;
}

export function PlanRequestForm({ email }: PlanRequestFormProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [plansError, setPlansError] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('planes_suscripcion')
      .select('*')
      .eq('is_active', true)
      .order('precio', { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          setPlansError(true);
          return;
        }
        setPlans((data as SubscriptionPlan[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!chosen) return;
    const problem = validateTicketFile(chosen);
    setError(problem);
    setFile(problem ? null : chosen);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!planId) {
      setError('Elige un plan.');
      return;
    }
    if (!file) {
      setError('Sube la foto de tu comprobante de pago.');
      return;
    }

    setSubmitting(true);
    setError(null);
    const path = `${email}/${crypto.randomUUID()}.${ticketExtension(file)}`;
    const { error: uploadError } = await supabase.storage
      .from(TICKET_BUCKET)
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      setSubmitting(false);
      setError('No pudimos subir tu comprobante. Intenta de nuevo.');
      return;
    }

    const { error: insertError } = await supabase
      .from('solicitudes_plan')
      .insert({ email, plan_id: planId, ticket_path: path });
    setSubmitting(false);
    if (insertError) {
      setError('No pudimos enviar tu solicitud. Intenta de nuevo.');
      return;
    }
    setSent(true);
    setPlanId(null);
    setFile(null);
  };

  if (sent) {
    return (
      <div className="mt-5 flex items-start gap-2 rounded-xl bg-green-50 p-4 text-left">
        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-700" />
        <p className="text-xs font-semibold text-green-800">
          Recibimos tu solicitud y tu comprobante. El administrador lo revisará y activará tu plan.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
      <p className="text-xs font-black text-gray-900">Solicitar plan</p>

      {plansError && (
        <p className="text-xs font-semibold text-red-600">No pudimos cargar los planes. Intenta de nuevo.</p>
      )}
      {!plansError && plans === null && <p className="text-xs text-gray-500">Cargando planes...</p>}
      {plans?.length === 0 && (
        <p className="text-xs text-gray-500">No hay planes disponibles por ahora.</p>
      )}

      {plans && plans.length > 0 && (
        <div className="space-y-2">
          {plans.map((plan) => {
            const selected = planId === plan.id;
            const { final } = computePlanPricing(plan.precio, plan.precio_original, plan.descuento_porcentaje);
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setPlanId(plan.id)}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left transition ${
                  selected ? 'border-red-600 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span>
                  <span className="block text-sm font-bold text-gray-900">{plan.nombre}</span>
                  <span className="block text-[11px] text-gray-500">{plan.duracion_dias} días</span>
                </span>
                <span className="text-sm font-black text-gray-900">{formatPlanPrice(final)}</span>
              </button>
            );
          })}
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-gray-700">Foto de tu comprobante de pago (obligatoria)</p>
        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 text-center transition hover:border-red-400">
          {previewUrl ? (
            <img src={previewUrl} alt="Comprobante seleccionado" className="max-h-40 rounded-lg object-contain" />
          ) : (
            <ImagePlus className="h-6 w-6 text-gray-400" />
          )}
          <span className="text-xs font-semibold text-gray-600">
            {previewUrl ? 'Cambiar imagen' : 'Elegir imagen (JPG, PNG o WebP, máx. 5 MB)'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
      </div>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !planId || !file}
        className="w-full rounded-full bg-red-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
      >
        {submitting ? 'Enviando...' : 'Enviar solicitud'}
      </button>
    </form>
  );
}
