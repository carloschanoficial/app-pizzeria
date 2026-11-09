import { LayoutGrid, List } from 'lucide-react';

export type ProductViewMode = 'grid' | 'list';

interface ViewModeToggleProps {
  value: ProductViewMode;
  onChange: (mode: ProductViewMode) => void;
}

const OPTIONS: { mode: ProductViewMode; label: string; icon: typeof List }[] = [
  { mode: 'grid', label: 'Vista de cuadrícula', icon: LayoutGrid },
  { mode: 'list', label: 'Vista de lista', icon: List },
];

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-white p-0.5 ring-1 ring-gray-200">
      {OPTIONS.map(({ mode, label, icon: Icon }) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-label={label}
            aria-pressed={active}
            className={`flex h-7 w-8 items-center justify-center rounded-full transition ${
              active ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
