import { useState, useEffect, useRef } from 'react';
import { Check, ImagePlus, Palette, Store } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { BrandLogo, AUTO_BRAND_LOGO, BRAND_PRESET_ICONS, DEFAULT_BRAND_LOGO, PRESET_PREFIX } from '@/components/BrandLogo';
import { BRAND_THEMES } from '@/lib/brandThemes';
import {
  DEFAULT_BRAND_COLOR,
  DEFAULT_BUSINESS_NAME,
  applyBrandTheme,
  isValidHexColor,
} from '@/lib/brandTheme';

interface AdminBrandingProps {
  settings: Record<string, string>;
  onChanged: () => void;
}

const LOGO_SIZE = 256;

const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: 'Rojo', hex: '#dc2626' },
  { name: 'Naranja', hex: '#ea580c' },
  { name: 'Verde', hex: '#16a34a' },
  { name: 'Azul', hex: '#2563eb' },
  { name: 'Carbón', hex: '#262626' },
];

function readImageAsSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = LOGO_SIZE;
      canvas.height = LOGO_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('canvas'));
        return;
      }
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, LOGO_SIZE, LOGO_SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}

export function AdminBranding({ settings, onChanged }: AdminBrandingProps) {
  const [name, setName] = useState(settings.business_name || DEFAULT_BUSINESS_NAME);
  const [logo, setLogo] = useState(settings.brand_logo || DEFAULT_BRAND_LOGO);
  const [color, setColor] = useState(settings.brand_color || DEFAULT_BRAND_COLOR);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickerColor = isValidHexColor(color) ? color : DEFAULT_BRAND_COLOR;

  useEffect(() => {
    setName(settings.business_name || DEFAULT_BUSINESS_NAME);
    setLogo(settings.brand_logo || DEFAULT_BRAND_LOGO);
    setColor(settings.brand_color || DEFAULT_BRAND_COLOR);
  }, [settings.business_name, settings.brand_logo, settings.brand_color]);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El logotipo debe ser una imagen (PNG, JPG o WEBP).');
      return;
    }
    try {
      setLogo(await readImageAsSquareDataUrl(file));
      setError(null);
    } catch {
      setError('No pudimos leer esa imagen. Prueba con otra.');
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nombre del negocio no puede estar vacío.');
      return;
    }
    if (!isValidHexColor(color)) {
      setError('El color debe tener el formato #RRGGBB.');
      return;
    }
    setError(null);
    setSaving(true);
    const rows = [
      { key: 'business_name', value: trimmedName },
      { key: 'brand_logo', value: logo },
      { key: 'brand_color', value: color },
    ];
    const { error: saveError } = await supabase
      .from('store_settings')
      .upsert(rows, { onConflict: 'key' });
    setSaving(false);
    if (saveError) {
      setError('No pudimos guardar la identidad. Intenta de nuevo.');
      return;
    }
    applyBrandTheme(color);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onChanged();
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-red-600" />
        <h3 className="text-sm font-black text-gray-900">Identidad de la Tienda</h3>
      </div>
      <p className="mt-1 text-[11px] text-gray-400">
        El nombre, logotipo y color principal se muestran a tus clientes en toda la app.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <span className="text-sm font-bold text-gray-700">Temas profesionales</span>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {BRAND_THEMES.map((theme) => {
              const active = color.toLowerCase() === theme.color && logo === theme.logo;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setColor(theme.color);
                    setLogo(theme.logo);
                  }}
                  aria-pressed={active}
                  className={`flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition active:scale-[0.98] ${
                    active ? 'border-red-600 bg-red-50' : 'border-gray-200 bg-white hover:border-red-300'
                  }`}
                >
                  <span
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                    style={{ backgroundColor: theme.color }}
                  >
                    <BrandLogo logo={theme.logo} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-black text-gray-900">{theme.name}</span>
                    <span className="block text-[11px] leading-snug text-gray-500">{theme.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="text-sm font-bold text-gray-700">Color principal</span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map((preset) => {
              const active = color.toLowerCase() === preset.hex;
              return (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setColor(preset.hex)}
                  aria-label={`Color ${preset.name}`}
                  aria-pressed={active}
                  className={`h-9 w-9 rounded-full transition active:scale-90 ${
                    active ? 'ring-2 ring-offset-2 ring-gray-900' : 'ring-1 ring-gray-200'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                />
              );
            })}
            <label className="flex h-9 cursor-pointer items-center gap-2 rounded-full border-2 border-gray-200 px-2.5 text-xs font-bold text-gray-600 transition hover:border-red-300">
              <span className="h-5 w-5 rounded-full ring-1 ring-gray-200" style={{ backgroundColor: pickerColor }} />
              Personalizado
              <input
                type="color"
                value={pickerColor}
                onChange={(e) => setColor(e.target.value)}
                className="sr-only"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border-2 border-gray-200 px-3 py-2 focus-within:border-red-500">
            <span className="text-xs font-bold text-gray-500">HEX</span>
            <input
              type="text"
              value={color}
              maxLength={7}
              spellCheck={false}
              placeholder="#dc2626"
              onChange={(e) => setColor(e.target.value.trim())}
              className="w-full bg-transparent py-0.5 text-sm font-semibold uppercase text-gray-900 outline-none"
            />
          </div>
          {!isValidHexColor(color) && (
            <p className="mt-1 text-[11px] text-amber-600">Escribe un color en formato #RRGGBB, por ejemplo #dc2626.</p>
          )}
        </div>

        <div>
          <label htmlFor="brand-name" className="text-sm font-bold text-gray-700">
            Nombre comercial
          </label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border-2 border-gray-200 px-3 py-2 focus-within:border-red-500">
            <Store className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <input
              id="brand-name"
              type="text"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent py-0.5 text-sm text-gray-900 outline-none"
            />
          </div>
        </div>

        <div>
          <span className="text-sm font-bold text-gray-700">Logotipo</span>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md">
              <BrandLogo logo={logo} name={name} className="h-9 w-9" />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-2 text-xs font-bold text-gray-600 transition hover:border-red-500 hover:text-red-600"
              >
                <ImagePlus className="h-4 w-4" />
                Subir imagen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleUpload(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setLogo(AUTO_BRAND_LOGO)}
              aria-label="Logotipo automático"
              aria-pressed={logo === AUTO_BRAND_LOGO}
              className={`flex aspect-square items-center justify-center rounded-xl border-2 transition active:scale-95 ${
                logo === AUTO_BRAND_LOGO ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500 hover:border-red-300'
              }`}
            >
              <BrandLogo logo={AUTO_BRAND_LOGO} name={name} className="h-5 w-5" />
            </button>
            {Object.keys(BRAND_PRESET_ICONS).map((presetName) => {
              const value = `${PRESET_PREFIX}${presetName}`;
              const active = logo === value;
              return (
                <button
                  key={presetName}
                  type="button"
                  onClick={() => setLogo(value)}
                  aria-label={`Logotipo ${presetName}`}
                  aria-pressed={active}
                  className={`flex aspect-square items-center justify-center rounded-xl border-2 transition active:scale-95 ${
                    active ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500 hover:border-red-300'
                  }`}
                >
                  <BrandLogo logo={value} className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {error && <p className="mt-4 text-xs font-semibold text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        <Check className="h-4 w-4" />
        {saving ? 'Guardando...' : saved ? '¡Identidad guardada!' : 'Guardar Identidad'}
      </button>
    </div>
  );
}
