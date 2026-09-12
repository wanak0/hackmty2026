import React from "react";
import { Sparkles, Shield } from "lucide-react";

interface HeaderBadgeProps {
  tag: string;
  title: string;
}

export const HeaderBadge: React.FC<HeaderBadgeProps> = ({ tag, title }) => {
  return (
    <div className="mb-5 pb-3 border-b border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F1] border border-[#F3C5C8] text-[#EB0029] text-[11px] font-bold tracking-wider uppercase shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#EB0029]" />
          {tag}
        </span>
        <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-emerald-600" /> Maya AI · Banorte
          Móvil
        </span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
        {title}
      </h2>
    </div>
  );
};
