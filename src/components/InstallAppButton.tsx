import { Download } from 'lucide-react';
import type { InstallPromptState } from '@/hooks/useInstallPrompt';

interface InstallAppButtonProps {
  install: InstallPromptState;
  variant: 'floating' | 'header';
}

export function InstallAppButton({ install, variant }: InstallAppButtonProps) {
  if (!install.canInstall) return null;

  if (variant === 'header') {
    return (
      <button
        onClick={install.install}
        className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-2 text-xs font-bold text-white shadow transition hover:bg-red-700 active:scale-95"
      >
        <Download className="h-4 w-4" />
        Instalar
      </button>
    );
  }

  return (
    <button
      onClick={install.install}
      className="fixed right-4 z-40 inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-bold text-white shadow-lg ring-1 ring-black/10 transition hover:bg-gray-800 active:scale-95"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
    >
      <Download className="h-4 w-4" />
      Instalar app
    </button>
  );
}
