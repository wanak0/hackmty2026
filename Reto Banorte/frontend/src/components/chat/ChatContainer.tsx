import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Eye,
  EyeOff,
  Home,
  List,
  LoaderCircle,
  LockKeyhole,
  PiggyBank,
  Send,
  ShieldCheck,
  TrendingUp,
  Type,
  Wallet,
  X,
} from "lucide-react";
import type { A2UIScreen } from "../../types/a2ui";
import { A2UIRenderer } from "../a2ui/A2UIRenderer";
import { ScreenBoundary } from "../a2ui/ScreenBoundary";

type Status = {
  user: { name: string; checkingBalance: number };
  totalDebt: number;
  cards: { last4: string; cardName: string }[];
};
type Transaction = {
  id: string;
  concept: string;
  amount: number;
  date: string;
  type: string;
  category: string;
};
type History = { transactions: Transaction[]; totalExpenses: number };
const money = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    value,
  );
const tasks = [
  {
    id: "transfer",
    label: "Transferir dinero",
    description: "Envía a quien tú quieras",
    icon: ArrowUpRight,
    prompt: "Quiero transferir dinero",
  },
  {
    id: "expenses",
    label: "Ver mis gastos",
    description: "Conoce en qué has gastado",
    icon: List,
    prompt: "¿En qué he gastado este mes?",
  },
  {
    id: "debt",
    label: "Pagar menos intereses",
    description: "Revisa opciones para tu tarjeta",
    icon: CreditCard,
    prompt: "Quiero pagar menos intereses de mi tarjeta",
  },
  {
    id: "savings",
    label: "Hacer crecer mi ahorro",
    description: "Calcula cuánto podrías ganar",
    icon: PiggyBank,
    prompt: "Quiero simular una inversión de $10,000",
  },
];

async function request<T>(
  url: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    signal: signal ?? AbortSignal.timeout(60000),
    ...(body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  if (!response.ok)
    throw new Error("No pudimos completar tu solicitud. Inténtalo de nuevo.");
  return response.json();
}

export function ChatContainer() {
  const [status, setStatus] = useState<Status | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [screen, setScreen] = useState<A2UIScreen | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountError, setAccountError] = useState(false);
  const [active, setActive] = useState("home");
  const [hidden, setHidden] = useState(false);
  const [largeText, setLargeText] = useState(
    () => localStorage.getItem("banca-large-text") === "true",
  );
  const [lastMessage, setLastMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const helpDialog = useRef<HTMLDialogElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const homeHeading = useRef<HTMLHeadingElement>(null);
  const busy = useRef(false);
  const pending = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function refresh(signal?: AbortSignal) {
    try {
      const [account, transactions] = await Promise.all([
        request<Status>("/api/user/usr_carlos_01/status", undefined, signal),
        request<History>(
          "/api/user/usr_carlos_01/transactions",
          undefined,
          signal,
        ),
      ]);
      setStatus(account);
      setHistory(transactions);
      setAccountError(false);
    } catch {
      if (!signal?.aborted) setAccountError(true);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => {
      controller.abort();
      pending.current?.abort();
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("large-text", largeText);
    localStorage.setItem("banca-large-text", String(largeText));
  }, [largeText]);
  useEffect(() => {
    if (screen) resultHeading.current?.focus();
  }, [revision, screen]);

  async function ask(
    message: string,
    context: Record<string, unknown> = {},
    task = "assistant",
  ) {
    if (busy.current) return;
    busy.current = true;
    const controller = new AbortController();
    pending.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 60000);
    setLoading(true);
    setError("");
    setActive(task);
    setLastMessage(message);
    try {
      const result = await request<A2UIScreen>(
        "/api/chat",
        { message, context: { ...context, userId: "usr_carlos_01" } },
        controller.signal,
      );
      if (
        result.type !== "a2ui_screen" ||
        !Array.isArray(result.components) ||
        result.components.some(
          (component) =>
            !component ||
            typeof component.type !== "string" ||
            !component.props,
        )
      )
        throw new Error("invalid screen");
      setScreen(result);
      setRevision((value) => value + 1);
      setInput("");
      void refresh();
    } catch {
      setError(
        "No pudimos preparar tu respuesta. Tu solicitud no se volverá a enviar automáticamente. Si confirmaste una operación, revisa tus movimientos antes de intentarlo de nuevo.",
      );
    } finally {
      window.clearTimeout(timeout);
      busy.current = false;
      setLoading(false);
    }
  }
  function goHome() {
    if (busy.current) return;
    setActive("home");
    setScreen(null);
    setError("");
    setInput("");
    homeHeading.current?.focus();
  }
  function onAction(action: string, payload: Record<string, unknown> = {}) {
    const prompts: Record<string, string> = {
      VIEW_ACCOUNT: "Quiero ver mis saldos",
      VIEW_BALANCES: "Quiero ver mis saldos",
      SHOW_DEBT_RESTRUCTURE_OPTIONS: tasks[2].prompt,
      PAY_CARD: tasks[2].prompt,
      SHOW_INVESTMENT: tasks[3].prompt,
      VIEW_TRANSACTIONS: tasks[1].prompt,
    };
    if (action === "USER_PROMPT") {
      void ask(String(payload.text ?? ""));
      return;
    }
    if (prompts[action]) {
      void ask(prompts[action]);
      return;
    }
    void ask(
      action === "SIMULATE_INVESTMENT"
        ? "Calcular mi rendimiento"
        : "Confirmar la operación que revisé",
      { ...payload, action },
    );
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (input.trim()) void ask(input.trim());
  }
  const balance = (value?: number) =>
    hidden ? "••••••" : value === undefined ? "—" : money(value);
  const firstName = status?.user.name.split(" ")[0];

  return (
    <div className="bank-app">
      <a className="skip-link" href="#main-content">
        Ir al contenido
      </a>
      <header className="bank-header">
        <button
          className="wordmark"
          onClick={goHome}
          aria-label="Santander, ir al inicio"
          disabled={loading}
        >
          <span className="brand-logo" aria-hidden="true" />
        </button>
        <div className="header-divider" />
        <span className="header-label">Tu banca, más clara</span>
        <div className="header-actions">
          <button
            className="utility-button"
            onClick={() => setLargeText((value) => !value)}
            aria-pressed={largeText}
          >
            <Type size={21} />
            <span>Letra {largeText ? "normal" : "grande"}</span>
          </button>
          <button
            className="utility-button"
            onClick={() => helpDialog.current?.showModal()}
          >
            <CircleHelp size={21} />
            <span>Ayuda</span>
          </button>
          <div className="profile">
            <span className="avatar">{firstName ? firstName[0] : "C"}</span>
            <span>
              {firstName || "Mi perfil"}
              <small>Cuenta de demostración</small>
            </span>
          </div>
        </div>
      </header>
      <aside className="sidebar">
        <div className="sidebar-top">
          <span className="nav-caption">MI BANCA</span>
          <nav aria-label="Navegación principal">
            <button
              className={active === "home" ? "nav-item selected" : "nav-item"}
              aria-current={active === "home" ? "page" : undefined}
              onClick={goHome}
              disabled={loading}
            >
              <Home />
              Inicio
              <ChevronRight className="nav-chevron" />
            </button>
            {[
              { ...tasks[1], label: "Mis movimientos", icon: List },
              { ...tasks[0], label: "Transferencias" },
              { ...tasks[3], label: "Mi ahorro" },
              { ...tasks[2], label: "Mi tarjeta" },
            ].map((item) => (
              <button
                key={item.id}
                className={
                  active === item.id ? "nav-item selected" : "nav-item"
                }
                aria-current={active === item.id ? "page" : undefined}
                disabled={loading}
                onClick={() => void ask(item.prompt, {}, item.id)}
              >
                <item.icon />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">
              <CircleHelp />
            </span>
            <h3>Vamos paso a paso</h3>
            <p>Estamos para ayudarte a entender tu dinero.</p>
            <button onClick={() => helpDialog.current?.showModal()}>
              ¿Cómo funciona? <ArrowRight size={18} />
            </button>
          </div>
          <div className="demo-note">
            <ShieldCheck size={19} />
            <span>
              Espacio de demostración<small>No se mueve dinero real.</small>
            </span>
          </div>
        </div>
      </aside>
      <main id="main-content" className="main-content">
        <div className="page-intro">
          <div>
            <p className="eyebrow">TU DÍA A DÍA, MÁS SENCILLO</p>
            <h1 ref={homeHeading} tabIndex={-1}>
              Hola{firstName ? `, ${firstName}` : ""}
              <span className="greeting-dot">.</span>
            </h1>
            <p>Qué bueno tenerte aquí. ¿Qué necesitas hacer hoy?</p>
          </div>
          <span className="demo-badge">
            <span />
            Demo interactiva
          </span>
        </div>
        {accountError && (
          <div className="error-banner" role="alert">
            No pudimos cargar tus cuentas. Comprueba que el servidor esté
            disponible.
            <button onClick={() => void refresh()}>Volver a cargar</button>
          </div>
        )}
        <section
          className={`assistant-panel ${screen ? "has-result" : ""}`}
          aria-label="Ayuda con tu dinero"
          aria-busy={loading}
        >
          {screen ? (
            <>
              <div className="result-top">
                <button
                  className="text-button"
                  disabled={loading}
                  onClick={goHome}
                >
                  <ArrowLeft size={18} />
                  Volver a inicio
                </button>
                <span className="small-label">TE ACOMPAÑAMOS PASO A PASO</span>
              </div>
              <h2 ref={resultHeading} tabIndex={-1} className="result-title">
                Tu solicitud, más clara
              </h2>
              <p className="request-echo">{lastMessage}</p>
              <ScreenBoundary key={revision}>
                <A2UIRenderer
                  screen={screen}
                  onAction={onAction}
                  loading={loading}
                />
              </ScreenBoundary>
            </>
          ) : (
            <div className="assistant-intro">
              <div>
                <span className="section-kicker">
                  <span className="assistant-symbol">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  A TU LADO
                </span>
                <h2>
                  Tu dinero,
                  <br />
                  <span>más claro.</span>
                </h2>
                <p>
                  Dinos qué necesitas, con tus propias palabras.
                  <br className="desktop-break" /> Te ayudamos a resolverlo,
                  paso a paso.
                </p>
              </div>
              <div className="hero-note">
                <span className="note-orbit" />
                <div className="paper-note">
                  <span className="note-icon">
                    <Wallet size={23} />
                  </span>
                  <p>
                    Menos vueltas.
                    <br />
                    <strong>Más tranquilidad.</strong>
                  </p>
                  <span className="note-line" />
                  <span className="note-line short" />
                  <span className="note-check">
                    <Check size={21} />
                  </span>
                </div>
              </div>
            </div>
          )}
          <form className="ask-form" onSubmit={submit}>
            <label htmlFor="bank-request">
              {screen ? "¿Necesitas algo más?" : "¿En qué te ayudamos?"}
            </label>
            <div className="input-wrap">
              <textarea
                id="bank-request"
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Por ejemplo: quiero enviar $500 a mi mamá"
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    if (input.trim()) void ask(input.trim());
                  }
                }}
              />
              <button type="submit" disabled={loading || !input.trim()}>
                {loading ? (
                  <LoaderCircle className="spin" size={19} />
                ) : (
                  <ArrowRight size={20} />
                )}
                <span>{loading ? "Preparando" : "Continuar"}</span>
              </button>
            </div>
            <p className="input-help">
              <LockKeyhole size={14} />
              Tú decides. Revisa los detalles antes de confirmar una operación.
            </p>
          </form>
          {loading && (
            <p className="loading-status" role="status">
              <LoaderCircle size={18} className="spin" />
              Estamos preparando tu respuesta. Puede tardar unos segundos.
            </p>
          )}
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
        </section>
        {!screen && (
          <section className="quick-section" aria-labelledby="quick-heading">
            <div className="section-heading">
              <h2 id="quick-heading">También puedes empezar aquí</h2>
              <span>Tú eliges</span>
            </div>
            <div className="quick-grid">
              {tasks.map((task) => (
                <button
                  className="quick-action"
                  key={task.id}
                  disabled={loading}
                  onClick={() => void ask(task.prompt, {}, task.id)}
                >
                  <span className="task-icon">
                    <task.icon size={25} strokeWidth={1.65} />
                  </span>
                  <strong>{task.label}</strong>
                  <span>{task.description}</span>
                  <ChevronRight className="task-chevron" size={18} />
                </button>
              ))}
            </div>
          </section>
        )}
        <section
          className="accounts-section"
          aria-labelledby="accounts-heading"
        >
          <div className="section-heading">
            <h2 id="accounts-heading">Tu dinero de un vistazo</h2>
            <button
              className="text-button muted"
              onClick={() => setHidden((value) => !value)}
              aria-pressed={hidden}
            >
              {hidden ? <Eye size={18} /> : <EyeOff size={18} />}
              {hidden ? "Mostrar saldos" : "Ocultar saldos"}
            </button>
          </div>
          <div className="overview-grid">
            <article className="account-card">
              <div className="account-top">
                <span className="account-type">
                  <Wallet size={19} />
                  Cuenta de débito
                </span>
                <span className="account-digits">•••• 9921</span>
              </div>
              <p className="balance-caption">Dinero disponible</p>
              <p className="account-balance">
                {balance(status?.user.checkingBalance)}
                <span>MXN</span>
              </p>
              <div className="account-bottom">
                <span className="mini-card">
                  <span>DÉBITO</span>
                  <span>•••• 9921</span>
                </span>
                <div>
                  <strong>Para lo que necesitas hoy</strong>
                  <span>Saldo de tu cuenta de demostración</span>
                </div>
                <button
                  className="round-button"
                  disabled={loading}
                  aria-label="Ver saldo de mi cuenta de débito"
                  onClick={() => void ask("Quiero ver mis saldos")}
                >
                  <ArrowUpRight size={21} />
                </button>
              </div>
            </article>
            <article className="account-card credit-summary">
              <div className="account-top">
                <span className="account-type">
                  <CreditCard size={19} />
                  Tarjeta de crédito
                </span>
                <span className="account-digits">
                  •••• {status?.cards[0]?.last4 ?? "—"}
                </span>
              </div>
              <p className="balance-caption">Saldo pendiente por pagar</p>
              <p className="account-balance">
                {balance(status?.totalDebt)}
                <span>MXN</span>
              </p>
              <div className="credit-bottom">
                <span className="credit-message">
                  Un plan más cómodo para ti
                </span>
                <button
                  className="text-button"
                  disabled={loading}
                  onClick={() => void ask(tasks[2].prompt, {}, "debt")}
                >
                  Explorar opciones
                  <ArrowRight size={18} />
                </button>
              </div>
            </article>
          </div>
        </section>
        <section
          className="transactions-section"
          aria-labelledby="transactions-heading"
        >
          <div className="section-heading">
            <h2 id="transactions-heading">Tus últimos movimientos</h2>
            <button
              className="text-button"
              disabled={loading}
              onClick={() => void ask(tasks[1].prompt, {}, "expenses")}
            >
              Ver todos
              <ArrowRight size={17} />
            </button>
          </div>
          <div className="transaction-list">
            {history?.transactions.slice(0, 3).map((transaction) => (
              <div className="transaction-row" key={transaction.id}>
                <span className="transaction-icon">
                  {transaction.type === "INCOME" ? (
                    <ArrowDownLeft size={21} />
                  ) : (
                    <ArrowUpRight size={21} />
                  )}
                </span>
                <div className="transaction-description">
                  <strong>{transaction.concept}</strong>
                  <span>{transaction.category}</span>
                </div>
                <time dateTime={transaction.date}>
                  {new Date(`${transaction.date}T12:00:00`).toLocaleDateString(
                    "es-MX",
                    { day: "numeric", month: "short" },
                  )}
                </time>
                <strong
                  className={transaction.type === "INCOME" ? "income" : ""}
                >
                  {hidden
                    ? "••••••"
                    : `${transaction.type === "INCOME" ? "+" : "−"}${money(transaction.amount)}`}
                </strong>
              </div>
            ))}
            {!history && (
              <p className="empty-state">
                {accountError
                  ? "Movimientos no disponibles."
                  : "Cargando tus movimientos…"}
              </p>
            )}
            {history?.transactions.length === 0 && (
              <p className="empty-state">
                Todavía no hay movimientos en esta cuenta.
              </p>
            )}
          </div>
        </section>
        <div className="wellbeing-note">
          <TrendingUp size={22} />
          <p>Entender tu dinero también es cuidarte.</p>
          <button
            className="text-button"
            disabled={loading}
            onClick={() => void ask("¿Cómo está mi salud financiera?")}
          >
            Revisar mis finanzas
            <ArrowRight size={17} />
          </button>
        </div>
        <footer className="page-footer">
          <span>Hecho para entendernos.</span>
          <span>
            HackMTY 2026 · Reto Banorte × Tec
            <br />
            Concepto visual inspirado en Santander. Prototipo no oficial.
          </span>
        </footer>
      </main>
      <dialog
        ref={helpDialog}
        className="help-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) helpDialog.current?.close();
        }}
        aria-labelledby="help-title"
      >
        <button
          className="close-dialog"
          aria-label="Cerrar ayuda"
          onClick={() => helpDialog.current?.close()}
        >
          <X />
        </button>
        <span className="section-kicker">A TU RITMO</span>
        <h2 id="help-title">Aquí vamos paso a paso.</h2>
        <ol>
          <li>
            <strong>Cuéntanos qué necesitas.</strong>
            <p>
              Escribe en el recuadro o elige una de las cuatro opciones de
              inicio.
            </p>
          </li>
          <li>
            <strong>Revisa tu respuesta.</strong>
            <p>
              Podrás cambiar cantidades, elegir un plazo y revisar los detalles.
            </p>
          </li>
          <li>
            <strong>Tú tienes la última palabra.</strong>
            <p>
              Confirma únicamente cuando los datos sean correctos. Esta demo usa
              dinero ficticio.
            </p>
          </li>
        </ol>
        <p>
          Para leer con más comodidad, activa «Letra grande» en la parte
          superior. También puedes recorrer la página con Tab y activar botones
          con Enter.
        </p>
        <button
          className="primary-button"
          onClick={() => {
            helpDialog.current?.close();
            inputRef.current?.focus();
          }}
        >
          Entendido, continuar
          <Send size={17} />
        </button>
      </dialog>
    </div>
  );
}
