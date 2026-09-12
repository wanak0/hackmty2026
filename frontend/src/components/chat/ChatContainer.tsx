import React, { useState, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  ArrowLeft,
  CreditCard,
  Shield,
  Sparkles,
  Wallet,
  MessageSquare,
  ChevronDown,
  User,
  Bot
} from 'lucide-react';
import { A2UIScreen, ChatMessage } from '../../types/a2ui';
import { A2UIRenderer } from '../a2ui/A2UIRenderer';
import { BanorteLogo } from '../common/BanorteLogo';

interface ChatContainerProps {
  onBackToLanding: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ onBackToLanding }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [reasoningPhase, setReasoningPhase] = useState<number>(1);
  const [screen, setScreen] = useState<A2UIScreen | null>(null);
  const [clientStatus, setClientStatus] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Cliente resiliente: intenta primero por proxy de Vite y hace fallback directo a 127.0.0.1:3001
  const apiFetch = async (url: string, options?: RequestInit): Promise<Response> => {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      return await fetch(`http://127.0.0.1:3001${url}`, options);
    } catch (err) {
      return await fetch(`http://127.0.0.1:3001${url}`, options);
    }
  };

  // Cargar estado inicial del cliente desde el Core MCP
  const fetchStatus = async () => {
    try {
      const res = await apiFetch('/api/user/usr_carlos_01/status');
      if (res.ok) {
        const data = await res.json();
        setClientStatus(data);
      }
    } catch (e) {
      console.error('Error cargando estado del cliente', e);
    }
  };

  // Efecto para animar las etapas de razonamiento agéntico en vivo (Opción B)
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    if (loading) {
      setReasoningPhase(1);
      t1 = setTimeout(() => setReasoningPhase(2), 800);
      t2 = setTimeout(() => setReasoningPhase(3), 2200);
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  // Iniciar sesión con pantalla inicial
  const initAgent = async (initialPrompt?: string) => {
    const promptText = initialPrompt || 'Quiero pagar menos intereses de mi tarjeta';
    setLoading(true);

    const initialUserMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: Date.now()
    };
    setMessages([initialUserMsg]);

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          context: { userId: 'usr_carlos_01' },
          history: []
        })
      });
      const data: A2UIScreen = await res.json();
      setScreen(data);

      const assistantMsg: ChatMessage = {
        id: `agent_${Date.now()}`,
        role: 'assistant',
        content: data.assistantMessage || 'Pantalla generada',
        screen: data,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error al comunicarse con el backend A2UI:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    initAgent('Quiero pagar menos intereses de mi tarjeta');
  }, []);

  // Enviar mensaje del usuario con persistencia en historial (1.2)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const msg = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const historyPayload = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          context: { userId: 'usr_carlos_01' },
          history: historyPayload
        })
      });
      const data: A2UIScreen = await res.json();
      setScreen(data);

      const assistantMsg: ChatMessage = {
        id: `agent_${Date.now()}`,
        role: 'assistant',
        content: data.assistantMessage || 'Pantalla generada',
        screen: data,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMsg]);
      fetchStatus();
    } catch (error) {
      console.error('Error procesando mensaje:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar acción viva disparada desde los componentes A2UI (reactividad evento a evento 3.2)
  const handleA2UIAction = async (actionType: string, payload?: any) => {
    if (actionType === 'USER_PROMPT') {
      setInputMessage(payload.text);
      setLoading(true);

      const userMsg: ChatMessage = {
        id: `usr_${Date.now()}`,
        role: 'user',
        content: payload.text,
        timestamp: Date.now()
      };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);

      try {
        const historyPayload = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content
        }));

        const res = await apiFetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: payload.text,
            context: { userId: 'usr_carlos_01' },
            history: historyPayload
          })
        });
        const data: A2UIScreen = await res.json();
        setScreen(data);

        const assistantMsg: ChatMessage = {
          id: `agent_${Date.now()}`,
          role: 'assistant',
          content: data.assistantMessage || 'Pantalla generada',
          screen: data,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setInputMessage('');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (actionType === 'VIEW_ACCOUNT' || actionType === 'VIEW_BALANCES') {
      handleA2UIAction('USER_PROMPT', { text: 'Quiero ver mis saldos actuales' });
      fetchStatus();
      return;
    }

    if (actionType === 'SHOW_DEBT_RESTRUCTURE_OPTIONS' || actionType === 'PAY_CARD') {
      handleA2UIAction('USER_PROMPT', { text: 'Quiero pagar menos intereses de mi tarjeta' });
      fetchStatus();
      return;
    }

    if (actionType === 'SHOW_INVESTMENT') {
      handleA2UIAction('USER_PROMPT', { text: 'Quiero simular una inversión en pagaré' });
      return;
    }

    if (actionType === 'VIEW_TRANSACTIONS') {
      handleA2UIAction('USER_PROMPT', { text: '¿En qué he gastado este mes?' });
      return;
    }

    // Acción viva de aplicar reestructuración, inversión o transferencia
    setLoading(true);
    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Acción interactiva ejecutada: ${actionType}`,
          context: {
            action: actionType,
            ...payload,
            userId: 'usr_carlos_01'
          },
          history: historyPayload
        })
      });
      const data = await res.json();
      setScreen(data);

      const assistantMsg: ChatMessage = {
        id: `agent_${Date.now()}`,
        role: 'assistant',
        content: data.assistantMessage || 'Operación bancaria procesada',
        screen: data,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMsg]);
      fetchStatus();
    } catch (error) {
      console.error('Error aplicando acción A2UI:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reiniciar la base de datos para la demo
  const handleReset = async () => {
    try {
      await apiFetch('/api/reset', { method: 'POST' });
      setMessages([]);
      fetchStatus();
      initAgent('Quiero pagar menos intereses de mi tarjeta');
    } catch (e) {
      console.error('Error reseteando demo:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F8] text-[#1E242D] flex flex-col selection:bg-[#EB0029] selection:text-white">
      {/* Topbar Oficial Banorte (Rojo Oficial / Blanco) */}
      <header className="bg-[#EB0029] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBackToLanding}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Landing</span>
            </button>

            <div className="flex items-center gap-3">
              <BanorteLogo size="sm" variant="white" />
              <span className="text-white/40 text-xs hidden sm:inline">|</span>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Token Activo · MCP Core</span>
              </div>
            </div>
          </div>

          {/* Info del Cliente & Sesión */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/15 border border-white/20 px-3 py-1.5 rounded-xl text-xs">
              <div className="w-6 h-6 rounded-full bg-white text-[#EB0029] font-black text-xs flex items-center justify-center">
                C
              </div>
              <div className="hidden sm:block text-left text-white">
                <div className="font-bold leading-tight">Carlos Mendoza</div>
              </div>
            </div>

            <button
              onClick={handleReset}
              title="Reiniciar datos de demo a valores iniciales"
              className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reiniciar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="w-full flex-1 flex flex-col">
          {/* Resumen Superior de Cuentas Banorte (Decisión 1.1: Conservado activo con MCP) */}
          <section className="bg-white border-b border-gray-200 py-4 px-4 sm:px-6 shadow-xs">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                      ¡Hola, Carlos! 👋
                    </h1>
                    <span className="text-[10px] bg-[#FFF0F2] text-[#EB0029] border border-[#FECDD3] px-2 py-0.5 rounded-full font-bold uppercase">
                      Banca Móvil Banorte · Protocolo A2UI
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 font-medium">
                  Core Bancario conectado vía <span className="font-bold text-gray-700">MCP SDK</span>
                </div>
              </div>

              {/* Cards de Cuentas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Tarjeta de Crédito */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFFBF0] via-white to-white border border-amber-300 shadow-xs">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                          Tarjeta de Crédito
                        </span>
                        <span className="text-xs font-black text-gray-900">Banorte Por Ti Oro (•••• 4821)</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-[#EB0029]">
                      REVOLVENTE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold block">Deuda Actual</span>
                      <div className="text-lg font-black text-[#EB0029]">
                        ${clientStatus?.totalDebt?.toLocaleString('es-MX') || '18,400'}{' '}
                        <span className="text-xs font-normal text-gray-500">MXN</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold block">Límite de Crédito</span>
                      <div className="text-lg font-bold text-gray-800">
                        $35,000 <span className="text-xs font-normal text-gray-500">MXN</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cuenta Débito */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-white to-white border border-emerald-300 shadow-xs">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                          Cuenta de Débito
                        </span>
                        <span className="text-xs font-black text-gray-900">Cuenta Enlace Digital (•••• 4092)</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      ACTIVA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold block">Saldo Disponible</span>
                      <div className="text-lg font-black text-emerald-700">
                        ${clientStatus?.checkingBalance?.toLocaleString('es-MX') || '14,500'}{' '}
                        <span className="text-xs font-normal text-gray-500">MXN</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold block">CLABE</span>
                      <div className="text-xs font-mono font-bold text-gray-700 mt-1">
                        072580012345678901
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Área Principal de Trabajo A2UI: Lienzo Reactivo */}
          <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col justify-between">
            {/* Historial Conversacional Desplegable (Requisito 1.2) */}
            {messages.length > 1 && (
              <div className="mb-4">
                <details className="group bg-white border border-gray-200 rounded-2xl p-3.5 text-xs text-gray-700 shadow-xs transition-all">
                  <summary className="font-bold flex items-center justify-between select-none list-none cursor-pointer">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#EB0029]" />
                      <span>Historial de conversación ({messages.length} mensajes)</span>
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-3 space-y-2 pt-2 border-t border-gray-100 max-h-52 overflow-y-auto pr-1">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                          m.role === 'user'
                            ? 'bg-[#FFF0F2] text-[#EB0029] ml-8 border border-[#FECDD3] font-semibold'
                            : 'bg-gray-50 text-gray-800 mr-8 border border-gray-200'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {m.role === 'user' ? (
                            <User className="w-3.5 h-3.5" />
                          ) : (
                            <Bot className="w-3.5 h-3.5 text-[#EB0029]" />
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase block opacity-70 mb-0.5">
                            {m.role === 'user' ? 'Carlos Mendoza' : 'Maya Banorte'}
                          </span>
                          <span className="leading-relaxed">{m.content}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {/* Indicador de Razonamiento Agéntico en Vivo (Opción B: Sin skeletons estáticos) */}
            {loading && (
              <div className="mb-4 p-4 rounded-2xl bg-white border border-[#FECDD3] shadow-sm flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF0F2] flex items-center justify-center text-[#EB0029]">
                    <Sparkles className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black tracking-wider text-[#EB0029]">
                        Razonamiento Agéntico en Vivo
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EB0029] animate-ping" />
                    </div>
                    <div className="text-xs font-bold text-gray-900 mt-0.5">
                      {reasoningPhase === 1 && 'Paso 1: Consultando Core Bancario Banorte (MCP Tools)...'}
                      {reasoningPhase === 2 && 'Paso 2: Razonando intención y diseñando pantalla con Gemma 4:31b (Ollama Cloud)...'}
                      {reasoningPhase >= 3 && 'Paso 3: Ensamblando componentes interactivos en el lienzo...'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      reasoningPhase >= 1 ? 'bg-[#EB0029]' : 'bg-gray-200'
                    }`}
                  />
                  <span
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      reasoningPhase >= 2 ? 'bg-[#EB0029]' : 'bg-gray-200'
                    }`}
                  />
                  <span
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      reasoningPhase >= 3 ? 'bg-[#EB0029]' : 'bg-gray-200'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Renderizado de Pantalla Dinámica A2UI Puro */}
            <div className="flex-1 flex flex-col justify-center">
              {screen && (
                <A2UIRenderer
                  screen={screen}
                  onAction={handleA2UIAction}
                  loading={loading}
                />
              )}
            </div>

            {/* Input Bar para el usuario en modo claro */}
            <div className="mt-6 pt-3 border-t border-gray-200 sticky bottom-2 bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-xs">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Habla con Maya Banorte (ej: 'Quiero pagar menos intereses de mi tarjeta')..."
                  className="w-full bg-[#F4F5F7] border border-gray-300 focus:border-[#EB0029] focus:bg-white focus:ring-2 focus:ring-[#EB0029]/20 rounded-xl px-4 py-3.5 pr-14 text-sm text-gray-900 placeholder-gray-500 outline-none transition-all shadow-xs font-medium"
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="absolute right-2 p-2.5 rounded-lg bg-[#EB0029] hover:bg-[#D40024] text-white disabled:opacity-40 transition-all shadow-xs active:scale-95"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>

              <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2 px-1 font-medium">
                <span className="flex items-center gap-1 text-gray-600">
                  <Shield className="w-3 h-3 text-[#EB0029]" />
                  <span>Ollama Cloud (`gemma4:31b`) · Core Bancario Banorte (MCP)</span>
                </span>
                <span className="font-semibold text-gray-700">Protocolo A2UI Puro</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

