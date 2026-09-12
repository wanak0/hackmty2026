import React from "react";
import { Icon } from "./Icon";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatTileProps {
  icon?: string;
  label: string;
  value: string;
  subtext?: string;
  tone?: string;
  trend?: "positive" | "negative" | "neutral";
}

export const StatTile: React.FC<StatTileProps> = ({
  icon = "sparkles",
  label,
  value,
  subtext,
  tone = "primary",
  trend,
}) => {
  return (
    <div className="p-3.5 rounded-2xl border border-gray-200 bg-white shadow-xs flex gap-3 items-start">
      <Icon name={icon} tone={tone} size="md" />
      <div className="min-w-0 flex-1">
        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
          {label}
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-lg font-black text-gray-900 tracking-tight truncate">
            {value}
          </span>
          {trend === "positive" && (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          )}
          {trend === "negative" && (
            <TrendingDown className="w-3.5 h-3.5 text-[#EB0029] shrink-0" />
          )}
        </div>
        {subtext && (
          <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
