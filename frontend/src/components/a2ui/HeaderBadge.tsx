import React from 'react';
import { Sparkles } from 'lucide-react';

interface HeaderBadgeProps {
  tag: string;
  title: string;
}

export const HeaderBadge: React.FC<HeaderBadgeProps> = ({ tag, title }) => {
  return (
    <div className="mb-4">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-semibold tracking-wider uppercase mb-2">
        <Sparkles className="w-3.5 h-3.5" />
        {tag}
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
    </div>
  );
};
