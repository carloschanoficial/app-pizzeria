import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { CartItem, StoreSettings, OrderType } from '@/types';

interface StoreContextValue {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  deliveryCost: number;
  cartTotal: number;
  settings: StoreSettings | null;
  setSettings: (s: StoreSettings | null) => void;
  orderType: OrderType;
  setOrderType: (t: OrderType) => void;
  customerPhone: string;
  setCustomerPhone: (p: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('domicilio');
  const [customerPhone, setCustomerPhone] = useState<string>(
    localStorage.getItem('pm_customer_phone') || '',
  );

  const handleSetCustomerPhone = useCallback((p: string) => {
    setCustomerPhone(p);
    localStorage.setItem('pm_customer_phone', p);
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      if (item.is_free_reward) {
        const existing = prev.find((c) => c.is_free_reward);
        if (existing) {
          return prev.map((c) =>
            c.is_free_reward ? { ...c, quantity: c.quantity + item.quantity } : c,
          );
        }
        return [...prev, item];
      }
      const existingIdx = prev.findIndex(
        (c) =>
          !c.is_free_reward &&
          c.product_id === item.product_id &&
          c.size === item.size &&
          c.notes === item.notes &&
          c.is_half_half === item.is_half_half &&
          c.half_product_name === item.half_product_name &&
          JSON.stringify(c.extras) === JSON.stringify(item.extras),
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + item.quantity,
        };
        return updated;
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === itemId ? { ...c, quantity: c.quantity + delta } : c,
        )
        .filter((c) => c.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = useMemo(
    () => cart.reduce((sum, c) => sum + c.quantity, 0),
    [cart],
  );

  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (sum, c) =>
          sum +
          (c.is_free_reward
            ? 0
            : c.unit_price *
              c.quantity *
              (1 - (c.discount_percent || 0) / 100)),
        0,
      ),
    [cart],
  );

  const deliveryCost = useMemo(() => {
    if (!settings) return 0;
    if (cart.length === 0) return 0;
    if (orderType !== 'domicilio') return 0;
    const cost = parseFloat(settings.delivery_cost) || 0;
    return cost;
  }, [settings, cart.length, orderType]);

  const cartTotal = useMemo(
    () => cartSubtotal + deliveryCost,
    [cartSubtotal, deliveryCost],
  );

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartSubtotal,
      deliveryCost,
      cartTotal,
      settings,
      setSettings,
      orderType,
      setOrderType,
      customerPhone,
      setCustomerPhone: handleSetCustomerPhone,
    }),
    [
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartSubtotal,
      deliveryCost,
      cartTotal,
      settings,
      orderType,
      customerPhone,
      handleSetCustomerPhone,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
