import { Calculator } from 'lucide-react';
import { CASH_DENOMINATIONS, calculateCashDifference, countTotal, type CashCount } from '@/lib/cashCount';
import { formatPriceDecimal } from '@/lib/format';

interface CashRegisterCountFormProps {
  expectedCash: number;
  count: CashCount;
  onChange: (count: CashCount) => void;
}

function parseCount(raw: string): number {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function CashRegisterCountForm({ expectedCash, count, onChange }: CashRegisterCountFormProps) {
  const countedCash = countTotal(count);
  const difference = calculateCashDifference(countedCash, expectedCash);
  const hasShortage = difference < 0;
  const hasSurplus = difference > 0;

  const updateDenomination = (denomination: number, raw: string) => {
    onChange({ ...count, [String(denomination)]: parseCount(raw) });
  };

  return (
    <div className="mt-4 space-y-4 rounded-xl bg-gray-50 p-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-bold text-gray-900">Arqueo de efectivo</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CASH_DENOMINATIONS.map((denomination) => {
          const key = String(denomination);
          const quantity = count[key] ?? 0;
          return (
            <label key={key} className="flex items-center gap-2 rounded-xl bg-white p-2 ring-1 ring-gray-200">
              <span className="w-14 shrink-0 text-xs font-bold text-gray-700">
                {formatPriceDecimal(denomination)}
              </span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                aria-label={`Cantidad de ${formatPriceDecimal(denomination)}`}
                value={quantity === 0 ? '' : quantity}
                placeholder="0"
                onChange={(e) => updateDenomination(denomination, e.target.value)}
                className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none transition focus:border-red-500"
              />
              <span className="w-16 shrink-0 text-right text-xs font-semibold text-gray-500">
                {formatPriceDecimal(denomination * quantity)}
              </span>
            </label>
          );
        })}
      </div>

      <dl className="space-y-2 border-t border-gray-200 pt-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-gray-600">Efectivo esperado</dt>
          <dd className="font-semibold text-gray-900">{formatPriceDecimal(expectedCash)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-600">Efectivo físico contado</dt>
          <dd className="font-semibold text-gray-900">{formatPriceDecimal(countedCash)}</dd>
        </div>
        <div
          className={`flex items-center justify-between rounded-xl p-3 ${
            hasShortage ? 'bg-red-50' : hasSurplus ? 'bg-green-50' : 'bg-gray-100'
          }`}
        >
          <dt
            className={`text-sm font-bold ${
              hasShortage ? 'text-red-700' : hasSurplus ? 'text-green-700' : 'text-gray-700'
            }`}
          >
            {hasShortage ? 'Faltante' : hasSurplus ? 'Sobrante' : 'Caja cuadrada'}
          </dt>
          <dd
            className={`text-lg font-black ${
              hasShortage ? 'text-red-700' : hasSurplus ? 'text-green-700' : 'text-gray-900'
            }`}
          >
            {formatPriceDecimal(Math.abs(difference))}
          </dd>
        </div>
      </dl>
    </div>
  );
}
