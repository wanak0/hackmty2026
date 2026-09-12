import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  ArrowLeft,
  CreditCard,
  Shield,
  Sparkles,
  Wallet,
  MessageSquare,
  Layers,
  TrendingUp,
  Sliders
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
      showToast('error', 'No se pudo cargar el estado bancario. ¿Está el backend en :3001?');
    }
  };

  // Efecto para animar las etapas de razonamiento agéntico en vivo
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
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: A2UIScreen = await res.json();
      if (!data?.type && data && (data as any).error) {
        throw new Error((data as any).error);
      }
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
      showToast('error', 'No se pudo generar la pantalla A2UI. Revisa que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    initAgent('Quiero pagar menos intereses de mi tarjeta');
  }, []);

  // Enviar mensaje del usuario a Maya Banorte
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
      fetchStatus();
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      showToast('error', 'Falló la comunicación con Maya. Intenta de nuevo o reinicia la demo.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar acción viva disparada desde los componentes A2UI en el lienzo principal
  const handleA2UIAction = async (actionType: string, payload?: any) => {
    if (actionType === 'USER_PROMPT') {
      await handleSendMessage(payload.text);
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
      fetchStatus();
      if (data.screenId?.includes('success')) {
        showToast('success', 'Operación aplicada en el core bancario (MCP).');
      }
    } catch (error) {
      console.error('Error aplicando acción A2UI:', error);
      showToast('error', 'No se pudo aplicar la acción bancaria. Revisa el backend.');
    } finally {
      setLoading(false);
    }
  };

  // Reiniciar la base de datos para la demo
  const handleReset = async () => {
    try {
      const res = await apiFetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('reset failed');
      setMessages([]);
      fetchStatus();
      showToast('success', 'Demo reiniciada a valores de fábrica.');
      initAgent('Quiero pagar menos intereses de mi tarjeta');
    } catch (e) {
      console.error('Error reseteando demo:', e);
      showToast('error', 'No se pudo reiniciar la demo.');
    }
  };

  const checkingBalance =
    clientStatus?.user?.checkingBalance ?? clientStatus?.checkingBalance ?? 14500;

  return (
    <div className="min-h-screen bg-[#F2F4F8] text-[#1E242D] flex flex-col selection:bg-[#EB0029] selection:text-white">
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

          {/* Acciones y Perfil */}
          <div className="flex items-center gap-3">
            {/* Botón directo para abrir el chat de Maya */}
            <button
              onClick={() => setIsChatModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
              title="Abrir chat con Maya"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Asistente Maya</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            </button>

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

      <div className="flex-1 flex flex-col pb-24">
        {/* Resumen Superior de Cuentas Banorte */}
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

              <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                <span>Core Bancario conectado vía <span className="font-bold text-gray-700">MCP SDK</span></span>
                <span className="text-gray-300">•</span>
                <span className="text-[#EB0029] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Gemma 4:3.1b · Ollama
                </span>
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
                      ${Number(checkingBalance).toLocaleString('es-MX')}{' '}
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
                <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
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

            {/* Accesos rápidos de interacción en el lienzo */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleA2UIAction('SHOW_DEBT_RESTRUCTURE_OPTIONS')}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#EB0029] hover:text-[#EB0029] text-gray-700 shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                <CreditCard className="w-3.5 h-3.5 text-[#EB0029]" />
                <span>Pagar Deuda</span>
              </button>
              <button
                onClick={() => handleA2UIAction('SHOW_INVESTMENT')}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#EB0029] hover:text-[#EB0029] text-gray-700 shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inversión Pagaré</span>
              </button>
              <button
                onClick={() => handleA2UIAction('VIEW_TRANSACTIONS')}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#EB0029] hover:text-[#EB0029] text-gray-700 shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Mis Gastos</span>
              </button>
            </div>
          </div>

          {/* Indicador de Razonamiento Agéntico en Vivo sobre el Lienzo */}
          {loading && (
            <div className="mb-6 p-4 rounded-2xl bg-white border border-[#FECDD3] shadow-sm flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0F2] flex items-center justify-center text-[#EB0029]">
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-[#EB0029]">
                      Generando interfaz interactiva en vivo
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#EB0029] animate-ping" />
                  </div>
                  <div className="text-xs font-bold text-gray-900 mt-0.5">
                    {reasoningPhase === 1 && 'Paso 1: Consultando Core Bancario Banorte (MCP Tools)...'}
                    {reasoningPhase === 2 && 'Paso 2: Razonando intención y diseñando pantalla con Gemma 4:3.1b (Ollama Cloud)...'}
                    {reasoningPhase >= 3 && 'Paso 3: Dibujando componentes A2UI en el lienzo principal...'}
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
              <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-dashed border-gray-300 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#FFF0F2] text-[#EB0029] flex items-center justify-center mb-4 banorte-subtle-glow">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-1">
                  Lienzo preparado para diseñar interfaces
                </h3>
                <p className="text-xs text-gray-500 max-w-md mb-4">
                  Haz clic en la burbuja roja de Maya Banorte para pedir lo que necesites o pulsa una acción rápida arriba.
                </p>
                <button
                  onClick={() => setIsChatModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-banorte-gradient text-white text-xs font-extrabold shadow-md hover:opacity-95 transition-all flex items-center gap-2"
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
              <Shield className="w-3.5 h-3.5 text-[#EB0029]" />
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
      />
    </div>
  );
};


