# 🚀 RELEVO TÉCNICO: PROYECTO BANORTE A2UI (HACKATHON TEC 2026)
> **Documento de Contexto y Transferencia para GPT 6 ASTRA DE CODEX**  
> *Versión del sistema: 2.0.0 (Multi-dominio Generativo)*  
> *Ruta del proyecto:* `/Users/user/Documents/Proyectos/hackmty2026`

---

## 📌 1. RESUMEN EJECUTIVO Y OBJETIVO DEL RETO
Este proyecto fue creado para el **Reto Oficial Banorte × Tec de Monterrey (HackMTY 2026)**.
* **El Reto:** Construir interfaces que la IA construye en tiempo real. No un chatbot con muro de texto, sino un agente generativo que traduce intenciones en pantallas interactivas (A2UI) respaldadas por el Model Context Protocol (MCP).
* **Los 3 Pilares No Negociables:**
  1. **LLM al Centro:** Orquestador inteligente impulsado por **Ollama Cloud** (usando modelo **Gemma 4:3.1b** con salida estructurada JSON según [docs.ollama.com](https://docs.ollama.com/cloud)) y Google Gemini como alternativa, que interpreta el lenguaje natural y diseña la UI en formato declarativo JSON.
  2. **MCP (Model Context Protocol) en TypeScript:** Expone al modelo herramientas seguras para consultar tarjetas, saldos, movimientos y ejecutar transacciones en el core bancario (`@modelcontextprotocol/sdk`).
  3. **A2UI (Agent-to-UI):** La interfaz viaja hacia el cliente React como un schema JSON y renderiza componentes vivos. Toda interacción en la UI vuelve al agente como contexto para **cerrar el ciclo de feedback**.

---

## 🏛️ 2. ARQUITECTURA TÉCNICA Y REGLAS DE EJECUCIÓN

### A. Estructura de Carpetas
```
hackmty2026/
├── package.json               # Scripts raíz para concurrently ('npm run dev')
├── README.md                  # Documentación oficial de los 4 entregables
├── CODEX_HANDOFF.md           # Este archivo de relevo
├── docs/
│   ├── ARCHITECTURE.md        # Diagrama de arquitectura Mermaid y justificaciones
│   └── DATA_DICTIONARY.md     # Especificación de datos sintéticos
├── backend/                   # Node.js + Express + TypeScript + MCP + Ollama Cloud
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── test-flow.ts           # Script de pruebas automatizadas del flujo A2UI
│   └── src/
│       ├── index.ts           # Servidor HTTP Express (/api/chat, /api/health, /api/config, /api/reset)
│       ├── data/mock_bank.json# Base de datos sintética local (cuentas, tarjetas, deudas)
│       ├── mcp/
│       │   ├── tools.ts       # Funciones del core bancario (consultas, amortización, SPEI)
│       │   └── server.ts      # Servidor MCP formal con @modelcontextprotocol/sdk
│       └── agent/
│           ├── prompts.ts     # System Prompt generativo con gramática de componentes A2UI
│           ├── ollama.ts      # Orquestador con Ollama Cloud (Gemma 4:3.1b), structured output y fallback
│           └── gemini.ts      # Orquestador alternativo con Google Gemini
└── frontend/                  # React 18 + Vite + TypeScript + Tailwind CSS
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts         # Proxy inverso de /api hacia http://localhost:3001
    ├── tailwind.config.js     # Paleta institucional Banorte (#EB0029)
    └── src/
        ├── App.tsx            # Conmutador entre Landing Page y ChatContainer
        ├── types/a2ui.ts      # Tipos TypeScript del protocolo A2UI
        └── components/
            ├── landing/LandingPage.tsx      # Landing corporativa de Banorte
            ├── chat/ChatContainer.tsx        # Área interactiva en vivo con barra de chips
            └── a2ui/                         # Catálogo de Componentes Vivos
                ├── A2UIRenderer.tsx          # Motor de renderizado dinámico
                ├── HeaderBadge.tsx           # Insignias de contexto y títulos
                ├── AlertBanner.tsx           # Avisos dinámicos (info, warning, success)
                ├── MetricComparison.tsx      # Comparativas de tasas, CAT y saldos
                ├── PlanOptionList.tsx        # Selector de plazos de pago (12, 18, 24m)
                ├── InvestmentSimulator.tsx   # Sliders de inversión y rendimientos
                ├── TransactionTable.tsx      # Tabla categorizada de gastos
                ├── TransferCard.tsx          # Tarjeta editable de transferencia SPEI
                ├── FinancialHealthScore.tsx  # Semáforo de salud y score crediticio
                ├── ActionList.tsx            # Lista de botones y sugerencias
                ├── ActionButton.tsx          # Botón disparador de acciones
                └── ConfirmationCard.tsx      # Comprobante bancario con folio y confeti
```

### B. Cómo se Corre el Proyecto
Desde la raíz (`/Users/user/Documents/Proyectos/hackmty2026`):
```bash
npm run dev
```
* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:3001`
* **Healthcheck:** `GET http://localhost:3001/api/health`
* **Prueba rápida de flujo:** `npm run test:flow`

---

## 📡 3. ESPECIFICACIÓN DEL PROTOCOLO A2UI

Cada respuesta del agente devuelta por `/api/chat` cumple con este schema estricto:

```json
{
  "type": "a2ui_screen",
  "screenId": "string_identificador_unico",
  "assistantMessage": "Texto explicativo y empático del modelo",
  "components": [
    {
      "id": "comp_unique_id",
      "type": "HeaderBadge | AlertBanner | MetricComparison | PlanOptionList | InvestmentSimulator | TransactionTable | TransferCard | FinancialHealthScore | ActionList | ActionButton | ConfirmationCard",
      "props": { ... }
    }
  ]
}
```

### Catálogo de Props por Componente:
* `HeaderBadge`: `{ tag: string, title: string }`
* `AlertBanner`: `{ variant: "info" | "warning" | "success", message: string }`
* `MetricComparison`: `{ balance: number, currentCat: number, preferentialCat: number, estimatedSavings: number }`
* `PlanOptionList`: `{ options: [{ planId: string, months: number, cat: number, monthlyPayment: number, recommended: boolean }] }`
* `InvestmentSimulator`: `{ amount: number, initialDays: number, options: Array<any> }`
* `TransactionTable`: `{ totalExpenses: number, topCategory: string, transactions: Array<any> }`
* `TransferCard`: `{ recipient: string, amount: number, concept: string, sourceAccount: string, isNewContact: boolean, clabe?: string }`
* `FinancialHealthScore`: `{ score: number, scoreRange: string, dti: number, recommendations: string[] }`
* `ActionButton`: `{ label: string, actionType: string, variant?: "primary" | "outline", [payload: string]: any }`

---

## 🛠️ 4. HERRAMIENTAS DEL SERVIDOR MCP (`backend/src/mcp/registry.ts` + `tools.ts`)
El registry MCP (`callMcpTool`) es el **mismo contrato** usado por el orquestador HTTP y por el servidor stdio. Expone:
1. `get_client_financial_status(userId)`: Devuelve cuentas, tarjeta de crédito activa ($18,400 de deuda, CAT 54.2%) y balance de cheques ($14,500).
2. `simulate_debt_restructure(debtAmount)`: Calcula amortizaciones a 12, 18 y 24 meses con tasas CAT del 32.4% al 36.0%.
3. `apply_debt_restructuring(...)`: Congela la deuda y emite folio `BNTE-RST-XXXXX`.
4. `simulate_investment_portfolio(amount, days)`: Calcula ganancias en Pagaré Banorte (11.25%) y Cetes (11.00%).
5. `apply_investment(...)`: Debita cheques, registra operación `INV-BNTE-*` y movimiento.
6. `get_transaction_history(userId)`: Devuelve compras del mes categorizadas y gastos acumulados.
7. `execute_transfer(...)`: Descuenta el saldo de débito, registra el movimiento y emite comprobante `SPEI-BNTE-XXXXXX`.
8. `get_financial_health_diagnostic(userId)`: Calcula el Debt-to-Income (DTI), score (685 pts) y recomendaciones.

**Resiliencia:** si Ollama/Gemini no responden, `deterministic.ts` clasifica la intención y arma pantallas A2UI consultando las mismas tools MCP.

---

## 💡 5. GUÍA PARA QUE GPT 6 ASTRA CONTINÚE EL DESARROLLO

Si vas a agregar nuevas capacidades con GPT 6 Astra, estas son las áreas prioritarias recomendadas:

1. **Entrada por Voz / Speech-to-Text (Web Speech API):**
   * Añadir un botón de micrófono en `ChatContainer.tsx` para dictar instrucciones de voz al agente (impresionante para la demo en vivo).
2. **Escaneo Multimodal de Comprobantes o Facturas (Gemini Vision):**
   * Añadir un botón de adjuntar imagen para subir una foto de factura o recibo de luz y que Gemini extraiga el monto y arme el `TransferCard` automáticamente.
3. **Despliegue a la Nube (Vercel / Render):**
   * `frontend/` listo para Vercel (`vercel.json`).
   * `backend/` listo para Render o Railway con variable `GEMINI_API_KEY`.
4. **Preservación del Cierre de Ciclo:**
   * Cualquier nuevo componente interactivo debe enviar sus eventos a `onAction(actionType, payload)` en `ChatContainer.tsx` para que regrese al orquestador como nuevo contexto.

---
*Fin del documento de transferencia técnica.*
