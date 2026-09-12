import React from 'react';
import { ArrowRight } from 'lucide-react';

interface QuickSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (text: string) => void;
}

export const QuickSuggestions: React.FC<QuickSuggestionsProps> = ({
  suggestions,
  onSelectSuggestion
}) => {
  return (
    <div className="space-y-2 mb-4">
      <span className="text-xs font-medium text-zinc-400 block">Sugerencias rápidas para probar:</span>
      <div className="flex flex-col gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSuggestion(suggestion)}
            className="w-full text-left p-3 rounded-xl bg-[#17181f] hover:bg-[#20222c] border border-[#272936] hover:border-red-500/40 text-xs text-zinc-200 hover:text-white transition-all flex items-center justify-between group"
          >
            <span>"{suggestion}"</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
};
