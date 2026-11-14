import { useState, useMemo, useEffect } from 'react';
import { X, Check, Plus, Flame, Percent } from 'lucide-react';
import type { Product, ExtraIngredient, SizeKey, CartItem } from '@/types';
import { formatPrice } from '@/lib/format';
import { getAvailableSizes, getSizeLabel, getSizePrice, getHalfHalfPrice } from '@/lib/pricing';
import { useStore } from '@/store/StoreContext';

interface ProductDetailSheetProps {
  product: Product;
  extras: ExtraIngredient[];
  allPizzas: Product[];
  onClose: () => void;
  onAdded: () => void;
}

type Tab = 'completa' | 'mitad';

export function ProductDetailSheet({
  product,
  extras,
  allPizzas,
  onClose,
  onAdded,
}: ProductDetailSheetProps) {
  const { addToCart } = useStore();
  const isPizza = product.sizes !== null;
  const isFourSeasons = product.name.toLowerCase().includes('4 estaciones') || product.name.toLowerCase().includes('cuatro estaciones');
  const canHalfHalf = isPizza && !isFourSeasons;
  const availableSizes = useMemo(
    () => getAvailableSizes(product.sizes),
    [product.sizes],
  );

  const [tab, setTab] = useState<Tab>('completa');
  const [selectedSize, setSelectedSize] = useState<SizeKey | null>(
    isPizza ? availableSizes[0] ?? null : null,
  );
  const [halfProductId, setHalfProductId] = useState<string>('');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const halfProduct = useMemo(
    () => allPizzas.find((p) => p.id === halfProductId) || null,
    [allPizzas, halfProductId],
  );

  const otherPizzas = useMemo(
    () => allPizzas.filter((p) => p.id !== product.id && p.is_available),
    [allPizzas, product.id],
  );

  // Direct price for the selected size (no base + upcharge)
  const sizePrice = useMemo(() => {
    if (!selectedSize) return 0;
    if (tab === 'mitad' && halfProduct) {
      return getHalfHalfPrice(product, halfProduct, selectedSize);
    }
    return getSizePrice(product, selectedSize);
  }, [product, halfProduct, selectedSize, tab]);

  const discount = product.discount_percent || 0;
  const discountedSizePrice =
    discount > 0 ? sizePrice * (1 - discount / 100) : sizePrice;

  const extrasTotal = useMemo(
    () =>
      extras
        .filter((e) => selectedExtras.includes(e.id))
        .reduce((sum, e) => sum + e.price, 0),
    [selectedExtras, extras],
  );

  const unitPrice = discountedSizePrice + extrasTotal;
  const totalPrice = unitPrice * quantity;

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const canAdd = () => {
    if (!product.is_available) return false;
    if (!isPizza) return true;
    if (!selectedSize) return false;
    if (tab === 'mitad' && !halfProductId) return false;
    return true;
  };

  const handleAdd = () => {
    if (!canAdd()) return;
    const itemName =
      tab === 'mitad' && halfProduct
        ? `Pizza Mitad/Mitad: ${product.name} / ${halfProduct.name}`
        : product.name;
    const item: CartItem = {
      id: crypto.randomUUID(),
      product_id: product.id,
      name: itemName,
      image_url: product.image_url,
      base_price: sizePrice,
      size: selectedSize,
      size_label: selectedSize ? getSizeLabel(product, selectedSize) : 'Único',
      size_price: sizePrice,
      extras: extras
        .filter((e) => selectedExtras.includes(e.id))
        .map((e) => ({ id: e.id, name: e.name, price: e.price })),
      notes,
      quantity,
      unit_price: unitPrice,
      discount_percent: discount,
      is_half_half: tab === 'mitad',
      half_product_name: tab === 'mitad' ? halfProduct?.name || null : null,
      is_free_reward: false,
    };
    addToCart(item);
    onAdded();
  };

  // For half-half, available sizes are those that BOTH pizzas have
  const halfAvailableSizes = useMemo(() => {
    if (!halfProduct) return availableSizes;
    const halfSizes = getAvailableSizes(halfProduct.sizes);
    return availableSizes.filter((s) => halfSizes.includes(s));
  }, [availableSizes, halfProduct]);

  const activeSizes = tab === 'mitad' ? halfAvailableSizes : availableSizes;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white animate-slide-up">
        {/* Imagen del producto (o dividida en mitad) */}
        <div className="relative h-52 flex-shrink-0 overflow-hidden bg-gray-100">
          {tab === 'mitad' && halfProduct && halfProduct.image_url ? (
            <div className="flex h-full w-full">
              <div className="relative h-full w-1/2 overflow-hidden">
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                )}
                <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">Lado A</span>
              </div>
              <div className="relative h-full w-1/2 overflow-hidden border-l-2 border-white">
                <img src={halfProduct.image_url} alt={halfProduct.name} className="h-full w-full object-cover" />
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">Lado B</span>
              </div>
            </div>
          ) : (
            product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )
          )}
          <button
            onClick={onClose}
            className="absolute right-3 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
            style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute left-3 flex gap-1.5" style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}>
            {product.is_bestseller && (
              <span className="flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">
                <Flame className="h-3.5 w-3.5" />
                Más Vendida
              </span>
            )}
            {product.discount_percent > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-yellow-400 px-2.5 py-1 text-[11px] font-bold text-red-700 shadow">
                <Percent className="h-3.5 w-3.5" />
                -{product.discount_percent}%
              </span>
            )}
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <h2 className="mt-4 text-xl font-black text-gray-900">{product.name}</h2>
          <p className="mt-1 text-sm text-gray-500">{product.description}</p>

          {!product.is_available && (
            <div className="mt-3 rounded-xl border-2 border-gray-300 bg-gray-100 px-3 py-2.5">
              <p className="text-sm font-bold text-gray-700">
                Este producto está agotado por el momento
              </p>
            </div>
          )}

          {/* Pestañas COMPLETA / MITAD Y MITAD */}
          {isPizza && (
            <div className="mt-4 flex gap-2 rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setTab('completa')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
                  tab === 'completa'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Completa
              </button>
              <button
                onClick={() => canHalfHalf && setTab('mitad')}
                disabled={!canHalfHalf}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
                  tab === 'mitad'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-500'
                } ${!canHalfHalf ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                Mitad y Mitad
              </button>
            </div>
          )}

          {/* Aviso 4 Estaciones */}
          {isPizza && isFourSeasons && (
            <div className="mt-3 rounded-xl bg-red-50 border-2 border-red-300 px-3 py-2.5">
              <p className="text-sm font-bold text-red-700">
                ⚠️ LA PIZZA 4 ESTACIONES NO APLICA EN MITADES
              </p>
            </div>
          )}

          {/* Selectores Lado A / Lado B (solo en mitad) */}
          {isPizza && tab === 'mitad' && (
            <div className="mt-3 space-y-2">
              <div>
                <label className="text-sm font-bold text-gray-700">Lado A</label>
                <div className="mt-1 w-full rounded-xl border-2 border-orange-300 bg-orange-50 px-3 py-2.5 text-sm font-bold text-gray-900">
                  {product.name}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">
                  Lado B <span className="text-red-500">*</span>
                </label>
                <select
                  value={halfProductId}
                  onChange={(e) => setHalfProductId(e.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                >
                  <option value="">Selecciona...</option>
                  {otherPizzas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Selección de tamaño */}
          {isPizza && (
            <div className="mt-5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Tamaño</h3>
                <span className="text-[11px] font-medium text-red-500">Obligatorio</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {activeSizes.map((size) => {
                  const price =
                    tab === 'mitad' && halfProduct
                      ? getHalfHalfPrice(product, halfProduct, size)
                      : getSizePrice(product, size);
                  const discounted =
                    discount > 0 ? price * (1 - discount / 100) : price;
                  const active = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`flex flex-col items-center rounded-xl border-2 p-3 transition ${
                        active
                          ? tab === 'mitad'
                            ? 'border-orange-600 bg-orange-50'
                            : 'border-red-600 bg-red-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span
                        className={`text-sm font-bold ${
                          active
                            ? tab === 'mitad'
                              ? 'text-orange-600'
                              : 'text-red-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {getSizeLabel(product, size)}
                      </span>
                      <span
                        className={`mt-0.5 text-xs ${
                          active
                            ? tab === 'mitad'
                              ? 'text-orange-500'
                              : 'text-red-500'
                            : 'text-gray-400'
                        }`}
                      >
                        {formatPrice(discounted)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {activeSizes.length === 0 && tab === 'mitad' && (
                <p className="mt-2 text-xs text-gray-400">
                  Selecciona el Lado B para ver tamaños disponibles
                </p>
              )}
            </div>
          )}

          {/* Ingredientes extra (completa y mitad) */}
          {isPizza && extras.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Ingredientes Extra</h3>
                <span className="text-[11px] text-gray-400">Opcional</span>
              </div>
              <p className="text-[11px] text-gray-400">
                +${extras[0]?.price.toFixed(0)} pesos c/u
              </p>
              <div className="mt-2 space-y-1.5">
                {extras.map((extra) => {
                  const checked = selectedExtras.includes(extra.id);
                  return (
                    <button
                      key={extra.id}
                      onClick={() => toggleExtra(extra.id)}
                      className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-2.5 transition ${
                        checked
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition ${
                            checked
                              ? 'border-red-600 bg-red-600 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {extra.name}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-400">
                        +{formatPrice(extra.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notas especiales */}
          <div className="mt-5">
            <h3 className="text-sm font-bold text-gray-900">Instrucciones Especiales</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Sin orilla, masa dorada, bien cocida..."
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-red-500"
            />
          </div>

          {/* Selector de cantidad */}
          <div className="mt-5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Cantidad</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-700 transition active:scale-90 hover:bg-gray-200"
              >
                −
              </button>
              <span className="w-6 text-center text-base font-bold text-gray-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white transition active:scale-90 hover:bg-red-700"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Barra inferior fija */}
        <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 pb-5">
          <button
            onClick={handleAdd}
            disabled={!canAdd()}
            className="flex w-full items-center justify-between rounded-full bg-red-600 px-5 py-3.5 text-white shadow-lg transition active:scale-[0.98] hover:bg-red-700 disabled:opacity-50"
          >
            <span className="text-sm font-bold">
              {!product.is_available
                ? 'Agotado por el momento'
                : !canAdd()
                  ? tab === 'mitad' && !halfProductId
                    ? 'Elige el Lado B'
                    : 'Selecciona un tamaño'
                  : 'Agregar al Carrito'}
            </span>
            {canAdd() && (
              <span className="flex items-center gap-1.5 text-base font-black">
                {formatPrice(totalPrice)}
                <Plus className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
