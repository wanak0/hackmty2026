// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatContainer } from "../src/components/chat/ChatContainer";
const bankStatus = {
  user: { name: "Carlos Mendoza", checkingBalance: 14500 },
  totalDebt: 18400,
  cards: [],
};
const paymentScreen = {
  type: "a2ui_screen",
  screenId: "payment",
  assistantMessage: "Revisa tu pago.",
  components: [
    {
      id: "pay",
      type: "ActionButton",
      props: { actionType: "PAY_CARD", label: "Pagar 100 pesos", amount: 100 },
    },
  ],
};
beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("reviews a payment, supports cancellation, and sends only one confirmed action", async () => {
  const chatRequests: Record<string, any>[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options?: RequestInit) => {
      if (url === "/api/chat") {
        chatRequests.push(JSON.parse(options!.body as string));
        return { ok: true, json: async () => paymentScreen };
      }
      return { ok: true, json: async () => bankStatus };
    }),
  );
  render(<ChatContainer onBackToLanding={vi.fn()} />);
  await userEvent.click(
    screen.getByRole("button", {
      name: /Pagar mi tarjeta/,
    }),
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Pagar 100 pesos" }),
  );
  expect(
    screen.getByRole("dialog", { name: "Revisa antes de confirmar" }),
  ).toBeTruthy();
  expect(screen.getByText("$100.00")).toBeTruthy();
  expect(chatRequests).toHaveLength(1);
  await userEvent.click(
    screen.getByRole("button", { name: "Volver", exact: true }),
  );
  expect(chatRequests).toHaveLength(1);
  await userEvent.click(
    screen.getByRole("button", { name: "Pagar 100 pesos" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Confirmar en la demo" }),
  );
  await waitFor(() => expect(chatRequests).toHaveLength(2));
  expect(chatRequests[1].context).toMatchObject({
    action: "PAY_CARD",
    amount: 100,
    userId: "usr_carlos_01",
  });
});

it("does not automatically replay failed chat requests", async () => {
  let requests = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url === "/api/chat") {
        requests++;
        return { ok: false };
      }
      return { ok: true, json: async () => bankStatus };
    }),
  );
  render(<ChatContainer onBackToLanding={vi.fn()} />);
  await userEvent.click(
    screen.getByRole("button", {
      name: /Ver mi saldo/,
    }),
  );
  await screen.findByRole("alert");
  expect(requests).toBe(1);
  expect(screen.getByText(/No pudimos obtener una respuesta/)).toBeTruthy();
});
