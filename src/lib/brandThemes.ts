import { PRESET_PREFIX } from '@/components/BrandLogo';

export interface BrandTheme {
  id: string;
  name: string;
  description: string;
  color: string;
  logo: string;
}

export const BRAND_THEMES: BrandTheme[] = [
  {
    id: 'clasico-pizzeria',
    name: 'Clásico Pizzería',
    description: 'Rojo intenso y apetitoso, ideal para pizzerías tradicionales.',
    color: '#dc2626',
    logo: `${PRESET_PREFIX}Pizza`,
  },
  {
    id: 'moderno-minimalista',
    name: 'Moderno Minimalista',
    description: 'Gris carbón limpio y sobrio, con un aire contemporáneo.',
    color: '#262626',
    logo: `${PRESET_PREFIX}Store`,
  },
  {
    id: 'dark-luxury',
    name: 'Dark Luxury',
    description: 'Negro profundo con detalles elegantes y exclusivos.',
    color: '#1c1917',
    logo: `${PRESET_PREFIX}Crown`,
  },
  {
    id: 'cafe-artesanal',
    name: 'Café Artesanal',
    description: 'Tonos tierra cálidos para cafeterías y panaderías.',
    color: '#78350f',
    logo: `${PRESET_PREFIX}Coffee`,
  },
  {
    id: 'frescura-natural',
    name: 'Frescura Natural',
    description: 'Verde fresco para comida saludable y ensaladas.',
    color: '#15803d',
    logo: `${PRESET_PREFIX}Leaf`,
  },
  {
    id: 'mar-azul',
    name: 'Mar Azul',
    description: 'Azul confiable para mariscos y servicios de confianza.',
    color: '#1d4ed8',
    logo: `${PRESET_PREFIX}Fish`,
  },
];
