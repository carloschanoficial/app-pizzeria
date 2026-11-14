import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Check, Flame, ImagePlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadImageBase64 } from '@/lib/upload';
import { getMinPrice } from '@/lib/pricing';
import type { Product, Category, SizeKey } from '@/types';
import { SIZE_LABELS, SIZE_ORDER } from '@/types';
import { formatPrice } from '@/lib/format';

interface AdminProductsProps {
  products: Product[];
  categories: Category[];
  onChanged: () => void;
}

interface ProductForm {
  name: string;
  description: string;
  image_url: string;
  base_price: number;
  category_id: string;
  is_bestseller: boolean;
  discount_percent: number;
  is_active: boolean;
  is_available: boolean;
  has_sizes: boolean;
  price_chica: string;
  price_mediana: string;
  price_grande: string;
  price_familiar: string;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  image_url: '',
  base_price: 0,
  category_id: '',
  is_bestseller: false,
  discount_percent: 0,
  is_active: true,
  is_available: true,
  has_sizes: true,
  price_chica: '',
  price_mediana: '',
  price_grande: '',
  price_familiar: '',
};

const PRICE_FIELDS: { key: keyof ProductForm; size: SizeKey }[] = [
  { key: 'price_chica', size: 'chica' },
  { key: 'price_mediana', size: 'mediana' },
  { key: 'price_grande', size: 'grande' },
  { key: 'price_familiar', size: 'familiar' },
];

export function AdminProducts({ products, categories, onChanged }: AdminProductsProps) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const base64 = await uploadImageBase64(file);
    if (base64) {
      setForm((prev) => ({ ...prev, image_url: base64 }));
    }
    setUploading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id || '' });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      image_url: p.image_url || '',
      base_price: p.base_price,
      category_id: p.category_id,
      is_bestseller: p.is_bestseller,
      discount_percent: p.discount_percent,
      is_active: p.is_active,
      is_available: p.is_available,
      has_sizes: p.sizes !== null,
      price_chica: p.sizes?.chica != null ? String(p.sizes.chica) : '',
      price_mediana: p.sizes?.mediana != null ? String(p.sizes.mediana) : '',
      price_grande: p.sizes?.grande != null ? String(p.sizes.grande) : '',
      price_familiar: p.sizes?.familiar != null ? String(p.sizes.familiar) : '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category_id) return;
    setSaving(true);

    let sizes = null;
    if (form.has_sizes) {
      const sizeObj: Record<string, number> = {};
      PRICE_FIELDS.forEach(({ key, size }) => {
        const val = form[key];
        if (val !== '' && val != null) {
          const num = Number(val);
          if (num > 0) sizeObj[size] = num;
        }
      });
      sizes = Object.keys(sizeObj).length > 0 ? sizeObj : null;
    }

    const payload = {
      name: form.name,
      description: form.description || null,
      image_url: form.image_url || null,
      base_price: Number(form.base_price) || 0,
      category_id: form.category_id,
      is_bestseller: form.is_bestseller,
      discount_percent: Number(form.discount_percent) || 0,
      is_active: form.is_active,
      is_available: form.is_available,
      sizes,
    };

    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('products').insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    onChanged();
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    await supabase.from('products').delete().eq('id', p.id);
    onChanged();
  };

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || '';

  return (
    <div className="p-4 space-y-3">
      <button
        onClick={openNew}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700"
      >
        <Plus className="h-5 w-5" />
        Agregar Producto
      </button>

      {products.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100"
        >
          {p.image_url && (
            <img
              src={p.image_url}
              alt={p.name}
              className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{p.name}</h3>
              {p.is_bestseller && <Flame className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />}
            </div>
            <p className="text-xs text-gray-400">{categoryName(p.category_id)}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-gray-700">
                {formatPrice(getMinPrice(p))}
              </span>
              {p.discount_percent > 0 && (
                <span className="text-yellow-600 font-bold">-{p.discount_percent}%</span>
              )}
              {!p.is_active && <span className="text-gray-400">Inactivo</span>}
              {!p.is_available && <span className="font-bold text-red-500">Agotado</span>}
            </div>
          </div>
          <button
            onClick={() => openEdit(p)}
            className="rounded-lg bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(p)}
            className="rounded-lg bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {/* Formulario modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editing ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full bg-gray-100 p-1.5 text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <Field label="Nombre">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-base"
                />
              </Field>

              <Field label="Descripción">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="input-base resize-none"
                />
              </Field>

              {/* Foto: subir desde galería (Base64 localStorage) */}
              <div>
                <label className="text-sm font-bold text-gray-700">Foto del producto</label>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:border-red-400 hover:text-red-500 disabled:opacity-50"
                  >
                    <ImagePlus className="h-5 w-5" />
                    {uploading ? 'Procesando...' : 'Subir desde galería'}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  La imagen se guarda localmente en tu dispositivo.
                </p>
                {form.image_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={form.image_url}
                      alt="preview"
                      className="h-20 w-20 rounded-lg object-cover ring-1 ring-gray-200"
                    />
                    <button
                      onClick={() => setForm({ ...form, image_url: '' })}
                      className="text-xs text-red-500"
                    >
                      Quitar imagen
                    </button>
                  </div>
                )}
              </div>

              <Field label="Categoría">
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="input-base"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Descuento */}
              <Field label="Porcentaje de descuento (%)">
                <input
                  type="number"
                  value={form.discount_percent}
                  onChange={(e) =>
                    setForm({ ...form, discount_percent: Number(e.target.value) })
                  }
                  min={0}
                  max={100}
                  className="input-base"
                />
              </Field>

              {/* Tipo de producto: con tamaños o precio único */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.has_sizes}
                    onChange={(e) => setForm({ ...form, has_sizes: e.target.checked })}
                    className="h-4 w-4 accent-red-600"
                  />
                  <span className="text-sm font-bold text-gray-700">
                    Producto con tamaños (pizza)
                  </span>
                </label>
              </div>

              {/* Precios por tamaño (independientes, sin fórmula) */}
              {form.has_sizes ? (
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    Precio directo por tamaño. Deja vacío si no ofreces ese tamaño.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PRICE_FIELDS.map(({ key, size }) => (
                      <Field key={size} label={SIZE_LABELS[size]}>
                        <input
                          type="number"
                          value={form[key] as string}
                          onChange={(e) =>
                            setForm({ ...form, [key]: e.target.value })
                          }
                          placeholder="—"
                          className="input-base"
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              ) : (
                <Field label="Precio (MXN)">
                  <input
                    type="number"
                    value={form.base_price}
                    onChange={(e) =>
                      setForm({ ...form, base_price: Number(e.target.value) })
                    }
                    className="input-base"
                  />
                </Field>
              )}

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-bold text-gray-700">Disponibilidad</p>
                  <p className="text-[11px] text-gray-400">
                    {form.is_available ? 'Disponible para pedir' : 'Se muestra como agotado'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.is_available}
                  onClick={() => setForm({ ...form, is_available: !form.is_available })}
                  className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${
                    form.is_available ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      form.is_available ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_bestseller}
                    onChange={(e) => setForm({ ...form, is_bestseller: e.target.checked })}
                    className="h-4 w-4 accent-red-600"
                  />
                  <span className="text-sm text-gray-700">Más Vendida</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="h-4 w-4 accent-red-600"
                  />
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !form.name}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-gray-700">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
