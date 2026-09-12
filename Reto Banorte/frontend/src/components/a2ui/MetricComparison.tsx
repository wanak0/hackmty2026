import React from 'react';
import { money, panel } from './styles';

interface MetricComparisonProps { balance: number; currentCat: number; preferentialCat: number; estimatedSavings?: number; }

const rate = (value: number) => Number.isFinite(value) ? value + '%' : 'No disponible';

export const MetricComparison: React.FC<MetricComparisonProps> = ({ balance, currentCat, preferentialCat, estimatedSavings }) => (
  <dl className="grid grid-cols-1 gap-3 text-base text-[#222222] lg:grid-cols-3">
    <div className={panel}><dt>Saldo a reestructurar</dt><dd className="mt-2 break-words text-2xl font-semibold">{money(balance)}</dd></div>
    <div className={panel}><dt>Costo anual total (CAT)</dt><dd className="mt-2 space-y-1"><p>Actual: {rate(currentCat)}</p><p className="font-semibold">{Number.isFinite(currentCat) && preferentialCat < currentCat ? 'Preferencial' : 'Propuesto'}: {rate(preferentialCat)}</p></dd></div>
    <div className="rounded-2xl border border-[#DED6D0] bg-[#FBF1EA] p-5 sm:p-6"><dt>Ahorro estimado</dt><dd className="mt-2 break-words text-2xl font-semibold">{typeof estimatedSavings === 'number' && Number.isFinite(estimatedSavings) ? money(estimatedSavings) : 'No calculado'}</dd></div>
  </dl>
);
