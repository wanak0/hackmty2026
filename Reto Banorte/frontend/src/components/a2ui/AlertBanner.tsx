import React from 'react';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { plainText } from './styles';

interface AlertBannerProps { variant?: 'info' | 'warning' | 'success'; message: string; }

export const AlertBanner: React.FC<AlertBannerProps> = ({ variant = 'info', message }) => {
  const Icon = variant === 'warning' ? AlertTriangle : variant === 'success' ? CheckCircle2 : Info;
  return (
    <div role={variant === 'warning' ? 'alert' : 'status'} className="flex items-start gap-3 rounded-xl border border-[#DED6D0] border-l-4 border-l-[#EC0000] bg-[#FBF1EA] p-4 text-base leading-relaxed text-[#222222]">
      <Icon aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[#B80000]" />
      <p><span className="font-semibold">{variant === 'warning' ? 'Atención. ' : variant === 'success' ? 'Confirmación. ' : 'Información. '}</span>{plainText(message)}</p>
    </div>
  );
};
