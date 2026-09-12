import React from 'react';
import { CheckCircle } from 'lucide-react';
import { money, panel, plainText } from './styles';

interface ConfirmationCardProps {
  operationId: string;
  cardName: string;
  last4: string;
  months: number;
  monthlyQuota: number;
  appliedAt: string;
  nextPaymentDate: string;
  screenId?: string;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  operationId, cardName, last4, months, monthlyQuota, appliedAt, nextPaymentDate, screenId = ''
}) => {
  // Older A2UI receipts reuse monthlyQuota and nextPaymentDate for other operations.
  const isTransfer = /SPEI/i.test(operationId ?? '') || /transfer/i.test(screenId);
  const isInvestment = !isTransfer && (/^INV[-_]/i.test(operationId ?? '') || /investment|inversion/i.test(screenId));
  const isRestructure = !isTransfer && !isInvestment && (/restructure|reestructura/i.test(screenId) || (Number.isFinite(months) && months > 1));
  const title = isTransfer ? 'Transferencia enviada' : isInvestment ? 'Simulación de inversión' : isRestructure ? 'Plan de pagos aplicado' : 'Comprobante de operación';
  const amountLabel = isTransfer ? 'Monto transferido' : isInvestment ? 'Rendimiento estimado' : isRestructure ? 'Mensualidad del plan' : 'Monto informado';
  const details = [
    ['Folio', operationId],
    [isTransfer ? 'Cuenta de origen' : isInvestment ? 'Producto' : 'Cuenta o tarjeta', [cardName, last4 ? '(•••• ' + last4 + ')' : ''].filter(Boolean).join(' ')],
    ['Fecha', appliedAt],
    [isTransfer ? 'Información de la cuenta' : isInvestment ? 'Vencimiento estimado' : isRestructure ? 'Próximo pago' : 'Información adicional', nextPaymentDate]
  ];
  return (
    <section className={panel} aria-label={title}>
      <div className="mb-5 flex items-start gap-3">
        <CheckCircle aria-hidden="true" className="mt-1 h-7 w-7 shrink-0 text-[#EC0000]" />
        <div><h3 className="text-xl font-semibold">{title}</h3><p className="mt-1">{isInvestment ? 'Resultado informativo; no acredita una inversión contratada.' : 'Conserva los datos de esta operación.'}</p></div>
      </div>
      <div className="mb-5 rounded-xl bg-[#FBF1EA] p-5">
        <p>{amountLabel}</p><p className="mt-2 break-words text-3xl font-semibold">{money(monthlyQuota)}</p>
        {isRestructure && <p className="mt-2">Plazo: {months} meses</p>}
      </div>
      <dl className="divide-y divide-[#DED6D0]">
        {details.filter(([, value]) => value).map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3"><dt>{label}</dt><dd className="min-w-0 break-words font-semibold sm:text-right">{plainText(value)}</dd></div>)}
      </dl>
    </section>
  );
};
