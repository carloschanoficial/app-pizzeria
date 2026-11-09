import { useState, type FormEvent } from 'react';
import { Plus, Receipt } from 'lucide-react';
import type { CashRegisterExpense } from '@/types';
import { formatPriceDecimal } from '@/lib/format';

interface CashRegisterExpensesProps {
  expenses: CashRegisterExpense[];
  total: number;
  onAdd: (description: string, amount: number) => Promise<boolean>;
}

export function CashRegisterExpenses({ expenses, total, onAdd }: CashRegisterExpensesProps) {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const ok = await onAdd(description, Number(amount));
    setSaving(false);
    if (ok) {
      setDescription('');
      setAmount('');
      setShowForm(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900">Gastos del turno</h3>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-red-600 ring-1 ring-gray-200 transition hover:bg-red-50 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            Registrar gasto
          </button>
        )}
      </div>

      {expenses.length === 0 ? (
        <p className="mt-3 text-xs text-gray-500">Aún no hay gastos registrados.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-200">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-gray-800">{expense.description}</span>
              <span className="font-semibold text-gray-900">{formatPriceDecimal(expense.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-sm">
        <span className="font-semibold text-gray-700">Total de gastos</span>
        <span className="font-black text-gray-900">{formatPriceDecimal(total)}</span>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          <div className="grid grid-cols-[1fr_7rem] gap-2">
            <input
              type="text"
              aria-label="Descripción del gasto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Cebolla"
              maxLength={120}
              required
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500"
            />
            <input
              type="number"
              inputMode="decimal"
              aria-label="Monto del gasto"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={saving}
              className="rounded-full bg-white py-2.5 text-sm font-bold text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-red-600 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar gasto'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
