# A2UI charts — examples

## Donut (gastos por categoría)

```json
{
  "id": "spend_donut",
  "component": "DonutChart",
  "title": "Gastos del mes",
  "centerLabel": "Total",
  "centerValue": "$8,420",
  "segments": [
    { "label": "Despensa", "value": 2340.5, "color": "#EB0029" },
    { "label": "Transporte", "value": 1200, "color": "#8F0017" },
    { "label": "Restaurantes", "value": 980, "color": "#B66D7A" },
    { "label": "Otros", "value": 3900, "color": "#758894" }
  ]
}
```

Or bind series from dataModel:

```json
{
  "id": "spend_donut",
  "component": "DonutChart",
  "title": "Gastos del mes",
  "segments": { "path": "/spendingSegments" }
}
```

With:

```json
"spendingSegments": [
  { "label": "Despensa", "value": 2340.5, "color": "#EB0029" }
]
```

## Bar (planes de reestructura)

```json
{
  "id": "plan_bars",
  "component": "BarChart",
  "title": "Pago mensual por plan",
  "unit": "MXN",
  "orientation": "horizontal",
  "bars": [
    { "label": "12 meses", "value": 1680, "color": "#758894" },
    { "label": "18 meses", "value": 1215, "highlight": true, "color": "#EB0029" },
    { "label": "24 meses", "value": 980, "color": "#758894" }
  ]
}
```

`items` or `data` are accepted as aliases of `bars` by the canvas adapter.

## Progress (uso de línea)

```json
{
  "id": "line_usage",
  "component": "ProgressBar",
  "label": "Uso de línea TDC",
  "value": 52,
  "max": 100,
  "unit": "%",
  "tone": "warning",
  "subtext": "Deuda sobre límite de $35,000"
}
```

Native shadcn progress:

```json
{
  "id": "line_usage_std",
  "component": "ProgressIndicator",
  "value": { "path": "/stats/usageValue" },
  "max": 100
}
```

## Minimal surface with chart

```json
{
  "type": "a2ui_v09",
  "surfaceId": "surface_spending",
  "assistantMessage": "Aquí ves en qué se fue tu dinero este mes.",
  "suggestedPrompts": [
    "Muéstrame solo el donut",
    "Agrega barras por categoría",
    "Ver mis saldos"
  ],
  "messages": [
    {
      "version": "v0.9",
      "createSurface": {
        "surfaceId": "surface_spending",
        "catalogId": "a2ui-shadcn",
        "sendDataModel": true
      }
    },
    {
      "version": "v0.9",
      "updateDataModel": {
        "surfaceId": "surface_spending",
        "path": "/",
        "value": { "title": "Tus gastos" }
      }
    },
    {
      "version": "v0.9",
      "updateComponents": {
        "surfaceId": "surface_spending",
        "components": [
          {
            "id": "root",
            "component": "Column",
            "children": ["title", "donut", "cta"]
          },
          {
            "id": "title",
            "component": "Text",
            "text": "Tus gastos",
            "usageHint": "h3"
          },
          {
            "id": "donut",
            "component": "DonutChart",
            "title": "Por categoría",
            "segments": [
              { "label": "Despensa", "value": 2340.5, "color": "#EB0029" },
              { "label": "Otros", "value": 1500, "color": "#758894" }
            ]
          },
          {
            "id": "cta",
            "component": "Button",
            "text": "Ver movimientos",
            "variant": "primary",
            "action": { "event": { "name": "VIEW_TRANSACTIONS" } }
          }
        ]
      }
    }
  ]
}
```

## Style-only refinement (no new MCP)

When `context.currentSurface` exists and the user says “haz el título más grande” / “pon el botón primary”:

- Keep `surfaceId`.
- Change `usageHint` / `variant` / `gap` / series `color`.
- Do not invent new money figures.

## Anti-patterns

| Bad | Good |
|-----|------|
| `"props": { "segments": [...] }` | `"segments": [...]` at node root |
| `"text": { "path": "/stats" }` (object) | path to scalar or literal string |
| `"text": "Detalle"` | Real copy from MCP |
| `"component": "BanorteDonut"` | `"DonutChart"` |
| `"style": { "color": "red" }` | series `color` / Button `variant` / CSS tokens |
| Downgrade charts to only `DataTable` | Prefer real chart + optional table |
