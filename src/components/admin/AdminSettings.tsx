import { useState, useEffect } from 'react';
import { buildLoyaltyRules } from '@/lib/loyaltyRules';
import { Check, Building2, Truck, Info, Power, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { isValidWhatsappNumber, normalizeWhatsappNumber } from '@/lib/whatsapp';
import { AdminBranding } from '@/components/admin/AdminBranding';
import {
  isStoreAutoOpen,
  getScheduleText,
  parseSchedule,
  serializeSchedule,
  DAY_NAMES,
  DEFAULT_SCHEDULE,
  type WeekSchedule,
} from '@/lib/storeHours';

interface AdminSettingsProps {
  settings: Record<string, string> | null;
  onChanged: () => void;
}

interface FieldGroup {
  title: string;
  icon: typeof Building2;
  fields: { key: string; label: string; type?: string }[];
}

const RULE_NUMBER_KEYS = ['wallet_cashback_per_order', 'wallet_redeem_threshold'];

const FIELD_GROUPS: FieldGroup[] = [
  {
    title: 'Información General',
    icon: Info,
    fields: [
      { key: 'whatsapp_number', label: 'Número de WhatsApp para recibir pedidos (52 + 10 dígitos)' },
      { key: 'address', label: 'Dirección de la pizzería' },
    ],
  },
  {
    title: 'Costo de Envío',
    icon: Truck,
    fields: [
      { key: 'delivery_cost', label: 'Costo de envío a domicilio (MXN)', type: 'number' },
    ],
  },
  {
    title: 'Datos Bancarios (Transferencia / Depósito)',
    icon: Building2,
    fields: [
      { key: 'bank_name', label: 'Nombre del banco' },
      { key: 'bank_account', label: 'Titular de la cuenta' },
      { key: 'bank_clabe', label: 'CLABE interbancaria' },
      { key: 'bank_card', label: 'Número de tarjeta' },
    ],
  },
  {
    title: 'Programa de Lealtad',
    icon: Gift,
    fields: [
      { key: 'loyalty_reward_name', label: 'Nombre del premio (ej: Pizza Chica Hawaiana GRATIS, Molletes, etc.)' },
      { key: 'wallet_cashback_per_order', label: 'Monedas que suma cada compra a la Olla de Dinero (MXN, 0 = no suma)', type: 'number' },
      { key: 'wallet_redeem_threshold', label: 'Saldo mínimo para canjear la Olla (MXN, 0 = sin canje)', type: 'number' },
    ],
  },
];

export function AdminSettings({ settings, onChanged }: AdminSettingsProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [ruleError, setRuleError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setForm(settings);
      setSchedule(parseSchedule(settings.auto_schedule));
    }
  }, [settings]);

  const allKeys = FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
  const autoOpen = isStoreAutoOpen(form as never);
  const manualOverride = form.manual_override || 'auto';
  const manualIsOpen = form.manual_is_open === 'true';

  const updateDay = (day: number, field: 'open' | 'openTime' | 'closeTime', value: string | boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
    const waNumber = normalizeWhatsappNumber(form.whatsapp_number ?? '');
    if (waNumber && !isValidWhatsappNumber(waNumber)) {
      setWaError('Escribe 52 seguido de 10 dígitos, por ejemplo 529993661948.');
      return;
    }
    setWaError(null);
    const invalidRule = RULE_NUMBER_KEYS.some((key) => {
      const raw = (form[key] ?? '').trim();
      return raw !== '' && (!Number.isFinite(Number(raw)) || Number(raw) < 0);
    });
    if (invalidRule) {
      setRuleError('Los montos de la Olla de Dinero deben ser números iguales o mayores a 0.');
      return;
    }
    setRuleError(null);
    setSaving(true);
    for (const key of allKeys) {
      const value = key === 'whatsapp_number' ? waNumber : form[key] ?? '';
      await supabase
        .from('store_settings')
        .upsert({ key, value }, { onConflict: 'key' });
    }
    await supabase
      .from('store_settings')
      .upsert({ key: 'manual_override', value: form.manual_override || 'auto' }, { onConflict: 'key' });
    await supabase
      .from('store_settings')
      .upsert({ key: 'manual_is_open', value: form.manual_is_open || 'false' }, { onConflict: 'key' });
    await supabase
      .from('store_settings')
      .upsert({ key: 'auto_schedule', value: serializeSchedule(schedule) }, { onConflict: 'key' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onChanged();
  };

  const toggleManualOpen = () => {
    setForm({
      ...form,
      manual_is_open: manualIsOpen ? 'false' : 'true',
    });
  };

  if (!settings) return null;

  return (
    <div className="p-4 space-y-5">
      <AdminBranding settings={settings} onChanged={onChanged} />

      <p className="text-xs text-gray-400">
        Configura los datos de tu pizzería. El costo de envío se aplica
        automáticamente cuando el cliente elige "A Domicilio". Los datos
        bancarios aparecen al elegir Transferencia / Depósito.
      </p>

      {/* Control de apertura */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center gap-2">
          <Power className="h-5 w-5 text-red-600" />
          <h3 className="text-sm font-black text-gray-900">
            Estado de la Tienda
          </h3>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Horario automático: {getScheduleText(form as never)}
        </p>
        <p className="mt-1 text-xs">
          Estado automático actual:{' '}
          <span className={`font-bold ${autoOpen ? 'text-green-600' : 'text-gray-400'}`}>
            {autoOpen ? 'Abierto' : 'Cerrado'}
          </span>
        </p>

        {/* Editor de horario */}
        <div className="mt-4">
          <label className="text-sm font-bold text-gray-700">Horario Automático</label>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Activa los días que abres y define la hora de apertura y cierre.
          </p>
          <div className="mt-3 space-y-2">
            {DAY_NAMES.map((name, idx) => {
              const dayCfg = schedule[idx];
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 rounded-xl border-2 p-2.5 transition ${
                    dayCfg.open ? 'border-red-200 bg-red-50/40' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => updateDay(idx, 'open', !dayCfg.open)}
                    className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${
                      dayCfg.open ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        dayCfg.open ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <span className={`w-20 flex-shrink-0 text-sm font-bold ${dayCfg.open ? 'text-gray-900' : 'text-gray-400'}`}>
                    {name}
                  </span>
                  {dayCfg.open ? (
                    <div className="flex flex-1 items-center gap-1.5">
                      <input
                        type="time"
                        value={dayCfg.openTime}
                        onChange={(e) => updateDay(idx, 'openTime', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-red-500"
                      />
                      <span className="text-xs text-gray-400">–</span>
                      <input
                        type="time"
                        value={dayCfg.closeTime}
                        onChange={(e) => updateDay(idx, 'closeTime', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-red-500"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Cerrado</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selector de modo */}
        <div className="mt-4">
          <label className="text-sm font-bold text-gray-700">Modo de control</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setForm({ ...form, manual_override: 'auto' })}
              className={`rounded-xl border-2 py-2.5 text-sm font-bold transition ${
                manualOverride === 'auto'
                  ? 'border-red-600 bg-red-50 text-red-600'
                  : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              Automático
            </button>
            <button
              onClick={() => setForm({ ...form, manual_override: 'manual' })}
              className={`rounded-xl border-2 py-2.5 text-sm font-bold transition ${
                manualOverride === 'manual'
                  ? 'border-red-600 bg-red-50 text-red-600'
                  : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              Manual
            </button>
          </div>
        </div>

        {/* Interruptor manual */}
        {manualOverride === 'manual' && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 p-3">
            <span className="text-sm font-bold text-gray-700">
              {manualIsOpen ? 'Tienda Abierta' : 'Tienda Cerrada'}
            </span>
            <button
              onClick={toggleManualOpen}
              className={`relative h-8 w-14 rounded-full transition ${
                manualIsOpen ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  manualIsOpen ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {FIELD_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        return (
          <div
            key={group.title}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
          >
            <div className="flex items-center gap-2">
              <GroupIcon className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-black text-gray-900">
                {group.title}
              </h3>
            </div>
            <div className="mt-3 space-y-3">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-bold text-gray-700">
                    {field.label}
                  </label>
                  <input
                    type={field.type || 'text'}
                    value={form[field.key] ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, [field.key]: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                  />
                  {RULE_NUMBER_KEYS.includes(field.key) && (
                    <p className="mt-1 text-[11px] text-gray-400">
                      Usa 0 para desactivarlo. Puedes escribir decimales, por ejemplo 2.5.
                    </p>
                  )}
                  {field.key === 'whatsapp_number' && (waError || !isValidWhatsappNumber(normalizeWhatsappNumber(form.whatsapp_number ?? ''))) && (
                    <p className={`mt-1 text-xs ${waError ? 'text-red-600' : 'text-amber-600'}`}>
                      {waError ?? 'Sin un número válido, los clientes no podrán enviar pedidos.'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <h3 className="text-sm font-black text-gray-900">Reglas del programa (vista previa)</h3>
        <p className="mt-1 text-[11px] text-gray-400">Estas frases se generan automáticamente con los valores de arriba y se muestran a los clientes en su perfil.</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-xs text-gray-600">
          {buildLoyaltyRules(form as never).map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>

      {ruleError && <p className="text-xs text-red-600">{ruleError}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        <Check className="h-4 w-4" />
        {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar Cambios'}
      </button>
    </div>
  );
}
