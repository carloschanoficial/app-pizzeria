import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  show: boolean;
  onHide: () => void;
}

export function Toast({ message, show, onHide }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 animate-slide-up">
      <div className="flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 shadow-xl">
        <CheckCircle className="h-5 w-5 text-white" />
        <span className="text-sm font-bold text-white">{message}</span>
      </div>
    </div>
  );
}
