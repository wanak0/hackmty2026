import React from "react";
import {
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Shield,
  Sparkles,
  Banknote,
  ArrowRightLeft,
  Receipt,
  PieChart,
  BarChart3,
  HeartPulse,
  Target,
  Zap,
  ShoppingBag,
  Car,
  Home,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Percent,
  Calendar,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  wallet: Wallet,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  shield: Shield,
  sparkles: Sparkles,
  banknote: Banknote,
  "arrow-right-left": ArrowRightLeft,
  receipt: Receipt,
  "chart-pie": PieChart,
  "chart-bar": BarChart3,
  "heart-pulse": HeartPulse,
  target: Target,
  zap: Zap,
  "shopping-bag": ShoppingBag,
  car: Car,
  home: Home,
  "check-circle": CheckCircle2,
  "alert-triangle": AlertTriangle,
  coins: Coins,
  percent: Percent,
  calendar: Calendar,
};

const TONE_CLASS: Record<string, string> = {
  primary: "text-[#EB0029] bg-[#FFF0F1] border-[#F3C5C8]",
  success: "text-emerald-700 bg-emerald-50 border-emerald-200",
  warning: "text-amber-700 bg-amber-50 border-amber-200",
  danger: "text-red-700 bg-red-50 border-red-200",
  info: "text-blue-700 bg-blue-50 border-blue-200",
  muted: "text-gray-600 bg-gray-50 border-gray-200",
};

interface IconProps {
  name?: string;
  tone?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Icon: React.FC<IconProps> = ({
  name = "sparkles",
  tone = "primary",
  size = "md",
  className = "",
}) => {
  const Lucide = ICON_MAP[name] || Sparkles;
  const box =
    size === "sm"
      ? "w-7 h-7 rounded-lg"
      : size === "lg"
        ? "w-11 h-11 rounded-2xl"
        : "w-9 h-9 rounded-xl";
  const glyph =
    size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4";

  return (
    <span
      className={`inline-flex items-center justify-center border ${box} ${
        TONE_CLASS[tone] || TONE_CLASS.primary
      } ${className}`}
    >
      <Lucide className={glyph} />
    </span>
  );
};

export function resolveLucideIcon(name?: string): LucideIcon {
  return ICON_MAP[name || ""] || Sparkles;
}
