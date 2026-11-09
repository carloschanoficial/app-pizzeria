export const DEFAULT_BRAND_COLOR = '#dc2626';
export const DEFAULT_BUSINESS_NAME = 'Pizzería Matias';

const LIGHT_SHADES: Record<number, number> = { 50: 0.95, 100: 0.9, 200: 0.75, 300: 0.6, 400: 0.35, 500: 0.15 };
const DARK_SHADES: Record<number, number> = { 700: 0.15, 800: 0.3, 900: 0.45 };

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as Rgb;
}

function mix(from: Rgb, to: number, amount: number): Rgb {
  return from.map((c) => Math.round(c + (to - c) * amount)) as Rgb;
}

export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function buildBrandRamp(hex: string): Record<number, Rgb> {
  const base = hexToRgb(hex);
  const ramp: Record<number, Rgb> = { 600: base };
  for (const [shade, amount] of Object.entries(LIGHT_SHADES)) ramp[Number(shade)] = mix(base, 255, amount);
  for (const [shade, amount] of Object.entries(DARK_SHADES)) ramp[Number(shade)] = mix(base, 0, amount);
  return ramp;
}

export function applyBrandTheme(hex: string): void {
  const safeHex = isValidHexColor(hex) ? hex : DEFAULT_BRAND_COLOR;
  const ramp = buildBrandRamp(safeHex);
  const root = document.documentElement;
  for (const [shade, rgb] of Object.entries(ramp)) {
    root.style.setProperty(`--brand-${shade}`, rgb.join(' '));
  }
}
