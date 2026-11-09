import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  CashRegisterExpense,
  CashRegisterShift,
  OrderType,
  ShiftSalesByType,
} from '@/types';

const EMPTY_SALES: ShiftSalesByType = { domicilio: 0, recoger: 0, comedor: 0 };

function summarizeSales(rows: { order_type: string | null; total: number }[]): ShiftSalesByType {
  const sales: ShiftSalesByType = { ...EMPTY_SALES };
  for (const row of rows) {
    if (row.order_type === 'domicilio' || row.order_type === 'recoger' || row.order_type === 'comedor') {
      sales[row.order_type as OrderType] += Number(row.total);
    }
  }
  return sales;
}

export function useCashRegister() {
  const [shift, setShift] = useState<CashRegisterShift | null>(null);
  const [expenses, setExpenses] = useState<CashRegisterExpense[]>([]);
  const [salesByType, setSalesByType] = useState<ShiftSalesByType>(EMPTY_SALES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shiftId = shift?.id ?? null;

  const fetchOpenShift = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('cash_register_shifts')
      .select('*')
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (fetchError) {
      setError('No se pudo cargar el corte de caja.');
    } else {
      setShift((data as CashRegisterShift | null) ?? null);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOpenShift();
  }, [fetchOpenShift]);

  useEffect(() => {
    if (!shiftId) {
      setExpenses([]);
      setSalesByType(EMPTY_SALES);
      return;
    }
    let active = true;
    (async () => {
      const [expensesRes, ordersRes, shiftRes] = await Promise.all([
        supabase
          .from('cash_register_expenses')
          .select('*')
          .eq('shift_id', shiftId)
          .order('created_at', { ascending: true }),
        supabase.from('orders').select('order_type,total').eq('shift_id', shiftId),
        supabase.from('cash_register_shifts').select('*').eq('id', shiftId).maybeSingle(),
      ]);
      if (!active) return;
      if (expensesRes.error || ordersRes.error || shiftRes.error) {
        setError('No se pudo cargar el detalle del turno.');
        return;
      }
      setExpenses((expensesRes.data as CashRegisterExpense[]) ?? []);
      setSalesByType(summarizeSales(ordersRes.data ?? []));
      if (shiftRes.data) setShift(shiftRes.data as CashRegisterShift);
    })();
    return () => {
      active = false;
    };
  }, [shiftId]);

  const openShift = useCallback(
    async (openingFloat: number): Promise<boolean> => {
      if (shift) {
        setError('Ya hay un corte de caja abierto.');
        return false;
      }
      const rounded = Math.round(openingFloat * 100) / 100;
      if (!Number.isFinite(rounded) || rounded < 0) {
        setError('Ingresa un fondo inicial válido, mayor o igual a 0.');
        return false;
      }
      const { data, error: insertError } = await supabase
        .from('cash_register_shifts')
        .insert({ opening_float: rounded })
        .select()
        .single();
      if (insertError || !data) {
        setError('No se pudo abrir el corte de caja. Intenta de nuevo.');
        return false;
      }
      setShift(data as CashRegisterShift);
      setError(null);
      return true;
    },
    [shift],
  );

  const addExpense = useCallback(
    async (description: string, amount: number): Promise<boolean> => {
      if (!shiftId) return false;
      const rounded = Math.round(amount * 100) / 100;
      const trimmed = description.trim();
      if (!trimmed || !Number.isFinite(rounded) || rounded <= 0) {
        setError('Ingresa una descripción y un monto mayor a 0.');
        return false;
      }
      const { data, error: insertError } = await supabase
        .from('cash_register_expenses')
        .insert({ shift_id: shiftId, description: trimmed, amount: rounded })
        .select()
        .single();
      if (insertError || !data) {
        setError('No se pudo registrar el gasto. Intenta de nuevo.');
        return false;
      }
      setExpenses((prev) => [...prev, data as CashRegisterExpense]);
      setError(null);
      return true;
    },
    [shiftId],
  );

  const closeShift = useCallback(async (): Promise<boolean> => {
    if (!shift) return false;
    const { data, error: updateError } = await supabase
      .from('cash_register_shifts')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', shift.id)
      .eq('status', 'open')
      .select('id');
    if (updateError || !data || data.length === 0) {
      setError('No se pudo cerrar el corte de caja. Intenta de nuevo.');
      return false;
    }
    setShift(null);
    setError(null);
    return true;
  }, [shift]);

  return {
    shift,
    expenses,
    salesByType,
    loading,
    error,
    openShift,
    addExpense,
    closeShift,
    refresh: fetchOpenShift,
  };
}
