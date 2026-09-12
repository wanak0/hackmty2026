import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { MCP_TOOL_DEFINITIONS, callMcpTool } from './registry.js';

/**
 * Servidor oficial MCP de Banorte.
 * Comparte registry + callMcpTool con el orquestador HTTP (mismo contrato de tools).
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

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: MCP_TOOL_DEFINITIONS.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }))
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = callMcpTool(name, (args || {}) as Record<string, unknown>);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
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
