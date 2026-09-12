// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BanorteA2UICanvas } from "../src/components/a2ui/BanorteA2UICanvas";
import type { A2UIChatResponse } from "../src/types/a2ui";

const makeResponse = (
  components: Array<Record<string, unknown>>,
  dataModel: Record<string, unknown> = {},
): A2UIChatResponse => ({
  type: "a2ui_v09",
  surfaceId: "test",
  assistantMessage: "Revisa los datos de ejemplo.",
  messages: [
    {
      version: "v0.9",
      createSurface: {
        surfaceId: "test",
        catalogId: "a2ui-shadcn",
        sendDataModel: true,
      },
    },
    {
      version: "v0.9",
      updateDataModel: {
        surfaceId: "test",
        path: "/",
        value: dataModel,
      },
    },
    {
      version: "v0.9",
      updateComponents: {
        surfaceId: "test",
        components: [
          {
            id: "root",
            component: "Column",
            children: components.map((c) => String(c.id)),
          },
          ...components,
        ] as any,
      },
    },
  ],
});

afterEach(cleanup);

describe("A2UI v0.9 standard catalog (a2ui-shadcn)", () => {
  it("keeps edited TextField values and sends them on Button confirm", async () => {
    const onAction = vi.fn();
    render(
      <BanorteA2UICanvas
        onAction={onAction}
        response={makeResponse(
          [
            {
              id: "amount",
              component: "TextField",
              label: "Importe a transferir",
              value: { path: "/transfer/amount" },
            },
            {
              id: "concept",
              component: "TextField",
              label: "Concepto del envío",
              value: { path: "/transfer/concept" },
            },
            {
              id: "confirm",
              component: "Button",
              text: "Continuar",
              action: {
                event: {
                  name: "CONFIRM_TRANSFER",
                  context: {
                    recipient: { path: "/transfer/recipient" },
                    amount: { path: "/transfer/amount" },
                    concept: { path: "/transfer/concept" },
                  },
                },
              },
            },
          ],
          {
            transfer: {
              recipient: "Mamá",
              amount: "500",
              concept: "Apoyo",
            },
          },
        )}
      />,
    );

    const [amountInput, conceptInput] = screen.getAllByRole("textbox");
    fireEvent.change(amountInput, { target: { value: "750" } });
    fireEvent.change(conceptInput, { target: { value: "Despensa" } });
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onAction).toHaveBeenCalledExactlyOnceWith(
      "CONFIRM_TRANSFER",
      expect.objectContaining({
        amount: "750",
        concept: "Despensa",
        recipient: "Mamá",
      }),
    );
  });

  it("forwards Button action.event and disables while loading", async () => {
    const onAction = vi.fn();
    const data = makeResponse([
      {
        id: "pay",
        component: "Button",
        text: "Revisar pago",
        action: {
          event: {
            name: "PAY_CARD",
            context: { amount: 1200, cardId: "card_1" },
          },
        },
      },
    ]);
    const { rerender } = render(
      <BanorteA2UICanvas onAction={onAction} response={data} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Revisar pago" }));
    expect(onAction).toHaveBeenCalledWith(
      "PAY_CARD",
      expect.objectContaining({ amount: 1200, cardId: "card_1" }),
    );
    rerender(<BanorteA2UICanvas onAction={onAction} response={data} loading />);
    await userEvent.click(screen.getByRole("button", { name: "Revisar pago" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders ChoicePicker plans from dataModel", async () => {
    const onAction = vi.fn();
    render(
      <BanorteA2UICanvas
        onAction={onAction}
        response={makeResponse(
          [
            {
              id: "picker",
              component: "ChoicePicker",
              value: { path: "/plans/selectedPlanId" },
              options: [
                { label: "12 meses", value: "plan_12m" },
                { label: "18 meses", value: "plan_18m" },
              ],
            },
            {
              id: "apply",
              component: "Button",
              text: "Aplicar plan",
              action: {
                event: {
                  name: "APPLY_RESTRUCTURE",
                  context: { planId: { path: "/plans/selectedPlanId" } },
                },
              },
            },
          ],
          { plans: { selectedPlanId: "plan_18m" } },
        )}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText(/18 meses/i)).toBeTruthy();
    });
    await userEvent.click(screen.getByText(/12 meses/i));
    await userEvent.click(screen.getByRole("button", { name: "Aplicar plan" }));
    expect(onAction).toHaveBeenCalledWith(
      "APPLY_RESTRUCTURE",
      expect.objectContaining({ planId: "plan_12m" }),
    );
  });

  it("renders DonutChart from banorteChartRegistry", async () => {
    render(
      <BanorteA2UICanvas
        onAction={vi.fn()}
        response={makeResponse([
          {
            id: "donut",
            component: "DonutChart",
            title: "Gastos del mes",
            centerLabel: "Total",
            centerValue: "$3,840",
            segments: [
              { label: "Despensa", value: 2340.5, color: "#EB0029" },
              { label: "Otros", value: 1500, color: "#758894" },
            ],
          },
          {
            id: "bars",
            component: "BarChart",
            title: "Comparativa",
            bars: [
              { label: "12 meses", value: 1680 },
              { label: "18 meses", value: 1215, highlight: true },
            ],
          },
          {
            id: "usage",
            component: "ProgressBar",
            label: "Uso de línea",
            value: 52,
            max: 100,
            unit: "%",
          },
        ])}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText(/Gastos del mes/i)).toBeTruthy();
      expect(screen.getByText(/Comparativa/i)).toBeTruthy();
      expect(screen.getByText(/Uso de línea/i)).toBeTruthy();
      expect(screen.getByText(/Despensa/i)).toBeTruthy();
    });
  });
});
