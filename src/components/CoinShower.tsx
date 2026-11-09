import { useEffect, useState, type CSSProperties } from 'react';
import { playCoinSound } from '@/lib/coinSound';

const COIN_COUNT = 30;
const SHOW_MS = 3600;

interface Coin {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
}

function createCoins(): Coin[] {
  return Array.from({ length: COIN_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    size: 14 + Math.random() * 10,
    delay: Math.random() * 0.9,
    duration: 1.9 + Math.random() * 1.1,
    drift: (Math.random() - 0.5) * 120,
  }));
}

export function CoinShower() {
  const [coins] = useState(createCoins);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    playCoinSound();
    const timer = setTimeout(() => setVisible(false), SHOW_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      {coins.map((coin) => (
        <span
          key={coin.id}
          className="coin-fall absolute top-0 rounded-full border border-amber-700/60 bg-gradient-to-br from-yellow-100 via-yellow-400 to-amber-600 shadow-sm"
          style={
            {
              left: `${coin.left}%`,
              width: coin.size,
              height: coin.size,
              animationDelay: `${coin.delay}s`,
              animationDuration: `${coin.duration}s`,
              '--coin-drift': `${coin.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
