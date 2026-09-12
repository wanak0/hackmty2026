import React from 'react';
import { CheckCircle2, TrendingUp, AlertCircle, HeartPulse } from 'lucide-react';

interface FinancialHealthScoreProps {
  score: number;
  scoreRange: string;
  dti: number;
  recommendations: string[];
}

export const FinancialHealthScore: React.FC<FinancialHealthScoreProps> = ({
  score,
  scoreRange,
  dti,
  recommendations
}) => {
  return (
    <div className="space-y-4 mb-5">
      {/* Tarjeta de Score Principal Banorte */}
      <div className="bg-gradient-to-r from-white via-[#FFFBF0] to-white border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-wider">
              <HeartPulse className="w-3.5 h-3.5 text-[#E30613]" />
              <span>Score Crediticio & Buró Banorte</span>
            </div>
            <div className="flex items-baseline gap-2.5 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{score}</span>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase">
                {scoreRange} (Escala Banorte)
              </span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Nivel de Endeudamiento (DTI) */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
          <div className="flex justify-between text-xs text-gray-700 mb-2 font-semibold">
            <span>Uso de Línea de Crédito (DTI):</span>
            <span className="font-bold text-amber-700">{dti}% (Capacidad moderada)</span>
          </div>
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-gray-200">
            <div
              className="bg-gradient-to-r from-emerald-500 via-amber-500 to-[#E30613] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(dti, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1.5 font-medium">
            <span>Óptimo &lt; 30%</span>
            <span>Moderado 30-50%</span>
            <span>Riesgo &gt; 50%</span>
          </div>
        </div>
      </div>

      {/* Recomendaciones de Hábitos Banorte */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-600" /> Plan de Acción Financiero Recomendado:
        </span>
        <div className="space-y-2.5">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="text-xs text-gray-800 flex items-start gap-3 bg-[#F8F9FB] p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span className="leading-relaxed font-medium">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


