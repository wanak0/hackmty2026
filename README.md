# Banorte A2UI · Interfaces Financieras Construidas por IA en Tiempo Real

> Proyecto oficial para el **Hackathon Reto Banorte × Tec de Monterrey 2026**.  
> *"El reto: que el modelo no solo conteste, sino que arme la pantalla que resuelve el problema financiero de quien pregunta."*

---

## Actualización de interfaz

Identidad Banorte verificada, Inter local, navegación accesible, revisión de operaciones y pruebas del ciclo generativo. Detalles, fuentes y comandos de la entrega en [docs/UI_HANDOFF.md](docs/UI_HANDOFF.md).

## 📌 Los Tres Pilares No Negociables del Reto

1. **LLM al Centro:** Ollama Cloud (Gemma 4:31b) interpreta la intención en lenguaje natural, consulta el contexto del usuario y orquesta la experiencia. Gemini es fallback opcional; si falla la generación, se muestra un error claro sin inventar una pantalla bancaria.
2. **MCP (Model Context Protocol) en TypeScript:** Expone herramientas estandarizadas (`@modelcontextprotocol/sdk` + registry `callMcpTool`) para consultar tarjetas, simular plazos, aplicar reestructuraciones, invertir y SPEI sobre el core bancario.
3. **A2UI (Agent-to-UI):** La interfaz viaja como especificación JSON declarativa hacia React, renderizando componentes interactivos que **regresan la interacción del usuario al modelo como contexto para cerrar el ciclo**.

---

## 🏆 Los 4 Entregables del Hackathon

| Entregable | Ubicación / Estado |
|---|---|
| **01. Demo en Vivo** | Corrida local integrada (Landing Page → Flujo A2UI con Carlos Mendoza \$18,400). |
| **02. Repositorio de Código** | Componentes en `frontend/src/components/a2ui`, Servidor MCP en `backend/src/mcp`, Orquestador en `backend/src/agent`. |
| **03. APIs y Datasets** | Especificación completa en [docs/DATA_DICTIONARY.md](docs/DATA_DICTIONARY.md) y base de datos simulada en `backend/src/data/mock_bank.json`. |
| **04. Decisiones Técnicas** | Diagrama de flujo y justificación de trade-offs en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). |

---

## 🚀 Inicio Rápido (Cómo Ejecutar la Demo)

### 1. Requisitos Previos
* Node.js 22.12 o superior (validado con Node 24).
* API Key de [Ollama Cloud](https://ollama.com/settings/keys). **Sin clave se pueden consultar los saldos del resumen, pero Maya muestra un estado no disponible.**

### 2. Configurar Variables de Entorno
Crea un archivo `.env` en la carpeta `backend/`:
```bash
cd backend
cp .env.example .env
# Configura OLLAMA_API_KEY; no compartas este archivo.
```

### 3. Levantar todo desde la raíz
```bash
npm run setup   # primera vez
npm run dev     # backend :3001 + frontend :5173
```

O por separado:
```bash
cd backend && npm run dev   # http://localhost:3001
cd frontend && npm run dev  # http://localhost:5173
```

### 4. Verificar flujo automatizado
```bash
npm run test:flow
```

---

## 🎬 Guion de Demostración para los Jueces

1. **Paso 1 (Landing Page):** Abre `http://localhost:5173` y presenta la propuesta de valor con diseño corporativo Banorte.
2. **Paso 2 (Lanzar Demo):** Haz clic en **"Comenzar con Maya"**.
3. **Paso 3 (Intención del Usuario):** Ingresa (o deja) la frase del reto:
   > *"Quiero pagar menos intereses de mi tarjeta."*
4. **Paso 4 (A2UI en Acción):** Observa cómo la pantalla se transforma en tiempo real mostrando:
   * Comparativa de reducción de CAT de **54.2% a 34.1%**.
   * Opciones a **12 meses ($1,690)**, **18 meses ($1,215)** y **24 meses ($980)**.
   * Ahorro proyectado de **$4,900 MXN**.
5. **Paso 5 (Cierre de Ciclo):** Selecciona el plan de 18 meses y haz clic en **"Aplicar plan →"**.
6. **Paso 6 (Transacción Bancaria):** El servidor MCP ejecuta la acción en el core bancario y la UI genera el comprobante oficial con folio `BNTE-RST-XXXXX` y confeti de celebración.
7. **Paso 7 (Reiniciar Demo):** Si los jueces quieren volver a probarlo, haz clic en el botón superior **"Reiniciar"**.
