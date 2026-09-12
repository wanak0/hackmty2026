import React from 'react';
import { Icon } from './Icon';

interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  tone?: 'success' | 'warning' | 'danger' | 'primary' | string;
  icon?: string;
  subtext?: string;
}

const BAR_TONE: Record<string, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-[#EB0029]',
  primary: 'bg-[#EB0029]'
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  max = 100,
  unit = '%',
  tone = 'primary',
  icon,
  subtext
}) => {
  const pct = Math.max(0, Math.min(100, max > 0 ? (Number(value) / Number(max)) * 100 : 0));

  return (
    <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <Icon name={icon} tone={tone} size="sm" />}
          <span className="text-xs font-bold text-gray-800 truncate">{label}</span>
        </div>
        <span className="text-sm font-black text-gray-900 shrink-0">
          {Number(value).toLocaleString('es-MX')}
          {unit}
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            BAR_TONE[tone] || BAR_TONE.primary
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {subtext && <p className="text-[11px] text-gray-500 font-medium">{subtext}</p>}
    </div>
  );
};
