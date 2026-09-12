import React, { useEffect } from 'react';
import { CheckCircle, ShieldCheck, Calendar, CreditCard, Hash, Download, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BanorteLogo } from '../common/BanorteLogo';

interface ConfirmationCardProps {
  operationId: string;
  cardName: string;
  last4: string;
  months: number;
  monthlyQuota: number;
  appliedAt: string;
  nextPaymentDate: string;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  operationId,
  cardName,
  last4,
  months,
  monthlyQuota,
  appliedAt,
  nextPaymentDate
}) => {
  useEffect(() => {
    // Disparar confetti de celebración
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="bg-white border border-emerald-300 rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden mb-5">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-50 rounded-full blur-2xl pointer-events-none" />

      {/* Header Comprobante Banorte */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
        <BanorteLogo size="sm" variant="red" />
        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 uppercase tracking-wider">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Operación Exitosa
        </span>
      </div>

      {/* Mensaje Principal */}
      <div className="text-center mb-6">
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          Plan de Pagos Fijos Activado
        </h3>
        <p className="text-xs text-gray-500 mt-1 font-medium">
          Tu tasa preferencial ha sido congelada con éxito en el Core Bancario Banorte.
        </p>
      </div>

      {/* Cuota Mensual Fija */}
      <div className="bg-[#F8F9FB] border border-gray-200 rounded-2xl p-5 mb-5 text-center shadow-xs">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Nueva Mensualidad Fija Congelada
        </span>
        <div className="text-3xl sm:text-4xl font-black text-emerald-600 mt-1">
          ${monthlyQuota.toLocaleString('es-MX')} <span className="text-xs font-normal text-emerald-700">MXN / mes</span>
        </div>
        <div className="text-xs text-gray-700 mt-1 font-medium">
          Plazo pactado: <strong className="text-gray-900 font-bold">{months} mensualidades</strong>
        </div>
      </div>

      {/* Detalles del Comprobante Digital */}
      <div className="bg-[#F8F9FB] rounded-2xl p-4 border border-gray-200 space-y-2.5 text-xs mb-5">
        <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
          <span className="text-gray-500 flex items-center gap-1.5 font-medium">
            <Hash className="w-3.5 h-3.5 text-[#E30613]" /> Folio de Operación
          </span>
          <span className="font-mono font-bold text-gray-900">{operationId}</span>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
          <span className="text-gray-500 flex items-center gap-1.5 font-medium">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" /> Tarjeta Banorte
          </span>
          <span className="font-bold text-gray-900">{cardName} (•••• {last4})</span>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
          <span className="text-gray-500 flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-gray-400" /> Fecha de Aplicación
          </span>
          <span className="text-gray-700 font-semibold">{appliedAt}</span>
        </div>

        <div className="flex justify-between items-center py-1.5">
          <span className="text-gray-500 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Primer Pago en Estado de Cuenta
          </span>
          <span className="font-bold text-emerald-700">{nextPaymentDate}</span>
        </div>
      </div>

      {/* Botones de acción del comprobante */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-xs font-bold text-gray-800 flex items-center justify-center gap-1.5 transition-all"
        >
          <Download className="w-3.5 h-3.5 text-[#E30613]" />
          <span>Descargar Comprobante</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'Comprobante Banorte', text: `Folio: ${operationId}` });
            }
          }}
          className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-xs font-bold text-gray-800 flex items-center justify-center gap-1.5 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};


