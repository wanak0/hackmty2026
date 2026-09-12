import React from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import { PlanOption } from '../../types/a2ui';

interface PlanOptionListProps {
  options: PlanOption[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
}

export const PlanOptionList: React.FC<PlanOptionListProps> = ({
  options,
  selectedPlanId,
  onSelectPlan
}) => {
  return (
    <div className="space-y-2.5 mb-5">
      {options.map((option) => {
        const isSelected = selectedPlanId === option.planId;

        return (
          <div
            key={option.planId}
            onClick={() => onSelectPlan(option.planId)}
            className={`cursor-pointer relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
              isSelected
                ? 'bg-[#22171b] border-red-500/80 shadow-lg shadow-red-950/30 ring-1 ring-red-500/50'
                : 'bg-[#141519] border-[#252732] hover:border-zinc-700 hover:bg-[#191a20]'
            }`}
          >
            {/* Indicador Recomendado */}
            {option.recommended && (
              <span className="absolute -top-2.5 right-4 bg-[#EB0029] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                <Star className="w-2.5 h-2.5 fill-current" /> RECOMENDADO
              </span>
            )}

            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-zinc-600 bg-transparent'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-4 h-4" />}
              </div>

              <div>
                <div className="text-base font-semibold text-white">
                  {option.months} meses
                </div>
                <div className="text-xs text-zinc-400">
                  CAT <span className="text-zinc-200 font-medium">{option.cat}%</span> sin comisiones
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-white tracking-tight">
                ${option.monthlyPayment.toLocaleString('es-MX')}
                <span className="text-xs font-normal text-zinc-400"> /mes</span>
              </div>
              {option.estimatedSavings && (
                <div className="text-[11px] text-emerald-400 font-medium">
                  Ahorras ~${option.estimatedSavings.toLocaleString('es-MX')}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
