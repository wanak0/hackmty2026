/**
 * Registro unificado de herramientas MCP Banorte.
 * Usado tanto por el servidor MCP (stdio) como por el orquestador HTTP,
 * para que el hot path del chat invoque el mismo contrato que ListTools/CallTool.
 */
import {
  getClientFinancialStatus,
  simulateDebtRestructure,
  applyDebtRestructuring,
  simulateInvestmentPortfolio,
  applyInvestment,
  getTransactionHistory,
  payCreditCard,
  executeTransfer,
  getFinancialHealthDiagnostic,
  getUiKit
} from './tools.js';

export const MCP_TOOL_DEFINITIONS = [
  {
    name: 'get_client_financial_status',
    description: 'Consulta saldos, cuentas de débito y tarjetas de crédito del usuario.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'ID del usuario (ej: usr_carlos_01)' }
      },
      required: ['userId']
    }
  },
  {
    name: 'simulate_debt_restructure',
    description: 'Calcula opciones de amortización de deuda a 12, 18 y 24 meses.',
    inputSchema: {
      type: 'object',
      properties: {
        debtAmount: { type: 'number', description: 'Monto de deuda en MXN' }
      },
      required: ['debtAmount']
    }
  },
  {
    name: 'apply_debt_restructuring',
    description: 'Aplica el plan de pagos congelados seleccionado y emite un folio bancario.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        cardId: { type: 'string' },
        planId: { type: 'string' },
        months: { type: 'number' },
        monthlyQuota: { type: 'number' }
      },
      required: ['userId', 'cardId', 'planId', 'months', 'monthlyQuota']
    }
  },
  {
    name: 'simulate_investment_portfolio',
    description: 'Simula rendimientos en Pagaré Banorte o Cetes según monto y días.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Monto a invertir en MXN' },
        days: { type: 'number', description: 'Plazo en días (28, 91, 180, 360)' }
      }
    }
  },
  {
    name: 'apply_investment',
    description: 'Confirma una inversión: debita la cuenta de cheques y emite folio INV-BNTE.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        amount: { type: 'number' },
        days: { type: 'number' },
        productId: { type: 'string' }
      },
      required: ['userId', 'amount', 'days']
    }
  },
  {
    name: 'get_transaction_history',
    description: 'Obtiene los movimientos del mes, total de gastos y categoría más alta.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string' }
      },
      required: ['userId']
    }
  },
  {
    name: 'pay_credit_card',
    description:
      'Paga la tarjeta de crédito con saldo de cheques: debita checkingBalance y reduce currentBalance de la TDC.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        amount: { type: 'number', description: 'Monto a abonar a la TDC en MXN' },
        cardId: { type: 'string', description: 'ID de tarjeta (opcional)' }
      },
      required: ['userId', 'amount']
    }
  },
  {
    name: 'execute_transfer',
    description: 'Ejecuta una transferencia rápida SPEI entre cuentas.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        recipientName: { type: 'string' },
        amount: { type: 'number' },
        concept: { type: 'string' }
      },
      required: ['userId', 'recipientName', 'amount', 'concept']
    }
  },
  {
    name: 'get_financial_health_diagnostic',
    description: 'Diagnóstico de score crediticio, ratio de endeudamiento (DTI) y recomendaciones.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string' }
      },
      required: ['userId']
    }
  },
  {
    name: 'get_ui_kit',
    description:
      'Kit visual A2UI: catálogo de íconos, series para gráficas (Donut/Bar/Progress) y bloques default con datos reales del usuario.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        focus: {
          type: 'string',
          description:
            'auto|spending|debt|balances|health|investment|card_payment — tipifica la composición recomendada'
        }
      },
      required: ['userId']
    }
  }
] as const;

export type McpToolName = (typeof MCP_TOOL_DEFINITIONS)[number]['name'];

/**
 * Ejecuta una herramienta MCP por nombre con el mismo contrato que CallTool.
 * El orquestador A2UI usa esta función en el hot path (no importa tools a ciegas).
 */
export function callMcpTool(name: string, args: Record<string, unknown> = {}): unknown {
  switch (name) {
    case 'get_client_financial_status':
      return getClientFinancialStatus(String(args.userId));
    case 'simulate_debt_restructure':
      return simulateDebtRestructure(Number(args.debtAmount));
    case 'apply_debt_restructuring':
      return applyDebtRestructuring(
        String(args.userId),
        String(args.cardId),
        String(args.planId),
        Number(args.months),
        Number(args.monthlyQuota)
      );
    case 'simulate_investment_portfolio':
      return simulateInvestmentPortfolio(
        args.amount !== undefined ? Number(args.amount) : 25000,
        args.days !== undefined ? Number(args.days) : 91
      );
    case 'apply_investment':
      return applyInvestment(
        String(args.userId),
        Number(args.amount),
        Number(args.days),
        args.productId ? String(args.productId) : undefined
      );
    case 'get_transaction_history':
      return getTransactionHistory(String(args.userId));
    case 'pay_credit_card':
      return payCreditCard(
        String(args.userId),
        Number(args.amount),
        args.cardId ? String(args.cardId) : undefined
      );
    case 'execute_transfer':
      return executeTransfer(
        String(args.userId),
        String(args.recipientName),
        Number(args.amount),
        String(args.concept)
      );
    case 'get_financial_health_diagnostic':
      return getFinancialHealthDiagnostic(String(args.userId));
    case 'get_ui_kit':
      return getUiKit(String(args.userId), args.focus ? String(args.focus) : 'auto');
    default:
      throw new Error(`Herramienta MCP desconocida: ${name}`);
  }
}
