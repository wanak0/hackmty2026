import { useId, useState } from "react";
import { ArrowRight, PiggyBank } from "lucide-react";
interface InvestmentOption {
  id: string;
  name: string;
  annualRate: number;
  termDays: number;
  profitNet: number;
  totalFinal: number;
}
interface InvestmentSimulatorProps {
  amount: number;
  initialDays?: number;
  options: InvestmentOption[];
  onAction: (action: string, payload: Record<string, unknown>) => void;
}

export function InvestmentSimulator({
  amount: initialAmount,
  initialDays = 91,
  options,
  onAction,
}: InvestmentSimulatorProps) {
  const id = useId();
  const [amount, setAmount] = useState(initialAmount ?? 5000);
  const [days, setDays] = useState(initialDays);
  const changed = amount !== initialAmount || days !== initialDays;
  const currency = (n: number) =>
    n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  return (
    <section className="investment-simulator">
      <h3>
        <PiggyBank size={22} /> Explora qué puedes ganar
      </h3>
      <p>
        Elige cuánto y por cuánto tiempo. Los rendimientos son estimaciones de
        esta demostración.
      </p>
      <label htmlFor={`${id}-amount`}>¿Cuánto quieres invertir? (pesos)</label>
      <input
        id={`${id}-amount`}
        type="number"
        inputMode="decimal"
        min="1"
        step="0.01"
        value={amount || ""}
        onChange={(event) => setAmount(Number(event.target.value))}
      />
      <fieldset>
        <legend>¿Por cuántos días?</legend>
        <div className="investment-terms">
          {[28, 91, 180, 360].map((term) => (
            <button
              key={term}
              type="button"
              aria-pressed={term === days}
              onClick={() => setDays(term)}
            >
              {term} días
            </button>
          ))}
        </div>
      </fieldset>
      {changed && (
        <button
          className="button secondary"
          disabled={!Number.isFinite(amount) || amount <= 0}
          onClick={() =>
            onAction("USER_PROMPT", {
              text: `Simula una inversión de ${amount} pesos a ${days} días`,
            })
          }
        >
          Actualizar cálculo <ArrowRight size={18} />
        </button>
      )}
      <div className="investment-options">
        {options.map((option) => (
          <div key={option.id}>
            <h4>{option.name}</h4>
            <p>Tasa anual de ejemplo: {option.annualRate}%</p>
            <dl>
              <div>
                <dt>Ganancia estimada</dt>
                <dd>{currency(option.profitNet)}</dd>
              </div>
              <div>
                <dt>Total al final de {option.termDays} días</dt>
                <dd>{currency(option.totalFinal)}</dd>
              </div>
            </dl>
            {changed ? (
              <p>Actualiza el cálculo para ver los nuevos resultados.</p>
            ) : (
              <button
                className="button secondary"
                onClick={() =>
                  onAction("CONFIRM_INVESTMENT", {
                    amount,
                    days,
                    productId: option.id,
                  })
                }
              >
                Revisar esta inversión <ArrowRight size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
