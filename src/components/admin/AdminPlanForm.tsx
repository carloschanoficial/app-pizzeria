import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SubscriptionPlan } from '@/types';
import { computePlanPricing, formatPlanPrice } from '@/lib/subscriptionPricing';

interface AdminPlanFormProps {
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AdminPlanForm({ plan, onClose, onSaved }: AdminPlanFormProps) {
  const isEditing = plan !== null;
  const [nombre, setNombre] = useState(plan?.nombre ?? '');
  const [duracion, setDuracion] = useState(String(plan?.duracion_dias ?? 30));
  const [precio, setPrecio] = useState(String(plan?.precio ?? ''));
  const [precioOriginal, setPrecioOriginal] = useState(plan?.precio_original != null ? String(plan.precio_original) : '');
  const [descuento, setDescuento] = useState(String(plan?.descuento_porcentaje ?? 0));
  const [esPrueba, setEsPrueba] = useState(plan?.es_prueba ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const livePricing = computePlanPricing(
    precio || NaN,
    precioOriginal.trim() === '' ? null : precioOriginal,
    descuento,
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const days = Number(duracion);
    const price = Number(precio);
    const discount = Number(descuento);
    const originalPrice = precioOriginal.trim() === '' ? null : Number(precioOriginal);
    if (!nombre.trim()) {
      setError('Escribe un nombre para el plan.');
      return;
    }
    if (!Number.isInteger(days) || days < 1) {
      setError('La duración debe ser un número de días mayor a 0.');
      return;
    }
    if (precio.trim() === '' || !Number.isFinite(price) || price < 0) {
      setError('Escribe un precio válido, igual o mayor a 0.');
      return;
    }
    if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice < 0)) {
      setError('El precio original debe ser un número igual o mayor a 0, o déjalo vacío.');
      return;
    }
    if (!Number.isInteger(discount) || discount < 0 || discount > 100) {
      setError('El descuento debe estar entre 0 y 100.');
      return;
    }

    setSaving(true);
    setError(null);
    const payload = {
      nombre: nombre.trim(),
      duracion_dias: days,
      precio: price,
      precio_original: originalPrice,
      descuento_porcentaje: discount,
      es_prueba: esPrueba,
    };
    const { error: saveError } = isEditing
      ? await supabase.from('planes_suscripcion').update(payload).eq('id', plan.id)
      : await supabase.from('planes_suscripcion').insert({ ...payload, is_active: true });
    setSaving(false);

    if (saveError) {
      setError('No se pudo guardar el plan. Intenta de nuevo.');
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-gray-900">
            {isEditing ? 'Editar plan' : 'Nuevo plan'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 p-1.5 text-gray-600 transition hover:bg-gray-200"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label htmlFor="plan-name" className="text-xs font-bold text-gray-700">Nombre del plan</label>
          <input
            id="plan-name"
            type="text"
            required
            maxLength={60}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Mensual"
            className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="plan-days" className="text-xs font-bold text-gray-700">Duración (días)</label>
            <input
              id="plan-days"
              type="number"
              required
              min={1}
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500"
            />
          </div>
          <div>
            <label htmlFor="plan-price" className="text-xs font-bold text-gray-700">Precio ($)</label>
            <input
              id="plan-price"
              type="number"
              required
              min={0}
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="plan-original-price" className="text-xs font-bold text-gray-700">Precio original ($) <span className="font-normal text-gray-400">opcional</span></label>
          <input
            id="plan-original-price"
            type="number"
            min={0}
            step="0.01"
            value={precioOriginal}
            onChange={(e) => setPrecioOriginal(e.target.value)}
            placeholder="Ej: 500"
            className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500"
          />
        </div>

        <div>
          <label htmlFor="plan-discount" className="text-xs font-bold text-gray-700">Descuento (%)</label>
          <input
            id="plan-discount"
            type="number"
            min={0}
            max={100}
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500"
          />
        </div>

        <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
          Precio final a pagar:{' '}
          <span className="font-black text-gray-900">
            {Number.isFinite(livePricing.final) ? formatPlanPrice(livePricing.final) : '—'}
          </span>
        </div>

        <label className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
          <span className="text-sm font-semibold text-gray-700">Prueba gratis</span>
          <input
            type="checkbox"
            checked={esPrueba}
            onChange={(e) => setEsPrueba(e.target.checked)}
            className="h-5 w-5 accent-red-600"
          />
        </label>

        {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-red-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}
