import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ExtraIngredient } from '@/types';
import { formatPrice } from '@/lib/format';

interface AdminExtrasProps {
  extras: ExtraIngredient[];
  onChanged: () => void;
}

export function AdminExtras({ extras, onChanged }: AdminExtrasProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExtraIngredient | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState(15);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setName('');
    setPrice(15);
    setShowForm(true);
  };

  const openEdit = (e: ExtraIngredient) => {
    setEditing(e);
    setName(e.name);
    setPrice(e.price);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name) return;
    setSaving(true);
    const payload = {
      name,
      price: Number(price) || 0,
      is_active: true,
    };
    if (editing) {
      await supabase.from('extra_ingredients').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('extra_ingredients').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    onChanged();
  };

  const handleDelete = async (e: ExtraIngredient) => {
    if (!confirm(`¿Eliminar "${e.name}"?`)) return;
    await supabase.from('extra_ingredients').delete().eq('id', e.id);
    onChanged();
  };

  return (
    <div className="p-4 space-y-3">
      <button
        onClick={openNew}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700"
      >
        <Plus className="h-5 w-5" />
        Agregar Ingrediente
      </button>

      <p className="text-xs text-gray-400">
        Estos ingredientes aparecen al personalizar una pizza. El precio se
        suma al total en tiempo real.
      </p>

      {extras.map((e) => (
        <div
          key={e.id}
          className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100"
        >
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900">{e.name}</h3>
            <p className="text-xs text-gray-400">
              {formatPrice(e.price)} c/u
              {!e.is_active && ' · Inactivo'}
            </p>
          </div>
          <button
            onClick={() => openEdit(e)}
            className="rounded-lg bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(e)}
            className="rounded-lg bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="relative w-full max-w-sm rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editing ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full bg-gray-100 p-1.5 text-gray-500"
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
                  placeholder="Ej: Queso Extra"
                  className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">
                  Precio (MXN)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !name}
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
