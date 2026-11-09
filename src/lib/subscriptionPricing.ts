export function formatPlanPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });
}

export function computePlanPricing(
  precio: number | string,
  precioOriginal: number | string | null,
  descuento: number | string,
) {
  const original = precioOriginal === null || precioOriginal === '' ? null : Number(precioOriginal);
  const base = original !== null && original > 0 ? original : Number(precio);
  const discount = Math.min(Math.max(Number(descuento) || 0, 0), 100);
  const final = Math.round(base * (1 - discount / 100) * 100) / 100;
  return { base, discount, final };
}
