import React from 'react';
import { CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';

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
      {/* Tarjeta de Score Principal */}
      <div className="bg-gradient-to-r from-[#181922] to-[#121319] border border-amber-500/30 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs text-zinc-400 font-medium">Score Crediticio Banorte</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-extrabold text-white tracking-tight">{score}</span>
              <span className="text-xs font-semibold text-amber-400">/ 850 ({scoreRange})</span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Nivel de Endeudamiento (DTI) */}
        <div className="bg-[#0e0f14] rounded-xl p-3 border border-zinc-800/80">
          <div className="flex justify-between text-xs text-zinc-300 mb-1.5 font-medium">
            <span>Nivel de Endeudamiento en Tarjeta (DTI):</span>
            <span className="font-bold text-red-400">{dti}% (Atención requerida)</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 h-full rounded-full"
              style={{ width: `${Math.min(dti, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recomendaciones de Hábitos */}
      <div className="bg-[#14151b] border border-zinc-800 rounded-xl p-4 space-y-2.5">
        <span className="text-xs font-semibold text-zinc-300 block flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-400" /> Plan de Acción Recomendado:
        </span>
        <div className="space-y-2">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="text-xs text-zinc-300 flex items-start gap-2 bg-[#1a1c24] p-2.5 rounded-lg border border-zinc-800/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
