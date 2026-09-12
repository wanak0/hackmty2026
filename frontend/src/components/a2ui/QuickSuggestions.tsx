import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

interface QuickSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (text: string) => void;
}

export const QuickSuggestions: React.FC<QuickSuggestionsProps> = ({
  suggestions,
  onSelectSuggestion,
}) => {
  return (
    <div className="space-y-2.5 mb-4">
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#EB0029]" /> Consultas sugeridas
        por Maya Banorte:
      </span>
      <div className="flex flex-col gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSuggestion(suggestion)}
            className="w-full text-left p-3.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 hover:border-[#EB0029] text-xs text-gray-800 hover:text-gray-900 transition-all flex items-center justify-between group shadow-xs"
          >
            <span className="font-semibold">"{suggestion}"</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#EB0029] group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
};
