/**
 * Motor NLP determinístico: garantiza la demo ante jueces sin depender de LLM/red.
 * Usa exclusivamente callMcpTool (mismo contrato MCP que el servidor stdio).
 */
import { callMcpTool } from '../mcp/registry.js';

/** Forma mínima de pantalla A2UI (evita dependencia circular con ollama.ts). */
export interface A2UIScreen {
  type: 'a2ui_screen';
  screenId: string;
  assistantMessage: string;
  components: Array<{
    id: string;
    type: string;
    props: Record<string, any>;
    children?: any[];
  }>;
  suggestedPrompts?: string[];
}

const DEFAULT_USER = 'usr_carlos_01';

function classifyIntent(message: string): string {
  const m = message.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

  if (
    /interes|deuda|reestructur|tarjeta|pagar menos|amortiz|plan de pago|revolvente/.test(m)
  ) {
    return 'debt';
  }
  if (/invert|pagare|cetes|rendimiento|ahorro a plazo/.test(m)) {
    return 'investment';
  }
  if (/transfer|spei|enviar dinero|mandar dinero|a mi mama|a mamá|a mama/.test(m)) {
    return 'transfer';
  }
  if (/gasto|movimiento|transaccion|en que he gastado|historial/.test(m)) {
    return 'transactions';
  }
  if (/salud financiera|score|crediticio|dti|endeudamiento/.test(m)) {
    return 'health';
  }
  if (/saldo|disponible|cuenta de debito|cuanto tengo|balances?/.test(m)) {
    return 'balances';
  }
  return 'debt'; // default demo: flujo principal del reto
}

export function buildDeterministicScreen(message: string, userId = DEFAULT_USER): A2UIScreen {
  const intent = classifyIntent(message);
  const status = callMcpTool('get_client_financial_status', { userId }) as any;

  if (intent === 'debt') {
    const debtSim = callMcpTool('simulate_debt_restructure', {
      debtAmount: status.totalDebt
    }) as any;
    const recommended = debtSim.options.find((o: any) => o.recommended) || debtSim.options[1];

    return {
      type: 'a2ui_screen',
      screenId: 'debt_restructure_deterministic',
      assistantMessage: `Carlos, detecté tu deuda revolvente de $${status.totalDebt.toLocaleString('es-MX')} MXN con CAT del ${debtSim.currentCat}%. Diseñé un plan de pagos fijos para reducir tus intereses.`,
      components: [
        {
          id: 'comp_debt_badge',
          type: 'HeaderBadge',
          props: {
            tag: 'MCP · REESTRUCTURA INTELIGENTE',
            title: 'Baja tus intereses de la Banorte Por Ti Oro'
          }
        },
        {
          id: 'comp_metrics',
          type: 'MetricComparison',
          props: {
            balance: status.totalDebt,
            currentCat: debtSim.currentCat,
            preferentialCat: recommended.cat,
            estimatedSavings: recommended.estimatedSavings
          }
        },
        {
          id: 'comp_plans',
          type: 'PlanOptionList',
          props: {
            options: debtSim.options,
            selectedPlanId: recommended.planId
          }
        },
        {
          id: 'comp_apply',
          type: 'ActionButton',
          props: {
            label: 'Aplicar plan →',
            actionType: 'APPLY_RESTRUCTURE',
            planId: recommended.planId,
            variant: 'primary'
          }
        }
      ],
      suggestedPrompts: [
        '¿Cuánto pagaría a 12 meses?',
        'Simular pagaré de ahorro',
        '¿En qué he gastado este mes?'
      ]
    };
  }

  if (intent === 'investment') {
    const amount = Math.min(25000, status.user.checkingBalance);
    const inv = callMcpTool('simulate_investment_portfolio', { amount, days: 91 }) as any;

    return {
      type: 'a2ui_screen',
      screenId: 'investment_deterministic',
      assistantMessage: `Con tu saldo disponible de $${status.user.checkingBalance.toLocaleString('es-MX')} MXN puedes invertir en Pagaré Banorte o CETES. Aquí tienes la simulación a 91 días.`,
      components: [
        {
          id: 'comp_inv_badge',
          type: 'HeaderBadge',
          props: { tag: 'MCP · INVERSIONES', title: 'Simulador de Pagaré Banorte' }
        },
        {
          id: 'comp_inv_sim',
          type: 'InvestmentSimulator',
          props: { amount, initialDays: 91, options: inv.options }
        },
        {
          id: 'comp_inv_action',
          type: 'ActionButton',
          props: {
            label: 'Confirmar inversión',
            actionType: 'CONFIRM_INVESTMENT',
            amount,
            days: 91,
            variant: 'primary'
          }
        }
      ],
      suggestedPrompts: [
        'Quiero pagar menos intereses de mi tarjeta',
        'Transferir $500 a mi mamá',
        '¿Cómo está mi salud financiera?'
      ]
    };
  }

  if (intent === 'transfer') {
    return {
      type: 'a2ui_screen',
      screenId: 'transfer_deterministic',
      assistantMessage:
        'Preparé una transferencia SPEI editable. Confirma el monto y el destinatario para ejecutarla en el core bancario.',
      components: [
        {
          id: 'comp_trf_badge',
          type: 'HeaderBadge',
          props: { tag: 'MCP · SPEI', title: 'Transferencia rápida' }
        },
        {
          id: 'comp_trf_alert',
          type: 'AlertBanner',
          props: {
            variant: 'info',
            message: `Saldo disponible: $${status.user.checkingBalance.toLocaleString('es-MX')} MXN`
          }
        },
        {
          id: 'comp_trf_card',
          type: 'TransferCard',
          props: {
            recipient: 'Mamá (Rosa Mendoza)',
            amount: 500,
            concept: 'Apoyo familiar',
            sourceAccount: 'Cuenta Débito Banorte (•••• 9921)',
            isNewContact: false,
            clabe: '072580012345678901'
          }
        },
        {
          id: 'comp_trf_action',
          type: 'ActionButton',
          props: {
            label: 'Enviar SPEI',
            actionType: 'CONFIRM_TRANSFER',
            variant: 'primary'
          }
        }
      ],
      suggestedPrompts: [
        '¿En qué he gastado este mes?',
        'Quiero pagar menos intereses',
        'Simular inversión'
      ]
    };
  }

  if (intent === 'transactions') {
    const tx = callMcpTool('get_transaction_history', { userId }) as any;
    return {
      type: 'a2ui_screen',
      screenId: 'transactions_deterministic',
      assistantMessage: `Este mes llevas $${tx.totalExpenses.toLocaleString('es-MX')} MXN en gastos. Tu categoría principal es ${tx.topCategory[0]}.`,
      components: [
        {
          id: 'comp_tx_badge',
          type: 'HeaderBadge',
          props: { tag: 'MCP · MOVIMIENTOS', title: 'Tus gastos del mes' }
        },
        {
          id: 'comp_tx_table',
          type: 'TransactionTable',
          props: {
            transactions: tx.transactions,
            totalExpenses: tx.totalExpenses,
            topCategory: tx.topCategory[0]
          }
        }
      ],
      suggestedPrompts: [
        'Quiero pagar menos intereses',
        'Simular inversión',
        '¿Cómo está mi salud financiera?'
      ]
    };
  }

  if (intent === 'health') {
    const health = callMcpTool('get_financial_health_diagnostic', { userId }) as any;
    return {
      type: 'a2ui_screen',
      screenId: 'health_deterministic',
      assistantMessage: `Tu score crediticio es ${health.creditScore}. Te preparé un diagnóstico con recomendaciones accionables.`,
      components: [
        {
          id: 'comp_health_badge',
          type: 'HeaderBadge',
          props: { tag: 'MCP · SALUD FINANCIERA', title: 'Diagnóstico Banorte' }
        },
        {
          id: 'comp_health_score',
          type: 'FinancialHealthScore',
          props: {
            score: health.creditScore,
            scoreRange: health.scoreRange,
            dti: health.dtiPercentage,
            recommendations: health.recommendations
          }
        },
        {
          id: 'comp_health_action',
          type: 'ActionButton',
          props: {
            label: 'Ver opciones para bajar intereses',
            actionType: 'SHOW_DEBT_RESTRUCTURE_OPTIONS',
            variant: 'primary'
          }
        }
      ],
      suggestedPrompts: [
        'Quiero pagar menos intereses',
        'Simular pagaré',
        'Ver mis gastos'
      ]
    };
  }

  // balances
  const card = status.cards?.[0];
  return {
    type: 'a2ui_screen',
    screenId: 'balances_deterministic',
    assistantMessage: `Carlos, tu saldo en débito es $${status.user.checkingBalance.toLocaleString('es-MX')} MXN y tu deuda en crédito es $${status.totalDebt.toLocaleString('es-MX')} MXN.`,
    components: [
      {
        id: 'comp_bal_badge',
        type: 'HeaderBadge',
        props: { tag: 'MCP · SALDOS', title: 'Resumen de tus cuentas' }
      },
      {
        id: 'comp_bal_alert',
        type: 'AlertBanner',
        props: {
          variant: 'info',
          message: card
            ? `${card.cardName} •••• ${card.last4}: deuda $${status.totalDebt.toLocaleString('es-MX')} · CAT ${card.catAnnual}`
            : `Débito disponible: $${status.user.checkingBalance.toLocaleString('es-MX')} MXN`
        }
      },
      {
        id: 'comp_bal_actions',
        type: 'ActionList',
        props: {
          actions: [
            { label: 'Bajar intereses de tarjeta', actionType: 'SHOW_DEBT_RESTRUCTURE_OPTIONS' },
            { label: 'Simular inversión', actionType: 'SHOW_INVESTMENT' },
            { label: 'Ver gastos del mes', actionType: 'VIEW_TRANSACTIONS' }
          ]
        }
      }
    ],
    suggestedPrompts: [
      'Quiero pagar menos intereses de mi tarjeta',
      'Transferir $500 a mi mamá',
      '¿En qué he gastado este mes?'
    ]
  };
}
