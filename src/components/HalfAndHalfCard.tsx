import { useState, useMemo } from 'react';
import { SplitSquareHorizontal, Plus } from 'lucide-react';
import type { Product, SizeKey, CartItem } from '@/types';
import { SIZE_LABELS } from '@/types';
import { formatPrice } from '@/lib/format';
import { getAvailableSizes, getHalfHalfPrice } from '@/lib/pricing';
import { useStore } from '@/store/StoreContext';

interface HalfAndHalfCardProps {
  pizzas: Product[];
  onAdded: () => void;
}

export function HalfAndHalfCard({ pizzas, onAdded }: HalfAndHalfCardProps) {
  const { addToCart } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [half1Id, setHalf1Id] = useState('');
  const [half2Id, setHalf2Id] = useState('');
  const [size, setSize] = useState<SizeKey | null>(null);

  const half1 = useMemo(
    () => pizzas.find((p) => p.id === half1Id) || null,
    [pizzas, half1Id],
  );
  const half2 = useMemo(
    () => pizzas.find((p) => p.id === half2Id) || null,
    [pizzas, half2Id],
  );

  // Available sizes = intersection of both pizzas' available sizes
  const availableSizes = useMemo(() => {
    if (!half1 || !half2) return [];
    const s1 = getAvailableSizes(half1.sizes);
    const s2 = getAvailableSizes(half2.sizes);
    return s1.filter((s) => s2.includes(s));
  }, [half1, half2]);

  const price = useMemo(() => {
    if (!half1 || !half2 || !size) return 0;
    return getHalfHalfPrice(half1, half2, size);
  }, [half1, half2, size]);

  const canAdd = half1 && half2 && size;

  const handleAdd = () => {
    if (!canAdd || !half1 || !half2 || !size) return;
    const item: CartItem = {
      id: crypto.randomUUID(),
      product_id: half1.id,
      name: `Pizza Mitad/Mitad: ${half1.name} / ${half2.name}`,
      image_url: half1.image_url,
      base_price: price,
      size,
      size_label: SIZE_LABELS[size],
      size_price: price,
      extras: [],
      notes: `Mitad: ${half1.name} / Mitad: ${half2.name}`,
      quantity: 1,
      unit_price: price,
      discount_percent: 0,
      is_half_half: true,
      half_product_name: half2.name,
      is_free_reward: false,
    };
    addToCart(item);
    setExpanded(false);
    setHalf1Id('');
    setHalf2Id('');
    setSize(null);
    onAdded();
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
          <SplitSquareHorizontal className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-white">Arma tu Pizza Mitad y Mitad</p>
          <p className="text-xs text-white/80">Elige 2 especialidades y el tamaño</p>
        </div>
      </button>

      {expanded && (
        <div className="bg-white p-4 space-y-3">
          <div>
            <label className="text-sm font-bold text-gray-700">
              Mitad 1 <span className="text-red-500">*</span>
            </label>
            <select
              value={half1Id}
              onChange={(e) => {
                setHalf1Id(e.target.value);
                setSize(null);
              }}
              className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
            >
              <option value="">Selecciona...</option>
              {pizzas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700">
              Mitad 2 <span className="text-red-500">*</span>
            </label>
            <select
              value={half2Id}
              onChange={(e) => {
                setHalf2Id(e.target.value);
                setSize(null);
              }}
              className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
            >
              <option value="">Selecciona...</option>
              {pizzas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {availableSizes.length > 0 && (
            <div>
              <label className="text-sm font-bold text-gray-700">Tamaño</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {availableSizes.map((s) => {
                  const sPrice = getHalfHalfPrice(half1!, half2!, s);
                  const active = size === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`flex flex-col items-center rounded-xl border-2 p-2.5 transition ${
                        active ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <span
                        className={`text-sm font-bold ${
                          active ? 'text-orange-600' : 'text-gray-700'
                        }`}
                      >
                        {SIZE_LABELS[s]}
                      </span>
                      <span
                        className={`text-xs ${
                          active ? 'text-orange-500' : 'text-gray-400'
                        }`}
                      >
                        {formatPrice(sPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {canAdd && (
            <div className="flex items-center justify-between rounded-xl bg-orange-50 px-3 py-2.5">
              <p className="text-xs text-gray-500">Precio (especialidad de mayor valor)</p>
              <span className="text-lg font-black text-orange-600">
                {formatPrice(price)}
              </span>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-sm font-bold text-white transition active:scale-[0.98] hover:bg-orange-600 disabled:opacity-50"
          >
            {canAdd ? (
              <>
                <Plus className="h-4 w-4" />
                Agregar al Carrito — {formatPrice(price)}
              </>
            ) : (
              'Selecciona ambas mitades y tamaño'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
