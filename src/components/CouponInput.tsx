import { useState } from 'react';
import { Ticket, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AppliedCoupon } from '@/types';

interface CouponInputProps {
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
}

export function CouponInput({ applied, onApply, onRemove }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    setChecking(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('validate_coupon', { p_codigo: normalized });
    setChecking(false);
    if (rpcError) {
      setError('No pudimos validar el cupón. Intenta de nuevo.');
      return;
    }
    if (typeof data !== 'number') {
      setError('Este cupón no es válido o ya no está vigente.');
      return;
    }
    onApply({ codigo: normalized, percent: data });
    setCode('');
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl bg-green-50 px-3 py-2.5 ring-1 ring-green-200">
        <div className="flex items-center gap-2 text-green-700">
          <Ticket className="h-4 w-4" />
          <span className="text-sm font-bold">
            {applied.codigo} · {applied.percent}% de descuento
          </span>
        </div>
        <button
          onClick={onRemove}
          className="rounded-full p-1 text-green-700 transition hover:bg-green-100"
          aria-label="Quitar cupón"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
          placeholder="Código de descuento"
          maxLength={32}
          className="min-w-0 flex-1 rounded-xl border-2 border-gray-200 px-3 py-2 font-mono text-sm uppercase tracking-wider outline-none transition placeholder:font-sans placeholder:normal-case placeholder:tracking-normal focus:border-red-500"
        />
        <button
          onClick={handleApply}
          disabled={checking || !code.trim()}
          className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-40"
        >
          {checking ? '...' : 'Aplicar'}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
