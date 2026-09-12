import { useEffect, useId, useState } from "react";
import { ArrowUpRight, Pencil, Check } from "lucide-react";

export interface TransferData {
  recipient: string;
  amount: number;
  concept: string;
  clabe: string;
}
interface TransferCardProps {
  recipient: string;
  amount: number;
  concept: string;
  sourceAccount: string;
  isNewContact?: boolean;
  clabe?: string;
  onChangeData?: (data: TransferData) => void;
}

export function TransferCard({
  recipient = "",
  amount = 0,
  concept = "",
  sourceAccount,
  isNewContact = false,
  clabe = "",
  onChangeData,
}: TransferCardProps) {
  const id = useId();
  const [data, setData] = useState<TransferData>({
    recipient,
    amount,
    concept,
    clabe,
  });
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    setData({ recipient, amount, concept, clabe });
  }, [recipient, amount, concept, clabe]);
  useEffect(() => {
    onChangeData?.(data);
  }, [data, onChangeData]);
  const update = (changes: Partial<TransferData>) =>
    setData((previous) => ({ ...previous, ...changes }));
  return (
    <section className="transfer-review">
      <div className="transfer-title">
        <span>
          <ArrowUpRight size={20} /> Revisa tu transferencia
        </span>
        <button
          type="button"
          aria-expanded={editing}
          onClick={() => setEditing(!editing)}
        >
          {editing ? <Check size={17} /> : <Pencil size={17} />}
          {editing ? "Listo" : "Modificar"}
        </button>
      </div>
      <div className="transfer-amount">
        <label htmlFor={`${id}-amount`}>Importe a transferir</label>
        {editing ? (
          <input
            id={`${id}-amount`}
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            value={data.amount || ""}
            onChange={(event) => update({ amount: Number(event.target.value) })}
          />
        ) : (
          <strong>
            {data.amount.toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })}{" "}
            <small>MXN</small>
          </strong>
        )}
      </div>
      <div className="transfer-field">
        <label htmlFor={`${id}-recipient`}>¿A quién envías?</label>
        {editing ? (
          <input
            id={`${id}-recipient`}
            required
            value={data.recipient}
            onChange={(event) => update({ recipient: event.target.value })}
          />
        ) : (
          <strong>{data.recipient || "Falta elegir destinatario"}</strong>
        )}
      </div>
      {(isNewContact || data.clabe) && (
        <div className="transfer-field">
          <label htmlFor={`${id}-clabe`}>
            Cuenta de destino (CLABE de 18 dígitos)
          </label>
          <input
            id={`${id}-clabe`}
            inputMode="numeric"
            pattern="[0-9]{18}"
            required
            maxLength={18}
            value={data.clabe}
            onChange={(event) =>
              update({ clabe: event.target.value.replace(/\D/g, "") })
            }
          />
          <p>Verifica que la cuenta pertenezca a la persona correcta.</p>
        </div>
      )}
      <div className="transfer-field">
        <span>Desde tu cuenta</span>
        <strong>{sourceAccount || "Enlace Digital"}</strong>
      </div>
      <div className="transfer-field">
        <label htmlFor={`${id}-concept`}>Concepto del envío</label>
        {editing ? (
          <input
            id={`${id}-concept`}
            value={data.concept}
            maxLength={100}
            onChange={(event) => update({ concept: event.target.value })}
          />
        ) : (
          <strong>{data.concept || "Sin concepto"}</strong>
        )}
      </div>
      <p className="transfer-note">
        Todavía no se ha enviado dinero. Revisa los datos y usa el botón de
        confirmación para continuar.
      </p>
    </section>
  );
}
