/**
 * Protocolo A2UI v0.9 para el orquestador Banorte.
 * El LLM emite mensajes createSurface / updateDataModel / updateComponents.
 */

export type A2UIVersion = "v0.9";

export type A2UIMessage =
  | {
      version: A2UIVersion;
      createSurface: {
        surfaceId: string;
        catalogId: string;
        sendDataModel?: boolean;
      };
    }
  | {
      version: A2UIVersion;
      updateComponents: {
        surfaceId: string;
        components: A2UIComponentNode[];
      };
    }
  | {
      version: A2UIVersion;
      updateDataModel: {
        surfaceId: string;
        path?: string;
        value?: unknown;
      };
    }
  | {
      version: A2UIVersion;
      deleteSurface: { surfaceId: string };
    };

export interface A2UIComponentNode {
  id: string;
  component: string;
  children?: string[];
  child?: string;
  [key: string]: unknown;
}

export interface A2UIChatResponse {
  type: "a2ui_v09";
  surfaceId: string;
  assistantMessage: string;
  suggestedPrompts: string[];
  messages: A2UIMessage[];
}

const KNOWN_ACTIONS = new Set([
  "APPLY_RESTRUCTURE",
  "CONFIRM_INVESTMENT",
  "CONFIRM_TRANSFER",
  "PAY_CARD",
  "USER_PROMPT",
  "SELECT_PLAN",
  "VIEW_ACCOUNT",
  "VIEW_BALANCES",
  "SHOW_DEBT_RESTRUCTURE_OPTIONS",
  "SHOW_INVESTMENT",
  "VIEW_TRANSACTIONS",
  "SIMULATE_INVESTMENT",
]);

const STANDARD = new Set([
  "Column",
  "Row",
  "Box",
  "Card",
  "Divider",
  "Tabs",
  "Accordion",
  "Text",
  "Markdown",
  "Badge",
  "Icon",
  "DataTable",
  "ProgressIndicator",
  "ProgressBar",
  "DonutChart",
  "BarChart",
  "List",
  "TextField",
  "Slider",
  "ChoicePicker",
  "CheckBox",
  "Switch",
  "DateTimeInput",
  "Button",
  "Snackbar",
  "Image",
  "Link",
  "CodeBlock",
  "Menu",
  "AppBar",
  "BottomNavigation",
  "NavigationDrawer",
  "Carousel",
  "Audio",
  "Video",
  "FileUpload",
]);

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function cleanJsonString(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  return text;
}

export function parseA2UIPayload(raw: string): unknown {
  return JSON.parse(cleanJsonString(raw));
}

function defaultPrompts(): string[] {
  return [
    "Quiero pagar menos intereses de mi tarjeta",
    "¿Cuánto tengo disponible en débito?",
    "Transferir $500 a mi mamá",
  ];
}

/** Evita que React muestre "[object Object]" en Text / celdas / diálogos. */
export function formatDisplayValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value)
      ? value.toLocaleString("es-MX")
      : value.toLocaleString("es-MX", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  }
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) {
    return value.map((item) => formatDisplayValue(item)).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    for (const key of ["literalString", "literal", "text", "content", "label", "message", "title"]) {
      if (typeof o[key] === "string") return o[key] as string;
    }
    if (typeof o.value === "string" || typeof o.value === "number") {
      return formatDisplayValue(o.value);
    }
    const moneyKeys = ["amount", "checkingBalance", "totalDebt", "monthlyPayment", "balance"];
    for (const key of moneyKeys) {
      if (typeof o[key] === "number") {
        return Number(o[key]).toLocaleString("es-MX", {
          style: "currency",
          currency: "MXN",
        });
      }
    }
    const pairs = Object.entries(o)
      .filter(([, v]) => v != null && typeof v !== "object")
      .slice(0, 6)
      .map(([k, v]) => `${k}: ${formatDisplayValue(v)}`);
    if (pairs.length) return pairs.join(" · ");
    try {
      return JSON.stringify(o);
    } catch {
      return "";
    }
  }
  return String(value);
}

function isPathBinding(value: unknown): value is { path: string } {
  return (
    !!value &&
    typeof value === "object" &&
    "path" in (value as object) &&
    typeof (value as { path: unknown }).path === "string"
  );
}

function getByPath(obj: unknown, path: string): unknown {
  if (!path || path === "/") return obj;
  const parts = path.replace(/^\//, "").split("/").filter(Boolean);
  let current: any = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

function coerceBoundText(value: unknown, dataModel: unknown): unknown {
  if (isPathBinding(value)) {
    const resolved = getByPath(dataModel, value.path);
    if (
      resolved != null &&
      typeof resolved === "object" &&
      !Array.isArray(resolved)
    ) {
      // Path apunta a un objeto → literal legible (evita [object Object] en a2ui-shadcn).
      return formatDisplayValue(resolved);
    }
    return value;
  }
  if (value != null && typeof value === "object") {
    return formatDisplayValue(value);
  }
  return value;
}

function sanitizeTableData(data: unknown, dataModel: unknown): unknown {
  const raw = isPathBinding(data) ? getByPath(dataModel, data.path) : data;
  if (!Array.isArray(raw)) return data;
  const rows = raw.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return { value: formatDisplayValue(row) };
    }
    const next: Record<string, unknown> = {};
    for (const [key, cell] of Object.entries(row as Record<string, unknown>)) {
      next[key] =
        cell != null && typeof cell === "object"
          ? formatDisplayValue(cell)
          : cell;
    }
    return next;
  });
  // Si venía por path, materializamos filas ya saneadas para no depender del objeto crudo.
  return rows;
}

/** Corrige textos/tablas que terminarían como "[object Object]" en el renderer. */
export function sanitizeA2UIDisplay(response: A2UIChatResponse): A2UIChatResponse {
  let dataModel: unknown = {};
  for (const msg of response.messages) {
    if ("updateDataModel" in msg && msg.updateDataModel.path === "/") {
      dataModel = msg.updateDataModel.value ?? {};
    } else if ("updateDataModel" in msg && !msg.updateDataModel.path) {
      dataModel = msg.updateDataModel.value ?? dataModel;
    }
  }

  const messages = response.messages.map((msg) => {
    if (!("updateComponents" in msg)) return msg;
    const components = msg.updateComponents.components.map((comp) => {
      const next: A2UIComponentNode = { ...comp };
      for (const key of ["text", "label", "content", "message", "title"] as const) {
        if (key in next) next[key] = coerceBoundText(next[key], dataModel);
      }
      if (next.component === "DataTable" && (next.data != null || next.items != null)) {
        const source = next.data ?? next.items;
        next.data = sanitizeTableData(source, dataModel);
        delete next.items;
      }
      // El LLM a veces mete "style" como objeto de diseño; a2ui-shadcn no lo usa.
      if (next.style != null && typeof next.style === "object") {
        delete next.style;
      }
      return next;
    });
    return {
      version: "v0.9" as const,
      updateComponents: { ...msg.updateComponents, components },
    };
  });

  return { ...response, messages };
}

function moneyMx(n: number): string {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

/**
 * Superficie A2UI mínima a partir de tools bancarias MCP (sin get_ui_kit / sin LLM).
 */
export function buildResponseFromMcpContext(
  mcpContext: Record<string, unknown>,
  opts: {
    intent?: string;
    message?: string;
    surfaceId?: string;
    assistantMessage?: string;
    suggestedPrompts?: string[];
  } = {},
): A2UIChatResponse | null {
  const status = mcpContext.get_client_financial_status as any;
  const txs = mcpContext.get_transaction_history as any;
  const debtSim = mcpContext.simulate_debt_restructure as any;
  const invest = mcpContext.simulate_investment_portfolio as any;
  const health = mcpContext.get_financial_health_diagnostic as any;
  const confirmation =
    mcpContext.apply_debt_restructuring ||
    mcpContext.apply_investment ||
    mcpContext.execute_transfer ||
    mcpContext.pay_credit_card;

  if (!status && !txs && !debtSim && !invest && !health && !confirmation) {
    return null;
  }

  const intent = opts.intent || "balances";
  const surfaceId = opts.surfaceId || `surface_${intent}_${Date.now()}`;
  const checking = Number(status?.user?.checkingBalance ?? 0);
  const debt = Number(status?.totalDebt ?? 0);
  const card = status?.cards?.[0];
  const children: string[] = ["title"];
  const components: A2UIComponentNode[] = [
    {
      id: "title",
      component: "Text",
      text: opts.assistantMessage || "Aquí tienes tu información actualizada",
      usageHint: "h3",
    },
  ];

  if (status) {
    children.push("stats", "balances_table");
    components.push(
      { id: "stats", component: "Row", children: ["card_check", "card_debt"] },
      {
        id: "card_check",
        component: "Card",
        children: ["check_label", "check_value"],
      },
      { id: "check_label", component: "Text", text: "Saldo débito", tone: "muted" },
      {
        id: "check_value",
        component: "Text",
        text: moneyMx(checking),
        usageHint: "h2",
      },
      {
        id: "card_debt",
        component: "Card",
        children: ["debt_label", "debt_value"],
      },
      { id: "debt_label", component: "Text", text: "Deuda TDC", tone: "muted" },
      {
        id: "debt_value",
        component: "Text",
        text: moneyMx(debt),
        usageHint: "h2",
      },
      {
        id: "balances_table",
        component: "DataTable",
        columns: [
          { key: "concept", header: "Concepto" },
          { key: "amount", header: "Monto" },
        ],
        data: [
          { concept: "Cheques", amount: moneyMx(checking) },
          { concept: "Deuda TDC", amount: moneyMx(debt) },
          {
            concept: "Pago mínimo",
            amount: moneyMx(Number(card?.minimumPayment || 0)),
          },
        ],
      },
    );
  }

  if (txs?.transactions?.length) {
    children.push("tx_table");
    components.push({
      id: "tx_table",
      component: "DataTable",
      columns: [
        { key: "concept", header: "Movimiento" },
        { key: "amount", header: "Monto" },
      ],
      data: (txs.transactions as any[]).slice(0, 8).map((t) => ({
        concept: String(t.concept || t.category || "Movimiento"),
        amount: moneyMx(Number(t.amount || 0)),
      })),
    });
  }

  const categoryBreakdown = txs?.categoryBreakdown;
  if (categoryBreakdown && typeof categoryBreakdown === "object") {
    const palette = [
      "#EB0029",
      "#8F0017",
      "#B66D7A",
      "#323E48",
      "#758894",
      "#C1CBD0",
    ];
    const segments = Object.entries(categoryBreakdown as Record<string, number>)
      .map(([label, value], i) => ({
        label,
        value: Number(value) || 0,
        color: palette[i % palette.length],
      }))
      .filter((s) => s.value > 0);
    if (segments.length) {
      children.push("spend_donut");
      components.push({
        id: "spend_donut",
        component: "DonutChart",
        title: "Gastos por categoría",
        centerLabel: "Total",
        centerValue: moneyMx(segments.reduce((a, s) => a + s.value, 0)),
        segments,
      });
    }
  }

  if (debtSim?.options?.length) {
    children.push("plan_bars", "plan_table");
    components.push({
      id: "plan_bars",
      component: "BarChart",
      title: "Pago mensual por plan",
      unit: "MXN",
      bars: debtSim.options.map((o: any, i: number) => ({
        label: `${o.months} meses`,
        value: Number(o.monthlyPayment || 0),
        highlight: !!o.recommended,
        color: o.recommended ? "#EB0029" : "#758894",
      })),
    });
    components.push({
      id: "plan_table",
      component: "DataTable",
      columns: [
        { key: "plazo", header: "Plazo" },
        { key: "mensual", header: "Pago mensual" },
        { key: "cat", header: "CAT" },
      ],
      data: debtSim.options.map((o: any) => ({
        plazo: `${o.months} meses`,
        mensual: moneyMx(Number(o.monthlyPayment || 0)),
        cat: `${o.cat}%`,
      })),
    });
  }

  if (invest?.options?.length) {
    children.push("inv_table");
    components.push({
      id: "inv_table",
      component: "DataTable",
      columns: [
        { key: "product", header: "Producto" },
        { key: "rate", header: "Tasa" },
        { key: "total", header: "Al vencimiento" },
      ],
      data: invest.options.map((o: any) => ({
        product: String(o.name || o.productId || "Inversión"),
        rate: `${o.annualRate ?? o.rate ?? "—"}%`,
        total: moneyMx(Number(o.totalFinal || o.projectedTotal || 0)),
      })),
    });
  }

  if (health) {
    children.push("health_card");
    components.push(
      {
        id: "health_card",
        component: "Card",
        children: ["health_score", "health_dti"],
      },
      {
        id: "health_score",
        component: "Text",
        text: `Score: ${health.creditScore} · ${health.scoreRange || ""}`,
      },
      {
        id: "health_dti",
        component: "Text",
        text: `DTI: ${health.dtiPercentage}% · ${health.status || ""}`,
      },
    );
  }

  if (confirmation && typeof confirmation === "object") {
    children.push("confirm_card");
    components.push(
      {
        id: "confirm_card",
        component: "Card",
        children: ["confirm_text"],
      },
      {
        id: "confirm_text",
        component: "Text",
        text: formatDisplayValue(confirmation),
      },
    );
  }

  children.push("cta");
  components.push({
    id: "cta",
    component: "Button",
    text: "Seguir explorando",
    variant: "primary",
    action: {
      event: {
        name: "USER_PROMPT",
        context: { text: opts.message || "Ver mis saldos" },
      },
    },
  });

  components.unshift({
    id: "root",
    component: "Column",
    children,
  });

  const raw = {
    type: "a2ui_v09",
    surfaceId,
    assistantMessage:
      opts.assistantMessage ||
      "Aquí tienes la interfaz con tus datos del momento.",
    suggestedPrompts: opts.suggestedPrompts || defaultPrompts(),
    messages: [
      {
        version: "v0.9",
        createSurface: {
          surfaceId,
          catalogId: "a2ui-shadcn",
          sendDataModel: true,
        },
      },
      {
        version: "v0.9",
        updateDataModel: { surfaceId, path: "/", value: { intent } },
      },
      {
        version: "v0.9",
        updateComponents: { surfaceId, components },
      },
    ],
  };

  const normalized = normalizeA2UIResponse(raw, surfaceId);
  return isCompleteA2UIResponse(normalized) ? normalized : null;
}

export function buildErrorResponse(
  message: string,
  operationMayHaveRun = false,
): A2UIChatResponse {
  const surfaceId = "agent_generation_error";
  return {
    type: "a2ui_v09",
    surfaceId,
    assistantMessage: operationMayHaveRun
      ? "No pude mostrar el resultado. Revisa tus saldos y movimientos antes de repetir la operación."
      : "Maya no está disponible por el momento. Tus saldos siguen a la vista.",
    suggestedPrompts: defaultPrompts(),
    messages: [
      {
        version: "v0.9",
        createSurface: {
          surfaceId,
          catalogId: "a2ui-shadcn",
          sendDataModel: true,
        },
      },
      {
        version: "v0.9",
        updateDataModel: {
          surfaceId,
          path: "/",
          value: {
            alert: operationMayHaveRun
              ? "La operación pudo haberse registrado. No vuelvas a confirmarla hasta revisar tus movimientos."
              : "Tu consulta se conserva en la conversación. Puedes volver a intentarlo más tarde.",
            retryText: operationMayHaveRun
              ? "Quiero consultar mis últimos movimientos"
              : message,
          },
        },
      },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId,
          components: [
            {
              id: "root",
              component: "Column",
              children: ["title", "alert", "retry"],
            },
            {
              id: "title",
              component: "Text",
              text: "No pudimos preparar tu respuesta",
              usageHint: "h3",
            },
            {
              id: "alert",
              component: "Text",
              text: { path: "/alert" },
            },
            {
              id: "retry",
              component: "Button",
              text: operationMayHaveRun
                ? "Consultar mis movimientos"
                : "Volver a consultar",
              action: {
                event: {
                  name: "USER_PROMPT",
                  context: { text: { path: "/retryText" } },
                },
              },
            },
          ],
        },
      },
    ],
  };
}

function extractMessages(raw: any, surfaceId: string): A2UIMessage[] {
  if (Array.isArray(raw.messages)) return raw.messages as A2UIMessage[];
  if (Array.isArray(raw.a2ui_messages)) return raw.a2ui_messages as A2UIMessage[];
  // Legacy nested: components tree → convert to flat adjacency if present
  if (Array.isArray(raw.components)) {
    return legacyTreeToMessages(raw.components, surfaceId, raw.dataModel);
  }
  return [];
}

function legacyTreeToMessages(
  tree: any[],
  surfaceId: string,
  dataModel?: unknown,
): A2UIMessage[] {
  const flat: A2UIComponentNode[] = [];
  const walk = (node: any, index: number): string => {
    const id = String(node.id || `node_${index}`);
    const type = String(node.type || node.component || "Text");
    const mapped =
      type === "TransferCard" || type === "BanorteTransferCard"
        ? "Card"
        : type === "PlanOptionList" || type === "BanortePlanOptions"
          ? "ChoicePicker"
          : type === "InvestmentSimulator" || type === "BanorteInvestment"
            ? "Card"
            : type === "ConfirmationCard" || type === "BanorteConfirmation"
              ? "Card"
              : type === "FinancialHealthScore" || type === "BanorteHealthScore"
                ? "Card"
                : type === "DonutChart" || type === "BanorteDonut"
                  ? "DonutChart"
                  : type === "BarChart" || type === "BanorteBar"
                    ? "BarChart"
                    : type === "ProgressBar"
                      ? "ProgressBar"
                      : type === "AlertBanner" || type === "BanorteAlert"
                    ? "Text"
                    : type === "StatTile" || type === "BanorteStat"
                      ? "Card"
                      : type === "ActionButton" || type === "BanorteActionButton"
                        ? "Button"
                        : type === "Grid" || type === "Stack"
                          ? "Column"
                          : type === "SectionHeader" || type === "HeaderBadge"
                            ? "Text"
                            : STANDARD.has(type)
                              ? type
                              : "Text";
    const children = Array.isArray(node.children)
      ? node.children.map((child: any, i: number) => walk(child, i))
      : undefined;
    const props = { ...(node.props || {}) };
    Object.keys(node).forEach((key) => {
      if (!["id", "type", "component", "props", "children"].includes(key)) {
        props[key] = node[key];
      }
    });
    if (mapped === "Text" && !props.text) {
      const candidate =
        props.title || props.content || props.label || props.message;
      if (candidate) props.text = candidate;
    }
    if (mapped === "Button") {
      if (!props.text) props.text = props.label || "Continuar";
      if (!props.action && props.actionType) {
        props.action = {
          event: {
            name: props.actionType,
            context: props.payload || {},
          },
        };
      }
    }
    flat.push({
      id,
      component: mapped,
      ...(children ? { children } : {}),
      ...props,
    });
    return id;
  };
  const roots = tree.map((node, i) => walk(node, i));
  flat.unshift({ id: "root", component: "Column", children: roots });
  const messages: A2UIMessage[] = [
    {
      version: "v0.9",
      createSurface: {
        surfaceId,
        catalogId: "a2ui-shadcn",
        sendDataModel: true,
      },
    },
  ];
  if (dataModel) {
    messages.push({
      version: "v0.9",
      updateDataModel: { surfaceId, path: "/", value: dataModel },
    });
  }
  messages.push({
    version: "v0.9",
    updateComponents: { surfaceId, components: flat },
  });
  return messages;
}

function flattenNodeProps(node: any): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  if (!node || typeof node !== "object") return flat;
  const nested =
    node.props && typeof node.props === "object" && !Array.isArray(node.props)
      ? (node.props as Record<string, unknown>)
      : {};
  // Nested props first; top-level wins if both exist.
  Object.assign(flat, nested);
  for (const [key, value] of Object.entries(node)) {
    if (key === "id" || key === "component" || key === "type" || key === "props")
      continue;
    flat[key] = value;
  }
  return flat;
}

function pickTextCandidate(source: Record<string, unknown>): unknown {
  for (const key of [
    "text",
    "label",
    "title",
    "content",
    "message",
    "value",
    "caption",
    "heading",
  ]) {
    const v = source[key];
    if (v == null) continue;
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (isPathBinding(v)) return v;
    if (typeof v === "object") {
      const formatted = formatDisplayValue(v);
      if (formatted && formatted !== "[object Object]") return formatted;
    }
  }
  return undefined;
}

function normalizeComponent(node: any, index: number): A2UIComponentNode {
  const id = String(node.id || `comp_${index}`);
  let component = String(node.component || node.type || "Text");
  // Force legacy Banorte* / domain names onto the standard catalog.
  if (component.startsWith("Banorte") || !STANDARD.has(component)) {
    if (component.includes("Action") || component === "ActionButton")
      component = "Button";
    else if (component.includes("Plan") || component.includes("Option"))
      component = "ChoicePicker";
    else if (component.includes("Transfer") || component.includes("Investment"))
      component = "Card";
    else if (component.includes("Donut") || component === "DonutChart")
      component = "DonutChart";
    else if (
      (component.includes("Bar") && component.includes("Chart")) ||
      component === "BarChart"
    )
      component = "BarChart";
    else if (component === "ProgressBar" || component.includes("ProgressBar"))
      component = "ProgressBar";
    else if (component.includes("Chart")) component = "DonutChart";
    else if (
      component.includes("Stat") ||
      component.includes("Confirm") ||
      component.includes("Health")
    )
      component = "Card";
    else if (component.includes("Alert")) component = "Text";
    else if (!STANDARD.has(component)) component = "Text";
  }

  const flat = flattenNodeProps(node);
  const next: A2UIComponentNode = { id, component, ...flat };

  if (component === "Button" && !next.action && next.actionType) {
    next.action = {
      event: {
        name: next.actionType,
        context: next.payload || {},
      },
    };
  }

  const textCandidate = pickTextCandidate(flat);
  if (component === "Text" || component === "Badge" || component === "Button") {
    if (textCandidate !== undefined) next.text = textCandidate;
    else if (component === "Button") next.text = "Continuar";
    else if (component === "Badge") next.text = "Info";
    // Text without content: leave empty so isComplete can reject placeholder spam
    else delete next.text;
  }

  if (Array.isArray(node.children) || Array.isArray(flat.children)) {
    const rawChildren = (Array.isArray(node.children)
      ? node.children
      : flat.children) as unknown[];
    next.children = rawChildren
      .map((child: unknown, i: number) => {
        if (typeof child === "string" && child.trim()) return child;
        if (child && typeof child === "object" && (child as any).id) {
          return String((child as any).id);
        }
        return `child_${id}_${i}`;
      })
      .filter((cid) => cid && cid !== "[object Object]");
  }

  for (const key of ["text", "label", "content", "message", "title"] as const) {
    if (
      next[key] != null &&
      typeof next[key] === "object" &&
      !isPathBinding(next[key])
    ) {
      next[key] = formatDisplayValue(next[key]);
    }
  }
  if (next.style != null && typeof next.style === "object") {
    delete next.style;
  }
  return next;
}

export function normalizeA2UIResponse(
  raw: any,
  fallbackSurfaceId = `surface_${Date.now()}`,
): A2UIChatResponse {
  const body = raw?.a2ui_v09 || raw?.a2ui_screen || raw;
  const surfaceId = String(
    body.surfaceId || body.screenId || body.id || fallbackSurfaceId,
  );
  const assistantMessage = String(
    body.assistantMessage ||
      body.message ||
      "Analicé tu solicitud y preparé esta interfaz:",
  );
  let messages = extractMessages(body, surfaceId);

  // Ensure createSurface exists
  const hasCreate = messages.some((m) => "createSurface" in m);
  if (!hasCreate) {
    messages = [
      {
        version: "v0.9",
        createSurface: {
          surfaceId,
          catalogId: "a2ui-shadcn",
          sendDataModel: true,
        },
      },
      ...messages,
    ];
  }

  // Normalize component lists
  messages = messages.map((msg) => {
    if (!("updateComponents" in msg)) return msg;
    const comps = (msg.updateComponents.components || []).map((c, i) =>
      normalizeComponent(c, i),
    );
    return {
      version: "v0.9" as const,
      updateComponents: {
        surfaceId: msg.updateComponents.surfaceId || surfaceId,
        components: comps,
      },
    };
  });

  // Align surfaceIds
  messages = messages.map((msg) => {
    if ("createSurface" in msg) {
      return {
        version: "v0.9" as const,
        createSurface: { ...msg.createSurface, surfaceId },
      };
    }
    if ("updateComponents" in msg) {
      return {
        version: "v0.9" as const,
        updateComponents: { ...msg.updateComponents, surfaceId },
      };
    }
    if ("updateDataModel" in msg) {
      return {
        version: "v0.9" as const,
        updateDataModel: { ...msg.updateDataModel, surfaceId },
      };
    }
    return msg;
  });

  const suggestedPrompts = Array.isArray(body.suggestedPrompts)
    ? body.suggestedPrompts.filter((p: unknown) => hasText(p)).map(String)
    : defaultPrompts();

  return sanitizeA2UIDisplay({
    type: "a2ui_v09",
    surfaceId,
    assistantMessage: formatDisplayValue(assistantMessage) || assistantMessage,
    suggestedPrompts:
      suggestedPrompts.length >= 2 ? suggestedPrompts : defaultPrompts(),
    messages,
  });
}

function collectComponents(messages: A2UIMessage[]): A2UIComponentNode[] {
  return messages.flatMap((msg) =>
    "updateComponents" in msg ? msg.updateComponents.components : [],
  );
}

function hasActionButton(components: A2UIComponentNode[]): boolean {
  return components.some((c) => {
    if (c.component !== "Button") return false;
    const eventName = (c.action as any)?.event?.name;
    return hasText(eventName) && KNOWN_ACTIONS.has(String(eventName));
  });
}

function hasVisual(components: A2UIComponentNode[]): boolean {
  return components.some((c) =>
    [
      "DataTable",
      "ProgressIndicator",
      "ProgressBar",
      "DonutChart",
      "BarChart",
      "Card",
      "ChoicePicker",
      "TextField",
      "Badge",
      "Slider",
    ].includes(c.component),
  );
}

function textLooksMeaningful(value: unknown): boolean {
  if (isPathBinding(value)) return true;
  if (typeof value === "number" && Number.isFinite(value)) return true;
  if (typeof value !== "string") return false;
  const t = value.trim();
  if (!t) return false;
  if (/^(detalle|detail|text|label|title|content|n\/a|null|undefined)$/i.test(t))
    return false;
  if (t === "[object Object]") return false;
  return true;
}

function hasUsableCopy(components: A2UIComponentNode[]): boolean {
  const texts = components.filter((c) => c.component === "Text");
  const meaningful = texts.filter((c) => textLooksMeaningful(c.text));
  // Evita pantallas de solo "Detalle" / Text vacíos.
  if (texts.length >= 2 && meaningful.length < Math.ceil(texts.length * 0.5)) {
    return false;
  }
  if (meaningful.length === 0 && texts.length > 0) return false;

  const buttons = components.filter((c) => c.component === "Button");
  if (
    buttons.some(
      (c) =>
        !textLooksMeaningful(c.text) && !textLooksMeaningful(c.label),
    )
  ) {
    return false;
  }
  return true;
}

export function isCompleteA2UIResponse(
  response: A2UIChatResponse | null | undefined,
): response is A2UIChatResponse {
  if (!response || response.type !== "a2ui_v09") return false;
  if (!hasText(response.assistantMessage)) return false;
  if (!Array.isArray(response.messages) || response.messages.length < 2)
    return false;
  const hasCreate = response.messages.some((m) => "createSurface" in m);
  const hasComponents = response.messages.some((m) => "updateComponents" in m);
  if (!hasCreate || !hasComponents) return false;
  const components = collectComponents(response.messages);
  if (components.length < 3) return false;
  if (!components.some((c) => c.id === "root")) return false;
  if (!hasVisual(components)) return false;
  // Error surfaces may omit action buttons with known domain actions
  if (response.surfaceId === "agent_generation_error") return true;
  if (!hasUsableCopy(components)) return false;
  return hasActionButton(components) || hasVisual(components);
}
