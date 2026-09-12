import React from 'react';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AlertBannerProps {
  variant?: 'info' | 'warning' | 'success';
  message: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  variant = 'info',
  message
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          container: 'bg-amber-950/30 border-amber-500/40 text-amber-200',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        };
      case 'success':
        return {
          container: 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        };
      default:
        return {
          container: 'bg-blue-950/30 border-blue-500/40 text-blue-200',
          icon: <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        };
    }
  };

  const style = getStyles();

  return (
    <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed mb-4 shadow-sm ${style.container}`}>
      {style.icon}
      <span>{message}</span>
    </div>
  );
};
