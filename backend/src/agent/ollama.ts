import dotenv from 'dotenv';
import { SYSTEM_PROMPT } from './prompts.js';
import {
  getClientFinancialStatus,
  simulateDebtRestructure,
  applyDebtRestructuring,
  simulateInvestmentPortfolio,
  getTransactionHistory,
  executeTransfer,
  getFinancialHealthDiagnostic
} from '../mcp/tools.js';

dotenv.config();

export interface A2UIComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: A2UIComponent[];
}

export interface A2UIScreen {
  type: 'a2ui_screen';
  screenId: string;
  assistantMessage: string;
  components: A2UIComponent[];
  suggestedPrompts?: string[];
}

export interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Limpia y repara cadenas JSON devueltas por modelos de lenguaje.
 */
function cleanJsonString(raw: string): string {
  let cleaned = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/m, '')
    .trim();

  // Extraer el objeto JSON delimitado por el primer '{' y el último '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Reparar comas colgantes comunes: ,} o ,]
  cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1');

  return cleaned;
}

/**
 * Normaliza y valida la estructura generada por el LLM hacia el protocolo A2UI.
 * Si faltan datos en un componente, hidrata las propiedades desde las herramientas MCP.
 */
export function normalizeA2UIScreen(raw: any): A2UIScreen {
  const s = raw.a2ui_screen || raw;
  const screenId = s.screenId || s.screenType || s.id || 'dynamic_screen';
  const assistantMessage =
    s.assistantMessage ||
    s.message ||
    'Analicé tu solicitud y diseñé esta interfaz personalizada para resolverla:';

  const rawComps: any[] = s.components || [];

  const components = rawComps.map((c: any, index: number) => {
    const type = c.type || c.component || 'HeaderBadge';
    const id = c.id || `comp_${type}_${index}`;
    const props = { ...(c.props || {}) };

    // Extraer propiedades directas en caso de que el LLM las coloque en la raíz del objeto
    Object.keys(c).forEach((k) => {
      if (k !== 'id' && k !== 'type' && k !== 'component' && k !== 'props') {
        props[k] = c[k];
      }
    });

    // Inyección / Hidratación desde MCP si faltan datos
    if (type === 'InvestmentSimulator' && (!props.options || props.options.length === 0)) {
      const amt = props.amount || 25000;
      const days = props.days || props.initialDays || 91;
      const inv = simulateInvestmentPortfolio(amt, days);
      props.options = inv.options;
      props.amount = amt;
      props.initialDays = days;
    }

    if (type === 'TransactionTable' && (!props.transactions || props.transactions.length === 0)) {
      const txData = getTransactionHistory('usr_carlos_01');
      props.transactions = txData.transactions;
      props.totalExpenses = txData.totalExpenses;
      props.topCategory = txData.topCategory[0];
    }

    if (type === 'FinancialHealthScore' && !props.score) {
      const diag = getFinancialHealthDiagnostic('usr_carlos_01');
      props.score = diag.creditScore;
      props.scoreRange = diag.scoreRange;
      props.dti = diag.dtiPercentage;
      props.recommendations = diag.recommendations;
    }

    if (type === 'TransferCard') {
      if (!props.recipient) props.recipient = 'Mamá (Rosa Mendoza)';
      if (!props.amount) props.amount = 500;
      if (!props.concept) props.concept = 'Apoyo familiar';
      if (!props.sourceAccount) props.sourceAccount = 'Cuenta Débito Banorte (•••• 9921)';
    }

    if (type === 'PlanOptionList' && (!props.options || props.options.length === 0)) {
      const userStatus = getClientFinancialStatus('usr_carlos_01');
      const sim = simulateDebtRestructure(userStatus.totalDebt);
      props.options = sim.options;
      props.selectedPlanId = 'plan_18m';
    }

    const children = Array.isArray(c.children)
      ? c.children.map((child: any, cIdx: number) => ({
          id: child.id || `subcomp_${cIdx}`,
          type: child.type || 'Text',
          props: child.props || {}
        }))
      : undefined;

    return { id, type, props, children };
  });

  const suggestedPrompts: string[] = Array.isArray(s.suggestedPrompts)
    ? s.suggestedPrompts
    : [
        '¿Cuánto pagaría a 12 meses?',
        'Simular pagaré de ahorro',
        '¿En qué he gastado este mes?'
      ];

  return {
    type: 'a2ui_screen',
    screenId,
    assistantMessage,
    components,
    suggestedPrompts
  };
}

/**
 * Función que realiza la llamada a la API de Ollama Cloud (/api/chat)
 * con soporte para salida estructurada JSON y Self-Healing en caso de sintaxis rota.
 */
async function callOllamaChat(
  messages: Array<{ role: string; content: string }>
): Promise<A2UIScreen | null> {
  const host = (process.env.OLLAMA_HOST || 'https://ollama.com').replace(/\/+$/, '');
  const apiKey = process.env.OLLAMA_API_KEY;
  const model = (process.env.OLLAMA_MODEL || 'gemma4:31b').trim();

  // Si apunta a ollama.com sin API key válida
  if (host.includes('ollama.com') && (!apiKey || apiKey.includes('tu_clave'))) {
    console.warn('[Ollama Cloud] Falta configurar OLLAMA_API_KEY en backend/.env');
    return null;
  }

  const endpoint = `${host}/api/chat`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const payload = {
    model,
    messages,
    format: 'json',
    stream: false,
    options: {
      temperature: 0.2
    }
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Ollama Cloud] Error HTTP ${response.status} con modelo ${model}:`, errorText);
      return null;
    }

    const resData: any = await response.json();
    const rawContent = resData.message?.content || resData.response;

    if (!rawContent) return null;

    // 1. Intento de parseo directo
    const cleaned = cleanJsonString(rawContent);
    try {
      const parsed = JSON.parse(cleaned);
      console.log(`[Ollama Cloud] Pantalla A2UI generada con éxito con ${model}`);
      return normalizeA2UIScreen(parsed);
    } catch (parseErr: any) {
      console.warn('[Ollama Cloud] Error parseando JSON directo, iniciando Self-Healing...', parseErr.message);

      // 2. SELF-HEALING: Petición correctiva a Ollama Cloud para reparar el JSON
      const healController = new AbortController();
      const healTimeout = setTimeout(() => healController.abort(), 8000);

      const healPayload = {
        model,
        messages: [
          {
            role: 'system',
            content:
              'Eres un reparador estricto de JSON. Devuelve ÚNICAMENTE el objeto JSON reparado y válido con la estructura A2UIScreen: { "type": "a2ui_screen", "screenId": "...", "assistantMessage": "...", "components": [...] }. Sin markdown.'
          },
          {
            role: 'user',
            content: `Repara este JSON inválido:\n${rawContent}`
          }
        ],
        format: 'json',
        stream: false
      };

      try {
        const healRes = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(healPayload),
          signal: healController.signal
        });
        clearTimeout(healTimeout);

        if (healRes.ok) {
          const healData: any = await healRes.json();
          const healRaw = healData.message?.content || healData.response;
          const healClean = cleanJsonString(healRaw);
          const healedParsed = JSON.parse(healClean);
          console.log('[Ollama Cloud] Self-Healing exitoso. JSON reparado y normalizado.');
          return normalizeA2UIScreen(healedParsed);
        }
      } catch (e) {
        console.warn('[Ollama Cloud] Self-Healing no pudo recuperar el JSON:', e);
      }
    }
  } catch (err: any) {
    console.warn('[Ollama Cloud] Fallo de conexión o timeout:', err.message || err);
  }

  return null;
}

/**
 * Orquestador principal con A2UI Puro, multi-turno y ejecución de herramientas MCP.
 */
export async function processUserMessage(
  message: string,
  context?: any,
  history?: HistoryItem[]
): Promise<A2UIScreen> {
  // 1. MANEJO DE ACCIONES VIVAS DE LA UI (Cierre de Ciclo en Core Bancario)
  if (context?.action === 'APPLY_RESTRUCTURE') {
    const planId = context.planId || 'plan_18m';
    const months = planId === 'plan_12m' ? 12 : planId === 'plan_18m' ? 18 : 24;
    const quota = planId === 'plan_12m' ? 1690 : planId === 'plan_18m' ? 1215 : 980;

    const opResult = applyDebtRestructuring(
      'usr_carlos_01',
      'crd_carlos_oro',
      planId,
      months,
      quota
    );

    return {
      type: 'a2ui_screen',
      screenId: 'restructure_success',
      assistantMessage: `¡Excelente, Carlos! Tu plan de pagos a ${months} meses ha sido aplicado en el core bancario. Tu saldo deudor ha quedado congelado con tasa preferencial.`,
      components: [
        {
          id: 'comp_success_badge',
          type: 'HeaderBadge',
          props: {
            tag: 'FOLIO OFICIAL BANORTE',
            title: 'Plan de Reestructuración Activado'
          }
        },
        {
          id: 'comp_confirmation',
          type: 'ConfirmationCard',
          props: {
            operationId: opResult.operationId,
            cardName: opResult.cardName,
            last4: opResult.last4,
            months: opResult.months,
            monthlyQuota: opResult.monthlyQuota,
            appliedAt: new Date().toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            nextPaymentDate: '8 de Octubre, 2026'
          }
        },
        {
          id: 'comp_return_action',
          type: 'ActionButton',
          props: {
            label: 'Ver mis movimientos y gastos',
            actionType: 'VIEW_TRANSACTIONS',
            variant: 'outline'
          }
        }
      ],
      suggestedPrompts: [
        '¿Cuál es mi saldo restante en débito?',
        'Simular inversión con mi ahorro',
        '¿Cómo quedó mi salud financiera?'
      ]
    };
  }

  if (context?.action === 'CONFIRM_INVESTMENT') {
    const amount = context.amount || 25000;
    const days = context.days || 91;
    const sim = simulateInvestmentPortfolio(amount, days);
    const pag = sim.options[0];
    const folio = `INV-BNTE-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      type: 'a2ui_screen',
      screenId: 'investment_success',
      assistantMessage: `¡Inversión exitosa! Has invertido $${amount.toLocaleString('es-MX')} MXN en Pagaré Banorte al ${pag.annualRate}% de rendimiento anual.`,
      components: [
        {
          id: 'comp_inv_badge',
          type: 'HeaderBadge',
          props: {
            tag: 'INVERSIÓN CONFIRMADA · BANORTE',
            title: 'Pagaré Banorte Activado'
          }
        },
        {
          id: 'comp_confirmation',
          type: 'ConfirmationCard',
          props: {
            operationId: folio,
            cardName: 'Pagaré Banorte Tradicional',
            last4: '0189',
            months: Math.round(days / 30),
            monthlyQuota: pag.profitNet,
            appliedAt: new Date().toLocaleDateString('es-MX'),
            nextPaymentDate: `Vencimiento en ${days} días (Total a recibir: $${pag.totalFinal.toLocaleString('es-MX')} MXN)`
          }
        }
      ],
      suggestedPrompts: [
        'Ver mi historial de transacciones',
        'Revisar mi tarjeta de crédito',
        'Hacer una transferencia SPEI'
      ]
    };
  }

  if (context?.action === 'CONFIRM_TRANSFER') {
    const recipient = context.recipient || 'Mamá (Rosa Mendoza)';
    const amount = context.amount || 500;
    const concept = context.concept || 'Apoyo familiar';

    const transferResult = executeTransfer('usr_carlos_01', recipient, amount, concept);

    return {
      type: 'a2ui_screen',
      screenId: 'transfer_success',
      assistantMessage: `Transferencia SPEI exitosa por $${amount.toLocaleString('es-MX')} MXN a favor de ${recipient}.`,
      components: [
        {
          id: 'comp_trf_badge',
          type: 'HeaderBadge',
          props: {
            tag: 'COMPROBANTE OFICIAL SPEI',
            title: 'Transferencia Enviada'
          }
        },
        {
          id: 'comp_confirmation',
          type: 'ConfirmationCard',
          props: {
            operationId: transferResult.trackingNumber,
            cardName: 'Cuenta Cheques Banorte',
            last4: '9921',
            months: 1,
            monthlyQuota: amount,
            appliedAt: transferResult.date,
            nextPaymentDate: `Saldo restante en cuenta: $${transferResult.remainingBalance.toLocaleString('es-MX')} MXN`
          }
        }
      ],
      suggestedPrompts: [
        'Ver mi saldo actual',
        '¿En qué he gastado este mes?',
        'Reestructurar mi tarjeta'
      ]
    };
  }

  // 2. OBTENCIÓN DE DATOS FRESCOS DEL CORE BANCARIO (MCP)
  const userStatus = getClientFinancialStatus('usr_carlos_01');
  const debtSim = simulateDebtRestructure(userStatus.totalDebt);
  const invSim = simulateInvestmentPortfolio(25000, 91);
  const txHistory = getTransactionHistory('usr_carlos_01');
  const health = getFinancialHealthDiagnostic('usr_carlos_01');

  const fullPrompt = `
DATOS DEL CLIENTE EN TIEMPO REAL (MCP CORE BANORTE):
- Usuario: ${userStatus.user.name} (ID: ${userStatus.user.id})
- Saldo disponible en cuenta cheques/débito: $${userStatus.user.checkingBalance} MXN (Cuenta •••• 9921)
- Tarjeta de crédito: Banorte Por Ti Oro (Saldo deudor: $${userStatus.totalDebt} MXN, CAT: 54.2%, Límite: $35,000 MXN)
- Opciones de amortización calculadas (MCP): ${JSON.stringify(debtSim.options)}
- Opciones de inversión actuales (MCP): ${JSON.stringify(invSim.options)}
- Transacciones recientes (MCP): ${JSON.stringify(txHistory.transactions.slice(0, 4))}
- Gastos acumulados (MCP): $${txHistory.totalExpenses} MXN (Categoría principal: ${txHistory.topCategory[0]})
- Diagnóstico de salud financiera (MCP): Score ${health.creditScore} (${health.scoreRange}), DTI ${health.dtiPercentage}%
- Contactos frecuentes del cliente:
  * Mamá (Rosa Mendoza) - Banorte - CLABE 072580012345678901
  * Renta (Arrendadora Valle) - BBVA - CLABE 012180004567891234
  * Juan Amigo (Juan Pérez) - Santander - CLABE 014580009876543210

MENSAJE / INTENCIÓN EN LENGUAJE NATURAL DEL USUARIO:
"${message}"

MISIÓN GENERATIVA:
1. Diseña la pantalla completa del protocolo A2UI ("a2ui_screen") combinando los componentes atómicos y de alto nivel adecuados.
2. Si el usuario pregunta por deuda o pagar menos intereses, usa HeaderBadge, MetricComparison, PlanOptionList y ActionButton.
3. Si el usuario pide transferir, usa HeaderBadge, AlertBanner, TransferCard y ActionButton ("CONFIRM_TRANSFER").
4. Si el usuario pide invertir, usa HeaderBadge, InvestmentSimulator y ActionButton ("CONFIRM_INVESTMENT").
5. Si el usuario consulta gastos, usa HeaderBadge, MetricGrid, TransactionTable.
6. Provee "suggestedPrompts" coherentes y dinámicos para los siguientes pasos.
`;

  // Construcción del hilo de mensajes con historial conversacional
  const messagesPayload: Array<{ role: string; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  if (history && Array.isArray(history)) {
    // Tomar los últimos 6 mensajes del historial para no saturar contexto
    const recentHistory = history.slice(-6);
    recentHistory.forEach((h) => {
      messagesPayload.push({
        role: h.role,
        content: h.content
      });
    });
  }

  messagesPayload.push({
    role: 'user',
    content: fullPrompt
  });

  // 3. INVOCACIÓN GENERATIVA A OLLAMA CLOUD CON GEMMA 4:31B
  try {
    const ollamaResult = await callOllamaChat(messagesPayload);
    if (ollamaResult && ollamaResult.components && ollamaResult.components.length > 0) {
      return ollamaResult;
    }
  } catch (err: any) {
    console.warn('[Orchestrator] Error en llamada principal a Ollama Cloud:', err.message || err);
  }

  // 4. FALLBACK SECUNDARIO A GOOGLE GEMINI (Solo si existe clave configurada)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && !geminiKey.includes('tu_clave')) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();
      const cleaned = cleanJsonString(text);
      const parsed = JSON.parse(cleaned);
      console.log('[Orchestrator] Generado con éxito vía Gemini');
      return normalizeA2UIScreen(parsed);
    } catch (err: any) {
      console.warn('[Orchestrator] Fallo en fallback de Gemini:', err.message || err);
    }
  }

  // 5. PANTALLA DE ERROR A2UI AUTÉNTICA (Sin mocks prefabricados)
  // Si no hay conexión o falla la inferencia, la interfaz informa honestamente con acción de reintento
  return {
    type: 'a2ui_screen',
    screenId: 'agent_connection_error',
    assistantMessage:
      'No pude completar la generación en tiempo real desde Ollama Cloud. Por favor verifica que el servicio esté activo y reintenta tu mensaje.',
    components: [
      {
        id: 'comp_err_badge',
        type: 'HeaderBadge',
        props: {
          tag: 'OLLAMA CLOUD · GEMMA 4:31B',
          title: 'Servicio de Inferencia Temporalmente Inaccesible'
        }
      },
      {
        id: 'comp_err_alert',
        type: 'AlertBanner',
        props: {
          variant: 'warning',
          message:
            'La conexión con Ollama Cloud no pudo procesar la solicitud en este momento. Revisa la clave de API o la conexión a internet del servidor.'
        }
      },
      {
        id: 'comp_err_action',
        type: 'ActionButton',
        props: {
          label: 'Reintentar solicitud',
          actionType: 'USER_PROMPT',
          payload: { text: message }
        }
      }
    ],
    suggestedPrompts: [
      'Quiero pagar menos intereses de mi tarjeta',
      '¿Cuánto tengo disponible en débito?',
      'Transferir $500 a mi mamá'
    ]
  };
}
