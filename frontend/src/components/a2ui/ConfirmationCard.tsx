import React, { useEffect } from 'react';
import { CheckCircle, ShieldCheck, Calendar, CreditCard, Hash } from 'lucide-react';
import confetti from 'canvas-confetti';

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
    <div className="bg-gradient-to-b from-[#181920] to-[#131418] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden mb-5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header de Éxito */}
      <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-zinc-800">
        <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Reestructuración Confirmada</h3>
          <p className="text-xs text-zinc-400">Tu tasa preferencial ha sido fijada en el core bancario.</p>
        </div>
      </div>

      {/* Cuota Mensual Fija */}
      <div className="bg-[#0f1013] border border-zinc-800 rounded-xl p-4 mb-4 text-center">
        <span className="text-xs font-medium text-zinc-400">Nueva Cuota Mensual Congelada</span>
        <div className="text-3xl font-extrabold text-emerald-400 mt-0.5">
          ${monthlyQuota.toLocaleString('es-MX')} <span className="text-xs font-normal text-zinc-400">MXN</span>
        </div>
        <span className="text-xs text-zinc-400 mt-1 block">
          Plazo pactado: <strong className="text-white">{months} meses</strong>
        </span>
      </div>

      {/* Detalles del Comprobante */}
      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/60">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-zinc-500" /> Folio Oficial
          </span>
          <span className="font-mono font-semibold text-zinc-200">{operationId}</span>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/60">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-zinc-500" /> Tarjeta Asociada
          </span>
          <span className="font-medium text-zinc-200">{cardName} (•••• {last4})</span>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/60">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Fecha de Aplicación
          </span>
          <span className="text-zinc-300">{appliedAt}</span>
        </div>

        <div className="flex justify-between items-center py-1.5">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Primer Pago Programado
          </span>
          <span className="font-semibold text-emerald-400">{nextPaymentDate}</span>
        </div>
      </div>
    </div>
  );
};
