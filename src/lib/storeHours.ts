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

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function formatClock(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDayRange(startIdx: number, endIdx: number): string {
  const first = DAY_NAMES[WEEK_ORDER[startIdx]];
  const last = DAY_NAMES[WEEK_ORDER[endIdx]];
  if (startIdx === endIdx) return first;
  if (endIdx - startIdx === 1) return `${first} y ${last}`;
  return `${first} a ${last}`;
}

export function getScheduleText(settings?: StoreSettings | null): string {
  const schedule = parseSchedule(settings?.auto_schedule);
  const runs: { startIdx: number; endIdx: number; cfg: DaySchedule }[] = [];

  WEEK_ORDER.forEach((day, idx) => {
    const cfg = schedule[day];
    if (!cfg?.open) return;
    const prev = runs[runs.length - 1];
    const sameHours =
      prev && prev.endIdx === idx - 1 &&
      prev.cfg.openTime === cfg.openTime && prev.cfg.closeTime === cfg.closeTime;
    if (sameHours) {
      prev.endIdx = idx;
    } else {
      runs.push({ startIdx: idx, endIdx: idx, cfg });
    }
  });

  if (runs.length === 0) return 'Cerrado todos los días';

  return runs
    .map(({ startIdx, endIdx, cfg }) => {
      const days = formatDayRange(startIdx, endIdx);
      return `${days}: ${formatClock(cfg.openTime)} - ${formatClock(cfg.closeTime)}`;
    })
    .join(' · ');
}
