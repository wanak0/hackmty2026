import React, { useState } from 'react';
import { ShieldCheck, DollarSign, Calendar, TrendingUp } from 'lucide-react';

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
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Simulador de Inversiones Banorte</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Tasa Fija Garantizada
          </span>
        </div>

        <div>
          <div className="flex justify-between items-center text-xs text-gray-600 mb-2 font-semibold">
            <span className="flex items-center gap-1.5 uppercase text-[11px]">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Monto a Invertir:
            </span>
            <span className="text-xl font-black text-gray-900 tracking-tight">
              ${amount.toLocaleString('es-MX')} <span className="text-xs text-gray-500 font-normal">MXN</span>
            </span>
          </div>
          <input
            type="range"
            min="5000"
            max="150000"
            step="5000"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full accent-[#EB0029] cursor-pointer h-2 bg-gray-200 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-gray-500 mt-1.5 font-mono">
            <span>$5,000</span>
            <span>$50,000</span>
            <span>$150,000 MXN</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-xs text-gray-600 mb-2 font-semibold">
            <span className="flex items-center gap-1.5 uppercase text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-[#EB0029]" /> Plazo en Días:
            </span>
            <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded border border-gray-200">
              {days} días
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[28, 91, 180, 360].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  days === d
                    ? 'bg-[#EB0029] text-white border-[#EB0029] shadow-xs'
                    : 'bg-[#F8F9FB] border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {d} días
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Opciones de Inversión Renderizadas */}
      <div className="space-y-3">
        {options.map((opt) => {
          const res = calculateEarnings(amount, opt.annualRate, days);

          return (
            <div
              key={opt.id}
              className="bg-white border border-gray-200 hover:border-emerald-500 rounded-2xl p-5 shadow-sm transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-gray-900">{opt.name}</span>
                    <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                      {opt.tag}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    GAT Nominal: <strong className="text-emerald-700 font-bold">{opt.annualRate}%</strong> anual fija
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-gray-500 uppercase font-semibold">Ganancia Neta:</div>
                  <div className="text-lg sm:text-xl font-black text-emerald-600">
                    +${res.net.toLocaleString('es-MX')} <span className="text-xs font-normal text-emerald-700">MXN</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                <span className="text-gray-500 flex items-center gap-1.5 text-[11px] font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Protegido IPAB (hasta 400 mil UDIS)</span>
                </span>
                <span className="text-gray-600 font-medium">
                  Saldo Total: <strong className="text-gray-900 font-bold">${res.total.toLocaleString('es-MX')} MXN</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


