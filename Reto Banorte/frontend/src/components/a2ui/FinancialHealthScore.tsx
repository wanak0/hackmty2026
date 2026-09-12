import React from 'react';
import { panel, plainText } from './styles';

interface FinancialHealthScoreProps { score: number; scoreRange: string; dti: number; recommendations: string[]; }

export const FinancialHealthScore: React.FC<FinancialHealthScoreProps> = ({ score, scoreRange, dti, recommendations }) => (
  <section aria-label="Salud financiera" className="space-y-4 text-base text-[#222222]">
    <div className={panel}>
      <h3 className="text-xl font-semibold">Tu salud financiera</h3>
      <p className="mt-3">Puntaje crediticio</p>
      <p className="mt-1"><strong className="text-4xl font-semibold">{Number.isFinite(score) ? score : '—'}</strong> / 850</p>
      <p className="mt-2 font-semibold">{plainText(scoreRange)}</p>
      <div className="mt-5 rounded-xl bg-[#FBF1EA] p-4">
        <p className="mb-3 flex flex-wrap justify-between gap-2"><span>Relación deuda / ingresos (DTI)</span><strong>{Number.isFinite(dti) ? dti + '%' : 'No disponible'}</strong></p>
        {Number.isFinite(dti) && <div role="meter" aria-label="Relación deuda / ingresos" aria-valuemin={0} aria-valuemax={Math.max(100, dti)} aria-valuenow={Math.max(0, dti)} aria-valuetext={dti + '%'} className="h-3 overflow-hidden rounded-full bg-[#DED6D0]"><div className="h-full rounded-full bg-[#EC0000]" style={{ width: Math.max(0, Math.min(dti, 100)) + '%' }} /></div>}
      </div>
    </div>
    {recommendations.length > 0 && <div className={panel}><h3 className="mb-3 text-lg font-semibold">Recomendaciones</h3><ul className="list-disc space-y-3 pl-5">{recommendations.map((rec, index) => <li key={index}>{plainText(rec)}</li>)}</ul></div>}
  </section>
);
