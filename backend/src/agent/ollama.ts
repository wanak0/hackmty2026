import dotenv from 'dotenv';
import { SYSTEM_PROMPT } from './prompts.js';
import { MCP_TOOL_DEFINITIONS } from '../mcp/registry.js';
import { callMcpToolViaServer } from '../mcp/client.js';
import {
  type A2UIChatResponse,
  buildErrorResponse,
  buildResponseFromMcpContext,
  isCompleteA2UIResponse,
  normalizeA2UIResponse,
} from './a2uiV09.js';

dotenv.config();

export type { A2UIChatResponse } from './a2uiV09.js';
export { normalizeA2UIResponse as normalizeA2UIScreen } from './a2uiV09.js';

export interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface NlpPlan {
  intent: string;
  tools: Array<{ name: string; args: Record<string, unknown> }>;
}

const DEFAULT_USER = 'usr_carlos_01';
const DEFAULT_CARD = 'crd_carlos_oro';
const NLP_MODEL = () =>
  (process.env.NLP_MODEL || process.env.OLLAMA_MODEL || 'gpt-oss:120b').trim();
const A2UI_MODEL = () => (process.env.A2UI_MODEL || 'gemma4:31b').trim();

const NLP_SYSTEM = `Eres el clasificador NLP de Banorte. Responde SOLO JSON válido:
{
  "intent": "debt|card_payment|investment|transfer|transactions|health|balances|ui_refine|general",
  "tools": [{ "name": "<mcp_tool_name>", "args": { ... } }]
}
Tools MCP (vía servidor): ${MCP_TOOL_DEFINITIONS.map((t) => t.name).join(', ')}.
Reglas:
- pedidos de DISEÑO / UI (cambia layout, agrega/quita botón/tabla/tarjeta, más grande, reordena, "haz dos columnas", "quita el progress") → intent ui_refine y tools: [] (el A2UI edita la superficie actual)
- pagar tarjeta / abonar TDC / pago mínimo / liquidar saldo (NO reestructura) → get_client_financial_status
- debt / intereses / reestructurar → get_client_financial_status + simulate_debt_restructure
- investment / pagaré → get_client_financial_status + simulate_investment_portfolio
- transfer / SPEI → get_client_financial_status
- gastos / movimientos → get_transaction_history
- salud crediticia → get_financial_health_diagnostic
- saldos → get_client_financial_status
Usa userId "usr_carlos_01" por defecto. No inventes tools. Sin markdown. Sin get_ui_kit.`;

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

  return cleaned.replace(/,\s*([\}\]])/g, '$1');
}

function ollamaConfigured(): boolean {
  const host = (process.env.OLLAMA_HOST || 'https://ollama.com').replace(/\/+$/, '');
  const apiKey = process.env.OLLAMA_API_KEY;
  if (host.includes('ollama.com') && (!apiKey || apiKey.includes('tu_clave'))) {
    return false;
  }
  return true;
}

async function callOllamaRaw(
  model: string,
  messages: Array<{ role: string; content: string }>,
  timeoutMs = 12000,
  temperature = 0.2
): Promise<string | null> {
  if (!ollamaConfigured()) {
    console.warn('[Ollama] Falta OLLAMA_API_KEY');
    return null;
  }

  const host = (process.env.OLLAMA_HOST || 'https://ollama.com').replace(/\/+$/, '');
  const apiKey = process.env.OLLAMA_API_KEY;
  const endpoint = `${host}/api/chat`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        format: 'json',
        stream: false,
        options: { temperature }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Ollama] HTTP ${response.status} model=${model}`);
      return null;
    }

    const resData: any = await response.json();
    return resData.message?.content || resData.response || null;
  } catch (err: any) {
    console.warn(`[Ollama] Fallo model=${model}:`, err.message || err);
    return null;
  }
}

function mcpFallbackFromContext(
  mcpContext: Record<string, unknown>,
  message: string,
  intent: string,
  mutationNote?: string
): A2UIChatResponse | null {
  return buildResponseFromMcpContext(mcpContext, {
    intent,
    message,
    surfaceId: `surface_${intent || 'auto'}_${Date.now()}`,
    assistantMessage: mutationNote
      ? 'Listo. Aquí tienes el resultado con tus datos actualizados.'
      : 'Aquí tienes la interfaz con tus datos del momento.',
    suggestedPrompts: [
      '¿Cuánto tengo disponible en débito?',
      '¿En qué he gastado?',
      message.slice(0, 80) || 'Ver mis saldos'
    ]
  });
}

function heuristicNlp(message: string, userId: string): NlpPlan {
  const m = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  if (
    /^(cambia|modifica|ajusta|actualiza|redisen|rediseñ|agrega|añade|anade|quita|elimina|oculta|muestra solo|haz |pon |mueve |reordena|mas grande|más grande|mas chico|más chico|dos columnas|una columna|sin tabla|con tabla|layout|interfaz|pantalla|boton|botón|tarjeta visual)/.test(
      m
    ) ||
    /\b(agrega|añade|quita|elimina|cambia el|cambia la|haz el|haz la|más grande|mas grande)\b.*\b(boton|botón|tabla|tarjeta|titulo|título|columna|fila|progress|barra)\b/.test(
      m
    )
  ) {
    return { intent: 'ui_refine', tools: [] };
  }
  if (/invert|pagare|cetes|rendimiento/.test(m)) {
    return {
      intent: 'investment',
      tools: [
        { name: 'get_client_financial_status', args: { userId } },
        { name: 'simulate_investment_portfolio', args: { amount: 25000, days: 91 } }
      ]
    };
  }
  if (
    /pagar (mi )?tarjeta|pago (de |a )?tdc|abonar (a )?(la )?tarjeta|pago minimo|pago mínimo|liquidar (la )?tarjeta/.test(
      m
    ) &&
    !/interes|reestructur/.test(m)
  ) {
    return {
      intent: 'card_payment',
      tools: [{ name: 'get_client_financial_status', args: { userId } }]
    };
  }
  if (/transfer|spei|enviar dinero|mandar dinero|mama|mamá/.test(m)) {
    return {
      intent: 'transfer',
      tools: [{ name: 'get_client_financial_status', args: { userId } }]
    };
  }
  if (/gasto|movimiento|transaccion|historial/.test(m)) {
    return {
      intent: 'transactions',
      tools: [{ name: 'get_transaction_history', args: { userId } }]
    };
  }
  if (/salud|score|crediticio|dti/.test(m)) {
    return {
      intent: 'health',
      tools: [{ name: 'get_financial_health_diagnostic', args: { userId } }]
    };
  }
  if (/saldo|disponible|balances?/.test(m) && !/interes|deuda|tarjeta/.test(m)) {
    return {
      intent: 'balances',
      tools: [{ name: 'get_client_financial_status', args: { userId } }]
    };
  }
  return {
    intent: 'debt',
    tools: [
      { name: 'get_client_financial_status', args: { userId } },
      { name: 'simulate_debt_restructure', args: { debtAmount: 18400 } }
    ]
  };
}

async function classifyIntentAndTools(
  message: string,
  history: HistoryItem[] | undefined,
  userId: string
): Promise<NlpPlan> {
  const fallback = heuristicNlp(message, userId);

  const raw = await callOllamaRaw(
    NLP_MODEL(),
    [
      { role: 'system', content: NLP_SYSTEM },
      ...(history || []).slice(-4).map((h) => ({ role: h.role, content: h.content })),
      {
        role: 'user',
        content: `Clasifica esta intención y elige tools MCP (servidor Banorte).\nMensaje: "${message}"\nuserId: ${userId}`
      }
    ],
    8000,
    0.1
  );

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(cleanJsonString(raw));
    const tools = Array.isArray(parsed.tools) ? parsed.tools : fallback.tools;
    const validNames = new Set(MCP_TOOL_DEFINITIONS.map((t) => t.name));
    const filtered = tools
      .filter((t: any) => t?.name && validNames.has(t.name))
      .map((t: any) => ({
        name: String(t.name),
        args: { userId, ...(t.args || {}) }
      }));

    return {
      intent: parsed.intent || fallback.intent,
      tools: filtered.length > 0 ? filtered : fallback.tools
    };
  } catch {
    return fallback;
  }
}

async function runMcpTools(
  tools: Array<{ name: string; args: Record<string, unknown> }>,
  userId: string
): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};
  for (const tool of tools) {
    try {
      const args: Record<string, unknown> = { userId, ...tool.args };
      if (tool.name === 'simulate_debt_restructure' && args.debtAmount == null) {
        const status = (await callMcpToolViaServer('get_client_financial_status', {
          userId
        })) as any;
        args.debtAmount = status.totalDebt;
      }
      results[tool.name] = await callMcpToolViaServer(tool.name, args);
    } catch (err: any) {
      results[tool.name] = { error: err.message };
    }
  }
  return results;
}

function tryParseA2UI(raw: string): A2UIChatResponse | null {
  try {
    const parsed = JSON.parse(cleanJsonString(raw));
    const response = normalizeA2UIResponse(parsed);
    return isCompleteA2UIResponse(response) ? response : null;
  } catch {
    return null;
  }
}

async function generateA2UIScreen(
  message: string,
  intent: string,
  mcpContext: Record<string, unknown>,
  history: HistoryItem[] | undefined,
  userId: string,
  mutationNote?: string,
  previousSurface?: A2UIChatResponse | null
): Promise<A2UIChatResponse> {
  const a2uiTemperature = Number(process.env.A2UI_TEMPERATURE || '0.5');
  const model = A2UI_MODEL();
  const maxAttempts = 3;
  const prev =
    previousSurface && previousSurface.type === 'a2ui_v09'
      ? previousSurface
      : null;
  const prevSnippet = prev
    ? JSON.stringify({
        surfaceId: prev.surfaceId,
        assistantMessage: prev.assistantMessage,
        messages: prev.messages
      }).slice(0, 14000)
    : '';

  const basePrompt = `
INTENCIÓN NLP (pista): ${intent}
${mutationNote ? `RESULTADO DE MUTACIÓN MCP:\n${mutationNote}\n` : ''}
DATOS MCP EN TIEMPO REAL:
${JSON.stringify(mcpContext, null, 2)}

${
  prev
    ? `SUPERFICIE ACTUAL DEL LIENZO (edítala según el mensaje del usuario; conserva surfaceId "${prev.surfaceId}" salvo que pidan reiniciar):
${prevSnippet}

MODO: refinamiento iterativo. Aplica el pedido del usuario sobre esta superficie. No regeneres algo ajeno si solo pidieron un cambio visual/estructural.`
    : `No hay superficie previa: diseña una pantalla nueva completa.`
}

MENSAJE DEL USUARIO (prompt de UI / banca):
"${message}"

OBLIGATORIO:
1) Genera JSON type "a2ui_v09" con messages[] (createSurface + updateDataModel + updateComponents).
2) Lista plana de components con id "root".
3) Text/Button: text string o path a string/número — NUNCA path a objetos (evita [object Object]).
4) Button con action.event.name reales. Sin Banorte*. Sin style objects. Sin get_ui_kit.
5) Datos solo del MCP o del dataModel de la superficie actual.
userId: ${userId}
`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const reinforce =
      attempt === 1
        ? ''
        : `\n\nREINTENTO ${attempt}/${maxAttempts}: UI incompleta o con textos vacíos/"Detalle". Devuelve a2ui_v09 con root, Card+Text con cifras literales del MCP, DataTable|ProgressIndicator y Button con text + action.event.name. Props en el mismo nivel del nodo (sin props anidados). Sin Banorte*. Sin markdown.`;

    const fullPrompt = basePrompt + reinforce;
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).slice(-6).map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: fullPrompt }
    ];

    console.log(`[A2UI] Intento ${attempt}/${maxAttempts} model=${model} temp=${a2uiTemperature}`);

    let raw = await callOllamaRaw(
      model,
      messages,
      25000,
      attempt === 1 ? a2uiTemperature : Math.min(a2uiTemperature, 0.35)
    );

    if (!raw && attempt === maxAttempts) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey && !geminiKey.includes('tu_clave')) {
        try {
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(geminiKey);
          const gModel = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3
            }
          });
          const result = await gModel.generateContent(fullPrompt);
          raw = result.response.text();
          console.log('[A2UI] Fallback Gemini en último intento');
        } catch (err: any) {
          console.warn('[A2UI] Gemini falló:', err.message || err);
        }
      }
    }

    if (!raw) {
      console.warn(`[A2UI] Intento ${attempt}: sin contenido del modelo`);
      continue;
    }

    let screen = tryParseA2UI(raw);
    if (screen) {
      console.log(
        `[A2UI] OK en intento ${attempt}: ${screen.surfaceId} (${screen.messages.length} msgs)`
      );
      return screen;
    }

    console.warn(`[A2UI] Intento ${attempt}: incompleto → self-heal`);
    const healRaw = await callOllamaRaw(
      model,
      [
        {
          role: 'system',
          content:
            'Validador A2UI v0.9. Devuelve SOLO JSON a2ui_v09 con createSurface+updateDataModel+updateComponents, root Column, Card/Text, DataTable|ProgressIndicator y Button con action.event.name. Catálogo estándar a2ui-shadcn únicamente. Sin markdown.'
        },
        {
          role: 'user',
          content: `Completa/repara hasta que sea renderizable:\n${raw}\n\nContexto MCP:\n${JSON.stringify(mcpContext).slice(0, 4000)}`
        }
      ],
      15000,
      0.1
    );

    if (healRaw) {
      screen = tryParseA2UI(healRaw);
      if (screen) {
        console.log(`[A2UI] OK tras self-heal intento ${attempt}: ${screen.surfaceId}`);
        return screen;
      }
    }
  }

  console.warn('[A2UI] Todos los intentos fallaron → superficie desde datos MCP');
  const fromMcp = mcpFallbackFromContext(mcpContext, message, intent, mutationNote);
  if (fromMcp) {
    console.log(`[A2UI] OK vía datos MCP: ${fromMcp.surfaceId}`);
    return fromMcp;
  }

  console.warn('[A2UI] Sin datos MCP útiles → error mínimo');
  return buildErrorResponse(
    message,
    ['APPLY_RESTRUCTURE', 'CONFIRM_INVESTMENT', 'CONFIRM_TRANSFER', 'PAY_CARD'].includes(intent)
  );
}

async function handleMutationAction(
  message: string,
  context: any,
  history: HistoryItem[] | undefined,
  userId: string
): Promise<A2UIChatResponse> {
  const action = context.action as string;
  let mutationNote = '';
  const mcpContext: Record<string, unknown> = {};

  try {
    if (action === 'APPLY_RESTRUCTURE') {
      const planId = context.planId || 'plan_18m';
      const status = (await callMcpToolViaServer('get_client_financial_status', { userId })) as any;
      const sim = (await callMcpToolViaServer('simulate_debt_restructure', {
        debtAmount: status.totalDebt
      })) as any;
      const plan =
        sim.options.find((o: any) => o.planId === planId) ||
        sim.options.find((o: any) => o.recommended) ||
        sim.options[1];

      const opResult = await callMcpToolViaServer('apply_debt_restructuring', {
        userId,
        cardId: status.cards?.[0]?.id || DEFAULT_CARD,
        planId: plan.planId,
        months: plan.months,
        monthlyQuota: plan.monthlyPayment
      });

      mcpContext.get_client_financial_status = await callMcpToolViaServer(
        'get_client_financial_status',
        { userId }
      );
      mcpContext.apply_debt_restructuring = opResult;
      mcpContext.simulate_debt_restructure = sim;
      mutationNote = `Reestructura aplicada: ${JSON.stringify(opResult)}. Genera Card+Text de comprobante con folio/plazo/pago y Button USER_PROMPT para continuar. Datos en /confirmation.`;
    } else if (action === 'CONFIRM_INVESTMENT') {
      const amount = Number(context.amount) || 25000;
      const days = Number(context.days) || 91;
      const invResult = await callMcpToolViaServer('apply_investment', {
        userId,
        amount,
        days,
        productId: context.productId || 'inv_pagare_banorte'
      });
      mcpContext.get_client_financial_status = await callMcpToolViaServer(
        'get_client_financial_status',
        { userId }
      );
      mcpContext.apply_investment = invResult;
      mutationNote = `Inversión aplicada: ${JSON.stringify(invResult)}. Genera comprobante con Card+Text y folio INV.`;
    } else if (action === 'CONFIRM_TRANSFER') {
      const recipient = context.recipient || 'Mamá (Rosa Mendoza)';
      const amount = Number(context.amount) || 500;
      const concept = context.concept || 'Apoyo familiar';
      const transferResult = await callMcpToolViaServer('execute_transfer', {
        userId,
        recipientName: recipient,
        amount,
        concept
      });
      mcpContext.get_client_financial_status = await callMcpToolViaServer(
        'get_client_financial_status',
        { userId }
      );
      mcpContext.execute_transfer = transferResult;
      mutationNote = `SPEI ejecutado: ${JSON.stringify(transferResult)}. Genera comprobante Card+Text con tracking SPEI.`;
    } else if (action === 'PAY_CARD') {
      const status = (await callMcpToolViaServer('get_client_financial_status', { userId })) as any;
      const card = status.cards?.[0];
      const amount =
        Number(context.amount) ||
        Number(context.payload?.amount) ||
        Number(card?.minimumPayment) ||
        980;
      const payResult = await callMcpToolViaServer('pay_credit_card', {
        userId,
        amount,
        cardId: context.cardId || card?.id || DEFAULT_CARD
      });
      mcpContext.get_client_financial_status = await callMcpToolViaServer(
        'get_client_financial_status',
        { userId }
      );
      mcpContext.pay_credit_card = payResult;
      mutationNote = `Pago a TDC aplicado: ${JSON.stringify(payResult)}. Muestra comprobante Card+Text.`;
    } else {
      mutationNote = `Acción UI: ${action}. Payload: ${JSON.stringify(context)}`;
      mcpContext.get_client_financial_status = await callMcpToolViaServer(
        'get_client_financial_status',
        { userId }
      );
    }
  } catch (err: any) {
    mcpContext.mutation_error = err.message;
    mutationNote = `La operación falló: ${err.message}. Muestra Text de aviso y Button para reintentar.`;
  }

  // El LLM arma/refina el comprobante con el resultado MCP (sin plantillas UI kit).
  return generateA2UIScreen(
    message || `Acción: ${action}`,
    action,
    mcpContext,
    history,
    userId,
    mutationNote,
    context?.currentSurface || null
  );
}

/**
 * Pipeline: NLP → MCP → A2UI iterativo (prompt sobre la UI y se modifica el lienzo).
 * Mutaciones sin LLM se rechazan. Consultas sin LLM usan superficie desde datos MCP.
 */
export async function processUserMessage(
  message: string,
  context?: any,
  history?: HistoryItem[]
): Promise<A2UIChatResponse> {
  const userId = context?.userId || DEFAULT_USER;
  const hasLlm = ollamaConfigured();
  const previousSurface =
    context?.currentSurface && context.currentSurface.type === 'a2ui_v09'
      ? (context.currentSurface as A2UIChatResponse)
      : null;

  if (context?.action) {
    if (!hasLlm) return buildErrorResponse(message);
    return handleMutationAction(message, context, history, userId);
  }

  const plan = hasLlm
    ? await classifyIntentAndTools(message, history, userId)
    : heuristicNlp(message, userId);

  // Refinar UI sin tools si hay lienzo actual.
  if (plan.intent === 'ui_refine' && previousSurface) {
    plan.tools = [];
  }

  console.log(
    `[NLP] intent=${plan.intent} tools=${plan.tools.map((t) => t.name).join(',') || '—'} llm=${hasLlm} refine=${Boolean(previousSurface && plan.intent === 'ui_refine')}`
  );

  if (plan.tools.some((t) => t.name === 'simulate_debt_restructure')) {
    const status = (await callMcpToolViaServer('get_client_financial_status', {
      userId
    })) as any;
    plan.tools = plan.tools.map((t) =>
      t.name === 'simulate_debt_restructure'
        ? { ...t, args: { ...t.args, debtAmount: status.totalDebt } }
        : t
    );
  }

  const mcpContext =
    plan.tools.length > 0 ? await runMcpTools(plan.tools, userId) : {};

  // Para refinamientos, reinyecta dataModel previo como contexto blando.
  if (previousSurface && plan.intent === 'ui_refine') {
    const dmMsg = previousSurface.messages.find((m) => 'updateDataModel' in m) as
      | { updateDataModel: { value?: unknown } }
      | undefined;
    if (dmMsg?.updateDataModel?.value) {
      mcpContext.previous_data_model = dmMsg.updateDataModel.value;
    }
  }

  if (!hasLlm) {
    if (previousSurface && plan.intent === 'ui_refine') {
      return previousSurface;
    }
    const fromMcp = mcpFallbackFromContext(mcpContext, message, plan.intent);
    if (fromMcp) {
      console.log(`[A2UI] Sin LLM → superficie desde datos MCP (${fromMcp.surfaceId})`);
      return fromMcp;
    }
    return buildErrorResponse(message);
  }

  return generateA2UIScreen(
    message,
    plan.intent,
    mcpContext,
    history,
    userId,
    undefined,
    previousSurface
  );
}
