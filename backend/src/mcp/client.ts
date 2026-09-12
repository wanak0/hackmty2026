/**
 * Cliente MCP Banorte: el orquestador HTTP habla con el servidor MCP
 * vía InMemoryTransport (mismo protocolo ListTools/CallTool que stdio).
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createBanorteMcpServer } from './server.js';

let ready: Promise<Client> | null = null;

async function getClient(): Promise<Client> {
  if (!ready) {
    ready = (async () => {
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      const server = createBanorteMcpServer();
      const client = new Client({ name: 'banorte-a2ui-orchestrator', version: '2.0.0' });
      await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
      console.log('[MCP] Cliente conectado al servidor Banorte (in-memory)');
      return client;
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

function parseToolContent(result: { content?: Array<{ type: string; text?: string }>; isError?: boolean }): unknown {
  if (result.isError) {
    const msg = result.content?.map((c) => c.text).filter(Boolean).join(' ') || 'Error MCP';
    throw new Error(msg);
  }
  const text = result.content?.find((c) => c.type === 'text')?.text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** ListTools vía servidor MCP. */
export async function listMcpTools(): Promise<
  Array<{ name: string; description?: string }>
> {
  const client = await getClient();
  const listed = await client.listTools();
  return (listed.tools || []).map((t) => ({
    name: t.name,
    description: t.description
  }));
}

/** CallTool vía servidor MCP (no llama el registry en proceso directamente). */
export async function callMcpToolViaServer(
  name: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  const client = await getClient();
  const result = await client.callTool({ name, arguments: args });
  return parseToolContent(result as any);
}
