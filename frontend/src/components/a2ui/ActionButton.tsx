import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface ActionButtonProps {
  label: string;
  actionType: string;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  onClick: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  variant = 'primary',
  loading = false,
  onClick
}) => {
  const isPrimary = variant === 'primary';

  return (
    <button
      disabled={loading}
      onClick={onClick}
      className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
        isPrimary
          ? 'bg-[#EB0029] hover:bg-[#c90022] text-white active:scale-[0.99] disabled:opacity-60'
          : 'bg-[#181920] hover:bg-[#23242c] text-zinc-200 border border-[#2d2f3c] active:scale-[0.99]'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Procesando en Core Bancario...</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          {isPrimary && <ArrowRight className="w-4 h-4" />}
        </>
      )}
    </button>
  );
};
