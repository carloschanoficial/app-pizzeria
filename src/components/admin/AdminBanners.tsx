import { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, ImagePlus, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';
import type { PromoBanner } from '@/types';

interface AdminBannersProps {
  onChanged: () => void;
}

const GRADIENTS = [
  'from-orange-500 to-red-500',
  'from-green-500 to-teal-600',
  'from-red-500 to-rose-600',
  'from-amber-500 to-orange-600',
  'from-blue-500 to-cyan-600',
  'from-purple-500 to-pink-600',
];

export function AdminBanners({ onChanged }: AdminBannersProps) {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PromoBanner | null>(null);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    bg_gradient: GRADIENTS[0],
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifBannerId, setNotifBannerId] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    const { data } = await supabase
      .from('promo_banners')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setBanners(data as PromoBanner[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', subtitle: '', image_url: '', bg_gradient: GRADIENTS[0], is_active: true });
    setShowForm(true);
  };

  const openEdit = (b: PromoBanner) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      image_url: b.image_url || '',
      bg_gradient: b.bg_gradient,
      is_active: b.is_active,
    });
    setShowForm(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file, 'product-images');
    if (url) {
      setForm((prev) => ({ ...prev, image_url: url }));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    const payload = {
      title: form.title,
      subtitle: form.subtitle || null,
      image_url: form.image_url || null,
      bg_gradient: form.bg_gradient,
      is_active: form.is_active,
    };
    if (editing) {
      await supabase.from('promo_banners').update(payload).eq('id', editing.id);
      if (payload.is_active && !editing.is_active) {
        sendBannerNotification({ ...editing, ...payload } as PromoBanner);
      }
    } else {
      const { data: newBanner } = await supabase.from('promo_banners').insert(payload).select().single();
      if (payload.is_active && newBanner) {
        sendBannerNotification(newBanner as PromoBanner);
      }
    }
    setSaving(false);
    setShowForm(false);
    fetchBanners();
    onChanged();
  };

  const handleDelete = async (b: PromoBanner) => {
    if (!confirm(`¿Eliminar el banner "${b.title}"?`)) return;
    await supabase.from('promo_banners').delete().eq('id', b.id);
    fetchBanners();
    onChanged();
  };

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') {
      setNotifPermission('granted');
      return true;
    }
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    return result === 'granted';
  };

  const sendBannerNotification = async (banner: PromoBanner) => {
    setNotifBannerId(banner.id);
    const granted = await requestNotifPermission();
    if (granted) {
      new Notification('Pizzería Matias - ' + banner.title, {
        body: banner.subtitle || 'Nueva oferta disponible. Revisa nuestra app.',
        icon: '/icon.svg',
        tag: 'banner-' + banner.id,
      });
    }
    setNotifBannerId(null);
  };

  const sendNotification = async () => {
    setSendingNotif(true);
    const granted = await requestNotifPermission();
    if (granted) {
      new Notification('Pizzería Matias - Nueva Oferta', {
        body: 'Se han publicado nuevas promociones. Revisa nuestra app.',
        icon: '/icon.svg',
      });
    }
    setSendingNotif(false);
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <button
        onClick={openNew}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700"
      >
        <Plus className="h-5 w-5" />
        Agregar Banner
      </button>

      <button
        onClick={sendNotification}
        disabled={sendingNotif}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        <Bell className="h-4 w-4" />
        Enviar Notificación de Oferta
      </button>

      <p className="text-xs text-gray-400">
        Los banners aparecen en la pantalla de inicio. Al enviar una
        notificación, los clientes que permitieron las alertas verán un
        mensaje sobre la nueva oferta.
      </p>

      {banners.map((b) => (
        <div
          key={b.id}
          className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100"
        >
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ${b.bg_gradient}`}
          >
            {b.image_url ? (
              <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-white">BANNER</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{b.title}</h3>
            <p className="text-xs text-gray-400 line-clamp-1">{b.subtitle}</p>
            {!b.is_active && <span className="text-[10px] text-gray-400">Inactivo</span>}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => sendBannerNotification(b)}
                disabled={notifBannerId === b.id}
                className="rounded-lg bg-blue-50 p-2 text-blue-500 transition hover:bg-blue-100 disabled:opacity-50"
                title="Enviar notificación de este banner"
              >
                <Bell className="h-4 w-4" />
              </button>
              <button
                onClick={() => openEdit(b)}
                className="rounded-lg bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(b)}
                className="rounded-lg bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {notifBannerId === b.id && (
              <span className="text-[10px] text-blue-500">Enviando...</span>
            )}
          </div>
        </div>
      ))}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editing ? 'Editar Banner' : 'Nuevo Banner'}
              </h3>
              <button onClick={() => setShowForm(false)} className="rounded-full bg-gray-100 p-1.5 text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-bold text-gray-700">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Combo Familiar"
                  className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Subtítulo / Descripción</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Ej: 2 pizzas grandes + bebida"
                  className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                />
              </div>

              {/* Subida de imagen */}
              <div>
                <label className="text-sm font-bold text-gray-700">Imagen del banner</label>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:border-red-400 hover:text-red-500 disabled:opacity-50"
                  >
                    <ImagePlus className="h-5 w-5" />
                    {uploading ? 'Subiendo...' : 'Subir desde galería'}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                {form.image_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={form.image_url} alt="preview" className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-200" />
                    <button
                      onClick={() => setForm({ ...form, image_url: '' })}
                      className="text-xs text-red-500"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>

              {/* Color de fondo */}
              <div>
                <label className="text-sm font-bold text-gray-700">Color de fondo</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GRADIENTS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setForm({ ...form, bg_gradient: g })}
                      className={`h-8 w-8 rounded-lg bg-gradient-to-br ${g} transition ${
                        form.bg_gradient === g ? 'ring-2 ring-gray-900 ring-offset-1' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 accent-red-600"
                />
                <span className="text-sm text-gray-700">Activo (visible en inicio)</span>
              </label>

              <button
                onClick={handleSave}
                disabled={saving || !form.title}
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
