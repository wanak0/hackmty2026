import React from "react";
import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";

interface AlertBannerProps {
  variant?: "info" | "warning" | "success";
  message: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  variant = "info",
  message,
}) => {
  const getStyles = () => {
    switch (variant) {
      case "warning":
        return {
          container: "bg-amber-50 border-amber-200 text-amber-900",
          icon: (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          ),
        };
      case "success":
        return {
          container: "bg-emerald-50 border-emerald-200 text-emerald-900",
          icon: (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ),
        };
      default:
        return {
          container: "bg-[#FFF0F1] border-[#F3C5C8] text-[#900018]",
          icon: <Info className="w-4 h-4 text-[#EB0029] shrink-0 mt-0.5" />,
        };
    }
  };

  const style = getStyles();

  return (
    <div
      className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed mb-4 shadow-xs ${style.container}`}
    >
      {style.icon}
      <span className="font-semibold">{message}</span>
    </div>
  );
};
