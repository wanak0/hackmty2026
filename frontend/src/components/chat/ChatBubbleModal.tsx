import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Minus,
  Send,
  Sparkles,
  Bot,
  Shield,
  Layers,
  ArrowUpRight,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { ChatMessage } from "../../types/a2ui";

export interface ChatTask {
  icon: LucideIcon;
  title: string;
  detail: string;
  prompt: string;
}

interface ChatBubbleModalProps {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  hasGeneratedScreen?: boolean;
  suggestedPrompts?: string[];
  tasks: ChatTask[];
  onResetDemo?: () => void;
}

const DEFAULT_QUICK_PROMPTS = [
  {
    label: "Pagar menos intereses",
    text: "Quiero pagar menos intereses de mi tarjeta",
  },
  {
    label: "Simular inversión",
    text: "Quiero simular una inversión en pagaré a 90 días",
  },
  { label: "Ver saldos", text: "Quiero ver mis saldos actuales" },
  { label: "Gastos del mes", text: "¿En qué he gastado este mes?" },
];

export const ChatBubbleModal: React.FC<ChatBubbleModalProps> = ({
  messages,
  loading,
  onSendMessage,
  isOpen,
  onToggle,
  onClose,
  hasGeneratedScreen = false,
  suggestedPrompts,
  tasks,
  onResetDemo,
}) => {
  const [inputText, setInputText] = useState("");
  const [showTooltip, setShowTooltip] = useState(true);
  const [showCanvasNotice, setShowCanvasNotice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (hasGeneratedScreen && messages.length > 1) {
      setShowCanvasNotice(true);
      const timer = setTimeout(() => setShowCanvasNotice(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [hasGeneratedScreen, messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handlePromptClick = (text: string) => {
    if (loading) return;
    onSendMessage(text);
  };

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  const chatChips =
    suggestedPrompts && suggestedPrompts.length > 0
      ? suggestedPrompts.map((text) => ({
          label: text.length > 36 ? `${text.slice(0, 34)}…` : text,
          text,
        }))
      : DEFAULT_QUICK_PROMPTS;

  return (
    <aside aria-label="Asistente Virtual Maya Banorte">
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="maya-chat-title"
          className="maya-chat-modal fixed bottom-24 right-4 sm:right-6 z-50 flex w-[calc(100vw-2rem)] sm:w-[420px] max-h-[82vh] h-[640px] flex-col overflow-hidden rounded-xl border border-[#E6E6E6] bg-white shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between bg-[#EB0029] p-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#EB0029] bg-white" />
              </div>
              <div>
                <h3
                  id="maya-chat-title"
                  className="text-sm font-semibold tracking-tight text-white"
                >
                  Maya
                </h3>
                <p className="text-[11px] font-medium text-white/85">
                  Tu asistente Banorte
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onToggle}
                title="Minimizar a burbuja"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/90 hover:bg-white/20"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                title="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/90 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between border-b border-[#F3C5C8] bg-[#FFF0F1] px-3.5 py-2 text-xs font-semibold text-[#EB0029]">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px]">
                Las vistas se muestran en la pantalla principal
              </span>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="flex items-center gap-0.5 text-[10px] font-black uppercase underline"
            >
              Ver lienzo
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#F8F9FB] p-4">
            <section
              className="maya-task-panel rounded-xl border border-[#E6E6E6] bg-white p-3"
              aria-labelledby="maya-tasks-title"
            >
              <div className="mb-2.5">
                <h4
                  id="maya-tasks-title"
                  className="text-sm font-semibold text-[#323E48]"
                >
                  ¿Qué necesitas hacer?
                </h4>
                <p className="text-[11px] text-[#606B73]">
                  Elige una opción para empezar
                </p>
              </div>
              <div className="maya-task-grid flex flex-col gap-1.5">
                {tasks.map(({ icon: Icon, title, detail, prompt }) => (
                  <button
                    key={title}
                    type="button"
                    disabled={loading}
                    onClick={() => handlePromptClick(prompt)}
                    className="flex items-center gap-2.5 rounded-lg border border-[#E6E6E6] bg-[#FAFAFA] px-2.5 py-2 text-left transition-colors hover:border-[#F3C5C8] hover:bg-[#FFF0F1] disabled:opacity-40"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF0F1] text-[#EB0029]">
                      <Icon size={18} strokeWidth={1.7} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-xs font-semibold text-[#323E48]">
                        {title}
                      </strong>
                      <span className="block truncate text-[10px] text-[#606B73]">
                        {detail}
                      </span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-[#606B73]" />
                  </button>
                ))}
              </div>
            </section>

            {messages.length === 0 && !loading && (
              <div className="flex min-h-[120px] flex-col items-center justify-center px-4 py-4 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F1] text-[#EB0029]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="mb-1 text-sm font-semibold text-[#1A1A1A]">
                  ¿En qué te ayudo?
                </p>
                <p className="max-w-[240px] text-[11px] font-medium text-gray-500">
                  Elige una tarea arriba o escribe tu petición. Maya dibuja la
                  interfaz en el lienzo.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EB0029] text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                    m.role === "user"
                      ? "rounded-tr-sm bg-[#EB0029] font-medium text-white"
                      : "rounded-tl-sm border border-gray-200/80 bg-white text-gray-800"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold uppercase opacity-75">
                    <span>{m.role === "user" ? "Tú" : "Maya"}</span>
                    <span>
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div>{m.content}</div>
                  {m.surface && (
                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-[10px] font-semibold text-[#EB0029]">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Vista en el lienzo
                      </span>
                      <button
                        type="button"
                        onClick={onToggle}
                        className="underline"
                      >
                        Ver en grande
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="space-y-2 rounded-xl border border-[#F3C5C8] bg-white p-3.5 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#EB0029]">
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  Maya está preparando tu respuesta…
                </div>
                <p className="text-[11px] font-medium text-gray-700">
                  Esto puede tomar un momento. El resultado aparecerá en el
                  lienzo.
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-gray-100 bg-white px-3 pb-1 pt-2">
            {chatChips.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(prompt.text)}
                disabled={loading}
                className="shrink-0 rounded-full border border-[#E6E6E6] bg-[#FAFAFA] px-2.5 py-1 text-[11px] font-semibold text-[#1A1A1A] hover:border-[#F3C5C8] hover:bg-[#FFF0F1] hover:text-[#EB0029] disabled:opacity-40"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 bg-white p-3">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center"
            >
              <label htmlFor="maya-bubble-input" className="sr-only">
                Escribe aquí tu consulta
              </label>
              <input
                id="maya-bubble-input"
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe una consulta a Maya…"
                disabled={loading}
                maxLength={2000}
                className="w-full rounded-full border border-[#E6E6E6] bg-[#F5F5F5] px-3.5 py-2.5 pr-12 text-xs text-[#1A1A1A] outline-none placeholder:text-[#6B6B6B] focus:border-[#EB0029] focus:bg-white focus:ring-1 focus:ring-[#EB0029]/20"
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="absolute right-1.5 rounded-full bg-[#EB0029] p-2 text-white hover:bg-[#8F0017] disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between px-1 text-[9px] font-medium text-gray-400">
              <span className="flex items-center gap-1">
                <Shield className="h-2.5 w-2.5 text-[#EB0029]" />
                Demo · no uses datos reales
              </span>
              {onResetDemo && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={onResetDemo}
                  className="underline hover:text-[#EB0029] disabled:opacity-40"
                >
                  Reiniciar demo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && showTooltip && (
          <button
            type="button"
            onClick={onToggle}
            className="hidden max-w-xs cursor-pointer items-center gap-2.5 rounded-xl border border-[#E6E6E6] bg-white px-3.5 py-2.5 text-left shadow-xl transition-all hover:border-[#EB0029] sm:flex"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF0F1] text-[#EB0029]">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#1A1A1A]">
                <span>Maya Banorte</span>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              </div>
              <p className="max-w-[180px] truncate text-[10px] text-gray-500">
                {lastAssistantMessage?.content ||
                  "Abre el chat y elige qué necesitas"}
              </p>
            </div>
            <span
              role="presentation"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="ml-1 p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        )}

        {!isOpen && showCanvasNotice && (
          <div className="flex animate-bounce items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
            <Sparkles className="h-3.5 w-3.5" />
            <span>¡Vista lista en el lienzo!</span>
          </div>
        )}

        <div className="relative">
          <span className="pointer-events-none absolute -inset-2 animate-banorte-halo rounded-full" />
          <button
            type="button"
            onClick={onToggle}
            aria-label={
              isOpen ? "Cerrar asistente Maya" : "Abrir asistente Maya Banorte"
            }
            className={`banorte-bubble-glow relative flex h-14 w-14 transform items-center justify-center rounded-full bg-banorte-gradient text-white transition-all duration-300 hover:scale-105 active:scale-90 sm:h-16 sm:w-16 ${
              isOpen ? "rotate-90 bg-gray-800" : "animate-banorte-float"
            }`}
          >
            {isOpen ? (
              <X className="h-6 w-6 stroke-[2.5] text-white" />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <MessageSquare className="h-6 w-6 stroke-[2.2]" />
                <span className="mt-0.5 text-[9px] font-black uppercase tracking-tighter">
                  MAYA
                </span>
              </div>
            )}
            {!isOpen && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#EB0029] bg-white text-[10px] font-semibold text-[#EB0029] shadow-md">
                {messages.length > 0 ? messages.length : "!"}
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
