import { useMemo } from 'react';
import { Flame, Clock, MapPin } from 'lucide-react';
import type { Product, Category, PromoBanner as PromoBannerType, ServiceShift, StoreSettings } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { PromoBanner } from '@/components/PromoBanner';
import { getStoreOpen, getScheduleText } from '@/lib/storeHours';
import type { TabKey } from '@/components/BottomNav';

interface HomePageProps {
  products: Product[];
  categories: Category[];
  shifts: ServiceShift[];
  settings: StoreSettings | null;
  banners: PromoBannerType[];
  searchQuery: string;
  onProductClick: (p: Product) => void;
  onTabChange: (t: TabKey) => void;
}

export function HomePage({
  products,
  shifts,
  settings,
  banners,
  searchQuery,
  onProductClick,
}: HomePageProps) {
  const filtered = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  const bestsellers = filtered.filter((p) => p.is_bestseller);
  const sections = useMemo(() => {
    const grouped = shifts
      .map((s) => ({ key: s.id, title: s.name, items: filtered.filter((p) => p.shift_id === s.id) }))
      .filter((g) => g.items.length > 0);
    const shiftIds = new Set(shifts.map((s) => s.id));
    const unassigned = filtered.filter((p) => !p.shift_id || !shiftIds.has(p.shift_id));
    if (unassigned.length > 0) {
      grouped.push({ key: 'sin-turno', title: 'Nuestra carta', items: unassigned });
    }
    return grouped;
  }, [shifts, filtered]);
  const isOpen = getStoreOpen(settings);

  return (
    <div className="space-y-5">
      {/* Estado de la tienda */}
      {settings && (
        <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-2.5 w-2.5 rounded-full ${
                isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm font-bold text-gray-900">
              {isOpen ? 'Abierto ahora' : 'Cerrado'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            {getScheduleText(settings)}
          </div>
        </div>
      )}

      {/* Banner promocional */}
      <PromoBanner banners={banners} />

      {/* Más vendidas */}
      {bestsellers.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-black text-gray-900">Las Más Vendidas</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />
            ))}
          </div>
        </div>
      )}

      {/* Secciones por turno */}
      {sections.map((section) => (
        <div key={section.key}>
          <h2 className="mb-3 text-lg font-black text-gray-900">{section.title}</h2>
          <div className="grid grid-cols-2 gap-3">
            {section.items.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />
            ))}
          </div>
        </div>
      ))}

      {/* Dirección */}
      {settings && (
        <div className="flex items-center gap-2 rounded-xl bg-gray-100 p-3 text-xs text-gray-500">
          <MapPin className="h-4 w-4 flex-shrink-0 text-red-500" />
          {settings.address}
        </div>
      )}
    </div>
  );
}
