# Diccionario de Datos Sintéticos - Core Bancario Simulado (Banorte × Tec)

Este documento describe la estructura y semántica de los datos simulados utilizados por el Servidor MCP y el Agente LLM para el caso de uso de **Reestructuración Inteligente de Deuda**.

---

## 1. Esquema de Entidades (`mock_bank.json`)

El archivo de datos reside en `backend/src/data/mock_bank.json` y simula la capa de core bancario de Banorte.

### 1.1 Entidad `User` (Cliente)
Representa al titular de los productos bancarios.
```typescript
interface User {
  id: string;              // Identificador único (ej: "usr_carlos_01")
  name: string;            // Nombre del cuentahabiente
  email: string;           // Correo registrado
  creditScore: number;     // Score crediticio (300 - 850)
  monthlyIncome: number;   // Ingreso mensual comprobable en MXN
}
```

### 1.2 Entidad `CreditCard` (Tarjeta de Crédito)
Representa los plásticos y saldos vigentes del usuario.
```typescript
interface CreditCard {
  id: string;              // Identificador de la tarjeta
  userId: string;          // Referencia al usuario
  cardName: string;        // Nombre comercial (ej: "Banorte Por Ti Oro")
  last4: string;           // Últimos 4 dígitos para visualización
  creditLimit: number;     // Límite de crédito en MXN
  currentBalance: number;  // Deuda actual revolvente en MXN ($18,400 en demo)
  minimumPayment: number;  // Pago mínimo requerido en el periodo
  interestRateAnnual: number; // Tasa de interés ordinaria anual (%)
  catAnnual: number;       // Costo Anual Total (%)
  cutoffDate: string;      // Fecha de corte mensual (YYYY-MM-DD)
  paymentDueDate: string;  // Fecha límite de pago (YYYY-MM-DD)
  status: "ACTIVE" | "BLOCKED" | "OVERDUE";
}
```

### 1.3 Entidad `RestructureOffer` (Ofertas de Reestructuración)
Opciones calculadas y validadas por el motor de riesgo bancario expuesto vía MCP.
```typescript
interface RestructureOffer {
  planId: string;          // Identificador único del plan (ej: "plan_18m")
  months: number;          // Plazo en meses (12, 18, 24)
  preferentialCat: number; // CAT preferencial otorgado (%)
  monthlyPayment: number;  // Cuota mensual congelada en MXN
  totalPayment: number;    // Monto total a pagar al final del plazo
  projectedSavings: number;// Ahorro estimado frente a pagar solo mínimos
}
```

### 1.4 Entidad `RestructureOperation` (Bitácora de Acciones)
Registro de auditoría generado cuando el usuario confirma la acción desde la interfaz viva (A2UI).
```typescript
interface RestructureOperation {
  operationId: string;     // Folio bancario generado (ej: "BNTE-RST-94821")
  userId: string;
  cardId: string;
  planId: string;
  months: number;
  monthlyQuota: number;
  appliedAt: string;       // Timestamp ISO8601
  status: "APPLIED" | "PENDING";
}
```

---

## 2. Perfiles de Prueba Precargados

| ID | Nombre | Perfil Financiero | Caso de Uso en Demo |
|---|---|---|---|
| `usr_carlos_01` | **Carlos Mendoza** | Deuda revolvente de **\$18,400 MXN**, CAT de **54.2%**, paga mínimos. | **Flujo Principal (Demo):** Solicita reestructurar para pagar menos intereses. |
| `usr_sofia_02` | **Sofía Ramírez** | Saldo al corriente, capacidad crediticia óptima, score 760. | Caso alterno: Solicitud de incremento de línea o crédito personal. |
| `usr_roberto_03` | **Roberto Treviño** | Alta liquidez, sin deudas, saldo disponible \$85,000 MXN. | Caso alterno: Sugerencia de inversión a plazo fijo. |
