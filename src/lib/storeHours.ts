import type { StoreSettings } from '@/types';

export interface DaySchedule {
  open: boolean;
  openTime: string; // "HH:mm" 24h
  closeTime: string; // "HH:mm" 24h
}

export type WeekSchedule = Record<number, DaySchedule>;

export const DAY_NAMES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export const DEFAULT_SCHEDULE: WeekSchedule = {
  0: { open: true, openTime: '13:00', closeTime: '22:00' },
  1: { open: false, openTime: '13:00', closeTime: '22:00' },
  2: { open: false, openTime: '13:00', closeTime: '22:00' },
  3: { open: false, openTime: '13:00', closeTime: '22:00' },
  4: { open: false, openTime: '13:00', closeTime: '22:00' },
  5: { open: true, openTime: '13:00', closeTime: '22:00' },
  6: { open: true, openTime: '13:00', closeTime: '22:00' },
};

export function parseSchedule(raw: string | undefined | null): WeekSchedule {
  if (!raw) return DEFAULT_SCHEDULE;
  try {
    const parsed = JSON.parse(raw);
    const result: WeekSchedule = { ...DEFAULT_SCHEDULE };
    for (let i = 0; i <= 6; i++) {
      if (parsed[i]) {
        result[i] = {
          open: !!parsed[i].open,
          openTime: parsed[i].openTime || '13:00',
          closeTime: parsed[i].closeTime || '22:00',
        };
      }
    }
    return result;
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

export function serializeSchedule(schedule: WeekSchedule): string {
  return JSON.stringify(schedule);
}

function isInRange(timeStr: string, now: Date): boolean {
  const [openH, openM] = timeStr.split(':').map(Number);
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentMin = hour * 60 + minute;
  const openMin = openH * 60 + openM;
  return currentMin >= openMin && currentMin < openMin + 9 * 60;
}

export function isStoreAutoOpen(settings?: StoreSettings | null): boolean {
  const schedule = parseSchedule(settings?.auto_schedule);
  const now = new Date();
  const day = now.getDay();
  const dayConfig = schedule[day];
  if (!dayConfig || !dayConfig.open) return false;
  return isInRange(dayConfig.openTime, now);
}

export function getStoreOpen(settings: StoreSettings | null): boolean {
  if (!settings) return true;
  if (settings.manual_override === 'manual') {
    return settings.manual_is_open === 'true';
  }
  return isStoreAutoOpen(settings);
}

export function getScheduleText(settings?: StoreSettings | null): string {
  const schedule = parseSchedule(settings?.auto_schedule);
  const openDays = Object.entries(schedule)
    .filter(([, v]) => v.open)
    .map(([k]) => DAY_NAMES[Number(k)]);
  if (openDays.length === 0) return 'Cerrado todos los días';
  const sample = schedule[Number(Object.keys(schedule).find(([k]) => schedule[Number(k)].open)!)];
  const fmtTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
  };
  return `${openDays.join(', ')}, ${fmtTime(sample.openTime)} - ${fmtTime(sample.closeTime)}`;
}
