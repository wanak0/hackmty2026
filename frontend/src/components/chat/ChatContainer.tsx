import React, { useState, useEffect } from 'react';
import { Send, RotateCcw, ArrowLeft, CreditCard, Shield, Sparkles } from 'lucide-react';
import { A2UIScreen } from '../../types/a2ui';
import { A2UIRenderer } from '../a2ui/A2UIRenderer';

interface ChatContainerProps {
  onBackToLanding: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ onBackToLanding }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<A2UIScreen | null>(null);
  const [clientStatus, setClientStatus] = useState<any>(null);

  // Cargar estado inicial del cliente
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/user/usr_carlos_01/status');
      if (res.ok) {
        const data = await res.json();
        setClientStatus(data);
      }
    } catch (e) {
      console.error('Error cargando estado del cliente', e);
    }
  };

  // Iniciar sesión con pantalla de bienvenida o mensaje inicial
  const initAgent = async (initialPrompt?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: initialPrompt || 'Hola',
          context: { userId: 'usr_carlos_01' }
        })
      });
      const data = await res.json();
      setScreen(data);
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

  // Enviar mensaje del usuario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const msg = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          context: { userId: 'usr_carlos_01' }
        })
      });
      const data = await res.json();
      setScreen(data);
      fetchStatus();
    } catch (error) {
      console.error('Error procesando mensaje:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar acción viva disparada desde los componentes A2UI (cerrando el ciclo)
  const handleA2UIAction = async (actionType: string, payload?: any) => {
    if (actionType === 'USER_PROMPT') {
      setInputMessage(payload.text);
      setLoading(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: payload.text,
            context: { userId: 'usr_carlos_01' }
          })
        });
        const data = await res.json();
        setScreen(data);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (actionType === 'VIEW_ACCOUNT' || actionType === 'VIEW_BALANCES') {
      initAgent('Quiero ver mis saldos');
      fetchStatus();
      return;
    }

    if (actionType === 'SHOW_DEBT_RESTRUCTURE_OPTIONS' || actionType === 'PAY_CARD') {
      initAgent('Quiero pagar menos intereses de mi tarjeta');
      fetchStatus();
      return;
    }

    if (actionType === 'SHOW_INVESTMENT') {
      initAgent('Quiero simular una inversión en pagaré');
      return;
    }

    if (actionType === 'VIEW_TRANSACTIONS') {
      initAgent('¿En qué he gastado este mes?');
      return;
    }

    // Acción viva de aplicar reestructuración, inversión o transferencia (cierre de ciclo)
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Acción ejecutada desde componente vivo A2UI',
          context: {
            action: actionType,
            ...payload,
            userId: 'usr_carlos_01'
          }
        })
      });
      const data = await res.json();
      setScreen(data);
      fetchStatus(); // Actualizar saldos en tiempo real
    } catch (error) {
      console.error('Error aplicando acción A2UI:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reiniciar la base de datos para la demo
  const handleReset = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
      fetchStatus();
      initAgent('Quiero pagar menos intereses de mi tarjeta');
    } catch (e) {
      console.error('Error reseteando demo:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-100 flex flex-col">
      {/* Topbar Bancario */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#101116]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToLanding}
            className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Landing</span>
          </button>

          <div className="flex items-center gap-2.5">
            <span className="bg-[#EB0029] text-white font-extrabold px-2.5 py-1 rounded text-xs tracking-wider">
              BANORTE
            </span>
            <span className="text-zinc-500 text-xs">|</span>
            <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-400" /> A2UI Live Agent
            </span>
          </div>
        </div>

        {/* Info del Cliente Simulado */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-full text-xs">
            <CreditCard className="w-3.5 h-3.5 text-red-400" />
            <span className="text-zinc-400">Cliente:</span>
            <strong className="text-zinc-200">Carlos Mendoza</strong>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400">Deuda:</span>
            <strong className="text-red-400">
              ${clientStatus?.totalDebt?.toLocaleString('es-MX') || '18,400'} MXN
            </strong>
          </div>

          <button
            onClick={handleReset}
            title="Reiniciar datos de demo a valores iniciales"
            className="px-3 py-1.5 rounded-full bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reiniciar Demo</span>
          </button>
        </div>
      </header>

      {/* Área Principal de Trabajo A2UI */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col justify-between">
        {/* Renderizado de Pantalla Dinámica */}
        <div className="flex-1 flex flex-col justify-center">
          {loading && !screen ? (
            <div className="text-center py-20">
              <div className="inline-flex p-4 rounded-2xl bg-red-950/30 border border-red-500/20 text-red-400 animate-pulse mb-3">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <p className="text-sm font-medium text-zinc-400">El modelo está construyendo la interfaz en tiempo real...</p>
            </div>
          ) : screen ? (
            <A2UIRenderer
              screen={screen}
              onAction={handleA2UIAction}
              loading={loading}
            />
          ) : null}
        </div>

        {/* Input Bar para que el usuario exprese su intención */}
        <div className="mt-8 pt-4 border-t border-zinc-900 sticky bottom-4 bg-[#0a0b0d]/95 backdrop-blur-md">
          {/* Chips de Intención Rápida (Multi-dominio NLP) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-2 text-xs">
            <span className="text-[11px] text-zinc-400 shrink-0 font-semibold">Probar intención:</span>
            {[
              { label: '💳 Reestructurar Deuda', prompt: 'Quiero pagar menos intereses de mi tarjeta' },
              { label: '📈 Inversión Pagaré', prompt: 'Quiero simular una inversión de $50,000' },
              { label: '📊 Control de Gastos', prompt: '¿En qué he gastado este mes?' },
              { label: '⚡ Transferencia SPEI', prompt: 'Transferir $500 a mi mamá' },
              { label: '🩺 Salud Financiera', prompt: '¿Cómo está mi salud financiera y score?' }
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputMessage(chip.prompt);
                  initAgent(chip.prompt);
                }}
                className="shrink-0 px-3 py-1 rounded-full bg-[#181922] hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/50 text-[11px] text-zinc-300 hover:text-white transition-all shadow-sm"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Expresa tu intención financiera (ej: 'Quiero pagar menos intereses de mi tarjeta')..."
              className="w-full bg-[#16171e] border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl px-4 py-3.5 pr-14 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-all shadow-lg"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="absolute right-2 p-2.5 rounded-lg bg-[#EB0029] hover:bg-[#c90022] text-white disabled:opacity-40 disabled:hover:bg-[#EB0029] transition-all shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 px-1">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-red-500" /> Core Bancario conectado con Model Context Protocol (MCP)
            </span>
            <span>Hackathon Banorte × Tec 2026</span>
          </div>
        </div>
      </main>
    </div>
  );
};
