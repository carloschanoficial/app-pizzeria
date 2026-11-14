import type { CashRegisterExpense, CashRegisterShift, ShiftSalesByType } from '@/types';
import { formatPriceDecimal } from '@/lib/format';
import {
  CASH_DENOMINATIONS,
  CENTAVOS_KEY,
  calculateCashDifference,
  calculateExpectedCash,
  countTotal,
} from '@/lib/cashCount';

type ReportRow = [label: string, value: string];

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

function escapePdfText(value: string): string {
  return value
    .replace(/[^\x20-\xff]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildContentStream(title: string, rows: ReportRow[]): string {
  const ops = ['BT', '/F2 20 Tf', '50 740 Td', `(${escapePdfText(title)}) Tj`, 'ET'];
  let y = 690;
  const step = Math.min(32, 600 / Math.max(rows.length, 1));
  for (const [label, value] of rows) {
    ops.push('BT', '/F1 12 Tf', `50 ${y} Td`, `(${escapePdfText(label)}) Tj`, 'ET');
    ops.push('BT', '/F2 12 Tf', `300 ${y} Td`, `(${escapePdfText(value)}) Tj`, 'ET');
    y -= step;
  }
  return ops.join('\n');
}

function assemblePdf(content: string): Uint8Array {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Uint8Array.from(pdf, (char) => char.charCodeAt(0));
}

const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

function buildCountRows(shift: CashRegisterShift, expectedCash: number): ReportRow[] {
  if (shift.cash_count === null || shift.counted_cash === null) {
    return [['Efectivo físico contado', 'Pendiente de arqueo']];
  }
  const countedCash = countTotal(shift.cash_count);
  const difference = calculateCashDifference(countedCash, expectedCash);
  const denominationRows: ReportRow[] = CASH_DENOMINATIONS.filter(
    (denomination) => (shift.cash_count?.[String(denomination)] ?? 0) > 0,
  ).map((denomination) => {
    const quantity = shift.cash_count?.[String(denomination)] ?? 0;
    return [
      `Billetes y monedas ${formatPriceDecimal(denomination)} x ${quantity}`,
      formatPriceDecimal(denomination * quantity),
    ];
  });
  const centavos = shift.cash_count[CENTAVOS_KEY] ?? 0;
  if (centavos > 0) {
    denominationRows.push([`Centavos x ${centavos}`, formatPriceDecimal(centavos / 100)]);
  }
  const differenceLabel = difference < 0 ? 'Faltante' : difference > 0 ? 'Sobrante' : 'Caja cuadrada';
  return [
    ['Arqueo de efectivo', ''],
    ...denominationRows,
    ['Efectivo físico contado', formatPriceDecimal(countedCash)],
    [
      'Diferencia final',
      difference === 0 ? differenceLabel : `${differenceLabel}: ${formatPriceDecimal(Math.abs(difference))}`,
    ],
  ];
}

export function buildShiftReportPdf(
  shift: CashRegisterShift,
  expenses: CashRegisterExpense[],
  sales: ShiftSalesByType,
): Blob {
  const expensesTotal = Math.round(expenses.reduce((sum, expense) => sum + expense.amount, 0) * 100) / 100;
  const expectedCash = calculateExpectedCash(shift.opening_float, shift.cash_sales, expensesTotal);
  const expenseRows: ReportRow[] = expenses.map((expense) => [
    `Gasto: ${expense.description}`,
    formatPriceDecimal(expense.amount),
  ]);
  const rows: ReportRow[] = [
    ['Fecha de apertura', new Date(shift.opened_at).toLocaleString('es-MX', DATE_TIME_FORMAT)],
    ['Fondo inicial', formatPriceDecimal(shift.opening_float)],
    ['Total de ventas en efectivo', formatPriceDecimal(shift.cash_sales)],
    ['Ventas a domicilio', formatPriceDecimal(sales.domicilio)],
    ['Ventas para recoger', formatPriceDecimal(sales.recoger)],
    ['Ventas en comedor', formatPriceDecimal(sales.comedor)],
    ['Total de ventas', formatPriceDecimal(sales.domicilio + sales.recoger + sales.comedor)],
    ['Cobros por envío (no incluidos en ventas)', formatPriceDecimal(sales.deliveryFees)],
    ...expenseRows,
    ['Total de gastos', formatPriceDecimal(expensesTotal)],
    ['Efectivo esperado', formatPriceDecimal(expectedCash)],
    ...buildCountRows(shift, expectedCash),
    ['Generado el', new Date().toLocaleString('es-MX', DATE_TIME_FORMAT)],
  ];
  const content = buildContentStream('Corte de Caja', rows);
  return new Blob([assemblePdf(content)], { type: 'application/pdf' });
}
