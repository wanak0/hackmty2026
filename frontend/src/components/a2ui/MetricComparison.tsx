import React from "react";
import {
  TrendingDown,
  ArrowDownRight,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

interface MetricComparisonProps {
  balance: number;
  currentCat: number;
  preferentialCat: number;
  estimatedSavings: number;
}

export const MetricComparison: React.FC<MetricComparisonProps> = ({
  balance,
  currentCat,
  preferentialCat,
  estimatedSavings,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5">
      {/* Saldo a Reestructurar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm transition-all hover:border-gray-300">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Saldo Revolvente
          </span>
          <CreditCard className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-black text-gray-900 tracking-tight">
          ${balance.toLocaleString("es-MX")}{" "}
          <span className="text-xs font-normal text-gray-500">MXN</span>
        </div>
        <div className="text-[11px] text-gray-600 mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Tarjeta Banorte Por Ti Oro (•••• 4821)</span>
        </div>
      </div>

      {/* Reducción de CAT */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm transition-all hover:border-gray-300">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Tasa Preferencial CAT
          </span>
          <TrendingDown className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-2.5">
          <span className="text-sm line-through text-gray-400 font-semibold">
            {currentCat}%
          </span>
          <span className="text-2xl font-black text-emerald-600 tracking-tight">
            {preferentialCat}%
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            FIJA
          </span>
        </div>
        <div className="text-[11px] text-emerald-700 mt-2 pt-2 border-t border-gray-100 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Congelada durante todo el plazo</span>
        </div>
      </div>

      {/* Ahorro Estimado */}
      <div className="bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-200 rounded-2xl p-4 shadow-sm transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Ahorro Proyectado
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="text-2xl font-black text-emerald-600 tracking-tight">
          ${estimatedSavings.toLocaleString("es-MX")}{" "}
          <span className="text-xs font-normal text-emerald-700">MXN</span>
        </div>
        <div className="text-[11px] text-emerald-700 mt-2 pt-2 border-t border-emerald-100 flex items-center gap-1 font-medium">
          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
          <span>Frente a pago mínimo regular</span>
        </div>
      </div>
    </div>
  );
};
