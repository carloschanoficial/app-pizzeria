import { useState, useMemo } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { HalfAndHalfCard } from '@/components/HalfAndHalfCard';
import { ProductListCard } from '@/components/ProductListCard';
import { ViewModeToggle, type ProductViewMode } from '@/components/ViewModeToggle';
import { ShiftStatus } from '@/components/ShiftStatus';
import type { Product, ServiceShift, StoreSettings } from '@/types';

interface MenuPageProps {
  products: Product[];
  shifts: ServiceShift[];
  settings: StoreSettings | null;
  searchQuery: string;
  onProductClick: (p: Product) => void;
  onHalfHalfAdded: () => void;
}

export function MenuPage({
  products,
  shifts,
  settings,
  searchQuery,
  onProductClick,
  onHalfHalfAdded,
}: MenuPageProps) {
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ProductViewMode>('grid');

  const shiftTabs = useMemo(
    () => shifts.filter((s) => products.some((p) => p.shift_id === s.id)),
    [shifts, products],
  );

  const filtered = useMemo(() => {
    let result = products;
    if (activeShiftId) {
      result = result.filter((p) => p.shift_id === activeShiftId);
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
  }, [products, activeShiftId, searchQuery]);

  const activeShift = shiftTabs.find((s) => s.id === activeShiftId) ?? null;
  const pizzas = products.filter((p) => p.sizes !== null && p.is_available);
  const showHalfAndHalf = filtered.some((p) => p.sizes !== null);

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveShiftId(null)}
          className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
            activeShiftId === null
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-600 ring-1 ring-gray-200'
          }`}
        >
          Todo
        </button>
        {shiftTabs.map((shift) => (
          <button
            key={shift.id}
            onClick={() => setActiveShiftId(shift.id)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              activeShiftId === shift.id
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200'
            }`}
          >
            {shift.name}
          </button>
        ))}
      </div>

      {activeShift && <ShiftStatus shift={activeShift} settings={settings} />}

      {showHalfAndHalf && <HalfAndHalfCard pizzas={pizzas} onAdded={onHalfHalfAdded} />}

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
