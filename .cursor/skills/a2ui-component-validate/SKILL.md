---
name: a2ui-component-validate
description: >-
  Validates Banorte A2UI v0.9 surfaces and React adapters: allowed catalog components,
  flat props, Text/path bindings, chart contracts, Button actions, no style objects,
  and UI contract tests. Use when auditing A2UI JSON, normalizing components, reviewing
  BanorteA2UICanvas / chartRegistry, fixing [object Object] / Detalle placeholders,
  or after generative UI / prompt changes.
---

# A2UI Component Validate (Banorte)

Owns **validation** of generative UI. Generation/pipeline → [`nlp-a2ui`](../nlp-a2ui/SKILL.md). Charts/style → [`a2ui-charts-style`](../a2ui-charts-style/SKILL.md).

## Validation stack (when to use which)

| Skill | Target |
|-------|--------|
| **This skill** | A2UI JSON + adapters (`a2uiV09`, prompts, canvas registry) |
| [`shadcn`](../shadcn/SKILL.md) | Correct shadcn APIs when editing React shell / a2ui-shadcn wrappers |
| [`shadcn-component-review`](../shadcn-component-review/SKILL.md) | Post-hoc audit of React components (tokens, a11y, composition) |
| [`enforce-design-system`](../enforce-design-system/SKILL.md) | Repo audit vs design system (raw HTML, hardcoded colors) |
| [`web-design-guidelines`](../web-design-guidelines/SKILL.md) | a11y / UX quality gate |

Default Banorte DS for `enforce-design-system`: **shadcn/ui** + Banorte tokens in `frontend/src/index.css` (not freestyle Tailwind colors).

## When to apply

- User asks to validar / auditar / revisar componentes, catálogo, contratos UI.
- After changes to `a2uiV09.ts`, `prompts.ts`, `BanorteA2UICanvas`, `chartRegistry`, chart components.
- Bugs: `[object Object]`, `"Detalle"`, charts missing, unknown Banorte* names, broken buttons.

## Pass 1 — A2UI surface (JSON)

Source of truth for allowed names: `STANDARD` in `backend/src/agent/a2uiV09.ts`.

**Must have**

1. `type: "a2ui_v09"` + `createSurface` + `updateDataModel` + `updateComponents`.
2. `root` is `Column` (or valid layout with `children` ids).
3. Every `children` / `child` id resolves to a node in the same `updateComponents` list.
4. `component` ∈ STANDARD (incl. `DonutChart` / `BarChart` / `ProgressBar`). **Reject** invented `Banorte*` / `get_ui_kit`.
5. Props are **flat** next to `id` / `component` — no nested `props: { ... }`.
6. No `style: { ... }` objects from the LLM.
7. `Text.text` / titles / labels: string **or** `{ path }` to a **scalar** in dataModel (never to an object/array).
8. No placeholder `"Detalle"` spam; empty Text nodes are invalid.
9. `Button.action.event.name` ∈ known actions (`KNOWN_ACTIONS` in `a2uiV09.ts`) or deliberate `USER_PROMPT`.
10. Charts:
    - `DonutChart`: `segments` (or path to array of `{ label, value, color? }`)
    - `BarChart`: `bars` / `items` / `data` with `{ label, value }`
    - `ProgressBar`: `label`, `value` (+ optional `max`)
11. Numbers come from MCP / dataModel — do not invent balances in validation fixes unless replacing broken bindings with formatted strings already sanitized.

**Report format** (read-only first):

```
FAIL|WARN|PASS  <rule>  <node id or path>  <snippet>
```

Then ask before auto-fixing unless the user already asked to fix.

## Pass 2 — Runtime adapters (React)

When touching `frontend/src/components/a2ui/*`:

1. Charts only via `banorteChartRegistry` → `BanorteA2UICanvas` `componentRegistry`.
2. Adapters must tolerate both nested `props` and flat A2UI nodes (match sanitize behavior).
3. Never render raw objects as React children (use `formatDisplayValue` patterns / string coercion).
4. Run [`shadcn-component-review`](../shadcn-component-review/SKILL.md) on changed `.tsx` files.
5. Theme: Banorte CSS variables / `.a2ui-canvas` — flag hardcoded `#hex` that fight brand (except chart series palette).

## Pass 3 — Automated contract

From `backend/`:

```bash
npx tsx test-ui-contract.ts
```

Also run frontend a2ui tests if adapters changed:

```bash
cd frontend && npm test -- --run tests/a2ui.test.tsx
```

Fail the validation skill outcome if these fail.

## Quick reject list

| Signal | Verdict |
|--------|---------|
| `BanorteDonut`, `get_ui_kit`, custom catalog ids | FAIL |
| `text: { path: "/stats" }` where `/stats` is object | FAIL (sanitize should stringify; prefer scalar paths) |
| `style: { color: ... }` on nodes | FAIL |
| Nested `props: { segments: ... }` only | WARN → flatten |
| Button without `action.event.name` | FAIL for CTAs |
| Chart with empty series and no path | FAIL |

## Related docs

- Contract examples: [`nlp-a2ui/reference.md`](../nlp-a2ui/reference.md)
- Chart recipes: [`a2ui-charts-style/reference.md`](../a2ui-charts-style/reference.md)
- Extended checklist: [`checklist.md`](checklist.md)
