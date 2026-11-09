import { Home, UtensilsCrossed, Tag, ClipboardList, User } from 'lucide-react';

export type TabKey = 'inicio' | 'menu' | 'ofertas' | 'pedidos' | 'perfil';

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'inicio', label: 'Inicio', icon: Home },
  { key: 'menu', label: 'Menú', icon: UtensilsCrossed },
  { key: 'ofertas', label: 'Ofertas', icon: Tag },
  { key: 'pedidos', label: 'Mis Pedidos', icon: ClipboardList },
  { key: 'perfil', label: 'Perfil', icon: User },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto flex max-w-md items-center justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5 transition"
            >
              <Icon
                className={`h-5 w-5 transition-colors ${
                  active ? 'text-red-600' : 'text-gray-400'
                }`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? 'text-red-600' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
