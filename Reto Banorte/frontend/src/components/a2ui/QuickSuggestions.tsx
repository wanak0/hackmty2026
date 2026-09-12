import React from 'react';
import { ArrowRight } from 'lucide-react';
import { plainText, secondaryButton } from './styles';

interface QuickSuggestionsProps { suggestions: string[]; onSelectSuggestion: (text: string) => void; disabled?: boolean; }

export const QuickSuggestions: React.FC<QuickSuggestionsProps> = ({ suggestions, onSelectSuggestion, disabled = false }) => (
  <section className="space-y-3 text-base text-[#222222]" aria-label="Sugerencias">
    <h3 className="font-semibold">¿Qué necesitas hacer?</h3>
    <div className="grid gap-3 sm:grid-cols-2">
      {suggestions.map((suggestion, index) => <button key={index} type="button" disabled={disabled} onClick={() => onSelectSuggestion(suggestion)} className={secondaryButton + ' flex items-center justify-between gap-3 text-left'}><span>{plainText(suggestion)}</span><ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-[#EC0000]" /></button>)}
    </div>
  </section>
);
