import { useMemo } from 'react';
import { Percent, Flame } from 'lucide-react';
import type { Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { formatPrice } from '@/lib/format';

interface OfertasPageProps {
  products: Product[];
  onProductClick: (p: Product) => void;
}

export function OfertasPage({ products, onProductClick }: OfertasPageProps) {
  const withDiscount = useMemo(
    () =>
      products
        .filter((p) => p.discount_percent > 0)
        .sort((a, b) => b.discount_percent - a.discount_percent),
    [products],
  );

  const bestsellers = useMemo(
    () => products.filter((p) => p.is_bestseller && p.discount_percent === 0),
    [products],
  );

  const totalSavings = withDiscount.reduce((sum, p) => {
    const original = p.base_price;
    const discounted = p.base_price * (1 - p.discount_percent / 100);
    return sum + (original - discounted);
  }, 0);

  return (
    <div className="space-y-5">
      {/* Banner de ahorro */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <Percent className="h-6 w-6 text-white" />
            <h2 className="text-xl font-black text-white">Ofertas Especiales</h2>
          </div>
          <p className="mt-1 text-sm text-white/90">
            Ahorra hasta {formatPrice(totalSavings)} en tu pedido
          </p>
        </div>
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
      </div>

      {/* Con descuento */}
      {withDiscount.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-black text-gray-900">
            Con Descuento
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {withDiscount.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onClick={() => onProductClick(p)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Más vendidas */}
      {bestsellers.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-600" />
            <h3 className="text-base font-black text-gray-900">
              Las Favoritas
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {bestsellers.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onClick={() => onProductClick(p)}
              />
            ))}
          </div>
        </div>
      )}

      {withDiscount.length === 0 && bestsellers.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-gray-400">
            No hay ofertas disponibles en este momento
          </p>
        </div>
      )}
    </div>
  );
}
