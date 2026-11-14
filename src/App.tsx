import { useState, useMemo, useEffect } from 'react';
import { StoreProvider, useStore } from '@/store/StoreContext';
import { TopBar } from '@/components/TopBar';
import { BottomNav, type TabKey } from '@/components/BottomNav';
import { ProductDetailSheet } from '@/components/ProductDetailSheet';
import { CartSheet } from '@/components/CartSheet';
import { CoinShower } from '@/components/CoinShower';
import { WalletSheet } from '@/components/WalletSheet';
import { AdminPanel } from '@/components/AdminPanel';
import { AdminLogin } from '@/components/AdminLogin';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { InstallAppButton } from '@/components/InstallAppButton';
import { HomePage } from '@/pages/HomePage';
import { MenuPage } from '@/pages/MenuPage';
import { OfertasPage } from '@/pages/OfertasPage';
import { PedidosPage } from '@/pages/PedidosPage';
import { PerfilPage } from '@/pages/PerfilPage';
import {
  useProducts,
  useActiveShifts,
  useCategories,
  useExtraIngredients,
  useStoreSettings,
  usePromoBanners,
  useWallet,
} from '@/hooks/useData';
import type { Product, StoreSettings } from '@/types';
import { Toast } from '@/components/Toast';
import { OfflineScreen } from '@/components/OfflineScreen';
import { getWalletRules } from '@/lib/loyaltyRules';
import { DEFAULT_BRAND_COLOR, DEFAULT_BUSINESS_NAME, applyBrandTheme } from '@/lib/brandTheme';
import { DEFAULT_BRAND_LOGO } from '@/components/BrandLogo';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(() => window.location.hash === '#admin');
  const { isAdmin, isSuperAdmin, loading: adminSessionLoading } = useAdminSession();
  const installPrompt = useInstallPrompt();
  const [toastShow, setToastShow] = useState(false);
  const [coinBurst, setCoinBurst] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const { products, loading } = useProducts();
  const { shifts } = useActiveShifts();
  const { categories } = useCategories();
  const { extras } = useExtraIngredients();
  const { settings } = useStoreSettings();
  const { banners } = usePromoBanners();
  const { cartCount, setSettings, customerPhone } = useStore();
  const settingsTyped = useMemo(
    () => (settings as unknown as StoreSettings) || null,
    [settings],
  );
  const { wallet, refetch: refetchWallet, canRedeem } = useWallet(
    customerPhone || null,
    getWalletRules(settingsTyped),
  );
  const walletBalance = wallet ? Number(wallet.balance) : 0;

  useEffect(() => {
    if (settings) setSettings(settings);
  }, [settings, setSettings]);

  useEffect(() => {
    applyBrandTheme(settingsTyped?.brand_color || DEFAULT_BRAND_COLOR);
  }, [settingsTyped]);

  // Request notification permission on first load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleProductClick = (p: Product) => {
    setSelectedProduct(p);
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  if (!isOnline) {
    return <OfflineScreen onRetry={() => window.location.reload()} />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
      </div>
    );
  }

  if (adminOpen) {
    if (adminSessionLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
        </div>
      );
    }
    return isAdmin ? (
      <AdminPanel isSuperAdmin={isSuperAdmin} onExit={() => setAdminOpen(false)} install={installPrompt} />
    ) : (
      <AdminLogin onExit={() => setAdminOpen(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar
        businessName={settingsTyped?.business_name || DEFAULT_BUSINESS_NAME}
        logo={settingsTyped?.brand_logo || DEFAULT_BRAND_LOGO}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
        walletBalance={walletBalance}
        canRedeem={canRedeem}
        onWalletClick={() => setWalletOpen(true)}
      />

      <main className="mx-auto max-w-md px-4 pb-28 pt-32" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        {activeTab === 'inicio' && (
          <HomePage
            products={products}
            categories={categories}
            shifts={shifts}
            settings={settingsTyped}
            banners={banners}
            searchQuery={searchQuery}
            onProductClick={handleProductClick}
            onTabChange={handleTabChange}
          />
        )}
        {activeTab === 'menu' && (
          <MenuPage
            products={products}
            shifts={shifts}
            settings={settingsTyped}
            searchQuery={searchQuery}
            onProductClick={handleProductClick}
            onHalfHalfAdded={() => setToastShow(true)}
          />
        )}
        {activeTab === 'ofertas' && (
          <OfertasPage
            products={products}
            onProductClick={handleProductClick}
          />
        )}
        {activeTab === 'pedidos' && <PedidosPage />}
        {activeTab === 'perfil' && (
          <PerfilPage
            settings={settingsTyped}
            isAdmin={isAdmin}
            onAdminClick={() => setAdminOpen(true)}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      <InstallAppButton install={installPrompt} variant="floating" />

      {selectedProduct && (
        <ProductDetailSheet
          product={selectedProduct}
          extras={extras}
          allPizzas={products.filter((p) => p.sizes !== null && p.is_available)}
          onClose={() => setSelectedProduct(null)}
          onAdded={() => {
            setSelectedProduct(null);
            setToastShow(true);
          }}
        />
      )}

      {cartOpen && (
        <CartSheet
          onClose={() => { setCartOpen(false); refetchWallet(); }}
          onOrderPlaced={() => setCoinBurst((n) => n + 1)}
        />
      )}
      {coinBurst > 0 && <CoinShower key={coinBurst} />}
      {walletOpen && (
        <WalletSheet onClose={() => { setWalletOpen(false); refetchWallet(); }} />
      )}

      <Toast
        message="¡Producto agregado!"
        show={toastShow}
        onHide={() => setToastShow(false)}
      />
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
