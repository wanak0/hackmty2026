import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  ArrowLeft,
  CreditCard,
  Shield,
  Sparkles,
  Wallet,
  MessageSquare,
  Layers
} from 'lucide-react';
import { A2UIScreen, ChatMessage } from '../../types/a2ui';
import { A2UIRenderer } from '../a2ui/A2UIRenderer';
import { BanorteLogo } from '../common/BanorteLogo';
import { ChatBubbleModal } from './ChatBubbleModal';

interface ChatContainerProps {
  onBackToLanding: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ onBackToLanding }) => {
  const [loading, setLoading] = useState(false);
  const [reasoningPhase, setReasoningPhase] = useState<number>(1);
  const [screen, setScreen] = useState<A2UIScreen | null>(null);
  const [clientStatus, setClientStatus] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const showToast = (type: 'error' | 'success', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4500);
  };

  const apiFetch = async (url: string, options?: RequestInit): Promise<Response> => {
    try {
      const res = await fetch(url, options);
      if (res.ok || options?.signal?.aborted) return res;
      return await fetch(`http://127.0.0.1:3001${url}`, options);
    } catch (err: any) {
      if (err?.name === 'AbortError' || options?.signal?.aborted) throw err;
      return await fetch(`http://127.0.0.1:3001${url}`, options);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await apiFetch('/api/user/usr_carlos_01/status');
      if (res.ok) {
        const data = await res.json();
        setClientStatus(data);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error('Error cargando estado del cliente', e);
      showToast('error', 'No se pudo cargar el estado bancario. ¿Está el backend en :3001?');
    }
  };

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

  useEffect(() => {
    fetchStatus();
    // Inicio limpio: sin mensaje default; el usuario elige una sugerencia
    setIsChatModalOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (msg: string) => {
    if (!msg.trim() || loading) return;

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
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: A2UIScreen = await res.json();
      if (!data?.components && (data as any)?.error) {
        throw new Error((data as any).error);
      }
      setScreen(data);

      const assistantMsg: ChatMessage = {
        id: `agent_${Date.now()}`,
        role: 'assistant',
        content: data.assistantMessage || 'Pantalla generada en el lienzo',
        screen: data,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMsg]);
      await fetchStatus();
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      showToast('error', 'Falló la comunicación con Maya. Intenta de nuevo o reinicia la demo.');
    } finally {
      setLoading(false);
    }
  };

  const handleA2UIAction = async (actionType: string, payload?: any) => {
    if (actionType === 'USER_PROMPT') {
      await handleSendMessage(payload.text);
      return;
    }

    if (actionType === 'VIEW_ACCOUNT' || actionType === 'VIEW_BALANCES') {
      await handleSendMessage('Quiero ver mis saldos actuales');
      return;
    }

    if (actionType === 'SHOW_DEBT_RESTRUCTURE_OPTIONS') {
      await handleSendMessage('Quiero pagar menos intereses de mi tarjeta');
      return;
    }

    if (actionType === 'SHOW_INVESTMENT') {
      await handleSendMessage('Quiero simular una inversión en pagaré');
      return;
    }

    if (actionType === 'VIEW_TRANSACTIONS') {
      await handleSendMessage('¿En qué he gastado este mes?');
      return;
    }

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
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data?.components && data?.error) {
        throw new Error(data.error);
      }
      setScreen(data);

      const assistantMsg: ChatMessage = {
        id: `agent_${Date.now()}`,
        role: 'assistant',
        content: data.assistantMessage || 'Operación bancaria procesada',
        screen: data,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMsg]);
      await fetchStatus();
      if (data.screenId?.includes('success') || data.components?.some((c: any) => c.type === 'ConfirmationCard')) {
        showToast('success', 'Operación aplicada en el core bancario (MCP).');
      }
    } catch (error) {
      console.error('Error aplicando acción A2UI:', error);
      showToast('error', 'No se pudo aplicar la acción bancaria. Revisa el backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      const res = await apiFetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('reset failed');
      setMessages([]);
      setScreen(null);
      await fetchStatus();
      setIsChatModalOpen(true);
      showToast('success', 'Demo reiniciada. Elige una sugerencia para empezar.');
    } catch (e) {
      console.error('Error reseteando demo:', e);
      showToast('error', 'No se pudo reiniciar la demo.');
    }
  };

  const checkingBalance =
    clientStatus?.user?.checkingBalance ?? clientStatus?.checkingBalance ?? 14500;

  const chatSuggestions =
    screen?.suggestedPrompts && screen.suggestedPrompts.length > 0
      ? screen.suggestedPrompts
      : undefined;

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] flex flex-col selection:bg-[#E30613] selection:text-white">
      {toast && (
        <div
          role="status"
          className={`fixed top-20 right-4 z-50 max-w-sm px-4 py-3 rounded-2xl shadow-lg text-xs font-bold border ${
            toast.type === 'error'
              ? 'bg-white border-red-200 text-red-700'
              : 'bg-white border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.message}
        </div>
      )}
      {/* Topbar Oficial Banorte */}
      <header className="bg-[#E30613] text-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToLanding}
              className="w-9 h-9 rounded-full hover:bg-white/15 text-white transition-colors flex items-center justify-center"
              title="Regresar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <BanorteLogo size="sm" variant="white" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsChatModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all"
              title="Abrir chat con Maya"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Maya</span>
            </button>

            <div className="flex items-center gap-2 px-2 py-1 text-xs">
              <div className="w-7 h-7 rounded-full bg-white text-[#E30613] font-semibold text-xs flex items-center justify-center">
                C
              </div>
              <div className="hidden sm:block text-left text-white">
                <div className="font-semibold leading-tight">Carlos Mendoza</div>
              </div>
            </div>

            <button
              onClick={handleReset}
              title="Reiniciar datos de demo a valores iniciales"
              className="w-9 h-9 rounded-full hover:bg-white/15 text-white flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col pb-24">
        {/* Resumen Superior de Cuentas Banorte */}
        <section className="bg-white border-b border-[#E6E6E6]">
          <div className="max-w-6xl mx-auto">
            <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
              <h1 className="text-base font-semibold text-[#1A1A1A] font-display">
                Hola, Carlos
              </h1>
              <span className="text-[11px] text-[#6B6B6B] font-medium">Banorte Móvil</span>
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-[#F0F0F0] hover:bg-[#FAFAFA] text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#FFF0F1] text-[#E30613] flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1A1A1A]">Banorte Por Ti Oro ···· 4821</div>
                  <div className="text-[11px] text-[#6B6B6B]">
                    Deuda ${clientStatus?.totalDebt?.toLocaleString('es-MX') || '18,400'} MXN
                  </div>
                </div>
              </div>
              <span className="text-[#E30613] text-lg leading-none">›</span>
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-[#F0F0F0] hover:bg-[#FAFAFA] text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#F5F5F5] text-[#1A1A1A] flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1A1A1A]">Enlace Digital ···· 4092</div>
                  <div className="text-[11px] text-[#6B6B6B]">
                    Disponible ${Number(checkingBalance).toLocaleString('es-MX')} MXN
                  </div>
                </div>
              </div>
              <span className="text-[#E30613] text-lg leading-none">›</span>
            </button>
          </div>
        </section>

        {/* ======================================================== */}
        {/* EL LIENZO PRINCIPAL A2UI: DONDE SE DIBUJA LO QUE GENERA  */}
        {/* ======================================================== */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
          {/* Barra de Encabezado del Lienzo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-banorte-gradient text-white flex items-center justify-center shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[#1A1A1A] tracking-tight flex items-center gap-2 font-display">
                  <span>Lienzo Generativo A2UI</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    En Vivo
                  </span>
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Las pantallas dinámicas diseñadas por Maya Banorte se renderizan en este espacio central.
                </p>
              </div>
            </div>
          </div>

          {/* Indicador de Razonamiento Agéntico en Vivo sobre el Lienzo */}
          {loading && (
            <div className="mb-6 p-4 rounded-xl bg-white border border-[#F3C5C8] flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFF0F1] flex items-center justify-center text-[#E30613]">
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-[#E30613]">
                      Generando interfaz interactiva en vivo
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#E30613] animate-ping" />
                  </div>
                  <div className="text-xs font-bold text-gray-900 mt-0.5">
                    {reasoningPhase === 1 && 'Paso 1: Consultando Core Bancario Banorte (MCP Tools)...'}
                    {reasoningPhase === 2 && 'Paso 2: NLP + diseño A2UI con Ollama Cloud...'}
                    {reasoningPhase >= 3 && 'Paso 3: Dibujando componentes A2UI en el lienzo principal...'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    reasoningPhase >= 1 ? 'bg-[#E30613]' : 'bg-gray-200'
                  }`}
                />
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    reasoningPhase >= 2 ? 'bg-[#E30613]' : 'bg-gray-200'
                  }`}
                />
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    reasoningPhase >= 3 ? 'bg-[#E30613]' : 'bg-gray-200'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Renderizado en Vivo de la Pantalla A2UI */}
          <div className="flex-1 flex flex-col justify-start">
            {screen ? (
              <div className="animate-in fade-in zoom-in-98 duration-300">
                <A2UIRenderer
                  screen={screen}
                  onAction={handleA2UIAction}
                  loading={loading}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-[#E6E6E6] text-center">
                <div className="w-14 h-14 rounded-full bg-[#FFF0F1] text-[#E30613] flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1 font-display">
                  Elige una operación
                </h3>
                <p className="text-xs text-[#6B6B6B] max-w-md mb-4">
                  Abre Maya y pulsa una sugerencia para generar la primera pantalla.
                </p>
                <button
                  onClick={() => setIsChatModalOpen(true)}
                  className="px-5 py-2.5 rounded-full bg-[#E30613] text-white text-xs font-semibold hover:bg-[#C10510] transition-all flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Abrir Asistente Maya</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer discreto del lienzo */}
          <div className="mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#E30613]" />
              <span>Protocolo A2UI Pure Canvas · Banca Digital Banorte</span>
            </div>
            <span>Haz clic en la burbuja flotante para dialogar con Maya</span>
          </div>
        </main>
      </div>

      {/* ======================================================== */}
      {/* BURBUJA FLOTANTE Y MODAL DE CHAT ESCONDIDO               */}
      {/* ======================================================== */}
      <ChatBubbleModal
        messages={messages}
        loading={loading}
        reasoningPhase={reasoningPhase}
        onSendMessage={handleSendMessage}
        isOpen={isChatModalOpen}
        onToggle={() => setIsChatModalOpen((prev) => !prev)}
        onClose={() => setIsChatModalOpen(false)}
        hasGeneratedScreen={!!screen}
        suggestedPrompts={chatSuggestions}
      />
    </div>
  );
};


