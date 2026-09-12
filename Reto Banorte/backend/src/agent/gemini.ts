import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { SYSTEM_PROMPT } from './prompts.js';
import {
  getClientFinancialStatus,
  loadBankData,
  simulateDebtRestructure,
  applyDebtRestructuring,
  simulateInvestmentPortfolio,
  getTransactionHistory,
  executeTransfer,
  getFinancialHealthDiagnostic
} from '../mcp/tools.js';

dotenv.config();

const DEMO_NOTICE = 'Demo: datos y operaciones de prueba, sin movimientos bancarios reales.';
const money = (amount: number) => `$${amount.toLocaleString('es-MX')} MXN`;

function positiveNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value :
    typeof value === 'string' && /^\s*\$?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?\s*$/.test(value)
      ? Number(value.trim().replace(/[$,]/g, '')) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function extractAmount(message: string): number | undefined {
  const match = message.match(/(?:\$|\s|^)((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)(?![\d,.])/);
  return match ? positiveNumber(match[1]) : undefined;
}

function investmentOptions(amount: number, days: number) {
  return simulateInvestmentPortfolio(amount, days).options.map((option) => ({
    ...option,
    tag: 'Estimación de demo'
  }));
}

function debtComparison(balance: number, currentCat: number) {
  const simulation = simulateDebtRestructure(balance);
  const options = simulation.options.map((option) => ({
    ...option,
    estimatedSavings: option.cat < currentCat ? option.estimatedSavings : undefined,
    recommended: option.cat < currentCat ? option.recommended : undefined
  }));
  const nonReducing = options.filter((option) => option.cat >= currentCat);
  const warning = nonReducing.length
    ? `Las propuestas con CAT de ${nonReducing.map((option) => `${option.cat}%`).join(', ')} no reducen el CAT actual de ${currentCat}%. Para esas opciones no se muestra ahorro estimado ni recomendación.`
    : undefined;
  return { ...simulation, currentCat, options, warning };
}

function noticeScreen(screenId: string, title: string, message: string): A2UIScreen {
  return {
    type: 'a2ui_screen', screenId, assistantMessage: `${message} ${DEMO_NOTICE}`,
    components: [
      { id: 'comp_header', type: 'HeaderBadge', props: { tag: 'DEMO · BANORTE', title } },
      { id: 'comp_notice', type: 'AlertBanner', props: { variant: 'info', message } }
    ]
  };
}

function investmentScreen(amount: number, days: number, confirmation = false): A2UIScreen {
  const message = confirmation
    ? 'La contratación de inversiones no está disponible en esta demo. No se realizó ninguna inversión ni se descontó dinero.'
    : `Simulación de ${money(amount)} a ${days} días. Los rendimientos son estimaciones con tasas de ejemplo, sin garantía de resultados.`;
  return {
    type: 'a2ui_screen', screenId: 'investment_simulator', assistantMessage: message,
    components: [
      { id: 'comp_header', type: 'HeaderBadge', props: { tag: 'DEMO · BANORTE', title: 'Simula tu inversión' } },
      { id: 'comp_inv_sim', type: 'InvestmentSimulator', props: { amount, initialDays: days, options: investmentOptions(amount, days) } }
    ]
  };
}

export interface A2UIScreen {
  type: 'a2ui_screen';
  screenId: string;
  assistantMessage: string;
  components: Array<{
    id: string;
    type: string;
    props: Record<string, any>;
  }>;
}

export function normalizeA2UIScreen(raw: any): A2UIScreen {
  const s = raw.a2ui_screen || raw;
  const screenId = s.screenId || s.screenType || s.id || 'dynamic_screen';
  let assistantMessage =
    s.assistantMessage ||
    s.message ||
    'Aquí puedes revisar los detalles de tu solicitud.';

  const rawComps: any[] = s.components || [];

  const components = rawComps.map((c: any, index: number) => {
    const type = c.type || c.component || 'HeaderBadge';
    const id = c.id || `comp_${type}_${index}`;
    const props = { ...(c.props || {}) };

    // Extraer propiedades directas en caso de que Gemini las coloque en la raíz del componente
    Object.keys(c).forEach((k) => {
      if (k !== 'id' && k !== 'type' && k !== 'component' && k !== 'props') {
        props[k] = c[k];
      }
    });

    // Inyección / Hidratación desde MCP si faltan datos
    if (type === 'InvestmentSimulator') {
      const amt = positiveNumber(props.amount) ?? 25000;
      const requestedDays = positiveNumber(props.days ?? props.initialDays);
      const days = requestedDays && Number.isInteger(requestedDays) ? requestedDays : 91;
      props.options = investmentOptions(amt, days);
      props.amount = amt;
      props.initialDays = days;
    }

    if (type === 'TransactionTable' && (!props.transactions || props.transactions.length === 0)) {
      const txData = getTransactionHistory('usr_carlos_01');
      props.transactions = txData.transactions;
      props.totalExpenses = txData.totalExpenses;
      props.topCategory = txData.topCategory[0];
    }

    if (type === 'FinancialHealthScore' && props.score == null) {
      const diag = getFinancialHealthDiagnostic('usr_carlos_01');
      props.score = diag.creditScore;
      props.scoreRange = diag.scoreRange;
      props.dti = diag.dtiPercentage;
      props.recommendations = ['Revisa tus gastos y fechas de pago antes de elegir un plan.'];
    }

    if (type === 'TransferCard') {
      props.recipient = typeof props.recipient === 'string' ? props.recipient.trim() : '';
      props.amount = positiveNumber(props.amount) ?? null;
      props.concept = typeof props.concept === 'string' ? props.concept.trim() : '';
      if (!props.recipient) {
        props.isNewContact = true;
        props.clabe = '';
      }
      if (!props.sourceAccount) props.sourceAccount = 'Cuenta Débito Banorte (•••• 9921)';
    }

    if (type === 'PlanOptionList') {
      const userStatus = getClientFinancialStatus('usr_carlos_01');
      const card = userStatus.cards.find((item) => item.id === (props.cardId ?? 'crd_carlos_oro'));
      props.options = card && card.currentBalance > 0 ? debtComparison(card.currentBalance, parseFloat(card.catAnnual)).options : [];
      props.cardId = card?.id ?? props.cardId;
      props.selectedPlanId = props.options.some((option: any) => option.planId === props.selectedPlanId)
        ? props.selectedPlanId : 'plan_18m';
    }

    if (type === 'HeaderBadge') props.tag = 'DEMO · BANORTE';
    return { id, type, props };
  });

  const plans = components.find((component) => component.type === 'PlanOptionList');
  const metrics = components.filter((component) => component.type === 'MetricComparison');
  if (plans || metrics.length) {
    const card = getClientFinancialStatus('usr_carlos_01').cards.find((item) => item.id === (plans?.props.cardId ?? 'crd_carlos_oro'));
    if (card) {
      const comparison = debtComparison(card.currentBalance, parseFloat(card.catAnnual));
      const selected = comparison.options.find((option) => option.planId === (plans?.props.selectedPlanId ?? 'plan_18m'))!;
      for (const metric of metrics) Object.assign(metric.props, {
        balance: card.currentBalance, currentCat: comparison.currentCat,
        preferentialCat: selected.cat, estimatedSavings: selected.estimatedSavings
      });
      if (comparison.warning) {
        components.push({ id: 'comp_cat_notice', type: 'AlertBanner', props: { variant: 'warning', message: comparison.warning } });
        assistantMessage = `Compara los plazos y cuotas de prueba. ${comparison.warning} ${DEMO_NOTICE}`;
      }
    }
  }

  components.push({
    id: 'comp_demo_notice', type: 'AlertBanner',
    props: { variant: 'info', message: DEMO_NOTICE }
  });

  return {
    type: 'a2ui_screen',
    screenId,
    assistantMessage,
    components
  };
}

/**
 * Orquestador inteligente con NLP multimodal y ejecución de herramientas MCP
 */
export async function processUserMessage(message: string, context?: any): Promise<A2UIScreen> {
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. MANEJO DE ACCIONES VIVAS DE LA UI (Cierre de Ciclo)
  if (context?.action === 'APPLY_RESTRUCTURE') {
    const userStatus = getClientFinancialStatus('usr_carlos_01');
    const card = userStatus.cards.find((item) => item.id === (context.cardId ?? 'crd_carlos_oro'));
    const planId = context.planId ?? 'plan_18m';
    const plan = card && simulateDebtRestructure(card.currentBalance).options.find((item) => item.planId === planId);
    if (!card || !plan || card.currentBalance <= 0) {
      return noticeScreen('restructure_unavailable', 'Revisa el plan', 'No hay un plan válido para esta tarjeta. Vuelve a consultar las opciones.');
    }

    const opResult = applyDebtRestructuring(
      'usr_carlos_01',
      card.id,
      planId,
      plan.months,
      plan.monthlyPayment
    );

    return {
      type: 'a2ui_screen',
      screenId: 'restructure_success',
      assistantMessage: `Plan a ${plan.months} meses registrado en los datos de prueba. ${DEMO_NOTICE}`,
      components: [
        {
          id: 'comp_success_badge',
          type: 'HeaderBadge',
          props: {
            tag: 'DEMO · BANORTE',
            title: 'Plan registrado en la demo'
          }
        },
        {
          id: 'comp_confirmation',
          type: 'AlertBanner',
          props: {
            variant: 'success',
            message: `${opResult.cardName} (•••• ${opResult.last4}): ${opResult.months} pagos mensuales de ${money(opResult.monthlyQuota)}. Registro de prueba: ${opResult.operationId}. No representa una contratación bancaria.`
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
      ]
    };
  }

  if (context?.action === 'SIMULATE_INVESTMENT' || context?.action === 'CONFIRM_INVESTMENT') {
    const confirmation = context.action === 'CONFIRM_INVESTMENT';
    const amount = positiveNumber(context.amount ?? (confirmation ? 25000 : undefined));
    const days = positiveNumber(context.days ?? (confirmation ? 91 : undefined));
    if (!amount || !days || !Number.isInteger(days)) {
      return noticeScreen('investment_invalid', 'Revisa la simulación', 'Ingresa un monto mayor que cero y un plazo en días enteros mayor que cero. No se realizó ninguna inversión.');
    }
    return investmentScreen(amount, days, confirmation);
  }

  if (context?.action === 'CONFIRM_TRANSFER') {
    const recipient = typeof context.recipient === 'string' ? context.recipient.trim() : '';
    const amount = positiveNumber(context.amount);
    const concept = typeof context.concept === 'string' ? context.concept.trim() : '';

    if (!amount) return noticeScreen('transfer_invalid', 'Revisa el monto', 'Ingresa un monto válido mayor que cero para la transferencia de prueba.');
    if (!recipient || !concept) return noticeScreen('transfer_invalid', 'Completa la transferencia', 'Ingresa el destinatario y el concepto antes de registrar la transferencia de prueba.');
    let transferResult;
    try {
      transferResult = executeTransfer('usr_carlos_01', recipient, amount, concept);
    } catch {
      return noticeScreen('transfer_unavailable', 'No se registró la transferencia', 'Revisa el saldo disponible y los datos antes de volver a intentar la transferencia de prueba.');
    }

    return {
      type: 'a2ui_screen',
      screenId: 'transfer_success',
      assistantMessage: `Transferencia de prueba por ${money(amount)} a ${recipient} registrada. ${DEMO_NOTICE}`,
      components: [
        {
          id: 'comp_trf_badge',
          type: 'HeaderBadge',
          props: {
            tag: 'DEMO · BANORTE',
            title: 'Transferencia registrada en la demo'
          }
        },
        {
          id: 'comp_confirmation',
          type: 'AlertBanner',
          props: {
            variant: 'success',
            message: `Saldo restante en la cuenta de prueba: ${money(transferResult.remainingBalance)}. Registro de prueba: ${transferResult.trackingNumber}. No se envió dinero por SPEI.`
          }
        }
      ]
    };
  }

  const lower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isTransfer = /transfer|enviar|mandar|spei|pagar a/.test(lower);
  const isInvestment = /invertir|inversion|rendimiento|cetes|pagare|ahorro/.test(lower);
  const isDebtPlan = /reestructura|pagar menos|interes/.test(lower);
  // La tarea rápida abre un formulario vacío sin inferir datos del contacto o del monto.
  const isGenericTransfer = isTransfer && !extractAmount(message) && !extractTransferEntities(message).recipient;
  if (!isTransfer && !isInvestment && !isDebtPlan && /saldo|cuanto (?:dinero )?(?:tengo|me queda)/.test(lower)) {
    // Leer los saldos almacenados, incluido cero.
    const data = loadBankData();
    const user = data.users.find((item) => item.id === 'usr_carlos_01');
    if (!user) return noticeScreen('balance_unavailable', 'Saldo no disponible', 'No se pudieron consultar los datos de la cuenta.');
    const cards = data.creditCards.filter((item) => item.userId === user.id);
    const debt = cards.reduce((total, card) => total + card.currentBalance, 0);
    const screen = noticeScreen('balance_summary', 'Consulta de saldos',
      `Saldo disponible en Cuenta Débito Banorte (•••• 9921): ${money(user.checkingBalance)}. Saldo deudor en tarjetas: ${money(debt)}.`);
    screen.components.push({ id: 'comp_balance_suggestions', type: 'QuickSuggestions', props: {
      suggestions: ['Ver mis movimientos', 'Consultar opciones para mi deuda', 'Simular una inversión']
    } });
    return screen;
  }

  // 2. ORQUESTACIÓN GENERATIVA CON GOOGLE GEMINI
  if (apiKey && apiKey !== 'tu_clave_de_gemini_aqui' && !isGenericTransfer) {
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-2.5-flash'];
    const genAI = new GoogleGenerativeAI(apiKey);

    // Contexto en tiempo real desde MCP
    const userStatus = getClientFinancialStatus('usr_carlos_01');
    const card = userStatus.cards.find((item) => item.id === 'crd_carlos_oro');
    const debtSim = card && card.currentBalance > 0 ? debtComparison(card.currentBalance, parseFloat(card.catAnnual)) : null;
    const checkingBalance = loadBankData().users.find((item) => item.id === userStatus.user.id)?.checkingBalance;
    const invOptions = investmentOptions(25000, 91);
    const txHistory = getTransactionHistory('usr_carlos_01');
    const health = getFinancialHealthDiagnostic('usr_carlos_01');

    const fullPrompt = `
DATOS ACTUALES DE LA DEMO (no son cotizaciones ni operaciones bancarias reales):
- Usuario: ${userStatus.user.name} (ID: ${userStatus.user.id})
- Saldo disponible en cheques/débito: ${checkingBalance == null ? 'No disponible' : money(checkingBalance)} (Cuenta •••• 9921)
- Tarjetas de crédito: ${JSON.stringify(userStatus.cards)}
- Opciones de amortización calculadas para la tarjeta ${card?.id ?? 'no disponible'}: ${JSON.stringify(debtSim?.options ?? [])}
- Comparación de CAT: ${debtSim?.warning ?? 'Compara cada propuesta con el CAT actual de la tarjeta.'}
- Opciones de inversión de ejemplo para $25,000 a 91 días: ${JSON.stringify(invOptions)}
- Transacciones recientes: ${JSON.stringify(txHistory.transactions.slice(0, 4))}
- Gastos acumulados: $${txHistory.totalExpenses} MXN (Categoría principal: ${txHistory.topCategory[0]})
- Diagnóstico financiero: Score ${health.creditScore}, DTI ${health.dtiPercentage}%
- Contactos frecuentes:
  * Mamá (Rosa Mendoza) - Banorte - CLABE 072580012345678901
  * Renta (Arrendadora Valle) - BBVA - CLABE 012180004567891234
  * Juan Amigo (Juan Pérez) - Santander - CLABE 014580009876543210

Mensaje del usuario: ${JSON.stringify(message)}

MISIÓN GENERATIVA:
1. Identifica la intención y los datos pertinentes (destinatario, montos, categorías, plazos, conceptos). Interpreta 1,000 como mil y 1,000.50 como mil con cincuenta centavos.
2. Construye y ensambla generativamente la pantalla A2UI ("a2ui_screen") combinando los componentes necesarios (HeaderBadge, AlertBanner, MetricComparison, PlanOptionList, InvestmentSimulator, TransactionTable, TransferCard, FinancialHealthScore, ActionButton, ActionList).
3. Adapta títulos, textos, métricas y acciones a lo que el usuario pidió específicamente. Usa español sencillo y señala que es una demo. Nunca afirmes que una operación ya se ejecutó.
`;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });

        const result = await model.generateContent(fullPrompt);
        const text = result.response.text();
        const cleanJson = text
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsed = JSON.parse(cleanJson);
        return normalizeA2UIScreen(parsed);
      } catch (err: any) {
        console.warn(`Error con modelo ${modelName}:`, err.message || err);
      }
    }
  }

  // 3. RESPUESTAS DE RESPALDO

  // Dominio: Deuda / Tarjetas
  if (!isInvestment && !isTransfer && (
    lower.includes('interes') ||
    lower.includes('interés') ||
    lower.includes('deuda') ||
    lower.includes('pagar menos') ||
    lower.includes('reestructura')
  )) {
    const userStatus = getClientFinancialStatus('usr_carlos_01');
    const card = userStatus.cards.find((item) => item.id === 'crd_carlos_oro');
    if (!card || card.currentBalance <= 0) return noticeScreen('restructure_unavailable', 'Sin saldo para simular', 'No hay saldo deudor en esta tarjeta para calcular un plan.');
    const simulation = debtComparison(card.currentBalance, parseFloat(card.catAnnual));
    const selected = simulation.options.find((option) => option.planId === 'plan_18m')!;

    return {
      type: 'a2ui_screen',
      screenId: 'debt_restructure_simulator',
      assistantMessage: `Opciones de ejemplo para ${card.cardName}, con saldo deudor de ${money(card.currentBalance)}. ${simulation.warning ?? 'Las cuotas y el ahorro son estimados.'} ${DEMO_NOTICE}`,
      components: [
        {
          id: 'comp_header',
          type: 'HeaderBadge',
          props: { tag: 'DEMO · PLAN DE PAGO', title: `Opciones para tu saldo de ${money(card.currentBalance)}` }
        },
        {
          id: 'comp_metrics',
          type: 'MetricComparison',
          props: { balance: card.currentBalance, currentCat: simulation.currentCat, preferentialCat: selected.cat, estimatedSavings: selected.estimatedSavings }
        },
        ...(simulation.warning ? [{ id: 'comp_cat_notice', type: 'AlertBanner', props: { variant: 'warning', message: simulation.warning } }] : []),
        {
          id: 'comp_options',
          type: 'PlanOptionList',
          props: { cardId: 'crd_carlos_oro', selectedPlanId: 'plan_18m', options: simulation.options }
        },
        {
          id: 'comp_action',
          type: 'ActionButton',
          props: { label: 'Registrar plan en la demo', actionType: 'APPLY_RESTRUCTURE', cardId: card.id, defaultPlanId: 'plan_18m' }
        }
      ]
    };
  }

  // Dominio: Inversiones
  if (isInvestment && !isTransfer) {
    const daysMatch = lower.match(/\b(\d+)\s*dias?\b/);
    const days = daysMatch ? positiveNumber(daysMatch[1]) : 91;
    const amount = extractAmount(lower.replace(/\b\d+\s*dias?\b/g, '')) ?? 25000;
    if (!days) return noticeScreen('investment_invalid', 'Revisa el plazo', 'El plazo de la simulación debe ser mayor que cero.');
    return investmentScreen(amount, days);
  }

  // Dominio: Gastos y Movimientos
  if (!isTransfer && (lower.includes('gast') || lower.includes('movimiento') || lower.includes('compra') || lower.includes('dinero') || lower.includes('transacci'))) {
    const txData = getTransactionHistory('usr_carlos_01');

    return {
      type: 'a2ui_screen',
      screenId: 'transaction_dashboard',
      assistantMessage: `Los movimientos disponibles suman gastos por ${money(txData.totalExpenses)}. La categoría con más gastos es ${txData.topCategory[0]}. ${DEMO_NOTICE}`,
      components: [
        {
          id: 'comp_tx_header',
          type: 'HeaderBadge',
          props: { tag: 'DEMO · GASTOS BANORTE', title: 'Movimientos disponibles' }
        },
        {
          id: 'comp_tx_table',
          type: 'TransactionTable',
          props: { transactions: txData.transactions, totalExpenses: txData.totalExpenses, topCategory: txData.topCategory[0] }
        },
        {
          id: 'comp_tx_actions',
          type: 'ActionList',
          props: {
            title: 'También puedes consultar',
            actions: [
              { label: 'Reestructurar deuda de tarjeta', actionType: 'SHOW_DEBT_RESTRUCTURE_OPTIONS' },
              { label: 'Simular inversión con mi ahorro', actionType: 'SHOW_INVESTMENT' }
            ]
          }
        }
      ]
    };
  }

function extractTransferEntities(msg: string) {
  let recipient = '';
  // Extraer destinatario dinámico (ej: "a mi dentista", "a Mariana", "para la escuela", "a Carlos")
  const match = msg.match(/\b(?:a|para|hacia|al)\s+(?!(?:transferir|enviar|mandar)\b)([a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s\.]+?)(?:\s+por\b|\s+de\b|\s+con\b|\s+\$|\s+[0-9]+|\s*pesos|\s*mxn|$)/i);
  if (match && match[1]) {
    recipient = match[1].trim();
  }

  const lowRec = recipient.toLowerCase();
  let isNewContact = true;
  let clabe = '';

  if (lowRec.includes('mamá') || lowRec.includes('mama')) {
    recipient = 'Mamá (Rosa Mendoza)';
    isNewContact = false;
    clabe = '072580012345678901';
  } else if (lowRec.includes('renta')) {
    recipient = 'Arrendadora Valle (Renta)';
    isNewContact = false;
    clabe = '012180004567891234';
  } else if (lowRec.includes('juan')) {
    recipient = 'Juan Pérez';
    isNewContact = false;
    clabe = '014580009876543210';
  }

  // Extraer monto exacto (ej: 1200, 450, 3500.50)
  const amount = extractAmount(msg) ?? null;

  // Extraer concepto (ej: "por la limpieza", "de la comida", "por la tanda")
  let concept = '';
  const conceptMatch = msg.match(/(?:por|concepto|motivo|para la|para el)\s+([a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s]+)/i);
  if (conceptMatch && conceptMatch[1]) {
    concept = conceptMatch[1].trim();
  }

  return { recipient, amount, concept, isNewContact, clabe };
}

// Dominio: Transferencias SPEI
if (isTransfer) {
  const { recipient, amount, concept, isNewContact, clabe } = extractTransferEntities(message);

  return {
    type: 'a2ui_screen',
    screenId: 'transfer_form',
    assistantMessage: `${amount && recipient ? `Revisa el envío de prueba de ${money(amount)} a ${recipient} antes de confirmarlo.` : 'Completa el monto y el destinatario para preparar tu transferencia de prueba.'} ${DEMO_NOTICE}`,
    components: [
      {
        id: 'comp_trf_header',
        type: 'HeaderBadge',
        props: { tag: 'DEMO · TRANSFERENCIA', title: recipient ? `Transferir a ${recipient}` : 'Prepara tu transferencia' }
      },
      {
        id: 'comp_trf_card',
        type: 'TransferCard',
        props: {
          recipient,
          amount,
          concept,
          sourceAccount: 'Cuenta Débito Banorte (•••• 9921)',
          isNewContact,
          clabe
        }
      },
      {
        id: 'comp_trf_action',
        type: 'ActionButton',
        props: {
          label: amount ? `Registrar envío de prueba de ${money(amount)}` : 'Registrar transferencia de prueba',
          actionType: 'CONFIRM_TRANSFER',
          recipient,
          amount,
          concept
        }
      }
    ]
  };
}

  // Dominio: Salud Financiera
  if (lower.includes('salud') || lower.includes('score') || lower.includes('diagnostico') || lower.includes('diagnóstico') || lower.includes('buró')) {
    const diag = getFinancialHealthDiagnostic('usr_carlos_01');

    return {
      type: 'a2ui_screen',
      screenId: 'financial_health_diagnostic',
      assistantMessage: `Este resumen usa los datos de prueba disponibles; no es una evaluación crediticia oficial. ${DEMO_NOTICE}`,
      components: [
        {
          id: 'comp_health_header',
          type: 'HeaderBadge',
          props: { tag: 'DEMO · RESUMEN FINANCIERO', title: 'Salud y hábitos financieros' }
        },
        {
          id: 'comp_health_score',
          type: 'FinancialHealthScore',
          props: { score: diag.creditScore, scoreRange: diag.scoreRange, dti: diag.dtiPercentage, recommendations: ['Revisa tus gastos y fechas de pago antes de elegir un plan.'] }
        },
        {
          id: 'comp_health_actions',
          type: 'ActionList',
          props: {
            title: 'Siguientes pasos recomendados',
            actions: [
              { label: 'Consultar opciones para mi deuda', actionType: 'SHOW_DEBT_RESTRUCTURE_OPTIONS' },
              { label: 'Simular ahorro en Pagaré Banorte', actionType: 'SHOW_INVESTMENT' }
            ]
          }
        }
      ]
    };
  }

  // Pantalla de Bienvenida por Defecto
  return {
    type: 'a2ui_screen',
    screenId: 'welcome_screen',
    assistantMessage: `Hola, Carlos. Puedes consultar saldos y movimientos, comparar planes de pago o simular una inversión. ${DEMO_NOTICE}`,
    components: [
      {
        id: 'comp_welcome_header',
        type: 'HeaderBadge',
        props: { tag: 'DEMO · BANORTE', title: '¿Qué deseas consultar hoy?' }
      },
      {
        id: 'comp_suggestions',
        type: 'QuickSuggestions',
        props: {
          suggestions: [
            '¿Cuál es mi saldo disponible?',
            'Quiero pagar menos intereses de mi tarjeta',
            'Simular inversión de $30,000 en pagaré',
            '¿En qué he gastado este mes?',
            'Transferir $500 a mi mamá',
            '¿Cómo está mi salud financiera?'
          ]
        }
      }
    ]
  };
}
