import { useCallback, useEffect, useRef, useState, FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  HelpCircle,
  Home,
  Loader2,
  MessageCircle,
  PiggyBank,
  ReceiptText,
  RotateCcw,
  Send,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { A2UIScreen, ChatMessage } from "../../types/a2ui";
import { A2UIRenderer } from "../a2ui/A2UIRenderer";
import { BanorteLogo } from "../common/BanorteLogo";

interface ClientStatus {
  user: { name: string; checkingBalance: number };
  totalDebt: number;
  cards: {
    cardName: string;
    last4: string;
    minimumPayment: number;
    paymentDueDate: string;
  }[];
}
type ActionPayload = Record<string, unknown>;
type PendingAction = { type: string; payload: ActionPayload };
const money = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const tasks = [
  {
    icon: Wallet,
    title: "Ver mi saldo",
    detail: "Consulta tu dinero disponible",
    prompt: "Quiero ver mis saldos actuales",
  },
  {
    icon: CreditCard,
    title: "Pagar mi tarjeta",
    detail: "Revisa cuánto necesitas pagar",
    prompt: "Quiero pagar mi tarjeta de crédito",
  },
  {
    icon: ArrowUpRight,
    title: "Transferir dinero",
    detail: "Prepara un envío paso a paso",
    prompt:
      "Quiero hacer una transferencia, ayúdame a elegir el destinatario y el monto",
  },
  {
    icon: ReceiptText,
    title: "Ver mis gastos",
    detail: "Entiende tus movimientos",
    prompt: "¿En qué he gastado este mes?",
  },
  {
    icon: PiggyBank,
    title: "Hacer crecer mi ahorro",
    detail: "Explora una inversión",
    prompt: "Quiero simular una inversión de 5000 pesos en pagaré",
  },
  {
    icon: ShieldCheck,
    title: "Pagar menos intereses",
    detail: "Compara opciones para tu deuda",
    prompt: "Quiero pagar menos intereses de mi tarjeta",
  },
];
const mutationLabels: Record<string, string> = {
  APPLY_RESTRUCTURE: "Aplicar plan de pagos",
  CONFIRM_TRANSFER: "Confirmar transferencia",
  CONFIRM_INVESTMENT: "Confirmar inversión",
  PAY_CARD: "Confirmar pago de tarjeta",
};

export function ChatContainer({
  onBackToLanding,
}: {
  onBackToLanding: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<A2UIScreen | null>(null);
  const [clientStatus, setClientStatus] = useState<ClientStatus | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showAmounts, setShowAmounts] = useState(true);
  const [largeText, setLargeText] = useState(
    () => localStorage.getItem("banorte-large-text") === "true",
  );
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [showHelp, setShowHelp] = useState(false);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const conversationLog = useRef<HTMLDivElement>(null);
  const resultTitle = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const fetchStatus = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/user/usr_carlos_01/status", {
        signal,
      });
      if (!response.ok) throw new Error("status");
      setClientStatus(await response.json());
      setStatusError(false);
    } catch {
      if (!signal?.aborted) setStatusError(true);
    }
  }, []);

  useEffect(() => {
    const statusController = new AbortController();
    void fetchStatus(statusController.signal);
    return () => {
      statusController.abort();
      controller.current?.abort();
    };
  }, [fetchStatus]);
  useEffect(() => {
    if (messages.length && conversationLog.current)
      conversationLog.current.scrollTop = conversationLog.current.scrollHeight;
  }, [messages]);
  useEffect(() => {
    localStorage.setItem("banorte-large-text", String(largeText));
  }, [largeText]);
  useEffect(() => {
    if (pendingAction) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [pendingAction]);

  const requestScreen = async (
    message: string,
    context: ActionPayload = {},
    displayMessage = message,
  ) => {
    if (busy.current || !message.trim()) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    const requestController = new AbortController();
    controller.current = requestController;
    const timeout = window.setTimeout(() => requestController.abort(), 180000);
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: displayMessage,
        timestamp: Date.now(),
      },
    ]);
    try {
      // One request only: retrying a failed POST automatically could repeat an operation.
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: requestController.signal,
        body: JSON.stringify({
          message,
          context: { ...context, userId: "usr_carlos_01" },
          history,
        }),
      });
      if (!response.ok) throw new Error("response");
      const data: A2UIScreen = await response.json();
      if (
        data.type !== "a2ui_screen" ||
        !Array.isArray(data.components) ||
        !data.components.length
      )
        throw new Error("screen");
      setScreen(data);
      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            data.assistantMessage ||
            "La información está lista. Revísala en tu pantalla.",
          screen: data,
          timestamp: Date.now(),
        },
      ]);
      void fetchStatus();
      requestAnimationFrame(() => {
        resultTitle.current?.focus({ preventScroll: true });
        resultTitle.current?.scrollIntoView({ block: "start" });
      });
    } catch {
      setError(
        context.action && mutationLabels[String(context.action)]
          ? "No pudimos confirmar el resultado. Consulta tus saldos y movimientos antes de repetir la operación."
          : "No pudimos obtener una respuesta. Tu consulta sigue en la conversación; puedes volver a intentarlo.",
      );
      void fetchStatus();
    } finally {
      clearTimeout(timeout);
      busy.current = false;
      setLoading(false);
    }
  };

  const onAction = (actionType: string, payload: ActionPayload = {}) => {
    if (busy.current) return;
    if (
      mutationLabels[actionType] &&
      actionType !== "APPLY_RESTRUCTURE" &&
      (!Number.isFinite(Number(payload.amount)) || Number(payload.amount) <= 0)
    ) {
      setError("Escribe un importe mayor que cero antes de continuar.");
      return;
    }
    if (
      actionType === "CONFIRM_TRANSFER" &&
      !String(payload.recipient || "").trim()
    ) {
      setError("Indica a quién quieres enviar antes de continuar.");
      return;
    }
    if (mutationLabels[actionType]) {
      setPendingAction({ type: actionType, payload });
      return;
    }
    if (actionType === "USER_PROMPT") {
      void requestScreen(String(payload.text || "Ayúdame a continuar"));
      return;
    }
    const prompts: Record<string, string> = {
      VIEW_ACCOUNT: tasks[0].prompt,
      VIEW_BALANCES: tasks[0].prompt,
      SHOW_DEBT_RESTRUCTURE_OPTIONS: tasks[5].prompt,
      SHOW_INVESTMENT: tasks[4].prompt,
      VIEW_TRANSACTIONS: tasks[3].prompt,
    };
    if (prompts[actionType]) {
      void requestScreen(prompts[actionType]);
      return;
    }
    void requestScreen(
      `Acción interactiva: ${actionType}`,
      { ...payload, action: actionType },
      actionType === "SELECT_PLAN"
        ? `Quiero revisar el plan ${String(payload.planId || "")
            .replace("plan_", "")
            .replace("m", " meses")}.`
        : "Actualizar mi consulta",
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || loading) return;
    void requestScreen(input.trim());
    setInput("");
  };
  const confirmAction = async () => {
    if (!pendingAction || busy.current) return;
    const action = pendingAction;
    setPendingAction(null);
    if (action.type !== "RESET") {
      await requestScreen(
        `Acción confirmada: ${action.type}`,
        { ...action.payload, action: action.type },
        mutationLabels[action.type],
      );
      return;
    }
    busy.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/reset", { method: "POST" });
      if (!response.ok) throw new Error("reset");
      setMessages([]);
      setScreen(null);
      await fetchStatus();
    } catch {
      setError("No se pudo reiniciar la demostración. Inténtalo más tarde.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };
  const card = clientStatus?.cards[0];
  const formatBalance = (value?: number) =>
    !showAmounts ? "••••••" : value === undefined ? "—" : money(value);

  return (
    <div className={`bank-app ${largeText ? "large-text" : ""}`}>
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      <div className="institutional-strip">
        <div className="page-width">
          <span>GRUPO FINANCIERO BANORTE</span>
          <span>Demo · Sin dinero real</span>
        </div>
      </div>
      <header className="site-header">
        <div className="page-width header-inner">
          <button
            className="logo-home"
            onClick={onBackToLanding}
            disabled={loading}
            aria-label="Volver a la bienvenida"
          >
            <BanorteLogo size="lg" />
          </button>
          <div className="header-tools">
            <button
              className="text-size-control"
              aria-label="Letra grande"
              aria-pressed={largeText}
              onClick={() => setLargeText((value) => !value)}
            >
              <span aria-hidden="true">Aa</span> <span>Letra grande</span>
            </button>
            <button
              className="help-control"
              aria-label="Ayuda"
              onClick={() => setShowHelp((value) => !value)}
              aria-expanded={showHelp}
            >
              <HelpCircle size={20} />
              <span>Ayuda</span>
            </button>
            <span className="header-divider" />
            <div className="user-avatar" aria-hidden="true">
              {clientStatus?.user.name.charAt(0) || "C"}
            </div>
            <span className="user-name">
              {clientStatus?.user.name || "Cuenta de ejemplo"}
            </span>
          </div>
        </div>
      </header>
      {showHelp && (
        <div
          className="help-banner page-width"
          role="region"
          aria-label="Ayuda"
        >
          <div>
            <strong>Estamos para ayudarte, paso a paso.</strong>
            <p>
              Elige una tarea o escribe a Maya. Revisa los resultados y, si vas
              a realizar una operación, verifica los datos antes de confirmar.
              Todos los movimientos de esta demo son simulados.
            </p>
          </div>
          <button
            className="icon-button"
            aria-label="Cerrar ayuda"
            onClick={() => setShowHelp(false)}
          >
            <X size={20} />
          </button>
        </div>
      )}
      <main className="page-width dashboard" id="main-content">
        <div className="dashboard-heading">
          <div>
            <p className="breadcrumb">
              <Home size={14} /> Mi banca <ChevronRight size={13} /> Inicio
            </p>
            <h1>
              Hola,{" "}
              {clientStatus?.user.name.split(" ")[0] ||
                "te damos la bienvenida"}
              .
            </h1>
            <p>Hoy es un buen día para tener tus cuentas claras.</p>
            <button
              className="mobile-maya-link"
              onClick={() => inputRef.current?.focus()}
            >
              <MessageCircle size={18} /> Escribir a Maya{" "}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="workspace-layout">
          <div className="bank-content">
            <section aria-labelledby="accounts-title">
              <div className="accounts-heading">
                <h2 id="accounts-title">Tu dinero</h2>
                <button
                  className="text-button"
                  onClick={() => setShowAmounts((value) => !value)}
                  aria-pressed={!showAmounts}
                >
                  {showAmounts ? <EyeOff size={18} /> : <Eye size={18} />}
                  {showAmounts ? "Ocultar saldos" : "Mostrar saldos"}
                </button>
              </div>
              {statusError && (
                <div className="inline-error" role="alert">
                  No pudimos actualizar tus saldos.{" "}
                  <button onClick={() => void fetchStatus()}>
                    Volver a consultar
                  </button>
                </div>
              )}
              <div className="account-grid">
                <button
                  className="account-card debit-account"
                  onClick={() => void requestScreen(tasks[0].prompt)}
                  disabled={loading}
                >
                  <div className="account-top">
                    <Wallet size={22} />
                    <span>CUENTA DE DÉBITO</span>
                    <ArrowUpRight size={20} />
                  </div>
                  <h3>
                    Enlace Digital <span>•••• 4092</span>
                  </h3>
                  <p>Dinero disponible</p>
                  <strong>
                    {formatBalance(clientStatus?.user.checkingBalance)}{" "}
                    <small>MXN</small>
                  </strong>
                  <div className="account-bottom">
                    Ver mi cuenta <ArrowRight size={17} />
                  </div>
                </button>
                <button
                  className="account-card credit-account"
                  onClick={() => void requestScreen(tasks[1].prompt)}
                  disabled={loading}
                >
                  <div className="account-top">
                    <CreditCard size={22} />
                    <span>TARJETA DE CRÉDITO</span>
                    <ArrowUpRight size={20} />
                  </div>
                  <h3>
                    {card?.cardName || "Tarjeta de crédito"}{" "}
                    <span>•••• {card?.last4 || "—"}</span>
                  </h3>
                  <p>Saldo por pagar</p>
                  <strong>
                    {formatBalance(clientStatus?.totalDebt)} <small>MXN</small>
                  </strong>
                  <div className="account-bottom">
                    Revisar mi próximo pago <ArrowRight size={17} />
                  </div>
                </button>
              </div>
            </section>
            <section
              className="operations-section"
              aria-labelledby="operations-title"
            >
              <div className="section-heading">
                <h2 id="operations-title">¿Qué necesitas hacer?</h2>
                <span>Elige una opción para empezar</span>
              </div>
              <div className="operation-grid">
                {tasks.map(({ icon: Icon, title, detail, prompt }) => (
                  <button
                    key={title}
                    disabled={loading}
                    onClick={() => void requestScreen(prompt)}
                  >
                    <span className="operation-icon">
                      <Icon size={23} strokeWidth={1.7} />
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <span>{detail}</span>
                    </div>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </div>
            </section>
            <section
              className="result-section"
              aria-labelledby="result-heading"
              aria-busy={loading}
            >
              <div className="result-heading">
                <div>
                  <span className="eyebrow">A TU MEDIDA</span>
                  <h2 id="result-heading" ref={resultTitle} tabIndex={-1}>
                    {screen
                      ? "Tu consulta, paso a paso"
                      : "Aquí comienza tu siguiente paso"}
                  </h2>
                </div>
                <span className="result-symbol" aria-hidden="true">
                  <MessageCircle size={22} />
                </span>
              </div>
              {loading && (
                <div className="loading-notice" role="status">
                  <Loader2 className="animate-spin" size={22} />
                  <div>
                    <strong>Maya está preparando tu respuesta</strong>
                    <p>
                      Esto puede tomar un momento. Mantén esta página abierta.
                    </p>
                  </div>
                </div>
              )}
              {error && (
                <div className="inline-error request-error" role="alert">
                  <p>{error}</p>
                  <button onClick={() => inputRef.current?.focus()}>
                    Escribir a Maya <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {screen ? (
                <A2UIRenderer
                  key={screen.screenId}
                  screen={screen}
                  onAction={onAction}
                  loading={loading}
                />
              ) : (
                !loading && (
                  <div className="empty-result">
                    <div className="empty-result-mark" aria-hidden="true">
                      <ReceiptText size={34} strokeWidth={1.3} />
                      <span>
                        <Check size={13} />
                      </span>
                    </div>
                    <div>
                      <h3>Lo que necesitas, explicado con claridad.</h3>
                      <p>
                        Elige una opción de arriba o cuéntale a Maya.
                        <br />
                        Aquí verás la información y los pasos para continuar.
                      </p>
                    </div>
                  </div>
                )
              )}
              {screen?.suggestedPrompts && (
                <div className="result-suggestions">
                  {screen.suggestedPrompts.map((text) => (
                    <button
                      key={text}
                      disabled={loading}
                      onClick={() => void requestScreen(text)}
                    >
                      {text}
                      <ArrowRight size={16} />
                    </button>
                  ))}
                </div>
              )}
            </section>
            <div className="bank-footnote">
              <ShieldCheck size={18} />
              <span>
                Este es un espacio de prueba. Los saldos, tasas y operaciones
                son de ejemplo.
              </span>
            </div>
          </div>
          <aside className="assistant-panel" aria-label="Conversación con Maya">
            <div className="assistant-header">
              <span className="maya-icon">
                <MessageCircle size={24} />
              </span>
              <div>
                <h2>Maya</h2>
                <p>Tu asistente Banorte</p>
              </div>
              <span className="assistant-badge">A tu lado</span>
            </div>
            <div className="assistant-intro">
              <h3>Lo vemos juntos.</h3>
              <p>
                Estoy aquí para ayudarte con tus cuentas. ¿Qué necesitas hoy?
              </p>
            </div>
            <div
              className="conversation"
              ref={conversationLog}
              role="log"
              aria-label="Mensajes con Maya"
              aria-live="polite"
            >
              {messages.length === 0 ? (
                <div className="conversation-example">
                  <p>Puedes escribir algo como:</p>
                  <button
                    disabled={loading}
                    onClick={() =>
                      void requestScreen(
                        "Quiero saber cuánto debo de mi tarjeta",
                      )
                    }
                  >
                    “Quiero saber cuánto debo de mi tarjeta”
                    <ArrowUpRight size={18} />
                  </button>
                  <span>No necesitas usar palabras complicadas.</span>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`conversation-message ${message.role}`}
                  >
                    <span>{message.role === "user" ? "Tú" : "Maya"}</span>
                    <p>{message.content}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={submit} className="composer">
              <label htmlFor="maya-message">Escribe aquí tu consulta</label>
              <textarea
                id="maya-message"
                ref={inputRef}
                value={input}
                maxLength={2000}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    if (input.trim() && !loading) {
                      void requestScreen(input.trim());
                      setInput("");
                    }
                  }
                }}
                placeholder="Por ejemplo: ¿cuánto puedo ahorrar?"
                rows={3}
              />
              <button
                className="button primary"
                disabled={loading || !input.trim()}
                type="submit"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Esperando
                    respuesta
                  </>
                ) : (
                  <>
                    Enviar a Maya <Send size={17} />
                  </>
                )}
              </button>
              <p>Evita escribir contraseñas o números de tarjeta.</p>
            </form>
            <button
              className="reset-demo"
              disabled={loading}
              onClick={() => setPendingAction({ type: "RESET", payload: {} })}
            >
              <RotateCcw size={16} /> Reiniciar demostración
            </button>
          </aside>
        </div>
      </main>
      <footer className="dashboard-footer page-width">
        <span>Banorte × Tec de Monterrey · HackMTY 2026</span>
        <button onClick={onBackToLanding} disabled={loading}>
          <ArrowLeft size={16} /> Volver a la bienvenida
        </button>
      </footer>
      <dialog
        ref={dialogRef}
        className="review-dialog"
        onCancel={() => setPendingAction(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setPendingAction(null);
        }}
        aria-labelledby="review-title"
      >
        <div className="review-dialog-inner">
          <button
            className="icon-button dialog-close"
            aria-label="Cerrar revisión"
            onClick={() => setPendingAction(null)}
          >
            <X size={20} />
          </button>
          <span className="maya-icon">
            <ShieldCheck size={26} />
          </span>
          <p className="eyebrow">UN ÚLTIMO VISTAZO</p>
          <h2 id="review-title">
            {pendingAction?.type === "RESET"
              ? "¿Reiniciar la demostración?"
              : "Revisa antes de confirmar"}
          </h2>
          <p>
            {pendingAction?.type === "RESET"
              ? "Los saldos de ejemplo volverán a su estado inicial y se borrará esta conversación."
              : "Esta operación solo se realizará con el dinero de ejemplo de la demostración."}
          </p>
          {pendingAction && pendingAction.type !== "RESET" && (
            <dl>
              <div>
                <dt>Operación</dt>
                <dd>{mutationLabels[pendingAction.type]}</dd>
              </div>
              {Object.entries(pendingAction.payload)
                .filter(
                  ([key, value]) =>
                    [
                      "recipient",
                      "amount",
                      "concept",
                      "days",
                      "planId",
                    ].includes(key) && value != null,
                )
                .map(([key, value]) => (
                  <div key={key}>
                    <dt>
                      {
                        {
                          recipient: "Para",
                          amount: "Importe",
                          concept: "Concepto",
                          days: "Plazo en días",
                          planId: "Plan",
                        }[key]
                      }
                    </dt>
                    <dd>
                      {key === "amount" ? money(Number(value)) : String(value)}
                    </dd>
                  </div>
                ))}
            </dl>
          )}
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => setPendingAction(null)}
            >
              Volver
            </button>
            <button
              className="button primary"
              onClick={() => void confirmAction()}
            >
              {pendingAction?.type === "RESET"
                ? "Sí, reiniciar"
                : "Confirmar en la demo"}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
