import React from "react";
import { CheckCircle2, Star, Percent, Calendar } from "lucide-react";
import { PlanOption } from "../../types/a2ui";

interface PlanOptionListProps {
  options: PlanOption[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
}

export const PlanOptionList: React.FC<PlanOptionListProps> = ({
  options,
  selectedPlanId,
  onSelectPlan,
}) => {
  return (
    <div className="space-y-3 mb-5">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#EB0029]" /> Selecciona tu
          Plazo Banorte:
        </span>
        <span className="text-[11px] text-gray-500 font-medium">
          Opciones de ejemplo
        </span>
      </div>

      {options.map((option) => {
        const isSelected = selectedPlanId === option.planId;

        return (
          <button
            type="button"
            aria-pressed={isSelected}
            key={option.planId}
            onClick={() => onSelectPlan(option.planId)}
            className={`w-full text-left cursor-pointer relative flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
              isSelected
                ? "bg-[#FFF0F1] border-[#EB0029] shadow-sm ring-1 ring-[#EB0029]/30"
                : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/70 shadow-xs"
            }`}
          >
            {/* Indicador Recomendado */}
            {option.recommended && (
              <span className="absolute -top-2.5 right-4 bg-[#EB0029] text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full flex items-center gap-1 shadow-xs uppercase tracking-wider">
                <Star className="w-2.5 h-2.5 fill-current" /> Sugerido
              </span>
            )}

            <div className="flex items-center gap-3.5">
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                  isSelected
                    ? "border-[#EB0029] bg-[#EB0029] text-white"
                    : "border-gray-300 bg-white"
                }`}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </div>

              <div>
                <div className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>{option.months} meses</span>
                  {isSelected && (
                    <span className="text-[10px] bg-[#FFF0F1] text-[#EB0029] px-2 py-0.5 rounded font-bold border border-[#F3C5C8]">
                      SELECCIONADO
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 font-medium">
                  <Percent className="w-3 h-3 text-amber-600" />
                  <span>
                    Costo anual total (CAT):{" "}
                    <strong className="text-gray-900">{option.cat}%</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                ${option.monthlyPayment.toLocaleString("es-MX")}
                <span className="text-xs font-normal text-gray-500"> /mes</span>
              </div>
              {option.estimatedSavings && (
                <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                  Ahorro: ~${option.estimatedSavings.toLocaleString("es-MX")}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
