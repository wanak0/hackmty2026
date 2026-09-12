---
name: a2ui-charts-style
description: >-
  Banorte A2UI charts and visual style: DonutChart, BarChart, ProgressBar/ProgressIndicator,
  Banorte tokens, and Anthropic frontend-design principles adapted to this repo. Use when
  adding or refining gráficas, donut, barras, progress, estilos del lienzo, theme Banorte,
  or visual A2UI polish on BanorteA2UICanvas / prompts / index.css.
---

# A2UI Charts + Style (Banorte)

Companion to [`nlp-a2ui`](../nlp-a2ui/SKILL.md). That skill owns the NLP → MCP → A2UI loop.
**This skill owns charts and visual style** on the canvas.

## When to apply

- User asks for gráficas, charts, donut, barras, progress, “hazlo más Banorte”, tokens, layout polish.
- Agent is editing `prompts.ts`, `BanorteA2UICanvas`, chart adapters, or `.a2ui-canvas` CSS.
- Refinement prompts like “agrega una gráfica de gastos” / “cambia colores de la serie”.

## Frontend Design (Anthropic, Banorte-anchored)

Adapted from Anthropic [`frontend-design`](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md).

Work in **two passes**:

1. **Plan** (short): color, type, layout, principles.
2. **Review** against Banorte brief, then implement.

### Brand lock (do not freestyle away from Banorte)

| Token | Value |
|-------|--------|
| Primary | `#EB0029` |
| Wine | `#8F0017` |
| Ink | `#323E48` |
| Muted | `#606B73` |
| Line / border | `#DFE3E5` |
| Paper | `#F7F8FA` |
| Series palette | `#EB0029`, `#8F0017`, `#B66D7A`, `#323E48`, `#758894`, `#C1CBD0` |
| Type | **Inter** (local WOFF2). Do not swap to “expressive” display fonts that break the portal look. |

Avoid Anthropic-skill *generic AI defaults* that fight Banorte: cream+terracotta serif, acid-green dark mode, broadsheet hairlines, purple SaaS kits, ALL-CAPS eyebrows everywhere.

Spend boldness once: usually the **chart** or the **primary CTA**; keep surrounding chrome quiet.

### Style levers that actually paint

1. **CSS tokens** in `frontend/src/index.css` (`@theme --color-primary`, `.a2ui-canvas`, `.a2ui-surface`).
2. **Catalog props** (never `style: {}` objects on A2UI nodes):
   - Text: `usageHint` (`h1`/`h2`/`h3`/`body`), `tone` (`muted`/`success`/`error`)
   - Button: `variant` (`primary`/`secondary`/`outline`/`ghost`/`destructive`)
   - Column/Row: `gap`, `align`, `justify`
3. **Chart series colors** from the Banorte series palette above.
4. `banorteA2UITheme` on `A2UISurface` is metadata; Tailwind/`@theme` does most of the paint.

## Charts allowed on the canvas

Registered in `BanorteA2UICanvas` via `componentRegistry` (plus standard `ProgressIndicator`):

| Component | Use for | Required props |
|-----------|---------|----------------|
| `DonutChart` | Categorías / mix de gastos | `segments: [{ label, value, color? }]`, optional `title`, `centerLabel`, `centerValue` |
| `BarChart` | Comparativas (planes, montos) | `bars` **or** `items`/`data`: `[{ label, value, color?, highlight? }]`, optional `title`, `unit`, `orientation` |
| `ProgressBar` | Uso de línea / % | `label`, `value`, optional `max`, `unit`, `tone`, `subtext` |
| `ProgressIndicator` | Progress nativo a2ui-shadcn | `value` number\|`{path}`, optional `max` |

### Hard rules for chart JSON

1. Props at the **same level** as `id` / `component` (no nested `props: { ... }`).
2. Series values are **numbers** from MCP / dataModel — never invent balances.
3. Prefer literal series in the component **or** `{ path: "/spendingSegments" }` to an array of flat objects.
4. Never bind Text/`title` to a whole object (avoids `[object Object]`).
5. Never use placeholder `"Detalle"`.
6. Do **not** reintroduce `get_ui_kit`.
7. Do **not** invent `BanorteDonut` etc.; use the names in the table.

### Intent → chart recipe

| User ask | Prefer |
|----------|--------|
| gastos / categorías / “en qué he gastado” | `DonutChart` + optional `DataTable` |
| comparar planes / montos / plazos | `BarChart` horizontal |
| uso de línea / % deuda | `ProgressBar` or `ProgressIndicator` |
| “más visual” sin dato nuevo | Add chart next to existing Cards; keep same `surfaceId` |

## File map

| Change | Path |
|--------|------|
| Agent catalog / rules | `backend/src/agent/prompts.ts` |
| Allow chart types in normalize | `backend/src/agent/a2uiV09.ts` |
| Registry adapters | `frontend/src/components/a2ui/chartRegistry.tsx`, `BanorteA2UICanvas.tsx` |
| Chart UI | `DonutChart.tsx`, `BarChart.tsx`, `ProgressBar.tsx` |
| Look | `frontend/src/index.css` (`.a2ui-canvas`) |
| Pipeline skill | `.cursor/skills/nlp-a2ui/SKILL.md` |

## Checklist before shipping chart/style work

- [ ] Surface still `a2ui_v09` with createSurface + updateDataModel + updateComponents
- [ ] `root` Column; chart ids referenced from a parent `children` array
- [ ] Chart component name is `DonutChart` | `BarChart` | `ProgressBar` | `ProgressIndicator`
- [ ] Series from MCP; Banorte series colors if colors are set
- [ ] No nested `props`, no `style` objects, no `"Detalle"`
- [ ] `npx tsx test-ui-contract.ts` and frontend a2ui tests still pass

## More detail

Examples: [reference.md](reference.md)
