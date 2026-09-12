import { CheckCircle2, Printer } from "lucide-react";
interface ConfirmationCardProps {
  operationId?: string;
  cardName?: string;
  last4?: string;
  months?: number;
  monthlyQuota?: number;
  appliedAt?: string;
  nextPaymentDate?: string;
  amount?: number;
  recipient?: string;
  productName?: string;
}
export function ConfirmationCard({
  operationId,
  cardName,
  last4,
  months,
  monthlyQuota,
  appliedAt,
  nextPaymentDate,
  amount,
  recipient,
  productName,
}: ConfirmationCardProps) {
  const currency = (value: number) =>
    value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  const title = months
    ? "Tu plan de pagos está listo"
    : recipient
      ? "Tu transferencia está lista"
      : productName
        ? "Tu inversión está lista"
        : "Comprobante de tu operación";
  const rows = [
    ["Folio", operationId],
    [
      "Tarjeta",
      cardName ? `${cardName}${last4 ? ` · •••• ${last4}` : ""}` : undefined,
    ],
    ["Destinatario", recipient],
    ["Inversión", productName],
    ["Importe", amount != null ? currency(amount) : undefined],
    ["Plazo", months ? `${months} meses` : undefined],
    ["Fecha de operación", appliedAt],
    ["Próximo pago", nextPaymentDate],
  ].filter(([, value]) => value != null);
  return (
    <section className="confirmation-card">
      <div className="confirmation-heading">
        <CheckCircle2 size={30} />
        <span>COMPROBANTE DE DEMOSTRACIÓN</span>
      </div>
      <h3>{title}</h3>
      <p>Conserva el folio para identificar este movimiento de prueba.</p>
      {monthlyQuota != null && (
        <div className="confirmation-amount">
          <span>Tu pago mensual</span>
          <strong>
            {currency(monthlyQuota)} <small>MXN</small>
          </strong>
        </div>
      )}
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        className="button secondary"
        onClick={() => window.print()}
      >
        <Printer size={18} /> Imprimir o guardar como PDF
      </button>
    </section>
  );
}
