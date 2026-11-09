import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DiscountCoupon } from '@/types';

interface AdminCouponFormProps {
  existingCodes: string[];
  coupon?: DiscountCoupon;
  onClose: () => void;
  onSaved: () => void;
}

const CODE_PATTERN = /^[A-Z0-9]{3,32}$/;

export function AdminCouponForm({ existingCodes, coupon, onClose, onSaved }: AdminCouponFormProps) {
  const isEditing = Boolean(coupon);
  const [codigo, setCodigo] = useState(coupon?.codigo ?? '');
  const [percent, setPercent] = useState(String(coupon?.descuento_porcentaje ?? 10));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = Number(percent);
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      setError('El descuento debe ser un número entero entre 1 y 100.');
      return;
    }

    setSaving(true);
    setError(null);

    if (coupon) {
      const { error: updateError } = await supabase
        .from('cupones_descuento')
        .update({ descuento_porcentaje: value })
        .eq('id', coupon.id);
      setSaving(false);
      if (updateError) {
        setError('No se pudo guardar el cambio. Intenta de nuevo.');
        return;
      }
      onSaved();
      onClose();
      return;
    }

    const normalizedCode = codigo.trim().toUpperCase();
    if (!CODE_PATTERN.test(normalizedCode)) {
      setSaving(false);
      setError('El código debe tener de 3 a 32 letras o números, sin espacios.');
      return;
    }
    if (existingCodes.includes(normalizedCode)) {
      setSaving(false);
      setError('Ya existe un cupón con ese código.');
      return;
    }

    const { error: saveError } = await supabase
      .from('cupones_descuento')
      .insert({ codigo: normalizedCode, descuento_porcentaje: value, is_active: true });
    setSaving(false);

    if (saveError) {
      setError(
        saveError.code === '23505'
          ? 'Ya existe un cupón con ese código.'
          : 'No se pudo guardar el cupón. Intenta de nuevo.',
      );
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
          <h2 className="text-base font-black text-gray-900">{isEditing ? 'Editar cupón' : 'Nuevo cupón'}</h2>
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
          <label htmlFor="coupon-code" className="text-xs font-bold text-gray-700">Código</label>
          {isEditing ? (
            <p className="mt-1 rounded-xl bg-gray-50 px-3 py-2.5 font-mono text-sm font-bold tracking-wider text-gray-700">
              {coupon?.codigo}
            </p>
          ) : (
            <>
              <input
                id="coupon-code"
                type="text"
                required
                maxLength={32}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="VERANO2026"
                className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 font-mono text-sm uppercase tracking-wider text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500"
              />
              <p className="mt-1 text-[11px] text-gray-500">Solo letras y números. Úsalo algo difícil de adivinar.</p>
            </>
          )}
        </div>

        <div>
          <label htmlFor="coupon-percent" className="text-xs font-bold text-gray-700">Descuento (%)</label>
          <input
            id="coupon-percent"
            type="number"
            required
            min={1}
            max={100}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500"
          />
        </div>

        {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-red-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear cupón'}
        </button>
      </form>
    </div>
  );
}
