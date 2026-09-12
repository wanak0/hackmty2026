import React from 'react';
import { TrendingDown, ArrowDownRight, ShieldCheck } from 'lucide-react';

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
  estimatedSavings
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
      {/* Saldo a Reestructurar */}
      <div className="bg-[#18191e] border border-[#272832] rounded-xl p-3.5 shadow-sm">
        <span className="text-xs font-medium text-zinc-400 block mb-1">Saldo a Reestructurar</span>
        <div className="text-xl font-bold text-white tracking-tight">
          ${balance.toLocaleString('es-MX')} <span className="text-xs font-normal text-zinc-500">MXN</span>
        </div>
        <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Tarjeta Banorte Oro
        </div>
      </div>

      {/* Reducción de CAT */}
      <div className="bg-[#18191e] border border-[#272832] rounded-xl p-3.5 shadow-sm">
        <span className="text-xs font-medium text-zinc-400 block mb-1">Reducción de CAT</span>
        <div className="flex items-baseline gap-2">
          <span className="text-sm line-through text-zinc-500">{currentCat}%</span>
          <span className="text-xl font-bold text-emerald-400 tracking-tight">{preferentialCat}%</span>
        </div>
        <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
          <TrendingDown className="w-3 h-3" /> Tasa fija congelada
        </div>
      </div>

      {/* Ahorro Estimado */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 shadow-sm">
        <span className="text-xs font-medium text-emerald-300 block mb-1">Ahorro Proyectado</span>
        <div className="text-xl font-bold text-emerald-400 tracking-tight">
          ${estimatedSavings.toLocaleString('es-MX')} <span className="text-xs font-normal text-emerald-400/80">MXN</span>
        </div>
        <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
          <ArrowDownRight className="w-3 h-3" /> vs pagar sólo el mínimo
        </div>
      </div>
    </div>
  );
};
