import assert from "node:assert/strict";
import { normalizeA2UIScreen, processUserMessage } from "./src/agent/ollama.js";
import { loadBankData } from "./src/mcp/tools.js";

async function main() {
  const nested = normalizeA2UIScreen({
    type: "a2ui_screen",
    screenId: "nested",
    assistantMessage: "Consulta",
    components: [
      {
        id: "outer",
        type: "Card",
        props: {},
        children: [
          {
            id: "grid",
            type: "Grid",
            props: {},
            children: [
              {
                id: "inner",
                type: "Card",
                props: {},
                children: [
                  {
                    id: "text",
                    type: "Text",
                    props: { content: "Movimiento conservado" },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
  assert.equal(
    nested.components[0].children?.[0].children?.[0].children?.[0].props
      .content,
    "Movimiento conservado",
  );
  console.log("PASS: nested A2UI content survives normalization.");
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
    assert.equal(unavailable.screenId, "agent_generation_error");
    assert.equal(JSON.stringify(loadBankData()), before);
    assert.ok(
      !unavailable.components.some(
        (component) => component.type === "ConfirmationCard",
      ),
    );
    console.log(
      "PASS: missing credentials produce an honest error without a bank mutation.",
    );
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
