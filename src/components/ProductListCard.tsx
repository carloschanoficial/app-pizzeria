import { Flame, Percent } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/format';
import { getMinPrice } from '@/lib/pricing';

interface ProductListCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductListCard({ product, onClick }: ProductListCardProps) {
  const hasDiscount = product.discount_percent > 0;
  const minPrice = getMinPrice(product);
  const discountedPrice = hasDiscount
    ? minPrice * (1 - product.discount_percent / 100)
    : minPrice;

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-gray-100 transition hover:shadow-md active:scale-[0.99]"
    >
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${
              product.is_available ? '' : 'opacity-50 blur-[2px] grayscale'
            }`}
          />
        )}
        {!product.is_available && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-gray-900/80 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              Agotado
            </span>
          </span>
        )}
        {hasDiscount && (
          <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-red-700 shadow-sm">
            <Percent className="h-2.5 w-2.5" />
            {product.discount_percent}%
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col self-stretch">
        <div className="flex items-start gap-1.5">
          <h3 className="min-w-0 flex-1 text-sm font-bold leading-tight text-gray-900 line-clamp-1">
            {product.name}
          </h3>
          {product.is_bestseller && <Flame className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-600" />}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
          {product.description}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {hasDiscount && (
              <span className="block text-[11px] text-gray-400 line-through">{formatPrice(minPrice)}</span>
            )}
            <span className="text-[10px] text-gray-400">desde</span>
            <p className="text-base font-black leading-none text-red-600">{formatPrice(discountedPrice)}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold text-white transition ${
              product.is_available ? 'bg-red-600 group-hover:bg-red-700' : 'bg-gray-400'
            }`}
          >
            {product.is_available ? 'Personalizar' : 'Agotado'}
          </span>
        </div>
      </div>
    </button>
  );
}
