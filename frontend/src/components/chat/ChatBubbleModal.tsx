import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Minus,
  Send,
  Sparkles,
  Bot,
  Shield,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { ChatMessage } from '../../types/a2ui';

interface ChatBubbleModalProps {
  messages: ChatMessage[];
  loading: boolean;
  reasoningPhase: number;
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  hasGeneratedScreen?: boolean;
  suggestedPrompts?: string[];
}

const DEFAULT_QUICK_PROMPTS = [
  { label: '💳 Pagar menos intereses', text: 'Quiero pagar menos intereses de mi tarjeta' },
  { label: '📈 Simular inversión', text: 'Quiero simular una inversión en pagaré a 90 días' },
  { label: '💰 Ver saldos actuales', text: 'Quiero ver mis saldos actuales' },
  { label: '📊 Gastos del mes', text: '¿En qué he gastado este mes?' }
];

export const ChatBubbleModal: React.FC<ChatBubbleModalProps> = ({
  messages,
  loading,
  reasoningPhase,
  onSendMessage,
  isOpen,
  onToggle,
  onClose,
  hasGeneratedScreen = false,
  suggestedPrompts
}) => {
  const [inputText, setInputText] = useState('');
  const [showTooltip, setShowTooltip] = useState(true);
  const [showCanvasNotice, setShowCanvasNotice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll al último mensaje
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Enfocar el input cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Notificación de pantalla dibujada
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
    setInputText('');
  };

  const handlePromptClick = (text: string) => {
    if (loading) return;
    onSendMessage(text);
  };

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  const chatChips =
    suggestedPrompts && suggestedPrompts.length > 0
      ? suggestedPrompts.map((text) => ({
          label: text.length > 36 ? `${text.slice(0, 34)}…` : text,
          text
        }))
      : DEFAULT_QUICK_PROMPTS;

  return (
    <aside aria-label="Asistente Virtual Maya Banorte">
      {/* 1. MODAL / VENTANA DEL CHAT */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="maya-chat-title"
          className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[82vh] h-[600px] z-50 flex flex-col bg-white rounded-xl shadow-2xl border border-[#E6E6E6] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="bg-[#E30613] text-white p-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white border-2 border-[#E30613] rounded-full" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 id="maya-chat-title" className="font-semibold text-sm tracking-tight text-white font-display">Maya Banorte</h3>
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-white">
                    IA A2UI
                  </span>
                </div>
                <p className="text-[11px] text-white/80 font-medium flex items-center gap-1">
                  <span>Asistente Financiero Activo</span>
                  <span>·</span>
                  <span className="text-emerald-200 font-bold">MCP Core</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onToggle}
                title="Minimizar a burbuja"
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                title="Cerrar modal"
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner indicador de sincronización con la pantalla principal */}
          <div className="bg-[#FFF0F1] border-b border-[#F3C5C8] px-3.5 py-2 flex items-center justify-between text-xs text-[#E30613] font-semibold shrink-0">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px]">Las vistas se dibujan en la <strong>pantalla principal</strong></span>
            </div>
            <button
              onClick={onToggle}
              className="text-[10px] uppercase font-black underline hover:text-[#C10510] flex items-center gap-0.5"
            >
              <span>Ver Lienzo</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Historial de conversación */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8F9FB]">
            {messages.length === 0 && !loading && (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center px-4 py-8">
                <div className="w-12 h-12 rounded-full bg-[#FFF0F1] text-[#E30613] flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[#1A1A1A] mb-1 font-display">¿En qué te ayudo?</p>
                <p className="text-[11px] text-gray-500 font-medium max-w-[240px]">
                  Elige una sugerencia abajo o escribe tu petición. Maya dibujará la interfaz en el lienzo.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#E30613] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                    m.role === 'user'
                      ? 'bg-[#E30613] text-white font-medium rounded-tr-sm'
                      : 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 opacity-75 text-[10px] font-bold uppercase">
                    <span>{m.role === 'user' ? 'Tú' : 'Maya Banorte'}</span>
                    <span>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>{m.content}</div>

                  {m.screen && (
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-2 text-[10px] font-semibold text-[#E30613]">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Vista generada en lienzo</span>
                      </span>
                      <button
                        onClick={onToggle}
                        className="underline hover:text-[#C10510] cursor-pointer"
                      >
                        Ver en grande
                      </button>
                    </div>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 mt-0.5 font-black text-[11px]">
                    C
                  </div>
                )}
              </div>
            ))}

            {/* Razonamiento Agéntico en Vivo */}
            {loading && (
              <div className="p-3.5 rounded-xl bg-white border border-[#F3C5C8] text-xs space-y-2 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#E30613] font-semibold text-[11px] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Maya está razonando...</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#E30613] animate-ping" />
                </div>

                <p className="text-[11px] text-gray-700 font-medium">
                  {reasoningPhase === 1 && '1. Extrayendo contexto de cuentas vía MCP Core...'}
                  {reasoningPhase === 2 && '2. Diseñando interfaz dinámica con Ollama Cloud...'}
                  {reasoningPhase >= 3 && '3. Dibujando componentes interactivos en tu pantalla...'}
                </p>

                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E30613] transition-all duration-300 rounded-full"
                    style={{
                      width: reasoningPhase === 1 ? '33%' : reasoningPhase === 2 ? '66%' : '90%'
                    }}
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias solo en el chat (dinámicas desde A2UI) */}
          <div className="px-3 pt-2 pb-1 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar">
            {chatChips.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(prompt.text)}
                disabled={loading}
                className="shrink-0 text-[11px] font-semibold bg-[#FAFAFA] hover:bg-[#FFF0F1] text-[#1A1A1A] hover:text-[#E30613] border border-[#E6E6E6] hover:border-[#F3C5C8] px-2.5 py-1 rounded-full transition-colors disabled:opacity-40"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Formulario de Entrada */}
          <div className="p-3 bg-white border-t border-gray-200">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe una instrucción a Maya..."
                disabled={loading}
                className="w-full bg-[#F5F5F5] border border-[#E6E6E6] focus:border-[#E30613] focus:bg-white focus:ring-1 focus:ring-[#E30613]/20 rounded-full px-3.5 py-2.5 pr-12 text-xs text-[#1A1A1A] placeholder-[#6B6B6B] outline-none"
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="absolute right-1.5 p-2 rounded-full bg-[#E30613] hover:bg-[#C10510] text-white disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[9px] text-gray-400 mt-2 px-1 font-medium">
              <span className="flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-[#E30613]" />
                <span>Ollama · NLP + A2UI</span>
              </span>
              <span>Lienzo A2UI Activo</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. BURBUJA FLOTANTE LLAMATIVA CON ANIMACIONES (FAB) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Tooltip flotante interactivo cuando el modal está cerrado */}
        {!isOpen && showTooltip && (
          <div
            onClick={onToggle}
            className="hidden sm:flex items-center gap-2.5 bg-white text-[#1A1A1A] px-3.5 py-2.5 rounded-xl shadow-xl border border-[#E6E6E6] cursor-pointer hover:border-[#E30613] transition-all group animate-in fade-in slide-in-from-right-4 duration-300 max-w-xs"
          >
            <div className="w-6 h-6 rounded-full bg-[#FFF0F1] text-[#E30613] flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-[#1A1A1A] group-hover:text-[#E30613] transition-colors flex items-center gap-1">
                <span>Maya Banorte</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-gray-500 truncate max-w-[180px]">
                {lastAssistantMessage?.content || 'Chatea y diseña en tu pantalla'}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="text-gray-400 hover:text-gray-600 ml-1 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Notificación de pantalla dibujada */}
        {!isOpen && showCanvasNotice && (
          <div className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 rounded-full shadow-lg text-xs font-bold animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            <span>¡Pantalla dibujada en el lienzo!</span>
          </div>
        )}

        {/* Botón Burbuja Principal */}
        <div className="relative">
          {/* Ondas expansivas de radar (Halo llamativo) */}
          <span className="absolute -inset-2 rounded-full animate-banorte-halo pointer-events-none" />

          <button
            onClick={onToggle}
            aria-label={isOpen ? 'Cerrar asistente Maya' : 'Abrir asistente Maya Banorte'}
            className={`relative group w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-banorte-gradient text-white flex items-center justify-center banorte-bubble-glow transition-all duration-300 transform active:scale-90 hover:scale-105 ${
              isOpen ? 'rotate-90 bg-gray-800' : 'animate-banorte-float'
            }`}
          >
            {/* Efecto de destello de luz sobre la esfera */}
            <span className="absolute inset-0 rounded-full animate-shimmer-fast pointer-events-none opacity-40 overflow-hidden" />

            {isOpen ? (
              <X className="w-6 h-6 stroke-[2.5] text-white" />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <MessageSquare className="w-6 h-6 stroke-[2.2] group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black tracking-tighter uppercase mt-0.5">MAYA</span>
              </div>
            )}

            {/* Badge de mensajes / estado en la esquina de la burbuja */}
            {!isOpen && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[#E30613] border-2 border-[#E30613] text-[10px] font-semibold flex items-center justify-center shadow-md">
                {messages.length > 0 ? messages.length : '1'}
              </span>
            )}

            {/* Pulso verde de estado en vivo */}
            {!isOpen && (
              <span className="absolute bottom-0 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-xs animate-ping" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
