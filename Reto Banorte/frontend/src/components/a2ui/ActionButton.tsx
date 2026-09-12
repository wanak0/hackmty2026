import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { focus, plainText, secondaryButton } from './styles';

interface ActionButtonProps {
  label: string;
  actionType: string;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  describedBy?: string;
  onClick: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ label, variant = 'primary', loading = false, disabled = false, describedBy, onClick }) => (
  <button type="button" disabled={loading || disabled} aria-busy={loading} aria-describedby={describedBy} onClick={onClick}
    className={'flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl px-5 py-3 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60 ' + (variant === 'primary' ? 'bg-[#EC0000] text-[#FFFFFF] hover:bg-[#CE0000] ' + focus : secondaryButton)}>
    {loading && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" />}
    <span>{loading ? 'Procesando…' : plainText(label)}</span>
    {!loading && variant === 'primary' && <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0" />}
  </button>
);
