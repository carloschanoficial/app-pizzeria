import {
  Award,
  Bike,
  Cake,
  ChefHat,
  Coffee,
  Crown,
  Croissant,
  Fish,
  Flame,
  Gem,
  Leaf,
  Pizza,
  Salad,
  Sandwich,
  Scissors,
  ShoppingBag,
  Star,
  Store,
  Utensils,
  Wine,
  type LucideIcon,
} from 'lucide-react';

export const BRAND_PRESET_ICONS: Record<string, LucideIcon> = {
  Pizza,
  ChefHat,
  Flame,
  Crown,
  Star,
  Utensils,
  Coffee,
  Store,
  ShoppingBag,
  Leaf,
  Croissant,
  Sandwich,
  Fish,
  Wine,
  Salad,
  Cake,
  Gem,
  Bike,
  Award,
  Scissors,
};

export const PRESET_PREFIX = 'preset:';
export const AUTO_BRAND_LOGO = 'auto';
export const DEFAULT_BRAND_LOGO = AUTO_BRAND_LOGO;

interface BrandLogoProps {
  logo: string;
  name?: string;
  className?: string;
}

export function BrandLogo({ logo, name = '', className = 'h-7 w-7' }: BrandLogoProps) {
  if (logo === AUTO_BRAND_LOGO) {
    const initial = name.trim().charAt(0).toUpperCase() || '★';
    return (
      <span
        className={`${className} flex items-center justify-center rounded-full bg-current/15 text-sm font-black leading-none text-current`}
        aria-hidden="true"
      >
        {initial}
      </span>
    );
  }
  if (logo.startsWith('data:image/')) {
    return <img src={logo} alt="" className={`${className} rounded-full object-cover`} />;
  }
  const presetName = logo.startsWith(PRESET_PREFIX) ? logo.slice(PRESET_PREFIX.length) : '';
  const Icon = BRAND_PRESET_ICONS[presetName] ?? Pizza;
  return <Icon className={className} />;
}
