import dotenv from 'dotenv';
import { SYSTEM_PROMPT } from './prompts.js';
import { callMcpTool, MCP_TOOL_DEFINITIONS } from '../mcp/registry.js';

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

interface NlpPlan {
  intent: string;
  tools: Array<{ name: string; args: Record<string, unknown> }>;
}

const DEFAULT_USER = 'usr_carlos_01';
const DEFAULT_CARD = 'crd_carlos_oro';
const NLP_MODEL = () => (process.env.OLLAMA_MODEL || 'gemma4:3.1b').trim();
const A2UI_MODEL = () => (process.env.A2UI_MODEL || 'gemma4:31b').trim();

const NLP_SYSTEM = `Eres el clasificador NLP de Banorte. Responde SOLO JSON válido:
{
  "intent": "debt|card_payment|investment|transfer|transactions|health|balances|general",
  "tools": [{ "name": "<mcp_tool_name>", "args": { ... } }]
}
Tools MCP disponibles: ${MCP_TOOL_DEFINITIONS.map((t) => t.name).join(', ')}.
Reglas:
- pagar tarjeta / abonar TDC / pago mínimo / liquidar saldo (NO reestructura) → get_client_financial_status
- debt / intereses / reestructurar → get_client_financial_status + simulate_debt_restructure
- investment / pagaré → get_client_financial_status + simulate_investment_portfolio
- transfer / SPEI → get_client_financial_status
- gastos / movimientos → get_transaction_history
- salud crediticia → get_financial_health_diagnostic
- saldos → get_client_financial_status
- SIEMPRE puedes incluir get_ui_kit para gráficas/íconos/bloques default
Usa userId "usr_carlos_01" por defecto. No inventes tools. Sin markdown.`;

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

const KNOWN_ACTION_TYPES = new Set([
  'APPLY_RESTRUCTURE',
  'CONFIRM_INVESTMENT',
  'CONFIRM_TRANSFER',
  'SELECT_PLAN',
  'SHOW_DEBT_RESTRUCTURE_OPTIONS',
  'SHOW_INVESTMENT',
  'VIEW_TRANSACTIONS',
  'VIEW_ACCOUNT',
  'VIEW_BALANCES',
  'PAY_CARD',
  'USER_PROMPT'
]);

function hasNonEmptyString(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

function hasFiniteNumber(v: unknown): boolean {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * Verifica que un control interactivo tenga actionType conocido y payload usable.
 * Si no se puede reparar con datos MCP, se descarta (no se dibuja muerto).
 */
function sanitizeInteractiveComponent(
  comp: A2UIComponent,
  userId: string,
  mcpHint?: Record<string, unknown>
): A2UIComponent | null {
  const type = comp.type;
  const props = { ...(comp.props || {}) };

  if (type === 'ActionButton') {
    if (!hasNonEmptyString(props.label)) return null;
    let actionType = String(props.actionType || '').trim();
    if (!KNOWN_ACTION_TYPES.has(actionType)) {
      // Intentar inferir
      const label = String(props.label).toLowerCase();
      if (/aplicar|reestructur|plan/.test(label)) actionType = 'APPLY_RESTRUCTURE';
      else if (/invert/.test(label)) actionType = 'CONFIRM_INVESTMENT';
      else if (/transfer|spei|enviar/.test(label)) actionType = 'CONFIRM_TRANSFER';
      else if (/gasto|movimiento/.test(label)) actionType = 'VIEW_TRANSACTIONS';
      else if (/saldo/.test(label)) actionType = 'VIEW_BALANCES';
      else return null;
      props.actionType = actionType;
    }

    if (actionType === 'APPLY_RESTRUCTURE') {
      const planFromPayload =
        props.payload && typeof props.payload === 'object'
          ? (props.payload as any).planId
          : undefined;
      if (!hasNonEmptyString(props.planId) && !hasNonEmptyString(planFromPayload)) {
        const status =
          (mcpHint?.get_client_financial_status as any) ||
          callMcpTool('get_client_financial_status', { userId });
        const sim =
          (mcpHint?.simulate_debt_restructure as any) ||
          callMcpTool('simulate_debt_restructure', { debtAmount: status.totalDebt });
        const plan = sim.options?.find((o: any) => o.recommended) || sim.options?.[1];
        if (!plan?.planId) return null;
        props.planId = plan.planId;
      } else if (!hasNonEmptyString(props.planId) && hasNonEmptyString(planFromPayload)) {
        props.planId = planFromPayload;
      }
    }

    if (actionType === 'CONFIRM_INVESTMENT') {
      if (!hasFiniteNumber(props.amount)) props.amount = 5000;
      if (!hasFiniteNumber(props.days) && !hasFiniteNumber(props.initialDays)) props.days = 91;
      else if (!hasFiniteNumber(props.days)) props.days = props.initialDays;
    }

    if (actionType === 'CONFIRM_TRANSFER') {
      if (!hasNonEmptyString(props.recipient)) props.recipient = 'Mamá (Rosa Mendoza)';
      if (!hasFiniteNumber(props.amount)) props.amount = 500;
      if (!hasNonEmptyString(props.concept)) props.concept = 'Apoyo familiar';
    }

    if (actionType === 'PAY_CARD') {
      const status =
        (mcpHint?.get_client_financial_status as any) ||
        callMcpTool('get_client_financial_status', { userId });
      const card = status?.cards?.[0];
      const fromPayload =
        props.payload && typeof props.payload === 'object'
          ? Number((props.payload as any).amount)
          : NaN;
      if (!hasFiniteNumber(props.amount)) {
        props.amount = Number.isFinite(fromPayload) && fromPayload > 0
          ? fromPayload
          : Number(card?.minimumPayment) || 980;
      }
      if (!hasNonEmptyString(props.cardId) && card?.id) props.cardId = card.id;
      props.payload = {
        ...(props.payload || {}),
        amount: props.amount,
        cardId: props.cardId || card?.id
      };
    }

    if (actionType === 'USER_PROMPT') {
      const text = props.payload?.text || props.text || props.label;
      if (!hasNonEmptyString(text)) return null;
      props.payload = { ...(props.payload || {}), text };
    }

    return { ...comp, props };
  }

  if (type === 'OptionPills') {
    const rawOpts = Array.isArray(props.options) ? props.options : [];
    const options = rawOpts
      .map((opt: any, idx: number) => {
        if (!opt || !hasNonEmptyString(opt.label)) return null;
        let actionType = String(opt.actionType || '').trim();
        const payload = { ...(opt.payload || {}) };
        if (opt.planId && !payload.planId) payload.planId = opt.planId;
        if (opt.id && !payload.planId && String(opt.id).startsWith('plan_')) {
          payload.planId = opt.id;
        }

        if (!KNOWN_ACTION_TYPES.has(actionType)) {
          if (payload.planId || opt.planId) actionType = 'APPLY_RESTRUCTURE';
          else if (/invert|pagare/.test(String(opt.label).toLowerCase()))
            actionType = 'SHOW_INVESTMENT';
          else if (/gasto/.test(String(opt.label).toLowerCase())) actionType = 'VIEW_TRANSACTIONS';
          else return null;
        }

        if (actionType === 'APPLY_RESTRUCTURE' && !hasNonEmptyString(payload.planId)) {
          return null;
        }
        if (actionType === 'PAY_CARD') {
          const status =
            (mcpHint?.get_client_financial_status as any) ||
            callMcpTool('get_client_financial_status', { userId });
          const card = status?.cards?.[0];
          const amt = Number(payload.amount ?? opt.amount);
          payload.amount =
            Number.isFinite(amt) && amt > 0
              ? amt
              : Number(card?.minimumPayment) || 980;
          if (!payload.cardId && card?.id) payload.cardId = card.id;
        }
        if (actionType === 'USER_PROMPT' && !hasNonEmptyString(payload.text)) {
          payload.text = opt.label;
        }

        return {
          id: opt.id || `opt_${idx}`,
          label: opt.label,
          actionType,
          payload,
          selected: !!opt.selected
        };
      })
      .filter(Boolean);

    if (options.length === 0) {
      // Reparar con planes MCP si el contexto es deuda
      const status =
        (mcpHint?.get_client_financial_status as any) ||
        callMcpTool('get_client_financial_status', { userId });
      const sim =
        (mcpHint?.simulate_debt_restructure as any) ||
        callMcpTool('simulate_debt_restructure', { debtAmount: status.totalDebt });
      if (!sim?.options?.length) return null;
      props.options = sim.options.map((o: any) => ({
        id: o.planId,
        label: `${o.months} meses · $${o.monthlyPayment}/mes`,
        actionType: 'APPLY_RESTRUCTURE',
        payload: { planId: o.planId },
        selected: !!o.recommended
      }));
      props.label = props.label || 'Elige un plazo';
      return { ...comp, props };
    }

    props.options = options;
    return { ...comp, props };
  }

  if (type === 'ActionList') {
    const rawActs = Array.isArray(props.actions) ? props.actions : [];
    const actions = rawActs
      .map((act: any) => {
        if (!act || !hasNonEmptyString(act.label)) return null;
        let actionType = String(act.actionType || '').trim();
        if (!KNOWN_ACTION_TYPES.has(actionType)) {
          const l = String(act.label).toLowerCase();
          if (/deuda|interes|reestructur/.test(l)) actionType = 'SHOW_DEBT_RESTRUCTURE_OPTIONS';
          else if (/invert/.test(l)) actionType = 'SHOW_INVESTMENT';
          else if (/gasto/.test(l)) actionType = 'VIEW_TRANSACTIONS';
          else if (/saldo/.test(l)) actionType = 'VIEW_BALANCES';
          else actionType = 'USER_PROMPT';
        }
        const payload = { ...(act.payload || {}) };
        if (actionType === 'USER_PROMPT' && !hasNonEmptyString(payload.text)) {
          payload.text = act.label;
        }
        return { label: act.label, actionType, payload };
      })
      .filter(Boolean);

    if (actions.length === 0) return null;
    props.actions = actions;
    return { ...comp, props };
  }

  if (type === 'PlanOptionList') {
    if (!Array.isArray(props.options) || props.options.length === 0) {
      const status =
        (mcpHint?.get_client_financial_status as any) ||
        callMcpTool('get_client_financial_status', { userId });
      const sim =
        (mcpHint?.simulate_debt_restructure as any) ||
        callMcpTool('simulate_debt_restructure', { debtAmount: status.totalDebt });
      if (!sim?.options?.length) return null;
      props.options = sim.options;
      props.selectedPlanId =
        props.selectedPlanId ||
        sim.options.find((o: any) => o.recommended)?.planId ||
        sim.options[0].planId;
    }
    const valid = props.options.filter(
      (o: any) =>
        o &&
        hasNonEmptyString(o.planId) &&
        hasFiniteNumber(o.months) &&
        hasFiniteNumber(o.monthlyPayment)
    );
    if (valid.length === 0) return null;
    props.options = valid;
    return { ...comp, props };
  }

  if (type === 'SliderInput') {
    if (!hasNonEmptyString(props.label)) return null;
    if (!hasFiniteNumber(props.min) || !hasFiniteNumber(props.max)) return null;
    if (!hasFiniteNumber(props.defaultValue)) {
      props.defaultValue = props.min;
    }
    if (!hasNonEmptyString(props.actionType)) {
      props.actionType = 'USER_PROMPT';
      props.payload = { text: `Ajustar ${props.label} a ${props.defaultValue}` };
    }
    return { ...comp, props };
  }

  if (type === 'InvestmentSimulator') {
    if (!Array.isArray(props.options) || props.options.length === 0) return null;
    return { ...comp, props };
  }

  if (type === 'TransferCard') {
    if (!hasNonEmptyString(props.recipient) || !hasFiniteNumber(props.amount)) return null;
    return { ...comp, props };
  }

  // Contenedores: sanitizar children
  if ((type === 'Card' || type === 'Grid' || type === 'Stack') && Array.isArray(comp.children)) {
    const children = comp.children
      .map((ch) => sanitizeInteractiveComponent(ch, userId, mcpHint))
      .filter(Boolean) as A2UIComponent[];
    // Card vacía sin título no aporta
    if (children.length === 0 && !hasNonEmptyString(props.title)) return null;
    return { ...comp, props, children };
  }

  // Componentes no interactivos: conservar si tienen contenido mínimo
  if (type === 'Text' && !hasNonEmptyString(props.content) && !hasNonEmptyString(props.text)) {
    return null;
  }
  if (type === 'AlertBanner' && !hasNonEmptyString(props.message)) return null;
  if (type === 'HeaderBadge' && !hasNonEmptyString(props.title)) return null;
  if (type === 'MetricGrid') {
    if (!Array.isArray(props.items) || props.items.length === 0) return null;
  }
  if (type === 'MetricItem' && (!hasNonEmptyString(props.label) || props.value == null)) {
    return null;
  }
  if (type === 'MetricComparison') {
    if (!hasFiniteNumber(props.balance) || !hasFiniteNumber(props.currentCat)) return null;
  }
  if (type === 'ConfirmationCard') {
    if (!hasNonEmptyString(props.operationId)) return null;
  }
  if (type === 'TransactionTable') {
    if (!Array.isArray(props.transactions) || props.transactions.length === 0) return null;
  }
  if (type === 'FinancialHealthScore' && !hasFiniteNumber(props.score)) return null;

  return { ...comp, props };
}

function sanitizeScreenComponents(
  components: A2UIComponent[],
  userId: string,
  mcpHint?: Record<string, unknown>
): A2UIComponent[] {
  const cleaned = components
    .map((c) => sanitizeInteractiveComponent(c, userId, mcpHint))
    .filter(Boolean) as A2UIComponent[];

  // Asegurar al menos un control accionable si hay deuda simulada
  const hasInteractive = cleaned.some((c) =>
    ['ActionButton', 'OptionPills', 'ActionList', 'PlanOptionList'].includes(c.type)
  );
  if (!hasInteractive && mcpHint?.simulate_debt_restructure) {
    const sim = mcpHint.simulate_debt_restructure as any;
    if (sim?.options?.length) {
      cleaned.push({
        id: 'sanitized_plan_pills',
        type: 'OptionPills',
        props: {
          label: 'Elige un plazo para aplicar',
          options: sim.options.map((o: any) => ({
            id: o.planId,
            label: `${o.months} meses · $${o.monthlyPayment}/mes`,
            actionType: 'APPLY_RESTRUCTURE',
            payload: { planId: o.planId },
            selected: !!o.recommended
          }))
        }
      });
    }
  }

  return cleaned;
}

/**
 * Normaliza A2UI e hidrata props faltantes vía MCP.
 */
export function normalizeA2UIScreen(
  raw: any,
  userId = DEFAULT_USER,
  mcpHint?: Record<string, unknown>
): A2UIScreen {
  const s = raw.a2ui_screen || raw;
  const screenId = s.screenId || s.screenType || s.id || 'dynamic_screen';
  const assistantMessage =
    s.assistantMessage ||
    s.message ||
    'Analicé tu solicitud y diseñé esta interfaz personalizada para resolverla:';

  const rawComps: any[] = s.components || [];

  const hydrated = rawComps.map((c: any, index: number) => {
    const type = c.type || c.component || 'HeaderBadge';
    const id = c.id || `comp_${type}_${index}`;
    const props = { ...(c.props || {}) };

    Object.keys(c).forEach((k) => {
      if (k !== 'id' && k !== 'type' && k !== 'component' && k !== 'props' && k !== 'children') {
        props[k] = c[k];
      }
    });

    if (type === 'InvestmentSimulator' && (!props.options || props.options.length === 0)) {
      const amt = props.amount || 25000;
      const days = props.days || props.initialDays || 91;
      const inv = callMcpTool('simulate_investment_portfolio', { amount: amt, days }) as any;
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

  const components = sanitizeScreenComponents(hydrated, userId, mcpHint);

  const suggestedPrompts: string[] = Array.isArray(s.suggestedPrompts)
    ? s.suggestedPrompts.filter((p: any) => hasNonEmptyString(p))
    : ['Ver mis saldos', '¿En qué he gastado?', 'Simular una inversión'];

  return {
    type: 'a2ui_screen',
    screenId,
    assistantMessage,
    components,
    suggestedPrompts: suggestedPrompts.length >= 2 ? suggestedPrompts : [
      'Ver mis saldos',
      '¿En qué he gastado?',
      'Simular una inversión'
    ]
  };
}

function heuristicNlp(message: string, userId: string): NlpPlan {
  const m = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  if (/invert|pagare|cetes|rendimiento/.test(m)) {
    return {
      intent: 'investment',
      tools: [
        { name: 'get_client_financial_status', args: { userId } },
        { name: 'simulate_investment_portfolio', args: { amount: 25000, days: 91 } }
      ]
    };
  }
  if (/pagar (mi )?tarjeta|pago (de |a )?tdc|abonar (a )?(la )?tarjeta|pago minimo|pago mínimo|liquidar (la )?tarjeta/.test(m) && !/interes|reestructur/.test(m)) {
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
        content: `Clasifica esta intención y elige tools MCP.\nMensaje: "${message}"\nuserId: ${userId}`
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

function runMcpTools(
  tools: Array<{ name: string; args: Record<string, unknown> }>,
  userId: string
): Record<string, unknown> {
  const results: Record<string, unknown> = {};

  for (const tool of tools) {
    try {
      const args: Record<string, unknown> = { userId, ...tool.args };
      if (tool.name === 'simulate_debt_restructure' && args.debtAmount == null) {
        const status = callMcpTool('get_client_financial_status', { userId }) as any;
        args.debtAmount = status.totalDebt;
      }
      results[tool.name] = callMcpTool(tool.name, args);
    } catch (err: any) {
      results[tool.name] = { error: err.message };
    }
  }

  return results;
}

function buildErrorScreen(message: string): A2UIScreen {
  return {
    type: 'a2ui_screen',
    screenId: 'agent_generation_error',
    assistantMessage:
      'No pude generar la interfaz A2UI en este momento. Revisa la conexión con Ollama Cloud e inténtalo de nuevo.',
    components: [
      {
        id: 'comp_err_badge',
        type: 'HeaderBadge',
        props: {
          tag: 'A2UI · GENERACIÓN',
          title: 'No se pudo construir la pantalla'
        }
      },
      {
        id: 'comp_err_alert',
        type: 'AlertBanner',
        props: {
          variant: 'warning',
          message:
            'El modelo A2UI no respondió con JSON válido. Tu solicitud se conserva; puedes reintentar.'
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

/** Pantalla válida = >=4 componentes tipados + controles interactivos sanos. */
function isCompleteA2UIScreen(screen: A2UIScreen | null | undefined): screen is A2UIScreen {
  if (!screen || screen.type !== 'a2ui_screen') return false;
  if (!Array.isArray(screen.components) || screen.components.length < 4) return false;
  if (!screen.assistantMessage?.trim()) return false;
  const withType = screen.components.filter(
    (c) => c && typeof c.type === 'string' && c.type.length > 0
  );
  if (withType.length < 4) return false;

  const VISUAL = new Set([
    'DonutChart',
    'BarChart',
    'ProgressBar',
    'StatTile',
    'SectionHeader',
    'Icon'
  ]);

  const hasVisualDeep = (nodes: A2UIComponent[]): boolean =>
    nodes.some(
      (c) =>
        VISUAL.has(c.type) ||
        (Array.isArray(c.children) && c.children.length > 0 && hasVisualDeep(c.children))
    );

  if (!hasVisualDeep(withType)) return false;

  for (const c of screen.components) {
    if (c.type === 'ActionButton') {
      if (!hasNonEmptyString(c.props?.label) || !hasNonEmptyString(c.props?.actionType)) return false;
      if (!KNOWN_ACTION_TYPES.has(String(c.props.actionType))) return false;
      const planFromPayload =
        c.props?.payload && typeof c.props.payload === 'object'
          ? (c.props.payload as any).planId
          : undefined;
      if (
        c.props.actionType === 'APPLY_RESTRUCTURE' &&
        !hasNonEmptyString(c.props.planId) &&
        !hasNonEmptyString(planFromPayload)
      ) {
        return false;
      }
    }
    if (c.type === 'OptionPills') {
      const opts = c.props?.options;
      if (!Array.isArray(opts) || opts.length === 0) return false;
      if (
        opts.some(
          (o: any) =>
            !hasNonEmptyString(o?.label) ||
            !hasNonEmptyString(o?.actionType) ||
            !KNOWN_ACTION_TYPES.has(String(o.actionType))
        )
      ) {
        return false;
      }
    }
    if (c.type === 'ActionList') {
      const acts = c.props?.actions;
      if (!Array.isArray(acts) || acts.length === 0) return false;
      if (acts.some((a: any) => !hasNonEmptyString(a?.label) || !hasNonEmptyString(a?.actionType))) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Garantía final: UI rica con kit visual MCP (gráficas + StatTiles + íconos).
 */
function buildGuaranteedScreenFromMcp(
  message: string,
  intent: string,
  mcpContext: Record<string, unknown>,
  userId: string
): A2UIScreen {
  const kit =
    (mcpContext.get_ui_kit as any) ||
    callMcpTool('get_ui_kit', { userId, focus: intent || 'auto' });
  const status = (mcpContext.get_client_financial_status ||
    callMcpTool('get_client_financial_status', { userId })) as any;
  const debtSim = (mcpContext.simulate_debt_restructure || null) as any;
  const name = status?.user?.name || 'Carlos';
  const debt = status?.totalDebt ?? 0;
  const checking = status?.user?.checkingBalance ?? 0;
  const card = status?.cards?.[0];

  const components: A2UIComponent[] = [
    {
      id: 'g_header',
      type: 'SectionHeader',
      props: {
        icon: 'sparkles',
        tag: 'A2UI · UI KIT',
        title: `Resumen para ${name}`,
        subtitle: `Respondí a: “${message.slice(0, 80)}”`
      }
    },
    {
      id: 'g_stats',
      type: 'Grid',
      props: { columns: 2 },
      children: [
        {
          id: 'g_stat_check',
          type: 'StatTile',
          props: {
            icon: 'wallet',
            label: 'Saldo débito',
            value: `$${Number(checking).toLocaleString('es-MX')}`,
            tone: 'success'
          }
        },
        {
          id: 'g_stat_debt',
          type: 'StatTile',
          props: {
            icon: 'credit-card',
            label: 'Deuda TDC',
            value: `$${Number(debt).toLocaleString('es-MX')}`,
            tone: 'danger',
            trend: 'negative'
          }
        }
      ]
    }
  ];

  if (kit?.charts?.creditUsage?.props) {
    components.push({
      id: 'g_usage',
      type: 'ProgressBar',
      props: kit.charts.creditUsage.props
    });
  }

  if (intent === 'transactions' || intent === 'spending' || /gasto/.test(message.toLowerCase())) {
    if (kit?.charts?.spendingDonut?.props?.segments?.length) {
      components.push({
        id: 'g_donut',
        type: 'DonutChart',
        props: kit.charts.spendingDonut.props
      });
    }
  } else if (kit?.charts?.balancesBar?.props) {
    components.push({
      id: 'g_bars',
      type: 'BarChart',
      props: kit.charts.balancesBar.props
    });
  }

  if (debtSim?.options?.length) {
    if (kit?.charts?.planBars?.props) {
      components.push({
        id: 'g_plan_bars',
        type: 'BarChart',
        props: kit.charts.planBars.props
      });
    }
    components.push({
      id: 'g_pills',
      type: 'OptionPills',
      props: {
        label: 'Plazos disponibles',
        options: debtSim.options.map((o: any) => ({
          id: o.planId,
          label: `${o.months}m · $${o.monthlyPayment}/mes`,
          actionType: 'APPLY_RESTRUCTURE',
          payload: { planId: o.planId },
          selected: !!o.recommended
        }))
      }
    });
  } else if (intent === 'card_payment' || /pagar|abonar|pago/.test(message.toLowerCase())) {
    const minPay = Number(card?.minimumPayment) || kit?.paymentHints?.minimumPayment || 980;
    const maxPay = Math.min(Number(checking) || 0, Number(debt) || 0);
    const midPay = Math.min(Math.round(maxPay / 2) || minPay, maxPay || minPay);
    components.push({
      id: 'g_pay',
      type: 'OptionPills',
      props: {
        label: 'Pagar TDC desde cheques',
        options: [
          {
            id: 'pay_min',
            label: `Mínimo $${minPay.toLocaleString('es-MX')}`,
            actionType: 'PAY_CARD',
            payload: { amount: minPay, cardId: card?.id }
          },
          ...(midPay > minPay
            ? [
                {
                  id: 'pay_mid',
                  label: `$${midPay.toLocaleString('es-MX')}`,
                  actionType: 'PAY_CARD',
                  payload: { amount: midPay, cardId: card?.id }
                }
              ]
            : []),
          ...(maxPay > 0
            ? [
                {
                  id: 'pay_max',
                  label: `Todo lo disponible $${maxPay.toLocaleString('es-MX')}`,
                  actionType: 'PAY_CARD',
                  payload: { amount: maxPay, cardId: card?.id }
                }
              ]
            : [])
        ]
      }
    });
  } else {
    components.push({
      id: 'g_actions',
      type: 'ActionList',
      props: {
        title: 'Siguiente paso',
        actions: [
          { label: 'Ver opciones de deuda', actionType: 'SHOW_DEBT_RESTRUCTURE_OPTIONS' },
          { label: 'Ver gastos del mes', actionType: 'VIEW_TRANSACTIONS' }
        ]
      }
    });
  }

  return {
    type: 'a2ui_screen',
    screenId: `guaranteed_${intent}_${Date.now()}`,
    assistantMessage: `${name}, aquí tienes una vista con gráficas e íconos del UI Kit Banorte.`,
    components,
    suggestedPrompts: [
      'Quiero pagar mi tarjeta de crédito',
      'Quiero pagar menos intereses de mi tarjeta',
      '¿En qué he gastado este mes?',
      'Simular una inversión'
    ]
  };
}

function tryParseA2UI(
  raw: string,
  userId: string,
  mcpHint?: Record<string, unknown>
): A2UIScreen | null {
  try {
    const parsed = JSON.parse(cleanJsonString(raw));
    const screen = normalizeA2UIScreen(parsed, userId, mcpHint);
    return isCompleteA2UIScreen(screen) ? screen : null;
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
  mutationNote?: string
): Promise<A2UIScreen> {
  const a2uiTemperature = Number(process.env.A2UI_TEMPERATURE || '0.5');
  const model = A2UI_MODEL();
  const maxAttempts = 3;

  const basePrompt = `
INTENCIÓN NLP (pista): ${intent}
${mutationNote ? `RESULTADO DE MUTACIÓN MCP:\n${mutationNote}\n` : ''}
DATOS MCP EN TIEMPO REAL:
${JSON.stringify(mcpContext, null, 2)}

MENSAJE DEL USUARIO:
"${message}"

OBLIGATORIO ANTES DE RESPONDER:
1) Genera JSON a2ui_screen completo.
2) components.length >= 4 (verifica antes de enviar).
3) CALIDAD VISUAL: incluye SectionHeader + >=2 StatTile (con icon) + >=1 gráfica (DonutChart|BarChart|ProgressBar). Copia props de get_ui_kit.charts o defaultBlocks.
4) VERIFICA CADA botón/pill/lista: label + actionType conocido + payload (planId/amount/text). Si un control no tiene acción real, NO lo incluyas.
5) Prioriza SectionHeader/StatTile/DonutChart/BarChart/ProgressBar/Icon. Evita la terna MetricComparison+PlanOptionList.
6) Datos solo del MCP anterior.
userId: ${userId}
`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const reinforce =
      attempt === 1
        ? ''
        : `\n\nREINTENTO ${attempt}/${maxAttempts}: UI incompleta o sin gráficas/íconos, o botones muertos. DEBES devolver JSON con components.length >= 4, SectionHeader+StatTile+gráfica, y controles con actionType/payload. Usa get_ui_kit. Sin markdown.`;

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

    let screen = tryParseA2UI(raw, userId, mcpContext);
    if (screen) {
      console.log(
        `[A2UI] OK en intento ${attempt}: ${screen.screenId} (${screen.components.length} comps, interactivos verificados)`
      );
      return screen;
    }

    console.warn(`[A2UI] Intento ${attempt}: incompleto o botones inválidos → self-heal`);
    const healRaw = await callOllamaRaw(
      model,
      [
        {
          role: 'system',
          content:
            'Validador A2UI. Devuelve SOLO JSON a2ui_screen con components.length >= 4, SectionHeader, StatTiles con icon, y al menos una gráfica (DonutChart|BarChart|ProgressBar) usando get_ui_kit. Controles con actionType/payload válidos. Sin markdown.'
        },
        {
          role: 'user',
          content: `Completa/repara hasta que sea renderizable y todos los botones funcionen:\n${raw}\n\nContexto MCP:\n${JSON.stringify(mcpContext).slice(0, 4000)}`
        }
      ],
      15000,
      0.1
    );

    if (healRaw) {
      screen = tryParseA2UI(healRaw, userId, mcpContext);
      if (screen) {
        console.log(`[A2UI] OK tras self-heal intento ${attempt}: ${screen.screenId}`);
        return screen;
      }
    }
  }

  console.warn('[A2UI] Todos los intentos fallaron → pantalla garantizada desde MCP');
  return buildGuaranteedScreenFromMcp(message, intent, mcpContext, userId);
}

async function handleMutationAction(
  message: string,
  context: any,
  history: HistoryItem[] | undefined,
  userId: string
): Promise<A2UIScreen> {
  const action = context.action as string;
  let mutationNote = '';
  const mcpContext: Record<string, unknown> = {};

  try {
    if (action === 'APPLY_RESTRUCTURE') {
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
      });

      mcpContext.get_client_financial_status = callMcpTool('get_client_financial_status', {
        userId
      });
      mcpContext.apply_debt_restructuring = opResult;
      mcpContext.simulate_debt_restructure = sim;
      mutationNote = `Reestructura aplicada con éxito: ${JSON.stringify(opResult)}. Genera ConfirmationCard y celebra el cierre.`;
    } else if (action === 'CONFIRM_INVESTMENT') {
      const amount = Number(context.amount) || 25000;
      const days = Number(context.days) || 91;
      const invResult = callMcpTool('apply_investment', {
        userId,
        amount,
        days,
        productId: context.productId || 'inv_pagare_banorte'
      });
      mcpContext.get_client_financial_status = callMcpTool('get_client_financial_status', {
        userId
      });
      mcpContext.apply_investment = invResult;
      mutationNote = `Inversión aplicada: ${JSON.stringify(invResult)}. Genera ConfirmationCard con folio INV.`;
    } else if (action === 'CONFIRM_TRANSFER') {
      const recipient = context.recipient || 'Mamá (Rosa Mendoza)';
      const amount = Number(context.amount) || 500;
      const concept = context.concept || 'Apoyo familiar';
      const transferResult = callMcpTool('execute_transfer', {
        userId,
        recipientName: recipient,
        amount,
        concept
      });
      mcpContext.get_client_financial_status = callMcpTool('get_client_financial_status', {
        userId
      });
      mcpContext.execute_transfer = transferResult;
      mutationNote = `SPEI ejecutado: ${JSON.stringify(transferResult)}. Genera ConfirmationCard con tracking SPEI.`;
    } else if (action === 'PAY_CARD') {
      const status = callMcpTool('get_client_financial_status', { userId }) as any;
      const card = status.cards?.[0];
      const amount =
        Number(context.amount) ||
        Number(context.payload?.amount) ||
        Number(card?.minimumPayment) ||
        980;
      const payResult = callMcpTool('pay_credit_card', {
        userId,
        amount,
        cardId: context.cardId || card?.id || DEFAULT_CARD
      });
      mcpContext.get_client_financial_status = callMcpTool('get_client_financial_status', {
        userId
      });
      mcpContext.pay_credit_card = payResult;
      mutationNote = `Pago a TDC aplicado: ${JSON.stringify(payResult)}. Muestra ConfirmationCard con saldo restante de tarjeta y cheques.`;
    } else {
      mutationNote = `Acción UI: ${action}. Payload: ${JSON.stringify(context)}`;
      mcpContext.get_client_financial_status = callMcpTool('get_client_financial_status', {
        userId
      });
    }
  } catch (err: any) {
    mcpContext.mutation_error = err.message;
    mutationNote = `La operación falló: ${err.message}. Muestra AlertBanner warning y permite reintentar.`;
  }

  mcpContext.get_ui_kit = callMcpTool('get_ui_kit', {
    userId,
    focus: action === 'PAY_CARD' ? 'card_payment' : 'auto'
  });

  const screen = await generateA2UIScreen(
    message || `Acción: ${action}`,
    action,
    mcpContext,
    history,
    userId,
    mutationNote
  );

  return isCompleteA2UIScreen(screen) ? screen : buildErrorScreen(message || action);
}

/**
 * Pipeline: NLP → MCP → A2UI_MODEL (sin plantillas de negocio).
 */
export async function processUserMessage(
  message: string,
  context?: any,
  history?: HistoryItem[]
): Promise<A2UIScreen> {
  const userId = context?.userId || DEFAULT_USER;

  if (context?.action) {
    return handleMutationAction(message, context, history, userId);
  }

  const plan = await classifyIntentAndTools(message, history, userId);
  console.log(`[NLP] intent=${plan.intent} tools=${plan.tools.map((t) => t.name).join(',')}`);

  if (plan.tools.some((t) => t.name === 'simulate_debt_restructure')) {
    const status = callMcpTool('get_client_financial_status', { userId }) as any;
    plan.tools = plan.tools.map((t) =>
      t.name === 'simulate_debt_restructure'
        ? { ...t, args: { ...t.args, debtAmount: status.totalDebt } }
        : t
    );
  }

  const mcpContext = runMcpTools(plan.tools, userId);

  if (!mcpContext.get_client_financial_status) {
    mcpContext.get_client_financial_status = callMcpTool('get_client_financial_status', {
      userId
    });
  }

  // Siempre enriquecer con UI Kit (gráficas, íconos, bloques default)
  mcpContext.get_ui_kit = callMcpTool('get_ui_kit', {
    userId,
    focus: plan.intent || 'auto'
  });

  // generateA2UIScreen reintenta hasta tener UI completa; si falla, garantiza pantalla MCP
  return generateA2UIScreen(message, plan.intent, mcpContext, history, userId);
}
