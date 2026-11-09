import { Gift, Check, Lock } from 'lucide-react';

interface LoyaltyCardComponentProps {
  stamps: number;
  rewardClaimed: boolean;
  rewardName: string;
}

export function LoyaltyCardComponent({
  stamps,
  rewardClaimed,
  rewardName,
}: LoyaltyCardComponentProps) {
  const totalSlots = 6;
  const canClaim = stamps >= totalSlots && !rewardClaimed;

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 p-4 shadow-lg">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-yellow-300" />
        <h3 className="text-sm font-black text-white">Tarjeta de Lealtad</h3>
      </div>
      <p className="mt-1 text-xs text-white/80">
        Acumula 6 pedidos y gana {rewardName}
      </p>

      {/* Sellos */}
      <div className="mt-3 grid grid-cols-6 gap-1.5">
        {Array.from({ length: totalSlots }).map((_, i) => {
          const filled = i < stamps;
          return (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-lg text-sm font-black transition-all duration-300 ${
                filled
                  ? 'bg-yellow-400 text-red-700 shadow-md scale-105'
                  : 'bg-white/20 text-white/40'
              }`}
            >
              {filled ? <Check className="h-4 w-4" /> : i + 1}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-bold text-white">
          {stamps}/{totalSlots} pedidos
        </span>
        {canClaim ? (
          <span className="text-xs font-bold text-yellow-300">
            Meta cumplida: reclama tu premio en tu carrito
          </span>
        ) : rewardClaimed ? (
          <span className="flex items-center gap-1 text-xs font-bold text-yellow-300">
            <Lock className="h-3 w-3" />
            Premio canjeado - completa 6 nuevos
          </span>
        ) : (
          <span className="text-xs text-white/60">
            Faltan {totalSlots - stamps} pedidos
          </span>
        )}
      </div>
    </div>
  );
}
