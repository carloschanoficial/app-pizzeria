export const CASH_DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1] as const;

export type CashCount = Record<string, number>;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function countTotal(count: CashCount): number {
  return roundMoney(
    CASH_DENOMINATIONS.reduce((sum, denomination) => sum + denomination * (count[String(denomination)] ?? 0), 0),
  );
}

export function calculateExpectedCash(openingFloat: number, cashSales: number, expensesTotal: number): number {
  return roundMoney(openingFloat + cashSales - expensesTotal);
}

export function calculateCashDifference(countedCash: number, expectedCash: number): number {
  return roundMoney(countedCash - expectedCash);
}
