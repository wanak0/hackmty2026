import React, { useId } from 'react';
import { PlanOption } from '../../types/a2ui';
import { money } from './styles';

interface PlanOptionListProps {
  options: PlanOption[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  disabled?: boolean;
}

export const PlanOptionList: React.FC<PlanOptionListProps> = ({ options, selectedPlanId, onSelectPlan, disabled = false }) => {
  const groupId = useId();
  return (
    <fieldset disabled={disabled} aria-describedby={groupId + '-help'} className="min-w-0 space-y-3 text-base text-[#222222]">
      <legend className="mb-2 text-xl font-semibold">Elige tu plan de pagos</legend>
      <p id={groupId + '-help'}>Revisa la mensualidad y el plazo. Selecciona un plan para continuar.</p>
      {options.length === 0 && <p role="status">No hay planes disponibles.</p>}
      {options.map(option => (
        <label key={option.planId} className={'flex min-h-[48px] cursor-pointer items-start gap-3 rounded-2xl border p-4 focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[#EC0000] ' + (selectedPlanId === option.planId ? 'border-[#EC0000] bg-[#FBF1EA]' : 'border-[#8A817B] bg-[#FFFFFF] hover:bg-[#FBF1EA]') + (disabled ? ' cursor-not-allowed opacity-60' : '')}>
          <input type="radio" name={groupId} value={option.planId} checked={selectedPlanId === option.planId} onChange={() => onSelectPlan(option.planId)} className="mt-1 h-6 w-6 shrink-0 accent-[#EC0000]" />
          <span className="flex min-w-0 flex-1 flex-wrap justify-between gap-3">
            <span className="space-y-1"><span className="block text-lg font-semibold">{option.months} meses</span><span className="block">CAT {option.cat}%</span>{option.recommended && <span className="block font-semibold text-[#B80000]">Recomendado</span>}</span>
            <span className="space-y-1"><span className="block text-lg font-semibold">{money(option.monthlyPayment)} / mes</span>{option.totalToPay != null && <span className="block">Total a pagar: {money(option.totalToPay)}</span>}{option.estimatedSavings != null && <span className="block">Ahorro estimado: {money(option.estimatedSavings)}</span>}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
};
