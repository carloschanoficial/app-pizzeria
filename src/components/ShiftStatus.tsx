import { Clock } from 'lucide-react';
import { formatWeekSchedule, getShiftSchedule, isShiftOpen } from '@/lib/storeHours';
import type { ServiceShift, StoreSettings } from '@/types';

interface ShiftStatusProps {
  shift: ServiceShift;
  settings: StoreSettings | null;
}

export function ShiftStatus({ shift, settings }: ShiftStatusProps) {
  const isOpen = isShiftOpen(shift, settings);
  const hours = formatWeekSchedule(getShiftSchedule(shift, settings));

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-gray-400'}`}
        />
        <span className={`font-bold ${isOpen ? 'text-green-700' : 'text-gray-600'}`}>
          {isOpen ? 'Abierto' : 'Cerrado'}
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-1 text-gray-500">
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{hours}</span>
      </span>
    </div>
  );
}
