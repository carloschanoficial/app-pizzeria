import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Product,
  Category,
  ExtraIngredient,
} from '@/types';
import { AdminProducts } from '@/components/admin/AdminProducts';
import { AdminExtras } from '@/components/admin/AdminExtras';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminBanners } from '@/components/admin/AdminBanners';
import { AdminCustomers } from '@/components/admin/AdminCustomers';
import { AdminSubscriptions } from '@/components/admin/AdminSubscriptions';
import { AdminCoupons } from '@/components/admin/AdminCoupons';
import { AdminPlans } from '@/components/admin/AdminPlans';
import { AdminPaymentInfo } from '@/components/admin/AdminPaymentInfo';
import { AdminPlanRequests } from '@/components/admin/AdminPlanRequests';
import { AdminCashRegister } from '@/components/admin/AdminCashRegister';
import { AdminOrders } from '@/components/admin/AdminOrders';
import { getLoyaltyStampsRequired } from '@/lib/loyaltyRules';
import { InstallAppButton } from '@/components/InstallAppButton';
import type { InstallPromptState } from '@/hooks/useInstallPrompt';
import { ArrowLeft, Pizza, Tag, Settings, Image, Users, LogOut, CreditCard, Wallet, ClipboardList } from 'lucide-react';

interface AdminPanelProps {
  isSuperAdmin: boolean;
  onExit: () => void;
  install: InstallPromptState;
}

type AdminTab = 'productos' | 'extras' | 'banners' | 'pedidos' | 'clientes' | 'config' | 'suscripciones' | 'caja';

export function AdminPanel({ isSuperAdmin, onExit, install }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>('productos');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [extras, setExtras] = useState<ExtraIngredient[]>([]);
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [prodRes, catRes, extRes, setRes] = await Promise.all([
      supabase.from('products').select('*').order('sort_order', { ascending: true }),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('extra_ingredients').select('*').order('sort_order', { ascending: true }),
      supabase.from('store_settings').select('*'),
    ]);

    setProducts(prodRes.data as Product[] || []);
    setCategories(catRes.data as Category[] || []);
    setExtras(extRes.data as ExtraIngredient[] || []);

    if (setRes.data) {
      const obj: Record<string, string> = {};
      setRes.data.forEach((row) => { obj[row.key] = row.value; });
      setSettings(obj);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const TABS: { key: AdminTab; label: string; icon: typeof Pizza }[] = [
    { key: 'productos', label: 'Productos', icon: Pizza },
    { key: 'extras', label: 'Ingredientes', icon: Tag },
    { key: 'banners', label: 'Banners', icon: Image },
    { key: 'pedidos', label: 'Pedidos', icon: ClipboardList },
    { key: 'clientes', label: 'Clientes', icon: Users },
    { key: 'config', label: 'Config', icon: Settings },
    { key: 'caja', label: 'Corte de Caja', icon: Wallet },
    ...(isSuperAdmin
      ? [{ key: 'suscripciones' as const, label: 'Suscripciones', icon: CreditCard }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={onExit}
          className="rounded-full bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
          aria-label="Salir"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-black text-gray-900">
          Panel de Administración
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <InstallAppButton install={install} variant="header" />
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-full bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex min-w-[88px] flex-1 shrink-0 flex-col items-center gap-1 py-3 transition ${
                active ? 'text-red-600' : 'text-gray-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{t.label}</span>
              {active && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-red-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
          </div>
        ) : tab === 'productos' ? (
          <AdminProducts
            products={products}
            categories={categories}
            onChanged={fetchAll}
          />
        ) : tab === 'extras' ? (
          <AdminExtras extras={extras} onChanged={fetchAll} />
        ) : tab === 'banners' ? (
          <AdminBanners onChanged={fetchAll} />
        ) : tab === 'pedidos' ? (
          <AdminOrders />
        ) : tab === 'clientes' ? (
          <AdminCustomers onChanged={fetchAll} rewardName={settings?.loyalty_reward_name || 'Pizza Chica Hawaiana GRATIS'} stampsRequired={getLoyaltyStampsRequired(settings)} />
        ) : tab === 'suscripciones' && isSuperAdmin ? (
          <>
            <AdminSubscriptions />
            <AdminPlanRequests />
          </>
        ) : tab === 'caja' ? (
          <AdminCashRegister />
        ) : (
          <>
            <AdminSettings settings={settings} onChanged={fetchAll} />
            {isSuperAdmin && (
              <div className="space-y-5 px-4 pb-6">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <AdminCoupons />
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <AdminPlans />
                </div>
                {settings && (
                  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                    <AdminPaymentInfo settings={settings} onChanged={fetchAll} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
