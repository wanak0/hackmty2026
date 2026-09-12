import { GoogleGenerativeAI } from '@google/generative-ai';
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
  const assistantMessage =
    s.assistantMessage ||
    s.message ||
    'Analicé tu solicitud y diseñé esta interfaz personalizada para resolverla:';

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

    return { id, type, props };
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
      ]
    };
  }

  // 2. ORQUESTACIÓN GENERATIVA NLP CON GOOGLE GEMINI
  if (apiKey && apiKey !== 'tu_clave_de_gemini_aqui') {
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-2.5-flash'];
    const genAI = new GoogleGenerativeAI(apiKey);

    // Contexto en tiempo real desde MCP
    const userStatus = getClientFinancialStatus('usr_carlos_01');
    const debtSim = simulateDebtRestructure(userStatus.totalDebt);
    const invSim = simulateInvestmentPortfolio(25000, 91);
    const txHistory = getTransactionHistory('usr_carlos_01');
    const health = getFinancialHealthDiagnostic('usr_carlos_01');

    const fullPrompt = `
DATOS DEL CLIENTE EN TIEMPO REAL (MCP CORE):
- Usuario: ${userStatus.user.name} (ID: ${userStatus.user.id})
- Saldo disponible en cheques/débito: $${userStatus.user.checkingBalance} MXN (Cuenta •••• 9921)
- Tarjeta de crédito: Banorte Por Ti Oro (Saldo deudor: $${userStatus.totalDebt} MXN, CAT: 54.2%)
- Opciones de amortización calculadas: ${JSON.stringify(debtSim.options)}
- Opciones de inversión actuales: ${JSON.stringify(invSim.options)}
- Transacciones recientes: ${JSON.stringify(txHistory.transactions.slice(0, 4))}
- Gastos acumulados: $${txHistory.totalExpenses} MXN (Categoría principal: ${txHistory.topCategory[0]})
- Diagnóstico financiero: Score ${health.creditScore}, DTI ${health.dtiPercentage}%
- Contactos frecuentes:
  * Mamá (Rosa Mendoza) - Banorte - CLABE 072580012345678901
  * Renta (Arrendadora Valle) - BBVA - CLABE 012180004567891234
  * Juan Amigo (Juan Pérez) - Santander - CLABE 014580009876543210

Mensaje o intención en lenguaje natural del usuario (NLP): "${message}"

MISIÓN GENERATIVA:
1. Analiza con NLP la intención y extrae todas las entidades pertinentes (destinatario, montos, categorías, plazos, conceptos).
2. Construye y ensambla generativamente la pantalla A2UI ("a2ui_screen") combinando los componentes necesarios (HeaderBadge, AlertBanner, MetricComparison, PlanOptionList, InvestmentSimulator, TransactionTable, TransferCard, FinancialHealthScore, ActionButton, ActionList).
3. Adapta títulos, textos, métricas y acciones a lo que el usuario pidió específicamente.
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

  // 3. CLASIFICADOR NLP DETERMINÍSTICO MULTIDOMINIO (Respaldo robusto)
  const lower = message.toLowerCase();

  // Dominio: Deuda / Tarjetas
  if (
    lower.includes('interes') ||
    lower.includes('interés') ||
    lower.includes('deuda') ||
    lower.includes('pagar menos') ||
    lower.includes('reestructura')
  ) {
    const userStatus = getClientFinancialStatus('usr_carlos_01');
    const simulation = simulateDebtRestructure(userStatus.totalDebt);

    return {
      type: 'a2ui_screen',
      screenId: 'debt_restructure_simulator',
      assistantMessage: 'Analicé tu tarjeta Banorte Por Ti Oro con saldo de $18,400. He preparado estas opciones con tasa preferencial congelada para que ahorres en intereses:',
      components: [
        {
          id: 'comp_header',
          type: 'HeaderBadge',
          props: { tag: 'COMPONENTE GENERADO · PLAN DE PAGO', title: 'Reestructura tu saldo de $18,400' }
        },
        {
          id: 'comp_metrics',
          type: 'MetricComparison',
          props: { balance: 18400, currentCat: 54.2, preferentialCat: 34.1, estimatedSavings: 4900 }
        },
        {
          id: 'comp_options',
          type: 'PlanOptionList',
          props: { cardId: 'crd_carlos_oro', selectedPlanId: 'plan_18m', options: simulation.options }
        },
        {
          id: 'comp_action',
          type: 'ActionButton',
          props: { label: 'Aplicar plan →', actionType: 'APPLY_RESTRUCTURE', defaultPlanId: 'plan_18m' }
        }
      ]
    };
  }

  // Dominio: Inversiones
  if (lower.includes('invertir') || lower.includes('rendimiento') || lower.includes('cetes') || lower.includes('pagaré') || lower.includes('ahorro')) {
    const matchAmount = message.match(/\$?([0-9,]+)/);
    const amount = matchAmount ? parseInt(matchAmount[1].replace(/,/g, ''), 10) : 25000;
    const inv = simulateInvestmentPortfolio(amount, 91);

    return {
      type: 'a2ui_screen',
      screenId: 'investment_simulator',
      assistantMessage: `Diseñé un simulador de inversión para $${amount.toLocaleString('es-MX')} MXN en Pagaré Banorte garantizado con tasa fija:`,
      components: [
        {
          id: 'comp_inv_header',
          type: 'HeaderBadge',
          props: { tag: 'BANORTE INVERSIONES · SIMULADOR', title: 'Rendimientos de Inversión' }
        },
        {
          id: 'comp_inv_sim',
          type: 'InvestmentSimulator',
          props: { amount, initialDays: 91, options: inv.options }
        },
        {
          id: 'comp_inv_btn',
          type: 'ActionButton',
          props: { label: `Invertir $${amount.toLocaleString('es-MX')} en Pagaré Banorte →`, actionType: 'CONFIRM_INVESTMENT' }
        }
      ]
    };
  }

  // Dominio: Gastos y Movimientos
  if (lower.includes('gast') || lower.includes('movimiento') || lower.includes('compra') || lower.includes('dinero') || lower.includes('transacci')) {
    const txData = getTransactionHistory('usr_carlos_01');

    return {
      type: 'a2ui_screen',
      screenId: 'transaction_dashboard',
      assistantMessage: `En lo que va del mes has realizado gastos por $${txData.totalExpenses.toLocaleString('es-MX')} MXN. Tu mayor categoría de consumo es ${txData.topCategory[0]}:`,
      components: [
        {
          id: 'comp_tx_header',
          type: 'HeaderBadge',
          props: { tag: 'CONTROL DE GASTOS BANORTE', title: 'Movimientos del Periodo' }
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
            title: 'Acciones Inteligentes Sugeridas',
            actions: [
              { label: 'Reestructurar deuda de tarjeta', actionType: 'SHOW_DEBT_RESTRUCTURE_OPTIONS' },
              { label: 'Simular inversión con mi ahorro', actionType: 'SHOW_INVESTMENT' }
            ]
          }
        }
      ]
    };
  }

function extractTransferEntitiesNLP(msg: string) {
  let recipient = '';
  // Extraer destinatario dinámico (ej: "a mi dentista", "a Mariana", "para la escuela", "a Carlos")
  const match = msg.match(/(?:a|para|hacia|al)\s+([a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s\.]+?)(?:\s+por\b|\s+de\b|\s+con\b|\s+\$|\s+[0-9]+|\s*pesos|\s*mxn|$)/i);
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
  } else if (!recipient) {
    recipient = 'Nuevo Destinatario';
  }

  // Extraer monto exacto (ej: 1200, 450, 3500.50)
  let amount = 500;
  const amtMatch = msg.match(/(?:\$|\s|^)([0-9]+(?:\.[0-9]{1,2})?)/);
  if (amtMatch && amtMatch[1]) {
    const parsed = parseFloat(amtMatch[1]);
    if (!isNaN(parsed) && parsed > 0) amount = parsed;
  }

  // Extraer concepto (ej: "por la limpieza", "de la comida", "por la tanda")
  let concept = 'Transferencia Banorte';
  const conceptMatch = msg.match(/(?:por|concepto|motivo|para la|para el)\s+([a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s]+)/i);
  if (conceptMatch && conceptMatch[1]) {
    concept = conceptMatch[1].trim();
  }

  return { recipient, amount, concept, isNewContact, clabe };
}

// Dominio: Transferencias SPEI
if (lower.includes('transfer') || lower.includes('enviar') || lower.includes('mandar') || lower.includes('spei') || lower.includes('pagar a')) {
  const { recipient, amount, concept, isNewContact, clabe } = extractTransferEntitiesNLP(message);

  return {
    type: 'a2ui_screen',
    screenId: 'transfer_form',
    assistantMessage: `Detecté con NLP tu intención de enviar $${amount.toLocaleString('es-MX')} MXN hacia "${recipient}". He preparado esta pantalla viva para que revises y confirmes:`,
    components: [
      {
        id: 'comp_trf_header',
        type: 'HeaderBadge',
        props: { tag: 'TRANSFERENCIA INMEDIATA SPEI', title: `Transferir a ${recipient}` }
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
          label: `Confirmar y Enviar $${amount.toLocaleString('es-MX')} a ${recipient} →`,
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
      assistantMessage: 'Aquí está tu diagnóstico financiero personalizado basado en tus productos activos:',
      components: [
        {
          id: 'comp_health_header',
          type: 'HeaderBadge',
          props: { tag: 'DIAGNÓSTICO FINANCIERO BANORTE', title: 'Salud y Hábitos Financieros' }
        },
        {
          id: 'comp_health_score',
          type: 'FinancialHealthScore',
          props: { score: diag.creditScore, scoreRange: diag.scoreRange, dti: diag.dtiPercentage, recommendations: diag.recommendations }
        },
        {
          id: 'comp_health_actions',
          type: 'ActionList',
          props: {
            title: 'Siguientes pasos recomendados',
            actions: [
              { label: 'Reestructurar mi tarjeta al 34.1%', actionType: 'SHOW_DEBT_RESTRUCTURE_OPTIONS' },
              { label: 'Crear fondo de ahorro en Pagaré', actionType: 'SHOW_INVESTMENT' }
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
    assistantMessage: 'Hola Carlos, soy tu Asistente Inteligente Banorte. Puedo construir interfaces dinámicas para cualquier necesidad financiera que tengas:',
    components: [
      {
        id: 'comp_welcome_header',
        type: 'HeaderBadge',
        props: { tag: 'INTERFACES EN TIEMPO REAL', title: '¿Qué deseas resolver hoy?' }
      },
      {
        id: 'comp_suggestions',
        type: 'QuickSuggestions',
        props: {
          suggestions: [
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
