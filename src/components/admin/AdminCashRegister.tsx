import { useState, type FormEvent } from 'react';
import { Download, Wallet, X } from 'lucide-react';
import { useCashRegister } from '@/hooks/useCashRegister';
import { formatPriceDecimal } from '@/lib/format';
import { buildShiftReportPdf } from '@/lib/shiftReportPdf';
import { CashRegisterExpenses } from '@/components/admin/CashRegisterExpenses';
import { CashRegisterSalesBreakdown } from '@/components/admin/CashRegisterSalesBreakdown';

function formatOpenedAt(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminCashRegister() {
  const { shift, expenses, salesByType, loading, error, openShift, addExpense, closeShift } = useCashRegister();
  const [showForm, setShowForm] = useState(false);
  const [floatInput, setFloatInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);

  const isOpen = shift !== null;
  const expensesTotal = Math.round(expenses.reduce((sum, expense) => sum + expense.amount, 0) * 100) / 100;
  const expectedCash = shift
    ? Math.round((shift.opening_float + shift.cash_sales - expensesTotal) * 100) / 100
    : 0;

  const handleOpen = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const ok = await openShift(Number(floatInput));
    setSaving(false);
    if (ok) {
      setShowForm(false);
      setFloatInput('');
    }
  };

  const handleClose = async () => {
    setSaving(true);
    const ok = await closeShift();
    setSaving(false);
    if (ok) setConfirmingClose(false);
  };

  const handleDownloadReport = () => {
    if (!shift) return;
    const url = URL.createObjectURL(buildShiftReportPdf(shift, expenses, salesByType));
    const link = document.createElement('a');
    link.href = url;
    link.download = `corte-de-caja-${shift.opened_at.slice(0, 10)}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-5 px-4 pb-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-2 text-red-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">Corte de Caja</h2>
              <p className="text-xs text-gray-500">Controla el efectivo de tu turno.</p>
            </div>
          </div>
          {!loading && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
          </div>
        ) : isOpen ? (
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <dt className="text-xs font-semibold text-gray-500">Fondo inicial</dt>
              <dd className="mt-1 text-lg font-black text-gray-900">{formatPriceDecimal(shift.opening_float)}</dd>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <dt className="text-xs font-semibold text-gray-500">Ventas en efectivo</dt>
              <dd className="mt-1 text-lg font-black text-gray-900">{formatPriceDecimal(shift.cash_sales)}</dd>
            </div>
            <div className="col-span-2 rounded-xl bg-red-50 p-3">
              <dt className="text-xs font-semibold text-red-700">Efectivo esperado al cerrar</dt>
              <dd className="mt-1 text-lg font-black text-red-700">{formatPriceDecimal(expectedCash)}</dd>
            </div>
            <p className="col-span-2 text-xs text-gray-500">
              Abierto desde {formatOpenedAt(shift.opened_at)}
            </p>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-gray-600">No hay un turno abierto en este momento.</p>
        )}

        {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}

        {!loading && isOpen && (
          <CashRegisterSalesBreakdown sales={salesByType} />
        )}

        {!loading && isOpen && (
          <CashRegisterExpenses expenses={expenses} total={expensesTotal} onAdd={addExpense} />
        )}

        {!loading && isOpen && (
          <button
            type="button"
            onClick={handleDownloadReport}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gray-100 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-200 active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            Descargar reporte PDF
          </button>
        )}

        {!loading && isOpen && !confirmingClose && (
          <button
            type="button"
            onClick={() => setConfirmingClose(true)}
            className="mt-4 w-full rounded-full border-2 border-red-600 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 active:scale-[0.98]"
          >
            Cerrar caja
          </button>
        )}

        {isOpen && confirmingClose && (
          <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              Se cerrará el turno con <span className="font-bold">{formatPriceDecimal(expectedCash)}</span> de efectivo esperado. ¿Confirmas?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmingClose(false)}
                disabled={saving}
                className="rounded-full bg-white py-3 text-sm font-bold text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="rounded-full bg-red-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? 'Cerrando...' : 'Confirmar cierre'}
              </button>
            </div>
          </div>
        )}

        {!loading && !isOpen && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 w-full rounded-full bg-red-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98]"
          >
            Abrir Caja
          </button>
        )}

        {showForm && (
          <form onSubmit={handleOpen} className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <label htmlFor="cash-float" className="text-xs font-bold text-gray-700">
                Fondo inicial en efectivo
              </label>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full bg-white p-1 text-gray-500 transition hover:bg-gray-200"
                aria-label="Cancelar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              id="cash-float"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              value={floatInput}
              onChange={(e) => setFloatInput(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-red-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Abriendo...' : 'Confirmar apertura'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
