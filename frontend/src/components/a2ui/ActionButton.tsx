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
      className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.98] ${
        isPrimary
          ? 'bg-[#E30613] hover:bg-[#C10510] text-white shadow-banorte-red disabled:opacity-50'
          : 'bg-white hover:bg-[#FAFAFA] text-[#1A1A1A] border border-[#E6E6E6]'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Procesando en Core Bancario Banorte...</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          {isPrimary && <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
        </>
      )}
    </button>
  );
};


