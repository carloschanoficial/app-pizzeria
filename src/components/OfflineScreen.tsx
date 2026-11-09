import { WifiOff, RotateCw } from 'lucide-react';

interface OfflineScreenProps {
  onRetry: () => void;
}

export function OfflineScreen({ onRetry }: OfflineScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white px-6">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-50 ring-4 ring-red-100">
        <WifiOff className="h-12 w-12 text-red-600" strokeWidth={2} />
      </div>
      <h1 className="mt-6 text-xl font-black text-gray-900">
        Sin conexión a internet
      </h1>
      <p className="mt-2 max-w-xs text-center text-sm text-gray-500">
        Revisa tu red y vuelve a intentarlo.
      </p>
      <button
        onClick={onRetry}
        className="mt-6 flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition active:scale-95 hover:bg-red-700"
      >
        <RotateCw className="h-4 w-4" />
        Reintentar
      </button>
    </div>
  );
}
