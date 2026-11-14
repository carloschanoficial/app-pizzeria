import { useState, useEffect } from 'react';
import { Users, Minus, Plus, Check, Search, Gift, RotateCcw, Clock, Wallet, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { getLoyaltyStampsRequired } from '@/lib/loyaltyRules';
import type { LoyaltyCard, Order, VirtualWallet } from '@/types';

interface AdminCustomersProps {
  onChanged: () => void;
  rewardName: string;
  stampsRequired: number;
}

interface CustomerWithStats extends LoyaltyCard {
  customer_name: string | null;
  total_orders: number;
  wallet_balance: number;
}

export function AdminCustomers({ onChanged, rewardName, stampsRequired }: AdminCustomersProps) {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStamps, setEditStamps] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [walletDraft, setWalletDraft] = useState('');
  const [walletError, setWalletError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    const [cardsRes, ordersRes, walletsRes] = await Promise.all([
      supabase.from('loyalty_cards').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('customer_phone, customer_name'),
      supabase.from('virtual_wallets').select('*'),
    ]);

    const cards = (cardsRes.data || []) as LoyaltyCard[];
    const orders = (ordersRes.data || []) as { customer_phone: string | null; customer_name: string | null }[];
    const wallets = (walletsRes.data || []) as VirtualWallet[];

    const walletByPhone: Record<string, number> = {};
    wallets.forEach((w) => {
      walletByPhone[w.customer_phone] = Number(w.balance);
    });

    const orderCounts: Record<string, { count: number; name: string | null }> = {};
    orders.forEach((o) => {
      if (!o.customer_phone) return;
      if (!orderCounts[o.customer_phone]) {
        orderCounts[o.customer_phone] = { count: 0, name: o.customer_name };
      }
      orderCounts[o.customer_phone].count += 1;
      if (!orderCounts[o.customer_phone].name && o.customer_name) {
        orderCounts[o.customer_phone].name = o.customer_name;
      }
    });

    const enriched: CustomerWithStats[] = cards.map((c) => ({
      ...c,
      customer_name: orderCounts[c.customer_phone]?.name || null,
      total_orders: orderCounts[c.customer_phone]?.count || 0,
      wallet_balance: walletByPhone[c.customer_phone] ?? 0,
    }));

    setCustomers(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (customerId: string) => {
    if (!confirm('¿Eliminar este cliente de la lista de lealtad? Esta acción no se puede deshacer.')) return;
    const { error } = await supabase.from('loyalty_cards').delete().eq('id', customerId);
    if (error) {
      window.alert('No se pudo eliminar al cliente. Intenta de nuevo.');
      return;
    }
    fetchCustomers();
    onChanged();
  };

  const handleSave = async (customerId: string) => {
    setSaving(true);
    const clamped = Math.max(0, Math.min(50, editStamps));
    await supabase
      .from('loyalty_cards')
      .update({ stamps: clamped, reward_claimed: false })
      .eq('id', customerId);
    setSaving(false);
    setEditingId(null);
    setSavedId(customerId);
    setTimeout(() => setSavedId(null), 1500);
    fetchCustomers();
    onChanged();
  };

  const handleReset = async (customerId: string) => {
    if (!confirm('¿Reiniciar los sellos de este cliente a 0?')) return;
    await supabase
      .from('loyalty_cards')
      .update({ stamps: 0, reward_claimed: false })
      .eq('id', customerId);
    fetchCustomers();
    onChanged();
  };

  const handleWalletSave = async (customerPhone: string, amount: number) => {
    const rounded = Math.round(amount * 100) / 100;
    if (!Number.isFinite(rounded) || rounded < 0) {
      setWalletError('Ingresa una cantidad válida, mayor o igual a 0.');
      return;
    }
    setSaving(true);
    setWalletError(null);
    const { error } = await supabase
      .from('virtual_wallets')
      .upsert({ customer_phone: customerPhone, balance: rounded }, { onConflict: 'customer_phone' });
    setSaving(false);
    if (error) {
      setWalletError('No se pudo guardar el saldo. Intenta de nuevo.');
      return;
    }
    setEditingWalletId(null);
    fetchCustomers();
    onChanged();
  };

  const handleWalletReset = async (customerPhone: string) => {
    if (!confirm('¿Vaciar la Olla de Dinero de este cliente?')) return;
    await handleWalletSave(customerPhone, 0);
  };

  const filtered = customers.filter(
    (c) =>
      c.customer_phone.includes(search) ||
      (c.customer_name || '').toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-red-600" />
        <h2 className="text-lg font-black text-gray-900">Clientes y Lealtad</h2>
      </div>

      <p className="text-xs text-gray-400">
        Administra los sellos de la tarjeta de lealtad y el saldo de la Olla de Dinero de cada cliente.
        Al completar {stampsRequired} sellos, el cliente puede reclamar: <span className="font-bold text-red-600">{rewardName}</span>.
        Los sellos expiran si pasan 30 días sin nuevos pedidos.
      </p>

      {walletError && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{walletError}</p>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por teléfono o nombre..."
          className="w-full rounded-xl border-2 border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-bold text-gray-700">
            {customers.length === 0 ? 'No hay clientes registrados' : 'Sin resultados'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {customers.length === 0
              ? 'Los clientes aparecerán aquí al hacer su primer pedido'
              : 'Prueba con otro término de búsqueda'}
          </p>
        </div>
      ) : (
        filtered.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-gray-900">
                  {c.customer_name || 'Cliente sin nombre'}
                </h3>
                <p className="text-xs text-gray-400">{c.customer_phone}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {c.total_orders} pedido{c.total_orders !== 1 ? 's' : ''} realizado{c.total_orders !== 1 ? 's' : ''}
                </p>
                {c.last_order_at && (
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="h-3 w-3" />
                    Último: {new Date(c.last_order_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              {savedId === c.id && (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                  <Check className="h-3 w-3" />
                  Guardado
                </span>
              )}
              <button
                onClick={() => handleDelete(c.id)}
                aria-label="Eliminar cliente"
                className="ml-2 flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Sellos editor */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-red-600" />
                <span className="text-xs font-bold text-gray-700">Sellos</span>
              </div>

              {editingId === c.id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditStamps((s) => Math.max(0, s - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm transition active:scale-90 hover:bg-gray-100"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={editStamps}
                    onChange={(e) => setEditStamps(Math.max(0, Math.min(50, Math.trunc(Number(e.target.value) || 0))))}
                    aria-label="Sellos"
                    className="w-12 rounded-lg border-2 border-gray-200 py-1 text-center text-sm font-black text-gray-900 outline-none focus:border-red-500"
                  />
                  <span className="text-xs font-bold text-gray-500">/{stampsRequired}</span>
                  <button
                    onClick={() => setEditStamps((s) => Math.min(50, s + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition active:scale-90 hover:bg-red-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleSave(c.id)}
                    disabled={saving}
                    className="ml-1 flex h-7 items-center gap-1 rounded-full bg-green-600 px-3 text-xs font-bold text-white transition active:scale-95 hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    OK
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {Array.from({ length: stampsRequired }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-5 w-5 rounded ${
                          i < c.stamps ? 'bg-red-600' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-700">{c.stamps}/{stampsRequired}</span>
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setEditStamps(c.stamps);
                    }}
                    className="rounded-lg bg-gray-200 px-2.5 py-1 text-[11px] font-bold text-gray-700 transition hover:bg-gray-300"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleReset(c.id)}
                    className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-500 transition hover:bg-gray-200"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Olla de Dinero editor */}
            <div className="mt-2 flex items-center justify-between rounded-xl bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-red-600" />
                <span className="text-xs font-bold text-gray-700">Olla de Dinero</span>
              </div>

              {editingWalletId === c.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={walletDraft}
                    onChange={(e) => setWalletDraft(e.target.value)}
                    aria-label="Saldo de la Olla de Dinero"
                    className="w-24 rounded-lg border-2 border-gray-200 px-2 py-1 text-right text-sm font-bold text-gray-900 outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => handleWalletSave(c.customer_phone, Number(walletDraft))}
                    disabled={saving || walletDraft.trim() === ''}
                    className="ml-1 flex h-7 items-center gap-1 rounded-full bg-green-600 px-3 text-xs font-bold text-white transition active:scale-95 hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    OK
                  </button>
                  <button
                    onClick={() => {
                      setEditingWalletId(null);
                      setWalletError(null);
                    }}
                    className="rounded-lg bg-gray-200 px-2 py-1 text-[11px] font-bold text-gray-700 transition hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-gray-900">{formatPrice(c.wallet_balance)}</span>
                  <button
                    onClick={() => {
                      setEditingWalletId(c.id);
                      setWalletDraft(String(c.wallet_balance));
                      setWalletError(null);
                    }}
                    className="rounded-lg bg-gray-200 px-2.5 py-1 text-[11px] font-bold text-gray-700 transition hover:bg-gray-300"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleWalletReset(c.customer_phone)}
                    disabled={saving || c.wallet_balance === 0}
                    className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-500 transition hover:bg-gray-200 disabled:opacity-40"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            {c.reward_claimed && (
              <p className="mt-2 text-[11px] font-bold text-green-600">
                Premio reclamado - acumulando nuevamente
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
