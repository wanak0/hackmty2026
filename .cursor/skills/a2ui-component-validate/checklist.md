# A2UI validate checklist

Use after generative UI or adapter edits. Mark each item.

## Surface JSON

- [ ] `a2ui_v09` with create / dataModel / components
- [ ] `catalogId` is a2ui-shadcn (or normalized equivalent) — not a private Banorte kit
- [ ] All child ids resolve
- [ ] Every `component` in STANDARD set (`a2uiV09.ts`)
- [ ] Props flat (no nested `props` left unflattened)
- [ ] No `style` objects
- [ ] Text / Badge / Button labels are strings or scalar paths
- [ ] No `"Detalle"` / empty decorative Text spam
- [ ] Buttons have `action.event.name`
- [ ] Charts have required series props or valid paths
- [ ] dataModel paths used by bindings exist

## React / theme

- [ ] New chart types registered in `chartRegistry.tsx`
- [ ] Canvas still uses `componentRegistry={banorteChartRegistry}`
- [ ] No raw object children in Text nodes
- [ ] Colors use Banorte tokens / series palette
- [ ] shadcn-component-review clean on touched files (or listed WARs)

## Tests

- [ ] `backend`: `npx tsx test-ui-contract.ts`
- [ ] `frontend`: a2ui tests if adapters changed
