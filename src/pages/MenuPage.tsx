import { useState, useMemo } from 'react';
import type { Product, Category } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { HalfAndHalfCard } from '@/components/HalfAndHalfCard';
import { ProductListCard } from '@/components/ProductListCard';
import { ViewModeToggle, type ProductViewMode } from '@/components/ViewModeToggle';

interface MenuPageProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  onProductClick: (p: Product) => void;
  onHalfHalfAdded: () => void;
}

export function MenuPage({
  products,
  categories,
  searchQuery,
  onProductClick,
  onHalfHalfAdded,
}: MenuPageProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ProductViewMode>('grid');

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory) {
      result = result.filter((p) => p.category_id === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q),
      );
    }
    return result;
  }, [products, activeCategory, searchQuery]);

  const pizzas = products.filter((p) => p.sizes !== null && p.is_available);
  const isAllOrPizzas = !activeCategory || activeCategory === categories.find((c) => c.slug === 'pizzas')?.id;

  return (
    <div className="space-y-4">
      {/* Chips de categorías */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        <button
          onClick={() => setActiveCategory(null)}
          className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
            activeCategory === null
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-600 ring-1 ring-gray-200'
          }`}
        >
          Todo
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              activeCategory === cat.id
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Tarjeta Mitad y Mitad */}
      {isAllOrPizzas && <HalfAndHalfCard pizzas={pizzas} onAdded={onHalfHalfAdded} />}

      {/* Grid o lista de productos */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500">
              {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
            </p>
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onClick={() => onProductClick(p)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((p) => (
                <ProductListCard
                  key={p.id}
                  product={p}
                  onClick={() => onProductClick(p)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-sm text-gray-400">No se encontraron productos</p>
        </div>
      )}
    </div>
  );
}
