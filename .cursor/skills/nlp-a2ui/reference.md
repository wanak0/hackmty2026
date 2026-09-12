# NLP → A2UI reference

## HTTP contract

`POST /api/chat` returns:

```json
{
  "type": "a2ui_v09",
  "surfaceId": "surface_balances",
  "assistantMessage": "Aquí tienes tu disponible y tu deuda.",
  "suggestedPrompts": ["¿En qué he gastado?", "Pagar mi tarjeta"],
  "messages": []
}
```

UI actions from the canvas call the same endpoint with `context.action` = event name and flattened payload fields (`planId`, `amount`, `recipient`, …).

## Minimal valid surface

```json
{
  "type": "a2ui_v09",
  "surfaceId": "surface_demo",
  "assistantMessage": "Resumen listo.",
  "suggestedPrompts": ["Ver movimientos", "Simular inversión"],
  "messages": [
    {
      "version": "v0.9",
      "createSurface": {
        "surfaceId": "surface_demo",
        "catalogId": "a2ui-shadcn",
        "sendDataModel": true
      }
    },
    {
      "version": "v0.9",
      "updateDataModel": {
        "surfaceId": "surface_demo",
        "path": "/",
        "value": {
          "checking": 24580,
          "debt": 18400,
          "plans": { "selectedPlanId": "plan_18m" }
        }
      }
    },
    {
      "version": "v0.9",
      "updateComponents": {
        "surfaceId": "surface_demo",
        "components": [
          {
            "id": "root",
            "component": "Column",
            "children": ["title", "metrics", "apply"]
          },
          {
            "id": "title",
            "component": "Text",
            "text": "Tu situación",
            "usageHint": "h2"
          },
          {
            "id": "metrics",
            "component": "Row",
            "children": ["m1", "m2"]
          },
          {
            "id": "m1",
            "component": "Card",
            "children": ["m1t"]
          },
          {
            "id": "m1t",
            "component": "Text",
            "text": { "path": "/checking" }
          },
          {
            "id": "m2",
            "component": "Card",
            "children": ["m2t"]
          },
          {
            "id": "m2t",
            "component": "Text",
            "text": { "path": "/debt" }
          },
          {
            "id": "apply",
            "component": "Button",
            "text": "Ver planes",
            "variant": "primary",
            "action": {
              "event": {
                "name": "SHOW_DEBT_RESTRUCTURE_OPTIONS"
              }
            }
          }
        ]
      }
    }
  ]
}
```

## Action shapes

### Restructure

```json
{
  "component": "Button",
  "text": "Aplicar plan",
  "action": {
    "event": {
      "name": "APPLY_RESTRUCTURE",
      "context": {
        "planId": { "path": "/plans/selectedPlanId" }
      }
    }
  }
}
```

Pair with `ChoicePicker` bound to `/plans/selectedPlanId`.

### Transfer

```json
{
  "component": "TextField",
  "label": "Importe",
  "value": { "path": "/transfer/amount" }
}
```

```json
{
  "component": "Button",
  "text": "Continuar",
  "action": {
    "event": {
      "name": "CONFIRM_TRANSFER",
      "context": {
        "recipient": { "path": "/transfer/recipient" },
        "amount": { "path": "/transfer/amount" },
        "concept": { "path": "/transfer/concept" }
      }
    }
  }
}
```

Canvas flattens `dataModel.transfer` into the chat payload even if context paths miss.

### Card payment

```json
{
  "action": {
    "event": {
      "name": "PAY_CARD",
      "context": { "amount": 980, "cardId": "card_01" }
    }
  }
}
```

### Soft navigation

```json
{
  "action": {
    "event": {
      "name": "USER_PROMPT",
      "context": { "text": "Quiero ver mis movimientos" }
    }
  }
}
```

## MCP tools (quick)

| Tool | Role |
|------|------|
| `get_client_financial_status` | balances, cards |
| `get_transaction_history` | movements |
| `simulate_debt_restructure` | plan options |
| `apply_debt_restructuring` | mutate + folio |
| `simulate_investment_portfolio` | yield options |
| `apply_investment` | mutate + INV folio |
| `pay_credit_card` | TDC payment |
| `execute_transfer` | SPEI |
| `get_financial_health_diagnostic` | score / DTI |

## Theming knobs

| Knob | Effect |
|------|--------|
| `@theme --color-primary` (+ foreground, secondary, border, …) in `index.css` | Actual Banorte paint on `bg-primary` / `text-primary` inside a2ui-shadcn |
| `@source "../node_modules/a2ui-shadcn/dist/index.js"` | Tailwind sees adapter class names |
| `:root --primary` + `components/ui/*` | Host chrome (chat chrome, landing), not A2UI adapters |
| `.a2ui-canvas` / `.a2ui-surface` | Host polish (card padding, primary button) |
| `banorteA2UITheme` | Passed to `A2UISurface`; adapters still rely on Tailwind tokens |

Do not add a Banorte `componentRegistry` to recover look-and-feel.

## Good MCP + iterative UI loop

1. NLP picks banking tools **or** `ui_refine` (tools `[]`) when the user prompts about layout/UI.
2. Frontend always sends `context.currentSurface` when a canvas already exists.
3. Run banking tools when needed; merge into `mcpContext`.
4. Prompt the A2UI model with MCP JSON **and** the current surface (edit in place).
5. Normalize + `sanitizeA2UIDisplay` (paths to objects become readable strings).
6. On LLM failure: `buildResponseFromMcpContext` for consultas; mutations stay blocked without LLM.
7. Styling comes from CSS tokens / `.a2ui-surface`, not from MCP.
