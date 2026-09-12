import type { ComponentAdapterProps, ComponentRegistry } from "a2ui-shadcn";
import { DonutChart } from "./DonutChart";
import { BarChart } from "./BarChart";
import { ProgressBar } from "./ProgressBar";

type Segment = { label: string; value: number; color?: string };
type BarItem = {
  label: string;
  value: number;
  color?: string;
  icon?: string;
  highlight?: boolean;
};

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toSegments(raw: unknown): Segment[] {
  return asArray(raw)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? row.category ?? row.name ?? "");
      const value = Number(row.value ?? row.amount ?? 0);
      if (!label || !Number.isFinite(value)) return null;
      return {
        label,
        value,
        ...(typeof row.color === "string" ? { color: row.color } : {}),
      };
    })
    .filter(Boolean) as Segment[];
}

function toBars(raw: unknown): BarItem[] {
  return asArray(raw)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? row.plazo ?? row.name ?? "");
      const value = Number(row.value ?? row.monthlyPayment ?? row.amount ?? 0);
      if (!label || !Number.isFinite(value)) return null;
      return {
        label,
        value,
        ...(typeof row.color === "string" ? { color: row.color } : {}),
        ...(typeof row.icon === "string" ? { icon: row.icon } : {}),
        ...(row.highlight ? { highlight: true } : {}),
      };
    })
    .filter(Boolean) as BarItem[];
}

function DonutChartAdapter({ component, resolveValue }: ComponentAdapterProps) {
  const segments = toSegments(
    resolveValue(
      (component.segments ?? component.data ?? component.items) as any,
      [],
    ),
  );
  const title = String(resolveValue(component.title as any, "") || "");
  const centerLabel = String(
    resolveValue(component.centerLabel as any, "Total") || "Total",
  );
  const centerValueRaw = resolveValue(component.centerValue as any, "");
  const centerValue =
    centerValueRaw == null || centerValueRaw === ""
      ? undefined
      : String(centerValueRaw);

  return (
    <DonutChart
      title={title || undefined}
      centerLabel={centerLabel}
      centerValue={centerValue}
      segments={segments}
    />
  );
}

function BarChartAdapter({ component, resolveValue }: ComponentAdapterProps) {
  const bars = toBars(
    resolveValue(
      (component.bars ?? component.items ?? component.data) as any,
      [],
    ),
  );
  const title = String(resolveValue(component.title as any, "") || "");
  const unit = String(resolveValue(component.unit as any, "MXN") || "MXN");
  const orientation =
    resolveValue(component.orientation as any, "horizontal") === "vertical"
      ? "vertical"
      : "horizontal";

  return (
    <BarChart
      title={title || undefined}
      unit={unit}
      orientation={orientation}
      bars={bars}
    />
  );
}

function ProgressBarAdapter({ component, resolveValue }: ComponentAdapterProps) {
  const label = String(
    resolveValue(
      (component.label ?? component.text ?? component.title) as any,
      "Progreso",
    ) || "Progreso",
  );
  const value = Number(resolveValue(component.value as any, 0) ?? 0);
  const max = Number(resolveValue(component.max as any, 100) ?? 100);
  const unit = String(resolveValue(component.unit as any, "%") || "%");
  const tone = String(resolveValue(component.tone as any, "primary") || "primary");
  const icon = resolveValue(component.icon as any, undefined);
  const subtextRaw = resolveValue(component.subtext as any, "");
  const subtext =
    subtextRaw == null || subtextRaw === "" ? undefined : String(subtextRaw);

  return (
    <ProgressBar
      label={label}
      value={Number.isFinite(value) ? value : 0}
      max={Number.isFinite(max) && max > 0 ? max : 100}
      unit={unit}
      tone={tone}
      icon={typeof icon === "string" ? icon : undefined}
      subtext={subtext}
    />
  );
}

/** Extra Banorte chart types on top of a2ui-shadcn defaultRegistry. */
export const banorteChartRegistry: ComponentRegistry = {
  DonutChart: DonutChartAdapter,
  BarChart: BarChartAdapter,
  ProgressBar: ProgressBarAdapter,
};
