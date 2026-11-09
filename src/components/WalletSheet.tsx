import { useEffect } from 'react';
import { X, Coins, Gift, Info } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useWallet } from '@/hooks/useData';
import { formatPrice } from '@/lib/format';
import { getWalletRules } from '@/lib/loyaltyRules';
import { ClayPotIcon } from '@/components/ClayPotIcon';

interface WalletSheetProps {
  onClose: () => void;
}

export function WalletSheet({ onClose }: WalletSheetProps) {
  const { customerPhone, settings } = useStore();
  const rules = getWalletRules(settings);
  const { wallet, loading, canRedeem, threshold, cashback } = useWallet(customerPhone || null, rules);
  const balance = wallet ? Number(wallet.balance) : 0;
  const progress = threshold > 0 ? Math.min(balance / threshold, 1) * 100 : 0;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-gradient-to-b from-red-50 to-white animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <ClayPotIcon className="h-6 w-6" />
            <h2 className="text-lg font-bold text-gray-900">Mi Olla de Dinero</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          {!customerPhone ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClayPotIcon className="h-16 w-16 opacity-40 grayscale" />
              <p className="mt-4 text-base font-bold text-gray-700">
                ¡Empieza a ahorrar!
              </p>
              <p className="mt-1 text-sm text-gray-400 max-w-xs">
                Realiza tu primer pedido con tu teléfono para empezar a
                acumular dinero en tu olla.
              </p>
            </div>
          ) : loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
            </div>
          ) : (
            <>
              {/* Balance principal */}
              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 p-6 text-center shadow-lg">
                <ClayPotIcon className="mx-auto h-12 w-12" />
                <p className="mt-2 text-xs text-white/80">Saldo Acumulado</p>
                <p className="text-4xl font-black text-white mt-1">
                  {formatPrice(balance)}
                </p>
                {cashback > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    <Coins className="h-4 w-4 text-yellow-300" />
                    <span className="text-xs text-white/80">
                      +{formatPrice(cashback)} por cada pedido
                    </span>
                  </div>
                )}
              </div>

              {threshold > 0 && (
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900">
                      Progreso hacia canje
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {formatPrice(balance)} / {formatPrice(threshold)}
                    </span>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        canRedeem
                          ? 'bg-green-500'
                          : 'bg-gradient-to-r from-yellow-400 to-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {canRedeem ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 p-3">
                      <Gift className="h-5 w-5 flex-shrink-0 text-green-600" />
                      <p className="text-xs font-bold text-green-700">
                        ¡Ya puedes usar {formatPrice(threshold)} como descuento en
                        tu siguiente compra!
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">
                      Te faltan {formatPrice(threshold - balance)} para poder
                      canjear tu saldo.
                    </p>
                  )}
                </div>
              )}

              {/* Cómo funciona */}
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-gray-900">
                    ¿Cómo funciona?
                  </h3>
                </div>
                <ul className="mt-3 space-y-2.5 text-xs text-gray-600">
                  {cashback > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">1</span>
                      Por cada pedido que realices, acumulas {formatPrice(cashback)} en tu olla.
                    </li>
                  )}
                  {threshold > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">2</span>
                      Cuando tu saldo llegue a {formatPrice(threshold)}, podrás usarlo como descuento en tu siguiente compra.
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">3</span>
                    El descuento se aplica automáticamente al confirmar tu pedido en el carrito.
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3 pb-5">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
