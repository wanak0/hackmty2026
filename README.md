# Banorte A2UI · Interfaces financieras construidas por IA

Prototipo para el **Hackathon Reto Banorte × Tec de Monterrey 2026**.  
Maya interpreta una petición en lenguaje natural, consulta el core simulado por MCP y dibuja una pantalla A2UI en el lienzo de Banca en línea.

No es una app oficial de Banorte. Usa datos sintéticos; no mueve dinero real.

---

## Qué hay hoy

- Landing editorial (“Tu dinero, más claro”) y entrada a la demo con **Comenzar con Maya**.
- Resumen de cuenta conectado a `/api/user/:id/status`. Si falla la consulta, se muestra error; no se inventa un saldo.
- Seis tareas cotidianas: saldo, pago de tarjeta, transferencia, gastos, inversión y menos intereses.
- Maya en un panel de conversación. La interfaz generada aparece en el lienzo principal, no como un muro de texto.
- Revisión con diálogo nativo antes de pagar, transferir, invertir o reestructurar. Cancelar conserva los datos.
- Identidad Inter local y rojo `#EB0029` verificados contra el portal Personal de Banorte. Detalle en [docs/UI_HANDOFF.md](docs/UI_HANDOFF.md).

---

## Los tres pilares del reto

1. **LLM al centro:** Ollama Cloud (`gemma4:31b`) clasifica la intención y genera el JSON A2UI. Gemini es fallback opcional. Si no hay clave o se agotan los reintentos, se muestra un error claro; no se fabrica una pantalla bancaria ajena a la consulta.
2. **MCP en TypeScript:** Un registry (`callMcpTool`) expone herramientas del core: saldos, movimientos, reestructura, inversión, pago de tarjeta y SPEI. El chat HTTP y el servidor MCP stdio comparten el mismo contrato.
3. **A2UI:** La UI viaja como especificación JSON hacia React. Cada interacción vuelve al modelo como contexto y cierra el ciclo.

---

## Entregables

| Entregable | Dónde está |
|---|---|
| Demo en vivo | Landing → Banca de ejemplo (Carlos Mendoza) → lienzo A2UI |
| Código | `frontend/src/components/a2ui`, `frontend/src/components/chat`, `backend/src/mcp`, `backend/src/agent` |
| APIs y datos | [docs/DATA_DICTIONARY.md](docs/DATA_DICTIONARY.md) y `backend/src/data/mock_bank.json` |
| Decisiones técnicas | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |

---

## Cómo ejecutar

### Requisitos

- Node.js 22.12 o superior.
- API key de [Ollama Cloud](https://ollama.com/settings/keys). Sin clave se pueden consultar los saldos del resumen, pero Maya no puede generar pantallas.

### Arranque

```bash
cd backend
cp .env.example .env
# Configura OLLAMA_API_KEY; no compartas este archivo.
```

Desde la raíz:

```bash
npm run setup   # primera vez
npm run dev     # backend :3001 + frontend :5173
```

Por separado:

```bash
npm run dev:backend    # http://localhost:3001
npm run dev:frontend   # http://localhost:5173
```

El proxy de Vite reenvía `/api` al backend. Si necesitas otro puerto: `BACKEND_URL=http://127.0.0.1:3002`.

### Verificar

```bash
npm run test:flow                 # flujo A2UI + MCP
npm test --prefix frontend        # catálogo e interacciones
npm run test:ui --prefix backend  # contrato del JSON A2UI
```

Para volver al estado inicial de la demo, usa **Reiniciar** en la cabecera (llama a `POST /api/reset`).

---

## Cómo se usa la demo

1. Entra con **Comenzar con Maya**.
2. Elige una tarea o escribe en el panel qué necesitas.
3. Revisa la pantalla en el lienzo. Ajusta montos o plazos si aplica.
4. Confirma en el diálogo antes de aplicar un cambio. El MCP escribe el folio en el core simulado.

La cuenta de ejemplo es `usr_carlos_01`. El prototipo no sustituye autenticación ni autorización bancaria reales.
