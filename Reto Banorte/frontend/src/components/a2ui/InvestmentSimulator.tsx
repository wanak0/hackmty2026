import React, { useEffect, useId, useState } from 'react';
import { ActionButton } from './ActionButton';
import { focus, input, money, panel, plainText, secondaryButton } from './styles';

interface InvestmentOption {
  id: string;
  name: string;
  tag: string;
  annualRate: number;
  termDays: number;
  profitNet: number;
  totalFinal: number;
  recommended: boolean;
}
interface InvestmentSimulatorProps {
  amount: number;
  initialDays?: number;
  options: InvestmentOption[];
  onAction?: (actionType: string, payload?: any) => void;
  loading?: boolean;
}

export const InvestmentSimulator: React.FC<InvestmentSimulatorProps> = ({
  amount: initialAmount, initialDays = 91, options, onAction, loading = false
}) => {
  const id = useId();
  const [amountText, setAmountText] = useState(Number.isFinite(initialAmount) ? String(initialAmount) : '');
  const [days, setDays] = useState(initialDays);
  useEffect(() => {
    setAmountText(Number.isFinite(initialAmount) ? String(initialAmount) : '');
    setDays(initialDays);
  }, [initialAmount, initialDays]);
  const amount = /^\d+(?:\.\d{1,2})?$/.test(amountText) ? Number(amountText) : NaN;
  const valid = Number.isFinite(amount) && amount > 0 && Number.isSafeInteger(Math.round(amount * 100)) && Number.isInteger(days) && days > 0;
  const changed = amount !== initialAmount || days !== initialDays;
  const terms = [...new Set([28, 91, 180, 360, ...(initialDays > 0 ? [initialDays] : [])])].sort((a, b) => a - b);

  return (
    <section className="space-y-4 text-base text-[#222222]" aria-label="Simulador de inversión">
      <div className={panel}>
        <h3 className="mb-2 text-xl font-semibold">Simula el rendimiento de tu ahorro</h3>
        <p className="mb-5">Ajusta el monto y el plazo. Pulsa Calcular rendimiento para consultar la simulación.</p>
        <fieldset disabled={loading} className="min-w-0 space-y-5">
          <legend className="sr-only">Parámetros de simulación</legend>
          <div>
            <label htmlFor={id + '-amount'} className="mb-2 block font-semibold">Monto a simular (MXN)</label>
            <input id={id + '-amount'} type="text" inputMode="decimal" value={amountText} onChange={e => setAmountText(e.target.value)} aria-invalid={!valid} aria-describedby={!valid ? id + '-error' : undefined} className={input} />
            <input type="range" aria-label="Ajustar monto a simular" aria-valuetext={money(amount)} min={0} max={Math.max(150000, Number.isFinite(amount) ? amount : 0)} step={1} value={Number.isFinite(amount) ? amount : 0} onChange={e => setAmountText(e.target.value)} className={'mt-2 min-h-[48px] w-full cursor-pointer accent-[#EC0000] ' + focus} />
          </div>
          <fieldset className="min-w-0">
            <legend className="mb-2 font-semibold">Plazo de la simulación</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{terms.map(term => <button key={term} type="button" aria-pressed={days === term} onClick={() => setDays(term)} className={secondaryButton + (days === term ? ' !border-[#EC0000] !bg-[#FBF1EA]' : '')}>{term} días</button>)}</div>
          </fieldset>
          {!valid && <p id={id + '-error'} className="text-[#B80000]">Ingresa un monto positivo con máximo dos decimales y un plazo válido.</p>}
          <ActionButton label="Calcular rendimiento" actionType="SIMULATE_INVESTMENT" loading={loading} disabled={!valid || !onAction} onClick={() => { if (valid && !loading) onAction?.('SIMULATE_INVESTMENT', { amount, days }); }} />
        </fieldset>
        <p className="mt-4">Esta simulación no contrata una inversión ni mueve tu dinero.</p>
      </div>
      {changed ? <p role="status" className="rounded-xl bg-[#FBF1EA] p-4">Los datos cambiaron. Calcula el rendimiento para actualizar los resultados.</p> : (
        <div className="space-y-3">
          {options.length === 0 && <p role="status">Aún no hay resultados para estos datos.</p>}
          {options.map(option => <article key={option.id} className={panel}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2"><h4 className="text-lg font-semibold">{plainText(option.name)}</h4>{option.tag && <span className="rounded-full bg-[#FBF1EA] px-3 py-1">{plainText(option.tag)}</span>}</div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div><dt>Tasa anual</dt><dd className="font-semibold">{option.annualRate}%</dd></div>
              <div><dt>Plazo</dt><dd className="font-semibold">{option.termDays} días</dd></div>
              <div><dt>Rendimiento estimado</dt><dd className="text-xl font-semibold">{money(option.profitNet)}</dd></div>
              <div><dt>Total estimado al vencimiento</dt><dd className="text-xl font-semibold">{money(option.totalFinal)}</dd></div>
            </dl>
          </article>)}
        </div>
      )}
    </section>
  );
};
