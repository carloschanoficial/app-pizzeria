import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AdminSubscription } from '@/types';

interface AdminSubscriptionFormProps {
  subscription: AdminSubscription | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function defaultExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return toDateInputValue(d.toISOString());
}

export function AdminSubscriptionForm({ subscription, onClose, onSaved }: AdminSubscriptionFormProps) {
  const isEditing = subscription !== null;
  const [email, setEmail] = useState(subscription?.email ?? '');
  const [expiresOn, setExpiresOn] = useState(
    subscription ? toDateInputValue(subscription.expires_at) : defaultExpiry(),
  );
  const [isActive, setIsActive] = useState(subscription?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('Escribe un correo válido.');
      return;
    }
    if (!expiresOn) {
      setError('Elige la fecha de vencimiento.');
      return;
    }

    setSaving(true);
    setError(null);
    const payload = {
      email: normalizedEmail,
      expires_at: new Date(`${expiresOn}T23:59:59`).toISOString(),
      is_active: isActive,
    };

    const { error: saveError } = isEditing
      ? await supabase
          .from('administradores')
          .update({ expires_at: payload.expires_at, is_active: payload.is_active })
          .eq('id', subscription.id)
      : await supabase.from('administradores').insert(payload);

    setSaving(false);
    if (saveError) {
      setError(
        saveError.code === '23505'
          ? 'Ya existe un administrador con ese correo.'
          : 'No se pudo guardar. Intenta de nuevo.',
      );
      return;
    }
    onSaved();
    if (isEditing) {
      onClose();
    } else {
      setCreatedEmail(normalizedEmail);
    }
  };

  if (createdEmail) {
    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900">Administrador agregado</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gray-100 p-1.5 text-gray-600 transition hover:bg-gray-200"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 rounded-xl bg-green-50 p-4">
            <p className="text-sm font-bold text-green-800">{createdEmail} ya quedó registrado.</p>
            <p className="text-xs leading-relaxed text-green-900">
              No se envió ningún correo de invitación. Para entrar, esta persona debe abrir la pantalla de acceso de
              administradores, crear una cuenta con este mismo correo y definir su contraseña. Su acceso se activa
              automáticamente una vez que lo haga.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-red-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98]"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-gray-900">
            {isEditing ? 'Editar suscripción' : 'Nuevo administrador'}
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
          <label htmlFor="sub-email" className="text-xs font-bold text-gray-700">Correo</label>
          <input
            id="sub-email"
            type="email"
            required
            disabled={isEditing}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="sub-expires" className="text-xs font-bold text-gray-700">Vence el</label>
          <input
            id="sub-expires"
            type="date"
            required
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500"
          />
        </div>

        <label className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
          <span className="text-sm font-semibold text-gray-700">Acceso activo</span>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-5 w-5 accent-red-600"
          />
        </label>

        <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-amber-900">
          El acceso se otorga usando este correo en la pantalla de inicio de sesión de administradores (no se envían contraseñas automáticas).
        </p>

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
