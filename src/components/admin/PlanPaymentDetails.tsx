import { useEffect, useState } from 'react';
import {
  PLAN_DEPOSIT_STORES_KEY,
  PLAN_PAYMENT_FIELDS,
  PLAN_PAYMENT_LEGEND_KEY,
  fetchPlanPaymentSettings,
  hasPlanPaymentInfo,
  parseDepositStores,
} from '@/lib/planPayment';

export function PlanPaymentDetails() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPlanPaymentSettings().then((result) => {
      if (!cancelled) setSettings(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!settings || !hasPlanPaymentInfo(settings)) return null;

  const legend = (settings[PLAN_PAYMENT_LEGEND_KEY] ?? '').trim();
  const stores = parseDepositStores(settings[PLAN_DEPOSIT_STORES_KEY]);
  const fields = PLAN_PAYMENT_FIELDS.filter((field) => (settings[field.key] ?? '').trim() !== '');

  return (
    <div className="mt-5 rounded-xl bg-gray-50 p-4 text-left">
      <p className="text-xs font-black text-gray-900">Pago de tu plan</p>
      {legend && <p className="mt-1 whitespace-pre-line text-xs text-gray-600">{legend}</p>}
      {stores.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-bold text-gray-500">Puedes pagar en</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {stores.map((store) => (
              <li key={store} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-gray-800 ring-1 ring-gray-200">
                {store}
              </li>
            ))}
          </ul>
        </div>
      )}
      {fields.length > 0 && (
        <dl className="mt-3 space-y-2">
          {fields.map((field) => (
            <div key={field.key}>
              <dt className="text-[11px] font-bold text-gray-500">{field.label}</dt>
              <dd className="break-all font-mono text-sm font-bold text-gray-900">{settings[field.key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
