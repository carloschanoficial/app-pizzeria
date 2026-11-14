import { useState, type FormEvent } from 'react';
import { Download, Wallet, X } from 'lucide-react';
import { useCashRegister } from '@/hooks/useCashRegister';
import { formatPriceDecimal } from '@/lib/format';
import { calculateCashDifference, calculateExpectedCash, countTotal, type CashCount } from '@/lib/cashCount';
import { buildShiftReportPdf } from '@/lib/shiftReportPdf';
import type { CashRegisterShift } from '@/types';
import { CashRegisterExpenses } from '@/components/admin/CashRegisterExpenses';
import { CashRegisterSalesBreakdown } from '@/components/admin/CashRegisterSalesBreakdown';
import { CashRegisterCountForm } from '@/components/admin/CashRegisterCountForm';

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
  const [count, setCount] = useState<CashCount>({});

  const isOpen = shift !== null;
  const expensesTotal = Math.round(expenses.reduce((sum, expense) => sum + expense.amount, 0) * 100) / 100;
  const expectedCash = shift ? calculateExpectedCash(shift.opening_float, shift.cash_sales, expensesTotal) : 0;
  const countedCash = countTotal(count);
  const isBalanced = calculateCashDifference(countedCash, expectedCash) === 0;

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

  const downloadReport = (report: CashRegisterShift) => {
    const url = URL.createObjectURL(buildShiftReportPdf(report, expenses, salesByType));
    const link = document.createElement('a');
    link.href = url;
    link.download = `corte-de-caja-${report.opened_at.slice(0, 10)}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadOpenReport = () => {
    if (!shift || !isBalanced) return;
    downloadReport({
      ...shift,
      cash_count: count,
      counted_cash: countedCash,
      expected_cash: expectedCash,
      cash_difference: 0,
    });
  };

  const handleClose = async () => {
    setSaving(true);
    const closed = await closeShift(count);
    setSaving(false);
    if (closed) {
      setConfirmingClose(false);
      setCount({});
      downloadReport(closed);
    }
  };

  const cancelClose = () => {
    setConfirmingClose(false);
  };

  return (
    <div className="space-y-5 px-4 pb-6">
      {isOpen && confirmingClose && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={saving ? undefined : cancelClose} />
          <div className="relative w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Confirmar cierre de caja</h3>
              <button
                type="button"
                onClick={cancelClose}
                disabled={saving}
                aria-label="Cerrar"
                className="rounded-full bg-gray-100 p-1.5 text-gray-500 transition hover:bg-gray-200 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="mt-4 space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Efectivo esperado</dt>
                <dd className="font-semibold text-gray-900">{formatPriceDecimal(expectedCash)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Efectivo contado</dt>
                <dd className="font-semibold text-gray-900">{formatPriceDecimal(countedCash)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-green-50 p-3">
                <dt className="font-bold text-green-700">Caja cuadrada</dt>
                <dd className="text-lg font-black text-green-700">
                  {formatPriceDecimal(calculateCashDifference(countedCash, expectedCash))}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-gray-500">Al confirmar, el turno se cerrará y se descargará el reporte PDF.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={cancelClose}
                disabled={saving}
                className="rounded-full bg-white py-3 text-sm font-bold text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={saving || !isBalanced}
                className="rounded-full bg-red-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-red-600 disabled:active:scale-100"
              >
                {saving ? 'Cerrando...' : 'Confirmar cierre'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          <CashRegisterCountForm expectedCash={expectedCash} count={count} onChange={setCount} />
        )}

        {!loading && isOpen && !isBalanced && (
          <p className="mt-3 text-center text-xs font-semibold text-red-600">
            Para cerrar la caja y descargar el reporte, el efectivo contado debe coincidir exactamente con el esperado.
          </p>
        )}

        {!loading && isOpen && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadOpenReport}
              disabled={!isBalanced}
              className="flex items-center justify-center gap-2 rounded-full bg-gray-100 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-200 active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-gray-100 disabled:active:scale-100"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </button>
            <button
              type="button"
              onClick={() => setConfirmingClose(true)}
              disabled={!isBalanced}
              className="rounded-full bg-red-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-red-600 disabled:active:scale-100"
            >
              Cerrar caja
            </button>
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
