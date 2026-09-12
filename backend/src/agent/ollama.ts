import dotenv from 'dotenv';
import { SYSTEM_PROMPT } from './prompts.js';
import { callMcpTool } from '../mcp/registry.js';
import { buildDeterministicScreen } from './deterministic.js';

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

const DEFAULT_USER = 'usr_carlos_01';
const DEFAULT_CARD = 'crd_carlos_oro';
const DEFAULT_MODEL = 'gemma4:3.1b';

function cleanJsonString(raw: string): string {
  let cleaned = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```$/m, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1');
  return cleaned;
}

/**
 * Normaliza A2UI e hidrata props faltantes vía el mismo contrato MCP (callMcpTool).
 */
export function normalizeA2UIScreen(raw: any, userId = DEFAULT_USER): A2UIScreen {
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

    Object.keys(c).forEach((k) => {
      if (k !== 'id' && k !== 'type' && k !== 'component' && k !== 'props') {
        props[k] = c[k];
      }
    });

    if (type === 'InvestmentSimulator' && (!props.options || props.options.length === 0)) {
      const amt = props.amount || 25000;
      const days = props.days || props.initialDays || 91;
      const inv = callMcpTool('simulate_investment_portfolio', {
        amount: amt,
        days
      }) as any;
      props.options = inv.options;
      props.amount = amt;
      props.initialDays = days;
    }

    if (type === 'TransactionTable' && (!props.transactions || props.transactions.length === 0)) {
      const txData = callMcpTool('get_transaction_history', { userId }) as any;
      props.transactions = txData.transactions;
      props.totalExpenses = txData.totalExpenses;
      props.topCategory = txData.topCategory[0];
    }

    if (type === 'FinancialHealthScore' && !props.score) {
      const diag = callMcpTool('get_financial_health_diagnostic', { userId }) as any;
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
      const userStatus = callMcpTool('get_client_financial_status', { userId }) as any;
      const sim = callMcpTool('simulate_debt_restructure', {
        debtAmount: userStatus.totalDebt
      }) as any;
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

async function callOllamaChat(
  messages: Array<{ role: string; content: string }>
): Promise<A2UIScreen | null> {
  const host = (process.env.OLLAMA_HOST || 'https://ollama.com').replace(/\/+$/, '');
  const apiKey = process.env.OLLAMA_API_KEY;
  const model = (process.env.OLLAMA_MODEL || DEFAULT_MODEL).trim();

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
    options: { temperature: 0.2 }
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

    const cleaned = cleanJsonString(rawContent);
    try {
      const parsed = JSON.parse(cleaned);
      console.log(`[Ollama Cloud] Pantalla A2UI generada con éxito con ${model}`);
      return normalizeA2UIScreen(parsed);
    } catch (parseErr: any) {
      console.warn('[Ollama Cloud] Error parseando JSON, Self-Healing...', parseErr.message);

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
          { role: 'user', content: `Repara este JSON inválido:\n${rawContent}` }
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
          console.log('[Ollama Cloud] Self-Healing exitoso.');
          return normalizeA2UIScreen(healedParsed);
        }
      } catch (e) {
        console.warn('[Ollama Cloud] Self-Healing falló:', e);
      }
    }
  } catch (err: any) {
    console.warn('[Ollama Cloud] Fallo de conexión o timeout:', err.message || err);
  }

  return null;
}

function buildRestructureSuccess(opResult: any, months: number): A2UIScreen {
  return {
    type: 'a2ui_screen',
    screenId: 'restructure_success',
    assistantMessage: `¡Excelente, Carlos! Tu plan de pagos a ${months} meses ha sido aplicado en el core bancario vía MCP. Tu saldo deudor ha quedado congelado con tasa preferencial.`,
    components: [
      {
        id: 'comp_success_badge',
        type: 'HeaderBadge',
        props: {
          tag: 'FOLIO OFICIAL BANORTE · MCP',
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

/**
 * Orquestador principal: acciones UI → MCP → LLM → fallback determinístico.
 */
export async function processUserMessage(
  message: string,
  context?: any,
  history?: HistoryItem[]
): Promise<A2UIScreen> {
  const userId = context?.userId || DEFAULT_USER;

  // 1. ACCIONES VIVAS (cierre de ciclo vía callMcpTool)
  if (context?.action === 'APPLY_RESTRUCTURE') {
    const planId = context.planId || 'plan_18m';
    const status = callMcpTool('get_client_financial_status', { userId }) as any;
    const sim = callMcpTool('simulate_debt_restructure', {
      debtAmount: status.totalDebt
    }) as any;
    const plan =
      sim.options.find((o: any) => o.planId === planId) ||
      sim.options.find((o: any) => o.recommended) ||
      sim.options[1];

    const opResult = callMcpTool('apply_debt_restructuring', {
      userId,
      cardId: status.cards?.[0]?.id || DEFAULT_CARD,
      planId: plan.planId,
      months: plan.months,
      monthlyQuota: plan.monthlyPayment
    }) as any;

    return buildRestructureSuccess(opResult, plan.months);
  }

  if (context?.action === 'CONFIRM_INVESTMENT') {
    const amount = Number(context.amount) || 25000;
    const days = Number(context.days) || 91;

    try {
      const invResult = callMcpTool('apply_investment', {
        userId,
        amount,
        days,
        productId: context.productId || 'inv_pagare_banorte'
      }) as any;

      return {
        type: 'a2ui_screen',
        screenId: 'investment_success',
        assistantMessage: `¡Inversión exitosa! Invertiste $${amount.toLocaleString('es-MX')} MXN en ${invResult.productName} al ${invResult.annualRate}% anual. Saldo restante: $${invResult.remainingBalance.toLocaleString('es-MX')} MXN.`,
        components: [
          {
            id: 'comp_inv_badge',
            type: 'HeaderBadge',
            props: {
              tag: 'INVERSIÓN CONFIRMADA · MCP',
              title: `${invResult.productName} Activado`
            }
          },
          {
            id: 'comp_confirmation',
            type: 'ConfirmationCard',
            props: {
              operationId: invResult.operationId,
              cardName: invResult.productName,
              last4: '0189',
              months: Math.round(days / 30),
              monthlyQuota: invResult.profitNet,
              appliedAt: new Date().toLocaleDateString('es-MX'),
              nextPaymentDate: `Vencimiento en ${days} días (Total a recibir: $${invResult.totalFinal.toLocaleString('es-MX')} MXN)`
            }
          }
        ],
        suggestedPrompts: [
          'Ver mi historial de transacciones',
          'Revisar mi tarjeta de crédito',
          'Hacer una transferencia SPEI'
        ]
      };
    } catch (err: any) {
      return {
        type: 'a2ui_screen',
        screenId: 'investment_error',
        assistantMessage: err.message || 'No se pudo completar la inversión.',
        components: [
          {
            id: 'comp_inv_err',
            type: 'AlertBanner',
            props: { variant: 'warning', message: err.message || 'Error en inversión' }
          },
          {
            id: 'comp_inv_retry',
            type: 'ActionButton',
            props: {
              label: 'Volver a simular',
              actionType: 'SHOW_INVESTMENT',
              variant: 'outline'
            }
          }
        ],
        suggestedPrompts: ['Simular inversión con $5,000', 'Ver mi saldo']
      };
    }
  }

  if (context?.action === 'CONFIRM_TRANSFER') {
    const recipient = context.recipient || 'Mamá (Rosa Mendoza)';
    const amount = Number(context.amount) || 500;
    const concept = context.concept || 'Apoyo familiar';

    try {
      const transferResult = callMcpTool('execute_transfer', {
        userId,
        recipientName: recipient,
        amount,
        concept
      }) as any;

      return {
        type: 'a2ui_screen',
        screenId: 'transfer_success',
        assistantMessage: `Transferencia SPEI exitosa por $${amount.toLocaleString('es-MX')} MXN a favor de ${recipient}.`,
        components: [
          {
            id: 'comp_trf_badge',
            type: 'HeaderBadge',
            props: {
              tag: 'COMPROBANTE OFICIAL SPEI · MCP',
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
    } catch (err: any) {
      return {
        type: 'a2ui_screen',
        screenId: 'transfer_error',
        assistantMessage: err.message || 'No se pudo completar la transferencia.',
        components: [
          {
            id: 'comp_trf_err',
            type: 'AlertBanner',
            props: { variant: 'warning', message: err.message || 'Error SPEI' }
          }
        ],
        suggestedPrompts: ['Ver mi saldo', 'Transferir $200 a mamá']
      };
    }
  }

  // 2. DATOS FRESCOS VÍA MCP (mismo contrato que el servidor stdio)
  const userStatus = callMcpTool('get_client_financial_status', { userId }) as any;
  const debtSim = callMcpTool('simulate_debt_restructure', {
    debtAmount: userStatus.totalDebt
  }) as any;
  const invSim = callMcpTool('simulate_investment_portfolio', {
    amount: 25000,
    days: 91
  }) as any;
  const txHistory = callMcpTool('get_transaction_history', { userId }) as any;
  const health = callMcpTool('get_financial_health_diagnostic', { userId }) as any;

  const fullPrompt = `
DATOS DEL CLIENTE EN TIEMPO REAL (MCP CORE BANORTE vía callMcpTool):
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

  const messagesPayload: Array<{ role: string; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  if (history && Array.isArray(history)) {
    history.slice(-6).forEach((h) => {
      messagesPayload.push({ role: h.role, content: h.content });
    });
  }

  messagesPayload.push({ role: 'user', content: fullPrompt });

  // 3. OLLAMA CLOUD
  try {
    const ollamaResult = await callOllamaChat(messagesPayload);
    if (ollamaResult && ollamaResult.components && ollamaResult.components.length > 0) {
      return ollamaResult;
    }
  } catch (err: any) {
    console.warn('[Orchestrator] Error Ollama Cloud:', err.message || err);
  }

  // 4. FALLBACK GEMINI
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
      return normalizeA2UIScreen(parsed, userId);
    } catch (err: any) {
      console.warn('[Orchestrator] Fallo Gemini:', err.message || err);
    }
  }

  // 5. FALLBACK DETERMINÍSTICO (demo a prueba de red — tools MCP reales)
  console.log('[Orchestrator] Activando fallback NLP determinístico + MCP tools');
  return buildDeterministicScreen(message || 'Quiero pagar menos intereses de mi tarjeta', userId);
}
