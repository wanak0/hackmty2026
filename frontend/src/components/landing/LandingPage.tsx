import React from 'react';
import { ArrowRight, Cpu, Layers, Layout, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onStartDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartDemo }) => {
  return (
    <div className="min-h-screen bg-[#090a0d] text-slate-100 flex flex-col selection:bg-red-500 selection:text-white">
      {/* Navbar */}
      <header className="max-w-6xl w-full mx-auto px-6 h-20 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="bg-[#EB0029] text-white font-extrabold px-3 py-1.5 rounded-md text-xs tracking-wider shadow-sm">
            BANORTE
          </div>
          <span className="text-zinc-600 font-light text-sm">×</span>
          <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            TEC DE MONTERREY
          </span>
        </div>

        <button
          onClick={onStartDemo}
          className="px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <span>Lanzar Demo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium mb-6 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Hackathon Reto Banorte 2026</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl mb-6 leading-tight">
          Interfaces que la IA construye en <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">tiempo real</span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          El reto: que el modelo no solo conteste con un muro de texto, sino que <strong>arme la pantalla viva</strong> que resuelve el problema financiero de quien pregunta.
        </p>

        {/* CTA Principal */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button
            onClick={onStartDemo}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#EB0029] hover:bg-[#c40022] text-white font-bold text-base shadow-xl shadow-red-950/40 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5" />
            <span>Probar Experiencia Banorte AI</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Visual de la Pantalla Generada (Mockup Diapositiva 1) */}
        <div className="w-full max-w-2xl bg-[#121318] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-left mb-16">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2 font-mono text-[11px] text-zinc-400">ui lista · intención detectada</span>
            </div>
            <span className="text-[11px] text-zinc-400">A2UI Protocol</span>
          </div>

          <div className="bg-[#191b22] rounded-xl p-3.5 border border-zinc-800 mb-4 flex items-center gap-3">
            <span className="text-xs uppercase font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/20">
              USER
            </span>
            <span className="text-sm font-medium text-zinc-200">
              "Quiero pagar menos intereses de mi tarjeta."
            </span>
          </div>

          <div className="bg-[#0e0f13] border border-zinc-800/80 rounded-xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-1">
              COMPONENTE GENERADO · PLAN DE PAGO
            </div>
            <h4 className="text-base font-bold text-white mb-3">Reestructura tu saldo de $18,400</h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-[#171820] rounded-lg border border-zinc-800">
                <span className="text-zinc-300">12 meses · CAT 32.4%</span>
                <span className="font-bold text-white">$1,690 /mes</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-red-950/20 rounded-lg border border-red-500/40">
                <span className="text-red-300 font-medium">18 meses · CAT 34.1% (Recomendado)</span>
                <span className="font-bold text-red-400">$1,215 /mes</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-[#171820] rounded-lg border border-zinc-800">
                <span className="text-zinc-300">24 meses · CAT 36.0%</span>
                <span className="font-bold text-white">$980 /mes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Las Tres Piezas No Negociables (Diapositiva 5) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 text-left mb-12">
          <div className="p-6 rounded-2xl bg-[#111217] border border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">LLM al Centro</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Google Gemini interpreta la necesidad y el contexto financiero del cliente, decidiendo qué piezas de software desplegar.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111217] border border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">MCP para Datos y Acciones</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Model Context Protocol en TypeScript expone de forma segura herramientas para consultar saldos y congelar deudas en el core bancario.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111217] border border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
              <Layout className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">A2UI para la Interfaz</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Protocolo declarativo Agent-to-UI que viaja como JSON al navegador, renderizando componentes interactivos que devuelven contexto al modelo.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 text-center text-xs text-zinc-400">
        <p>Solución desarrollada para el Reto Oficial Banorte × Tec de Monterrey · HackMTY 2026</p>
      </footer>
    </div>
  );
};
