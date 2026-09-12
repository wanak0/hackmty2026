import React from "react";
import { Icon } from "./Icon";

interface BarItem {
  label: string;
  value: number;
  color?: string;
  icon?: string;
  highlight?: boolean;
}

interface BarChartProps {
  title?: string;
  unit?: string;
  orientation?: "horizontal" | "vertical";
  bars: BarItem[];
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  unit = "MXN",
  orientation = "horizontal",
  bars = [],
}) => {
  const formatValue = (value: number) =>
    unit.startsWith("MXN")
      ? Number(value).toLocaleString("es-MX", {
          style: "currency",
          currency: "MXN",
        })
      : `${Number(value).toLocaleString("es-MX")} ${unit}`;
  const max = Math.max(...bars.map((b) => Number(b.value) || 0), 1);

  if (orientation === "vertical") {
    return (
      <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-3">
        {title && (
          <div className="flex items-center gap-2">
            <Icon name="chart-bar" tone="primary" size="sm" />
            <h4 className="text-sm font-black text-gray-900">{title}</h4>
          </div>
        )}
        <div className="flex items-end gap-3 h-52 pt-2">
          {bars.map((bar, idx) => {
            const h = Math.max(
              8,
              Math.round(((Number(bar.value) || 0) / max) * 100),
            );
            return (
              <div
                key={idx}
                className="h-full flex-1 flex flex-col items-center gap-1.5 min-w-0"
              >
                <span className="text-[10px] font-bold text-gray-600 w-full text-center">
                  {formatValue(bar.value)}
                </span>
                <div className="w-full h-28 flex items-end">
                  <div
                    className="w-full rounded-t-lg transition-all duration-700"
                    style={{
                      height: `${h}%`,
                      backgroundColor:
                        bar.color || (bar.highlight ? "#EB0029" : "#94A3B8"),
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase w-full text-center">
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
        {unit && (
          <p className="text-[10px] text-gray-400 font-medium">
            Unidad: {unit}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-3">
      {title && (
        <div className="flex items-center gap-2">
          <Icon name="chart-bar" tone="primary" size="sm" />
          <h4 className="text-sm font-black text-gray-900">{title}</h4>
        </div>
      )}
      <div className="space-y-3">
        {bars.map((bar, idx) => {
          const w = Math.max(
            4,
            Math.round(((Number(bar.value) || 0) / max) * 100),
          );
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {bar.icon && <Icon name={bar.icon} tone="muted" size="sm" />}
                  <span className="text-xs font-bold text-gray-700">
                    {bar.label}
                  </span>
                </div>
                <span className="text-xs font-black text-gray-900 shrink-0">
                  {formatValue(bar.value)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${w}%`,
                    backgroundColor: bar.color || "#EB0029",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {unit && (
        <p className="text-[10px] text-gray-400 font-medium">Unidad: {unit}</p>
      )}
    </div>
  );
};
