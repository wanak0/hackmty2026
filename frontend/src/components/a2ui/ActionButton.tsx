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
      className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] ${
        isPrimary
          ? 'bg-[#EB0029] hover:bg-[#D40024] text-white shadow-banorte-red disabled:opacity-50'
          : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300'
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


