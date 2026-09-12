import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import {
  getClientFinancialStatus,
  simulateDebtRestructure,
  applyDebtRestructuring,
  simulateInvestmentPortfolio,
  getTransactionHistory,
  executeTransfer,
  getFinancialHealthDiagnostic
} from './tools.js';

/**
 * Inicializa y expone el servidor oficial MCP de Banorte
 */
export function createBanorteMcpServer() {
  const server = new Server(
    {
      name: 'banorte-financial-mcp',
      version: '2.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Registro de herramientas disponibles
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
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
        }
      ]
    };
  });

  // Ejecución de herramientas
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'get_client_financial_status') {
        const result = getClientFinancialStatus((args as any).userId);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      if (name === 'simulate_debt_restructure') {
        const result = simulateDebtRestructure((args as any).debtAmount);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      if (name === 'apply_debt_restructuring') {
        const { userId, cardId, planId, months, monthlyQuota } = args as any;
        const result = applyDebtRestructuring(userId, cardId, planId, months, monthlyQuota);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      if (name === 'simulate_investment_portfolio') {
        const { amount, days } = args as any;
        const result = simulateInvestmentPortfolio(amount, days);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      if (name === 'get_transaction_history') {
        const result = getTransactionHistory((args as any).userId);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      if (name === 'execute_transfer') {
        const { userId, recipientName, amount, concept } = args as any;
        const result = executeTransfer(userId, recipientName, amount, concept);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      if (name === 'get_financial_health_diagnostic') {
        const result = getFinancialHealthDiagnostic((args as any).userId);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }

      throw new Error(`Herramienta desconocida: ${name}`);
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: error.message || 'Error al ejecutar tool MCP' }]
      };
    }
  });

  return server;
}

if (process.argv[1]?.includes('server.ts') || process.argv[1]?.includes('server.js')) {
  const mcp = createBanorteMcpServer();
  const transport = new StdioServerTransport();
  mcp.connect(transport).then(() => {
    console.error('Servidor MCP Banorte 2.0 conectado.');
  });
}
