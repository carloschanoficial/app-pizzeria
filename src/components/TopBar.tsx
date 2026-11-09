import { Search, ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { ClayPotIcon } from '@/components/ClayPotIcon';
import { BrandLogo } from '@/components/BrandLogo';

interface TopBarProps {
  businessName: string;
  logo: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  onCartClick: () => void;
  walletBalance: number;
  canRedeem: boolean;
  onWalletClick: () => void;
}

export function TopBar({
  businessName,
  logo,
  searchQuery,
  onSearchChange,
  cartCount,
  onCartClick,
  walletBalance,
  canRedeem,
  onWalletClick,
}: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-red-600 text-white shadow-lg">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <BrandLogo logo={logo} className="h-7 w-7 flex-shrink-0" />
          <span className="truncate text-xl font-black tracking-tight">
            {businessName}
          </span>
        </div>

        {/* Olla de Dinero */}
        <button
          onClick={onWalletClick}
          className="relative ml-auto flex-shrink-0 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 transition active:scale-90 hover:bg-white/25"
          aria-label="Olla de Dinero"
        >
          <ClayPotIcon className={`h-6 w-6 ${canRedeem ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-bold ${canRedeem ? 'text-yellow-300' : 'text-white/90'}`}>
            {formatPrice(walletBalance)}
          </span>
          {canRedeem && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] font-black text-red-700">
              ¡USA!
            </span>
          )}
        </button>

        {/* Carrito - más grande y llamativo */}
        <button
          onClick={onCartClick}
          className="relative flex-shrink-0 rounded-full bg-yellow-400 p-3 shadow-lg transition active:scale-90 hover:bg-yellow-300"
          aria-label="Carrito"
        >
          <ShoppingCart className="h-7 w-7 text-red-700" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-black text-white shadow-md ring-2 ring-yellow-400">
              {cartCount}
            </span>
          )}
        </button>
      </div>
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar pizzas, bebidas..."
            className="w-full rounded-full bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none ring-2 ring-transparent focus:ring-yellow-400"
          />
        </div>
      </div>
    </header>
  );
}
