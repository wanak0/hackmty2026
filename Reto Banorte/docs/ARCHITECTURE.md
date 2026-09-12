# Arquitectura del Sistema: Banorte A2UI & MCP Agent

Este documento describe las decisiones técnicas y de arquitectura requeridas para el entregable técnico del Hackathon Banorte × Tec de Monterrey.

---

## 1. Diagrama de Arquitectura de Referencia (A2UI Loop)

El sistema cierra el ciclo de interacción tal como lo exigen las reglas: la interacción sobre los componentes viaja de regreso al modelo, cerrando el bucle sin forzar al usuario a abandonar la pantalla o irse a otra aplicación.

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (React + Vite + TypeScript)"]
        Landing["Landing Page Banorte"] -->|"Probar Asistente"| DynamicView["Espacio Dinámico A2UI"]
        UserInput["Expresión del Usuario ('Quiero pagar menos intereses')"] --> DynamicView
        DynamicView -->|"Renderiza JSON A2UI"| Components["Componentes Vivos (Simulador / Opciones / Botón)"]
        Components -->|"Interacción del Usuario (Click en 'Aplicar plan')"| ActionDispatch["Despachador de Eventos"]
    end

    subgraph Backend ["Orquestador Backend (Node.js / TypeScript)"]
        API["API Gateway (/api/chat)"]
        LLM["Google Gemini (Model: gemini-1.5-flash)"]
        A2UIProtocol["Traductor de Intenciones a Schema A2UI"]
    end

    subgraph MCP ["Capa MCP (Model Context Protocol)"]
        MCPServer["Servidor MCP (@modelcontextprotocol/sdk)"]
        ToolStatus["Tool: get_client_financial_status"]
        ToolSimulate["Tool: simulate_debt_restructure"]
        ToolApply["Tool: apply_debt_restructuring"]
    end

    subgraph CoreBancario ["Datos Sintéticos"]
        MockDB[("mock_bank.json (Saldos, Tarjetas, Auditoría)")]
    end

    UserInput -->|"POST /api/chat"| API
    ActionDispatch -->|"POST /api/chat (action payload)"| API
    API --> LLM
    LLM <-->|"Tool Calling (MCP)"| MCPServer
    MCPServer --> ToolStatus & ToolSimulate & ToolApply
    ToolStatus & ToolSimulate & ToolApply <--> MockDB
    LLM -->|"Genera JSON A2UI"| A2UIProtocol
    A2UIProtocol -->|"Response payload"| DynamicView
```

---

## 2. Decisiones Técnicas y Justificación de Trade-Offs

| Componente | Elección | Justificación del Trade-off |
|---|---|---|
| **Frontend** | **React 18 + Vite + TypeScript + TailwindCSS** | Máxima velocidad de iteración, sin complejidad de SSR innecesaria para un dashboard interactivo de tiempo real. Compatibilidad total con tipado estricto para esquemas JSON de A2UI. |
| **LLM** | **Google Gemini (1.5 Flash / Pro)** | Ventana de contexto amplia, excelente soporte para llamadas a funciones estructuradas (Function Calling) y generación de esquemas JSON estrictos sin alucinaciones de formato. |
| **Capa de Herramientas** | **MCP (@modelcontextprotocol/sdk)** | Cumplimiento no negociable del reto. Permite desacoplar la lógica de negocio bancaria del agente, permitiendo que cualquier modelo consuma los servicios de forma estandarizada. |
| **Protocolo de Interfaz** | **A2UI Declarativo (JSON Schema)** | En lugar de pedirle al LLM que genere código HTML/React arbitrario (lo cual es inseguro y propenso a errores de renderizado), el LLM genera una **especificación declarativa de componentes pre-validados**, garantizando consistencia de diseño Banorte y seguridad contra inyección de código. |
| **Persistencia de Datos** | **Almacén Sintético JSON con Estado en Memoria** | Elimina dependencias de bases de datos externas pesadas durante el hackathon, permitiendo reiniciar el estado de la demo al instante para los jueces. |
