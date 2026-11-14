import { Flame, Percent } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/format';
import { getMinPrice } from '@/lib/pricing';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const hasDiscount = product.discount_percent > 0;
  const minPrice = getMinPrice(product);
  const discountedPrice = hasDiscount
    ? minPrice * (1 - product.discount_percent / 100)
    : minPrice;

  return (
    <button
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-gray-100 transition hover:shadow-md active:scale-[0.98]"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
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
            <span className="rounded-full bg-gray-900/80 px-3 py-1 text-xs font-bold text-white shadow">
              Agotado
            </span>
          </span>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.is_bestseller && (
            <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              <Flame className="h-3 w-3" />
              Más Vendida
            </span>
          )}
          {hasDiscount && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-red-700 shadow">
              <Percent className="h-3 w-3" />
              -{product.discount_percent}%
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">
          {product.name}
        </h3>
        <p className="mt-0.5 text-[11px] text-gray-500 leading-tight line-clamp-2">
          {product.description}
        </p>
        <div className="mt-auto pt-2">
          {hasDiscount && (
            <span className="block text-[11px] text-gray-400 line-through">
              {formatPrice(minPrice)}
            </span>
          )}
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] text-gray-400">desde</span>
              <p className="text-base font-black text-red-600 leading-none">
                {formatPrice(discountedPrice)}
              </p>
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
      </div>
    </button>
  );
}
