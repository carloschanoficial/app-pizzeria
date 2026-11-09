import { useState, type FormEvent } from 'react';
import { ArrowLeft, Lock, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminSession, type AdminAccess, type AdminRecord } from '@/hooks/useAdminSession';
import { PlanPaymentDetails } from '@/components/admin/PlanPaymentDetails';
import { PlanRequestForm } from '@/components/admin/PlanRequestForm';

interface AdminLoginProps {
  onExit: () => void;
}

type Mode = 'signin' | 'signup';

function accessMessage(access: AdminAccess, record: AdminRecord | null): string | null {
  if (access === 'no_access') return 'Esta cuenta no tiene acceso de administrador.';
  if (access === 'inactive') return 'Tu acceso de administrador está desactivado.';
  if (access === 'expired' && record) {
    const date = new Date(record.expires_at).toLocaleDateString('es-MX', { dateStyle: 'long' });
    return `Tu suscripción venció el ${date}. Contacta al administrador para renovarla.`;
  }
  if (access === 'error') return 'No pudimos verificar tu acceso. Intenta de nuevo.';
  return null;
}

export function AdminLogin({ onExit }: AdminLoginProps) {
  const { session, access, record } = useAdminSession();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const blockedMessage = session ? accessMessage(access, record) : null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    const credentials = { email: email.trim().toLowerCase(), password };

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword(credentials);
      if (signInError) setError('Correo o contraseña incorrectos.');
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp(credentials);
      if (signUpError) {
        setError('No se pudo crear la cuenta. Revisa los datos (la contraseña necesita al menos 6 caracteres).');
      } else if (!data.session) {
        setMessage('Cuenta creada. Ya puedes iniciar sesión.');
        setMode('signin');
      }
    }

    setPassword('');
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={onExit}
          className="rounded-full bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
          aria-label="Salir"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-black text-gray-900">Acceso de administrador</h1>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <Lock className="h-6 w-6 text-red-600" />
          </div>

          {blockedMessage ? (
            <div className="mt-4 text-center">
              <p className="text-sm font-bold text-gray-900">Acceso no disponible</p>
              <p className="mt-1 text-xs text-gray-600">{blockedMessage}</p>
              <PlanPaymentDetails />
              {session?.user.email && <PlanRequestForm email={session.user.email.toLowerCase()} />}
              <button
                onClick={() => supabase.auth.signOut()}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <p className="text-center text-sm font-bold text-gray-900">
                {mode === 'signin' ? 'Inicia sesión' : 'Crea tu cuenta de administrador'}
              </p>

              <div>
                <label htmlFor="admin-email" className="text-xs font-bold text-gray-700">
                  Correo
                </label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500"
                />
              </div>

              <div>
                <label htmlFor="admin-password" className="text-xs font-bold text-gray-700">
                  Contraseña
                </label>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500"
                />
              </div>

              {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
              {message && <p className="text-xs font-semibold text-green-700">{message}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-red-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? 'Procesando...' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMessage(null);
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                }}
                className="w-full text-xs font-bold text-gray-600 underline underline-offset-2 transition hover:text-gray-900"
              >
                {mode === 'signin' ? 'Primera vez: crear cuenta' : 'Ya tengo cuenta: iniciar sesión'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
