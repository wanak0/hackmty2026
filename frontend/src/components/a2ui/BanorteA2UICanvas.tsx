import { A2UISurface } from "a2ui-shadcn";
import type { ActionMessage } from "a2ui-shadcn";
import { banorteA2UITheme, type A2UIChatResponse } from "@/types/a2ui";
import { banorteChartRegistry } from "./chartRegistry";

interface A2UICanvasProps {
  response: A2UIChatResponse;
  onAction: (actionType: string, payload?: Record<string, unknown>) => void;
  loading?: boolean;
}

function flattenPayload(action: ActionMessage["action"]): Record<string, unknown> {
  const context = { ...(action.context || {}) };
  const dataModel = { ...(action.dataModel || {}) } as Record<string, unknown>;
  const transfer = dataModel.transfer as Record<string, unknown> | undefined;
  const plans = dataModel.plans as Record<string, unknown> | undefined;
  const investment = dataModel.investment as Record<string, unknown> | undefined;
  const payment = dataModel.payment as Record<string, unknown> | undefined;

  return {
    ...dataModel,
    ...context,
    ...(transfer || {}),
    ...(investment || {}),
    ...(payment || {}),
    ...(plans?.selectedPlanId ? { planId: plans.selectedPlanId } : {}),
  };
}

/** Lienzo A2UI v0.9: catálogo a2ui-shadcn + gráficas Banorte (Donut/Bar/Progress). */
export function BanorteA2UICanvas({
  response,
  onAction,
  loading = false,
}: A2UICanvasProps) {
  const handleAction = (action: ActionMessage["action"]) => {
    if (loading) return;
    onAction(action.name, flattenPayload(action));
  };

  return (
    <div
      className={`a2ui-canvas ${loading ? "opacity-70 pointer-events-none" : ""}`}
      aria-busy={loading}
    >
      <A2UISurface
        key={`${response.surfaceId}-${response.messages.length}`}
        surfaceId={response.surfaceId}
        messages={response.messages}
        theme={banorteA2UITheme}
        componentRegistry={banorteChartRegistry}
        onAction={handleAction}
        className="a2ui-surface space-y-4"
      />
    </div>
  );
}
