import { DAY_NAMES, type WeekSchedule } from '@/lib/storeHours';

interface ScheduleEditorProps {
  schedule: WeekSchedule;
  onChange: (schedule: WeekSchedule) => void;
}

export function ScheduleEditor({ schedule, onChange }: ScheduleEditorProps) {
  const updateDay = (day: number, field: 'open' | 'openTime' | 'closeTime', value: string | boolean) => {
    onChange({
      ...schedule,
      [day]: { ...schedule[day], [field]: value },
    });
  };

  return (
    <div className="space-y-2">
      {DAY_NAMES.map((name, idx) => {
        const dayCfg = schedule[idx];
        return (
          <div
            key={idx}
            className={`flex items-center gap-2 rounded-xl border-2 p-2.5 transition ${
              dayCfg.open ? 'border-red-200 bg-red-50/40' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <button
              type="button"
              onClick={() => updateDay(idx, 'open', !dayCfg.open)}
              className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${
                dayCfg.open ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  dayCfg.open ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
            <span className={`w-20 flex-shrink-0 text-sm font-bold ${dayCfg.open ? 'text-gray-900' : 'text-gray-400'}`}>
              {name}
            </span>
            {dayCfg.open ? (
              <div className="flex flex-1 items-center gap-1.5">
                <input
                  type="time"
                  value={dayCfg.openTime}
                  onChange={(e) => updateDay(idx, 'openTime', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-red-500"
                />
                <span className="text-xs text-gray-400">–</span>
                <input
                  type="time"
                  value={dayCfg.closeTime}
                  onChange={(e) => updateDay(idx, 'closeTime', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-red-500"
                />
              </div>
            ) : (
              <span className="text-xs text-gray-400">Cerrado</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
