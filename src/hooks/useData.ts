import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { canRedeemBalance, type WalletRules } from '@/lib/loyaltyRules';
import type {
  Product,
  Category,
  ExtraIngredient,
  StoreSettings,
  PromoBanner,
  VirtualWallet,
} from '@/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (error) setError(error.message);
      else setProducts(data as Product[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (data) setCategories(data as Category[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading };
}

export function useExtraIngredients() {
  const [extras, setExtras] = useState<ExtraIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('extra_ingredients')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (data) setExtras(data as ExtraIngredient[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { extras, loading };
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('store_settings').select('*');
      if (cancelled) return;
      if (data) {
        const obj: Record<string, string> = {};
        data.forEach((row) => {
          obj[row.key] = row.value;
        });
        setSettings(obj as unknown as StoreSettings);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}

export function usePromoBanners() {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('promo_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (data) setBanners(data as PromoBanner[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { banners, loading };
}

export function useLoyaltyCard(phone: string | null) {
  const [card, setCard] = useState<{
    stamps: number;
    reward_claimed: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!phone) {
        setCard(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('customer_phone', phone)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        const row = data as {
          stamps: number;
          reward_claimed: boolean;
          last_stamp_at: string | null;
          customer_phone: string;
        };
        const now = Date.now();
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const lastStampMs = row.last_stamp_at ? new Date(row.last_stamp_at).getTime() : 0;
        if (row.stamps > 0 && now - lastStampMs > THIRTY_DAYS_MS) {
          // Sellos expirados — reset in DB
          await supabase
            .from('loyalty_cards')
            .update({ stamps: 0, reward_claimed: false })
            .eq('customer_phone', row.customer_phone);
          setCard({ stamps: 0, reward_claimed: false });
        } else {
          setCard({
            stamps: row.stamps,
            reward_claimed: row.reward_claimed,
          });
        }
      } else {
        setCard({ stamps: 0, reward_claimed: false });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [phone, refreshKey]);

  return { card, loading, refetch };
}

const WALLET_INACTIVITY_MS = 30 * 24 * 60 * 60 * 1000;

export function useWallet(phone: string | null, rules: WalletRules) {
  const [wallet, setWallet] = useState<VirtualWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!phone) {
        setWallet(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('virtual_wallets')
        .select('*')
        .eq('customer_phone', phone)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        const row = data as VirtualWallet;
        const lastActivityMs = new Date(row.last_credited_at ?? row.created_at).getTime();
        if (Number(row.balance) > 0 && Date.now() - lastActivityMs > WALLET_INACTIVITY_MS) {
          const { error } = await supabase
            .from('virtual_wallets')
            .update({ balance: 0 })
            .eq('customer_phone', phone);
          setWallet(error ? row : { ...row, balance: 0 });
        } else {
          setWallet(row);
        }
      } else {
        setWallet(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [phone, refreshKey]);

  const canRedeem = wallet ? canRedeemBalance(Number(wallet.balance), rules) : false;

  return { wallet, loading, refetch, canRedeem, threshold: rules.redeemThreshold, cashback: rules.cashbackPerOrder };
}
