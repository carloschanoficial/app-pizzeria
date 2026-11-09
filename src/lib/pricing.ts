import type { Product, SizeKey, SizePrices } from '@/types';
import { SIZE_ORDER } from '@/types';

export function getAvailableSizes(sizes: SizePrices | null): SizeKey[] {
  if (!sizes) return [];
  return SIZE_ORDER.filter((s) => sizes[s] !== undefined && sizes[s]! > 0);
}

export function getSizePrice(product: Product, size: SizeKey): number {
  if (!product.sizes) return product.base_price;
  return product.sizes[size] ?? 0;
}

export function getMinPrice(product: Product): number {
  if (!product.sizes) return product.base_price;
  const available = getAvailableSizes(product.sizes);
  if (available.length === 0) return product.base_price;
  return Math.min(...available.map((s) => product.sizes![s]!));
}

export function getHalfHalfPrice(
  productA: Product,
  productB: Product,
  size: SizeKey,
): number {
  const priceA = getSizePrice(productA, size);
  const priceB = getSizePrice(productB, size);
  return Math.max(priceA, priceB);
}
