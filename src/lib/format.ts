export function formatPrice(value: number): string {
  return `$${value.toFixed(0)}`;
}

export function formatPriceDecimal(value: number): string {
  return `$${value.toFixed(2)}`;
}
