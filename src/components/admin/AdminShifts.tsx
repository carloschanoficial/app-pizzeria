import { useState } from 'react';
import { Plus, Pencil, X, Check, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ScheduleEditor } from '@/components/admin/ScheduleEditor';
import {
  DEFAULT_SCHEDULE,
  formatWeekSchedule,
  parseSchedule,
  serializeSchedule,
  type WeekSchedule,
} from '@/lib/storeHours';
import type { Product, ServiceShift } from '@/types';

interface AdminShiftsProps {
  shifts: ServiceShift[];
  products: Product[];
  onChanged: () => void;
}

export function AdminShifts({ shifts, products, onChanged }: AdminShiftsProps) {
  const [editing, setEditing] = useState<ServiceShift | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [ownSchedule, setOwnSchedule] = useState(false);
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setName('');
    setIsActive(true);
    setOwnSchedule(false);
    setSchedule(DEFAULT_SCHEDULE);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (s: ServiceShift) => {
    setEditing(s);
    setName(s.name);
    setIsActive(s.is_active);
    setOwnSchedule(s.auto_schedule !== null);
    setSchedule(parseSchedule(s.auto_schedule));
    setError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: trimmed,
      is_active: isActive,
      auto_schedule: ownSchedule ? serializeSchedule(schedule) : null,
    };
    const { error: saveError } = editing
      ? await supabase.from('service_shifts').update(payload).eq('id', editing.id)
      : await supabase.from('service_shifts').insert({ ...payload, sort_order: shifts.length });
    setSaving(false);
    if (saveError) {
      setError('No se pudo guardar el turno. Intenta de nuevo.');
      return;
    }
    setShowForm(false);
    onChanged();
  };

  const handleAssign = async (product: Product, shiftId: string) => {
    const { error: assignError } = await supabase
      .from('products')
      .update({ shift_id: shiftId || null })
      .eq('id', product.id);
    if (assignError) {
      setError('No se pudo asignar el producto. Intenta de nuevo.');
      return;
    }
    setError(null);
    onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-red-600" />
        <div>
          <h2 className="text-base font-black text-gray-900">Turnos o Menús Activos</h2>
          <p className="text-xs text-gray-400">
            Solo se muestran en la tienda los productos de los turnos activos.
          </p>
        </div>
      </div>

      {error && <p className="text-xs font-medium text-red-500">{error}</p>}

      <button
        onClick={openNew}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
      >
        <Plus className="h-4 w-4" />
        Agregar Turno
      </button>

      <div className="space-y-2">
        {shifts.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{s.name}</p>
              <p className={`text-xs ${s.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                {s.is_active ? 'Activo' : 'Inactivo'}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400 truncate">
                {s.auto_schedule === null
                  ? 'Usa el horario de la tienda'
                  : formatWeekSchedule(parseSchedule(s.auto_schedule))}
              </p>
            </div>
            <button
              onClick={() => openEdit(s)}
              className="rounded-lg bg-white p-2 text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-100"
              aria-label="Editar turno"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {shifts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-700">Asignar productos a un turno</p>
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="flex-1 min-w-0 truncate text-sm text-gray-700">{p.name}</span>
              <select
                value={p.shift_id ?? ''}
                onChange={(e) => handleAssign(p, e.target.value)}
                className="w-40 rounded-lg border-2 border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-red-500"
              >
                <option value="">Sin turno (siempre visible)</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editing ? 'Editar Turno' : 'Nuevo Turno'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full bg-gray-100 p-1.5 text-gray-500"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-bold text-gray-700">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Pizzas, Comida Casera"
                  className="input-base mt-1"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
                <p className="text-sm font-bold text-gray-700">Activo</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive(!isActive)}
                  className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${
                    isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      isActive ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-700">Horario propio</p>
                    <p className="text-[11px] text-gray-400">
                      {ownSchedule
                        ? 'Este turno usa sus propios días y horas.'
                        : 'Sigue el horario general de la tienda.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ownSchedule}
                    onClick={() => setOwnSchedule(!ownSchedule)}
                    className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${
                      ownSchedule ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        ownSchedule ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {ownSchedule && (
                  <div className="mt-3">
                    <ScheduleEditor schedule={schedule} onChange={setSchedule} />
                  </div>
                )}
              </div>
              {error && <p className="text-xs font-medium text-red-500">{error}</p>}
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
