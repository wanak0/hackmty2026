// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { A2UIRenderer } from "../src/components/a2ui/A2UIRenderer";
import { A2UIScreen } from "../src/types/a2ui";

const makeScreen = (components: A2UIScreen["components"]): A2UIScreen => ({
  type: "a2ui_screen",
  screenId: "test",
  assistantMessage: "Revisa los datos de ejemplo.",
  components,
});
afterEach(cleanup);

describe("A2UI interaction contract", () => {
  it("keeps edited transfer values stable and sends them on confirmation", async () => {
    const onAction = vi.fn();
    render(
      <A2UIRenderer
        onAction={onAction}
        screen={makeScreen([
          {
            id: "transfer",
            type: "TransferCard",
            props: {
              recipient: "Mamá",
              amount: 500,
              concept: "Apoyo",
              sourceAccount: "Enlace Digital",
            },
          },
          {
            id: "confirm",
            type: "ActionButton",
            props: {
              label: "Continuar",
              actionType: "CONFIRM_TRANSFER",
              amount: 500,
              recipient: "Mamá",
            },
          },
        ])}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Modificar" }));
    fireEvent.change(screen.getByLabelText("Importe a transferir"), {
      target: { value: "750" },
    });
    fireEvent.change(screen.getByLabelText("Concepto del envío"), {
      target: { value: "Despensa" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onAction).toHaveBeenCalledExactlyOnceWith(
      "CONFIRM_TRANSFER",
      expect.objectContaining({
        amount: 750,
        concept: "Despensa",
        recipient: "Mamá",
      }),
    );
  });

  it("forwards ActionList payloads and disables every nested action while waiting", async () => {
    const onAction = vi.fn();
    const data = makeScreen([
      {
        id: "list",
        type: "ActionList",
        props: {
          actions: [
            {
              label: "Revisar pago",
              actionType: "PAY_CARD",
              payload: { amount: 1200, cardId: "card_1" },
            },
          ],
        },
      },
    ]);
    const { rerender } = render(
      <A2UIRenderer onAction={onAction} screen={data} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Revisar pago" }));
    expect(onAction).toHaveBeenCalledWith(
      "PAY_CARD",
      expect.objectContaining({ amount: 1200, cardId: "card_1" }),
    );
    rerender(<A2UIRenderer onAction={onAction} screen={data} loading />);
    await userEvent.click(screen.getByRole("button", { name: "Revisar pago" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("lets keyboard users update a slider deliberately, with the visible value", async () => {
    const onAction = vi.fn();
    render(
      <A2UIRenderer
        onAction={onAction}
        screen={makeScreen([
          {
            id: "slider",
            type: "SliderInput",
            props: {
              label: "Importe",
              min: 0,
              max: 10000,
              step: 100,
              defaultValue: 1000,
              actionType: "SLIDER_CHANGE",
            },
          },
        ])}
      />,
    );
    fireEvent.change(screen.getByLabelText("Importe"), {
      target: { value: "2400" },
    });
    expect(onAction).not.toHaveBeenCalled();
    screen.getByRole("button", { name: "Actualizar consulta" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(onAction).toHaveBeenCalledExactlyOnceWith("SLIDER_CHANGE", {
      value: 2400,
    });
  });

  it("uses MCP investment results and requests a new calculation before confirming changed inputs", async () => {
    const onAction = vi.fn();
    render(
      <A2UIRenderer
        onAction={onAction}
        screen={makeScreen([
          {
            id: "investment",
            type: "InvestmentSimulator",
            props: {
              amount: 5000,
              initialDays: 28,
              options: [
                {
                  id: "pagare",
                  name: "Pagaré",
                  annualRate: 11.25,
                  termDays: 28,
                  profitNet: 44,
                  totalFinal: 5044,
                },
              ],
            },
          },
        ])}
      />,
    );
    expect(screen.getByText("$44.00")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "91 días" }));
    expect(
      screen.queryByRole("button", { name: "Revisar esta inversión" }),
    ).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Actualizar cálculo" }),
    );
    await waitFor(() =>
      expect(onAction).toHaveBeenCalledExactlyOnceWith("USER_PROMPT", {
        text: "Simula una inversión de 5000 pesos a 91 días",
      }),
    );
  });

  it("renders non-restructure receipts without inventing a monthly payment", () => {
    render(
      <A2UIRenderer
        onAction={vi.fn()}
        screen={makeScreen([
          {
            id: "receipt",
            type: "ConfirmationCard",
            props: { operationId: "SPEI-TEST", amount: 750, recipient: "Mamá" },
          },
        ])}
      />,
    );
    expect(screen.getByText("SPEI-TEST")).toBeTruthy();
    expect(screen.getByText("$750.00")).toBeTruthy();
    expect(screen.queryByText("Tu pago mensual")).toBeNull();
  });
});
