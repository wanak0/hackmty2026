import assert from "node:assert/strict";
import { normalizeA2UIScreen, processUserMessage } from "./src/agent/ollama.js";
import { loadBankData } from "./src/mcp/tools.js";

async function main() {
  const nested = normalizeA2UIScreen({
    type: "a2ui_v09",
    surfaceId: "nested",
    assistantMessage: "Consulta",
    messages: [
      {
        version: "v0.9",
        createSurface: {
          surfaceId: "nested",
          catalogId: "banorte",
          sendDataModel: true,
        },
      },
      {
        version: "v0.9",
        updateDataModel: {
          surfaceId: "nested",
          path: "/",
          value: {
            note: "Movimiento conservado",
            stats: { checking: "$12,785", debt: "$17,185" },
          },
        },
      },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "nested",
          components: [
            {
              id: "root",
              component: "Column",
              children: ["card"],
            },
            {
              id: "card",
              component: "Card",
              children: ["text", "bad"],
            },
            {
              id: "text",
              component: "Text",
              text: { path: "/note" },
            },
            {
              id: "bad",
              component: "Text",
              text: { path: "/stats" },
            },
            {
              id: "stat",
              component: "Card",
              children: ["stat_text"],
            },
            {
              id: "stat_text",
              component: "Text",
              text: "Saldo",
            },
            {
              id: "chart",
              component: "DataTable",
              columns: [{ key: "a", header: "A" }],
              data: [],
            },
            {
              id: "cta",
              component: "Button",
              text: "Ver saldos",
              action: {
                event: { name: "VIEW_BALANCES" },
              },
            },
          ],
        },
      },
    ],
  });
  assert.equal(nested.type, "a2ui_v09");
  assert.equal(nested.surfaceId, "nested");
  const update = nested.messages.find((m) => "updateComponents" in m) as any;
  assert.equal(update.updateComponents.components[2].text.path, "/note");
  const badText = update.updateComponents.components.find(
    (c: any) => c.id === "bad",
  )?.text;
  assert.equal(typeof badText, "string");
  assert.ok(!String(badText).includes("[object Object]"));
  console.log("PASS: nested A2UI v0.9 + sanitize de paths a objetos.");

  const withNestedProps = normalizeA2UIScreen({
    type: "a2ui_v09",
    surfaceId: "props_flat",
    assistantMessage: "Saldos listos",
    messages: [
      {
        version: "v0.9",
        createSurface: {
          surfaceId: "props_flat",
          catalogId: "a2ui-shadcn",
          sendDataModel: true,
        },
      },
      {
        version: "v0.9",
        updateDataModel: { surfaceId: "props_flat", path: "/", value: {} },
      },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "props_flat",
          components: [
            { id: "root", component: "Column", children: ["title", "card", "cta"] },
            {
              id: "title",
              component: "Text",
              props: { text: "Tu saldo disponible", usageHint: "h3" },
            },
            {
              id: "card",
              component: "Card",
              children: ["amount"],
            },
            {
              id: "amount",
              type: "Text",
              props: { text: "$12,785.00", usageHint: "h2" },
            },
            {
              id: "cta",
              component: "Button",
              props: {
                label: "Ver movimientos",
                actionType: "VIEW_TRANSACTIONS",
              },
            },
          ],
        },
      },
    ],
  });
  const flatComps =
    (
      withNestedProps.messages.find((m) => "updateComponents" in m) as any
    )?.updateComponents?.components || [];
  assert.equal(
    flatComps.find((c: any) => c.id === "title")?.text,
    "Tu saldo disponible",
  );
  assert.equal(
    flatComps.find((c: any) => c.id === "amount")?.text,
    "$12,785.00",
  );
  assert.equal(
    flatComps.find((c: any) => c.id === "cta")?.text,
    "Ver movimientos",
  );
  assert.ok(
    !flatComps.some((c: any) => c.text === "Detalle"),
    "no debe rellenar Detalle cuando hay props anidados",
  );
  console.log("PASS: props anidados se aplanan a text/label.");

  const { isCompleteA2UIResponse } = await import("./src/agent/a2uiV09.js");
  const withDonut = normalizeA2UIScreen({
    type: "a2ui_v09",
    surfaceId: "surface_donut",
    assistantMessage: "Aquí tienes tus gastos por categoría.",
    suggestedPrompts: ["Ver saldos", "Agrega barras"],
    messages: [
      {
        version: "v0.9",
        createSurface: {
          surfaceId: "surface_donut",
          catalogId: "a2ui-shadcn",
          sendDataModel: true,
        },
      },
      {
        version: "v0.9",
        updateDataModel: { surfaceId: "surface_donut", path: "/", value: {} },
      },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "surface_donut",
          components: [
            { id: "root", component: "Column", children: ["title", "donut", "cta"] },
            {
              id: "title",
              component: "Text",
              text: "Gastos del mes",
              usageHint: "h3",
            },
            {
              id: "donut",
              component: "DonutChart",
              title: "Por categoría",
              segments: [
                { label: "Despensa", value: 2340.5, color: "#EB0029" },
                { label: "Otros", value: 1500, color: "#758894" },
              ],
            },
            {
              id: "cta",
              component: "Button",
              text: "Ver movimientos",
              action: { event: { name: "VIEW_TRANSACTIONS" } },
            },
          ],
        },
      },
    ],
  });
  const donutComp = (
    withDonut.messages.find((m) => "updateComponents" in m) as any
  )?.updateComponents?.components?.find((c: any) => c.id === "donut");
  assert.equal(donutComp?.component, "DonutChart");
  assert.ok(Array.isArray(donutComp?.segments));
  assert.ok(isCompleteA2UIResponse(withDonut));
  console.log("PASS: DonutChart sobrevive normalize y isComplete.");

  const { buildResponseFromMcpContext } = await import("./src/agent/a2uiV09.js");
  const { callMcpToolViaServer } = await import("./src/mcp/client.js");
  const status = await callMcpToolViaServer("get_client_financial_status", {
    userId: "usr_carlos_01",
  });
  const fromMcp = buildResponseFromMcpContext(
    { get_client_financial_status: status },
    {
      surfaceId: "surface_mcp_test",
      assistantMessage: "Vista MCP",
      intent: "balances",
    },
  );
  assert.ok(fromMcp);
  assert.equal(fromMcp!.type, "a2ui_v09");
  assert.equal(fromMcp!.surfaceId, "surface_mcp_test");
  const mcpComps =
    (
      fromMcp!.messages.find((m) => "updateComponents" in m) as any
    )?.updateComponents?.components || [];
  assert.ok(mcpComps.some((c: any) => c.id === "root"));
  assert.ok(mcpComps.some((c: any) => c.component === "Button"));
  console.log("PASS: superficie desde datos MCP bancarios (sin get_ui_kit).");

  const originalKey = process.env.OLLAMA_API_KEY;
  const originalHost = process.env.OLLAMA_HOST;
  try {
    delete process.env.OLLAMA_API_KEY;
    process.env.OLLAMA_HOST = "https://ollama.com";
    const before = JSON.stringify(loadBankData());
    const unavailable = await processUserMessage("Confirmar", {
      action: "APPLY_RESTRUCTURE",
      planId: "plan_18m",
    });
    assert.equal(unavailable.surfaceId, "agent_generation_error");
    assert.equal(JSON.stringify(loadBankData()), before);
    const comps =
      (
        unavailable.messages.find((m) => "updateComponents" in m) as any
      )?.updateComponents?.components || [];
    assert.ok(!comps.some((c: any) => c.component === "BanorteConfirmation"));
    assert.ok(
      comps.some((c: any) => c.component === "Button" || c.component === "Text"),
    );
    console.log(
      "PASS: missing credentials produce an honest error without a bank mutation.",
    );

    const consultaSinLlm = await processUserMessage(
      "¿Cuánto tengo disponible en débito?",
    );
    assert.notEqual(consultaSinLlm.surfaceId, "agent_generation_error");
    assert.ok(
      consultaSinLlm.messages.some((m) => "updateComponents" in m),
      "consulta sin LLM debe armar superficie desde tools MCP bancarias",
    );
    console.log("PASS: consultas sin LLM usan datos MCP (sin UI kit).");

    const refined = await processUserMessage("quita la tabla", {
      currentSurface: consultaSinLlm,
    });
    assert.equal(refined.surfaceId, consultaSinLlm.surfaceId);
    console.log("PASS: ui_refine sin LLM conserva la superficie actual.");
  } finally {
    if (originalKey === undefined) delete process.env.OLLAMA_API_KEY;
    else process.env.OLLAMA_API_KEY = originalKey;
    if (originalHost === undefined) delete process.env.OLLAMA_HOST;
    else process.env.OLLAMA_HOST = originalHost;
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
