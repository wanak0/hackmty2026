# Arquitectura del Sistema: Banorte A2UI & MCP Agent

Este documento describe las decisiones técnicas y de arquitectura requeridas para el entregable técnico del Hackathon Banorte × Tec de Monterrey.

---

## 1. Diagrama de Arquitectura de Referencia (A2UI Loop)

El sistema cierra el ciclo de interacción tal como lo exigen las reglas: la interacción sobre los componentes viaja de regreso al modelo, cerrando el bucle sin forzar al usuario a abandonar la pantalla o irse a otra aplicación.

```mermaid
flowchart TD
    subgraph Frontend ["Frontend React Vite a2ui-shadcn"]
        Landing["Landing Page Banorte"] -->|"Probar Asistente"| DynamicView["A2UISurface"]
        UserInput["Expresión del Usuario"] --> DynamicView
        DynamicView -->|"Mensajes A2UI v0.9"| Components["Catálogo estándar a2ui-shadcn"]
        Components -->|"onAction event"| ActionDispatch["Despachador de Eventos"]
    end

    subgraph Backend ["Orquestador Backend"]
        API["API Gateway /api/chat"]
        LLM["Ollama Cloud NLP + A2UI"]
        DetNLP["Fallback NLP determinístico"]
        A2UIProtocol["Emisor A2UI v0.9"]
        MCPClient["MCP Client CallTool"]
    end

    subgraph MCP ["Capa MCP"]
        MCPServer["Servidor Banorte MCP"]
        Registry["Registry callMcpTool"]
        ToolStatus["get_client_financial_status"]
        ToolSimulate["simulate_debt_restructure"]
        ToolApply["apply_debt_restructuring"]
        ToolInvest["apply_investment"]
        ToolSpei["execute_transfer"]
    end

    subgraph CoreBancario ["Datos Sintéticos"]
        MockDB[("mock_bank.json")]
    end

    UserInput -->|"POST /api/chat"| API
    ActionDispatch -->|"POST /api/chat action"| API
    API --> LLM
    API --> DetNLP
    LLM -->|"elige tools"| MCPClient
    DetNLP -->|"elige tools"| MCPClient
    MCPClient -->|"in-memory / stdio"| MCPServer
    MCPServer --> Registry
    Registry --> ToolStatus & ToolSimulate & ToolApply & ToolInvest & ToolSpei
    ToolStatus & ToolSimulate & ToolApply & ToolInvest & ToolSpei <--> MockDB
    LLM -->|"a2ui_v09 (nueva o refinada)"| A2UIProtocol
    A2UIProtocol -->|"Response payload"| DynamicView
    DynamicView -.->|"currentSurface"| API
```

---

## 2. Decisiones Técnicas y Justificación de Trade-Offs

| Componente | Elección | Justificación del Trade-off |
|---|---|---|
| **Frontend** | **React 18 + Vite + TypeScript + Tailwind v4 + a2ui-shadcn** | Renderer oficial A2UI v0.9; el agente usa solo el catálogo estándar (sin registry Banorte). |
| **LLM primario** | **Ollama Cloud (`gpt-oss:120b` NLP + `gemma4:31b` A2UI)** | Structured JSON; NLP elige tools; A2UI genera mensajes v0.9. |
| **Capa de Herramientas** | **MCP Client → Banorte MCP Server** | El chat usa `callMcpToolViaServer`. Solo tools bancarias (sin `get_ui_kit`). |
| **Protocolo de Interfaz** | **A2UI v0.9 iterativo** | El LLM diseña o edita `context.currentSurface` según el prompt del usuario. |
| **Resiliencia de demo** | **Fallback desde datos MCP** | Si falla el LLM en consultas, se arma una superficie mínima con resultados de tools bancarias. |
| **Persistencia de Datos** | **Almacén Sintético JSON con Estado en Memoria** | Elimina dependencias de bases de datos externas pesadas durante el hackathon, permitiendo reiniciar el estado de la demo al instante para los jueces. |
