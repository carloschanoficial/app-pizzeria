import { useState, type FormEvent } from 'react';
import { Check, Landmark } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  PLAN_DEPOSIT_STORES,
  PLAN_DEPOSIT_STORES_KEY,
  PLAN_PAYMENT_FIELDS,
  PLAN_PAYMENT_KEYS,
  PLAN_PAYMENT_LEGEND_KEY,
  parseDepositStores,
} from '@/lib/planPayment';

interface AdminPaymentInfoProps {
  settings: Record<string, string>;
  onChanged: () => void;
}

const CLABE_PATTERN = /^\d{18}$/;

export function AdminPaymentInfo({ settings, onChanged }: AdminPaymentInfoProps) {
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(PLAN_PAYMENT_KEYS.map((key) => [key, settings[key] ?? ''])),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedStores = parseDepositStores(form[PLAN_DEPOSIT_STORES_KEY]);

  const toggleStore = (store: string) => {
    const next = selectedStores.includes(store)
      ? selectedStores.filter((s) => s !== store)
      : [...selectedStores, store];
    setForm({
      ...form,
      [PLAN_DEPOSIT_STORES_KEY]: PLAN_DEPOSIT_STORES.filter((s) => next.includes(s)).join(','),
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clabe = (form.plan_bank_clabe ?? '').replace(/\s/g, '');
    if (clabe !== '' && !CLABE_PATTERN.test(clabe)) {
      setError('La CLABE debe tener 18 dígitos.');
      return;
    }
    setError(null);
    setSaving(true);
    const rows = PLAN_PAYMENT_KEYS.map((key) => ({
      key,
      value: key === 'plan_bank_clabe' ? clabe : (form[key] ?? '').trim(),
    }));
    const { error: saveError } = await supabase
      .from('store_settings')
      .upsert(rows, { onConflict: 'key' });
    setSaving(false);
    if (saveError) {
      setError('No se pudieron guardar los datos de pago. Intenta de nuevo.');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onChanged();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-red-600" />
          <h3 className="text-sm font-black text-gray-900">Datos para pago de planes</h3>
        </div>
        <p className="mt-1 text-[11px] text-gray-400">
          Los administradores verán estos datos cuando su suscripción esté vencida o desactivada.
        </p>
      </div>

      {PLAN_PAYMENT_FIELDS.map((field) => (
        <div key={field.key}>
          <label htmlFor={field.key} className="text-sm font-bold text-gray-700">
            {field.label}
          </label>
          <input
            id={field.key}
            type="text"
            value={form[field.key] ?? ''}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-500"
          />
        </div>
      ))}

      <div>
        <p className="text-sm font-bold text-gray-700">Tiendas de depósito habilitadas</p>
        <p className="mt-0.5 text-[11px] text-gray-400">Solo las tiendas marcadas aparecen en el pago del plan.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PLAN_DEPOSIT_STORES.map((store) => {
            const checked = selectedStores.includes(store);
            return (
              <label
                key={store}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition ${
                  checked ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleStore(store)}
                  className="h-4 w-4 accent-red-600"
                />
                {store}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor={PLAN_PAYMENT_LEGEND_KEY} className="text-sm font-bold text-gray-700">
          Leyenda para los administradores
        </label>
        <textarea
          id={PLAN_PAYMENT_LEGEND_KEY}
          rows={4}
          value={form[PLAN_PAYMENT_LEGEND_KEY] ?? ''}
          onChange={(e) => setForm({ ...form, [PLAN_PAYMENT_LEGEND_KEY]: e.target.value })}
          placeholder="Ej: Realiza tu transferencia y envía el comprobante para activar tu plan."
          className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-500"
        />
      </div>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        <Check className="h-4 w-4" />
        {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar datos de pago'}
      </button>
    </form>
  );
}
