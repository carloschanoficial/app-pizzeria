import {
  User,
  MapPin,
  Clock,
  Phone,
  Settings,
  ChevronRight,
  Gift,
} from 'lucide-react';
import type { StoreSettings } from '@/types';
import { buildLoyaltyRules } from '@/lib/loyaltyRules';

interface PerfilPageProps {
  settings: StoreSettings | null;
  isAdmin: boolean;
  onAdminClick: () => void;
}

export function PerfilPage({ settings, isAdmin, onAdminClick }: PerfilPageProps) {
  return (
    <div className="space-y-5">
      {/* Perfil */}
      <div className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 p-6 text-white shadow-lg">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/10">
          <User className="h-10 w-10 text-white" />
        </div>
        <h2 className="mt-3 text-xl font-black">Cliente</h2>
        <p className="text-sm text-white/80">Pizzería Matias</p>
      </div>

      {/* Información de la tienda */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <h3 className="border-b border-gray-100 px-4 py-3 text-sm font-bold text-gray-900">
          Información de la Pizzería
        </h3>
        <div className="divide-y divide-gray-50">
          {settings && (
            <>
              <div className="flex items-start gap-3 px-4 py-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <div>
                  <p className="text-xs text-gray-400">Dirección</p>
                  <p className="text-sm text-gray-700">{settings.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <div>
                  <p className="text-xs text-gray-400">Horario</p>
                  <p className="text-sm text-gray-700">{settings.schedule}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <div>
                  <p className="text-xs text-gray-400">Teléfono / WhatsApp</p>
                  <p className="text-sm text-gray-700">
                    +{settings.whatsapp_number}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reglas del programa */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <h3 className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm font-bold text-gray-900">
          <Gift className="h-4 w-4 text-red-600" />
          Reglas del Programa de Lealtad
        </h3>
        <ul className="space-y-2 px-4 py-3 text-sm leading-relaxed text-gray-600">
          {buildLoyaltyRules(settings).map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>

      {isAdmin && (
        <button
          onClick={onAdminClick}
          className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-gray-100 transition hover:bg-gray-50"
        >
          <Settings className="h-5 w-5 text-gray-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">
              Panel de Administración
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </button>
      )}
    </div>
  );
}
