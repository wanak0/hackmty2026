import React, { useState } from 'react';
import { ShieldCheck, DollarSign, Calendar } from 'lucide-react';

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
}

export const InvestmentSimulator: React.FC<InvestmentSimulatorProps> = ({
  amount: initialAmount,
  options
}) => {
  const [amount, setAmount] = useState<number>(initialAmount || 25000);
  const [days, setDays] = useState<number>(91);

  // Recalcular rendimientos basados en estado local
  const calculateEarnings = (principal: number, rate: number, termDays: number) => {
    const gross = (principal * (rate / 100) * termDays) / 360;
    const net = Math.round(gross * 0.995);
    return { net, total: principal + net };
  };

  return (
    <div className="space-y-4 mb-5">
      {/* Controles de Simulación Interactiva */}
      <div className="bg-[#15161c] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <div className="flex justify-between items-center text-xs text-zinc-400 mb-1.5 font-medium">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Monto a Invertir:
            </span>
            <span className="text-base font-bold text-white tracking-tight">
              ${amount.toLocaleString('es-MX')} MXN
            </span>
          </div>
          <input
            type="range"
            min="5000"
            max="150000"
            step="5000"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full accent-red-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
            <span>$5,000</span>
            <span>$50,000</span>
            <span>$150,000</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-xs text-zinc-400 mb-1.5 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-red-400" /> Plazo de Inversión:
            </span>
            <span className="text-sm font-bold text-white">{days} días</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[28, 91, 180, 360].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  days === d
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-[#1b1c24] border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {d} días
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Opciones de Inversión Renderizadas */}
      <div className="space-y-2.5">
        {options.map((opt) => {
          const res = calculateEarnings(amount, opt.annualRate, days);

          return (
            <div
              key={opt.id}
              className="bg-[#121318] border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{opt.name}</span>
                    <span className="text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                      {opt.tag}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Tasa fija anual: <strong className="text-emerald-400">{opt.annualRate}%</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-zinc-400">Rendimiento estimado:</div>
                  <div className="text-base font-bold text-emerald-400">
                    +${res.net.toLocaleString('es-MX')} MXN
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-zinc-800/80 flex justify-between items-center text-xs">
                <span className="text-zinc-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Capital asegurado
                </span>
                <span className="text-zinc-300 font-medium">
                  Total al vencer: <strong className="text-white">${res.total.toLocaleString('es-MX')} MXN</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
