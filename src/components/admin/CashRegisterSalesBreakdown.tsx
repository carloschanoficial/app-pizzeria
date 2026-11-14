import { Bike, Store, Truck, UtensilsCrossed } from 'lucide-react';
import type { ShiftSalesByType } from '@/types';
import { formatPriceDecimal } from '@/lib/format';

const SALES_ROWS = [
  { key: 'domicilio', label: 'A Domicilio', icon: Truck },
  { key: 'recoger', label: 'Para Recoger', icon: Store },
  { key: 'comedor', label: 'Comedor', icon: UtensilsCrossed },
] as const;

interface CashRegisterSalesBreakdownProps {
  sales: ShiftSalesByType;
}

export function CashRegisterSalesBreakdown({ sales }: CashRegisterSalesBreakdownProps) {
  const total = Math.round((sales.domicilio + sales.recoger + sales.comedor) * 100) / 100;

  return (
    <div className="mt-4 rounded-xl bg-gray-50 p-4">
      <h3 className="text-sm font-bold text-gray-900">Ventas por tipo de pedido</h3>
      <ul className="mt-3 divide-y divide-gray-200">
        {SALES_ROWS.map(({ key, label, icon: Icon }) => (
          <li key={key} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="flex items-center gap-2 text-gray-800">
              <Icon className="h-4 w-4 text-gray-500" />
              {label}
            </span>
            <span className="font-semibold text-gray-900">{formatPriceDecimal(sales[key])}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-sm">
        <span className="font-semibold text-gray-700">Total de ventas</span>
        <span className="font-black text-gray-900">{formatPriceDecimal(total)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-white p-3 text-sm ring-1 ring-gray-200">
        <div>
          <span className="flex items-center gap-2 font-semibold text-gray-800">
            <Bike className="h-4 w-4 text-gray-500" />
            Cobros por envío
          </span>
          <p className="mt-0.5 text-xs text-gray-500">No incluido en el total de ventas</p>
        </div>
        <span className="font-black text-gray-900">{formatPriceDecimal(sales.deliveryFees)}</span>
      </div>
    </div>
  );
}
