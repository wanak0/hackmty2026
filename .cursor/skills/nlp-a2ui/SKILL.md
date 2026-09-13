---
name: nlp-a2ui
description: >-
  Guides Banorte HackMTY NLP → MCP → A2UI v0.9 pipeline: intent classification,
  MCP CallTool (no get_ui_kit), iterative generative UI (prompt → refine surface),
  a2ui_v09 messages, a2ui-shadcn + Banorte charts, action.event.name bridge, and
  Banorte theming via CSS tokens. Use when editing prompts, ollama.ts, a2uiV09,
  BanorteA2UICanvas, /api/chat, or generative banking UI.
---

# NLP → MCP → A2UI v0.9 (iterativo)

## Pipeline

```
user message / UI action
  → NLP (elige tools bancarias; ui_refine = sin tools)   ollama.ts
  → MCP Client → Banorte MCP Server                     client.ts + server.ts
  → LLM diseña o EDITA la superficie actual             prompts.ts + a2uiV09.ts
  → /api/chat → BanorteA2UICanvas                       A2UISurface + chartRegistry
  → siguiente prompt puede refinar el mismo lienzo      context.currentSurface
```

For **gráficas / estilos visuales** (donut, barras, progress, tokens Banorte): use [`.cursor/skills/a2ui-charts-style/SKILL.md`](../a2ui-charts-style/SKILL.md). For **validación de componentes / catálogo A2UI**: [`a2ui-component-validate`](../a2ui-component-validate/SKILL.md) (+ [`shadcn-component-review`](../shadcn-component-review/SKILL.md), [`enforce-design-system`](../enforce-design-system/SKILL.md), [`shadcn`](../shadcn/SKILL.md)). For generative UI craft on React/CSS chrome: [`frontend-design`](../frontend-design/SKILL.md), [`design-taste-frontend`](../design-taste-frontend/SKILL.md); for a11y/UX review: [`web-design-guidelines`](../web-design-guidelines/SKILL.md). On the A2UI canvas, Banorte brand lock in `a2ui-charts-style` wins.

Key files:

| Area | Path |
|------|------|
| System prompt | `backend/src/agent/prompts.ts` |
| Orchestrator | `backend/src/agent/ollama.ts` |
| Normalize/sanitize | `backend/src/agent/a2uiV09.ts` |
| MCP banking | `backend/src/mcp/registry.ts`, `tools.ts`, `client.ts` |
| Canvas + charts | `BanorteA2UICanvas.tsx`, `chartRegistry.tsx` |
| Theme | `frontend/src/index.css` (`.a2ui-canvas` / `.a2ui-surface`) |

## Hard rules

1. **Output:** `type: "a2ui_v09"` with `createSurface` + `updateDataModel` + `updateComponents`.
2. **Catalog:** a2ui-shadcn standard + `DonutChart` / `BarChart` / `ProgressBar` (via chart registry). Never invent other Banorte* names.
3. **Iterative UI:** frontend sends `context.currentSurface`. On `ui_refine`, the model edits that surface (same `surfaceId` when possible).
4. **No get_ui_kit.** Numbers from banking MCP tools or previous dataModel only.
5. **No `[object Object]`:** `text` must be string or `{ path }` to a scalar. `sanitizeA2UIDisplay` rewrites path-to-object bindings.
6. **No `style` objects** from the LLM; Banorte look is CSS tokens + `.a2ui-surface` + chart series colors.
7. **MCP path:** orchestrator uses `callMcpToolViaServer` only.
8. **Actions:** `Button` → `action.event.name` (APPLY_RESTRUCTURE, CONFIRM_*, PAY_CARD, USER_PROMPT, …).
9. **Copy:** Spanish tú; never mention MCP/JSON/A2UI/IA in `assistantMessage`.

## Intent → tools

| Signal | Tools |
|--------|--------|
| saldos | `get_client_financial_status` |
| gastos | `get_transaction_history` |
| reestructura | status + `simulate_debt_restructure` |
| inversión | `simulate_investment_portfolio` |
| pagar TDC | status (+ `pay_credit_card` on confirm) |
| SPEI | status (+ `execute_transfer` on confirm) |
| “quita la tabla / haz dos columnas / agrega botón…” | `ui_refine`, tools `[]` |

## Banorte look

1. `@theme --color-primary: #eb0029` + `@source` a2ui-shadcn
2. Canvas uses `className="a2ui-surface …"` so host CSS applies
3. Card padding / primary button overrides under `.a2ui-canvas`

## Checklist

- [ ] Response is a2ui_v09 with three message kinds
- [ ] `root` Column; no Banorte*
- [ ] Refinement passes `currentSurface`
- [ ] Text paths never point at nested objects
- [ ] `npx tsx test-ui-contract.ts` passes
- [ ] After UI changes, run [`a2ui-component-validate`](../a2ui-component-validate/SKILL.md)
