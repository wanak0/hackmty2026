import React from "react";
import { Icon } from "./Icon";

interface Segment {
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  title?: string;
  centerLabel?: string;
  centerValue?: string;
  segments: Segment[];
}

const DEFAULT_COLORS = [
  "#EB0029",
  "#8F0017",
  "#B66D7A",
  "#323E48",
  "#758894",
  "#C1CBD0",
];

export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  centerLabel = "Total",
  centerValue,
  segments = [],
}) => {
  const total = segments.reduce((acc, s) => acc + (Number(s.value) || 0), 0);
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-3">
      {title && (
        <div className="flex items-center gap-2">
          <Icon name="chart-pie" tone="primary" size="sm" />
          <h4 className="text-sm font-black text-gray-900">{title}</h4>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-40 h-40 shrink-0">
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="w-full h-full -rotate-90"
          >
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="12"
            />
            {segments.map((seg, idx) => {
              const val = Number(seg.value) || 0;
              const len = (val / (total || 1)) * c;
              const dash = `${len} ${c - len}`;
              const el = (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={
                    seg.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
                  }
                  strokeWidth="12"
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += len;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase">
              {centerLabel}
            </span>
            <span className="text-sm font-black text-gray-900 leading-tight">
              {centerValue ||
                `$${total.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>
        <div className="flex-1 w-full space-y-2">
          {segments.map((seg, idx) => {
            const pct = Math.round(
              ((Number(seg.value) || 0) / (total || 1)) * 100,
            );
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        seg.color ||
                        DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                    }}
                  />
                  <span className="font-bold text-gray-700">{seg.label}</span>
                </div>
                <span className="font-black text-gray-900 shrink-0">
                  $
                  {Number(seg.value).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  · {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
