import React from 'react';
import { ArrowRight, Cpu, Layers, Layout, Sparkles, CreditCard } from 'lucide-react';
import { BanorteLogo } from '../common/BanorteLogo';

interface LandingPageProps {
  onStartDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartDemo }) => {
  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] flex flex-col selection:bg-[#E30613] selection:text-white">
      <header className="bg-[#E30613] text-white sticky top-0 z-40">
        <div className="max-w-6xl w-full mx-auto px-6 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BanorteLogo size="sm" variant="white" />
            <span className="text-white/40 text-sm font-light hidden sm:inline">|</span>
            <span className="hidden sm:inline text-[10px] font-semibold tracking-[0.16em] text-white/80 uppercase">
              Móvil
            </span>
          </div>

          <button
            onClick={onStartDemo}
            className="px-4 py-2 rounded-full bg-white text-[#E30613] text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
          >
            <span>Iniciar Banorte Móvil</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E6E6E6] text-[#E30613] text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-[#E30613] animate-pulse" />
          <span>Hackathon Reto Banorte 2026 · Inteligencia Viva</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1A1A1A] max-w-3xl mb-6 leading-tight font-display">
          Interfaces vivas que Banorte construye en <span className="text-[#E30613]">tiempo real</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mb-10 leading-relaxed font-medium">
          El nuevo paradigma de Banca Digital: el agente (Ollama Cloud · Gemma) no solo responde con texto, sino que <strong>genera la interfaz viva de Banorte Móvil</strong> que resuelve al instante la necesidad financiera del cliente.
        </p>

        {/* CTA Principal */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-14">
          <button
            onClick={onStartDemo}
            className="w-full sm:w-auto px-9 py-3.5 rounded-full bg-[#E30613] hover:bg-[#C10510] text-white font-semibold text-base shadow-banorte-red flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5" />
            <span>Probar Experiencia Banorte AI</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Visual de la Pantalla Generada con Branding Banorte */}
        <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden text-left mb-16">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#E30613]" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 font-mono text-[11px] text-gray-700 font-bold">Maya AI · Protocolo A2UI</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Core Bancario Conectado
            </span>
          </div>

          <div className="bg-[#F8F9FB] rounded-2xl p-4 border border-gray-200 mb-4 flex items-center gap-3">
            <span className="text-xs uppercase font-semibold text-[#E30613] bg-[#FFF0F1] px-2.5 py-1 rounded">
              CLIENTE
            </span>
            <span className="text-sm font-semibold text-gray-800">
              "Quiero pagar menos intereses de mi tarjeta de crédito."
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E30613] mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> COMPONENTE GENERADO · PLAN PAGOS FIJOS BANORTE
            </div>
            <h4 className="text-lg font-black text-gray-900 mb-3">Reestructura tu saldo de $18,400 MXN</h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center p-3 bg-[#F8F9FB] rounded-xl border border-gray-200">
                <span className="text-gray-700 font-semibold">12 meses · CAT 32.4% fijo</span>
                <span className="font-black text-gray-900 text-sm">$1,690 /mes</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#FFF0F1] rounded border border-[#E30613]">
                <span className="text-[#E30613] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E30613]" />
                  18 meses · CAT 34.1% (Recomendado)
                </span>
                <span className="font-semibold text-[#E30613] text-sm">$1,215 /mes</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#F8F9FB] rounded-xl border border-gray-200">
                <span className="text-gray-700 font-semibold">24 meses · CAT 36.0% fijo</span>
                <span className="font-black text-gray-900 text-sm">$980 /mes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Las Tres Piezas Clave de la Arquitectura */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 text-left mb-12">
          <div className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-gray-300 shadow-xs transition-all">
            <div className="w-11 h-11 rounded-full bg-[#FFF0F1] border border-[#F3C5C8] flex items-center justify-center text-[#E30613] mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-gray-900 mb-2">Ollama Cloud · Gemma</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Interpreta el lenguaje natural, detecta la intención financiera y diseña pantallas A2UI en JSON (con Gemini como fallback opcional).
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-gray-300 shadow-xs transition-all">
            <div className="w-11 h-11 rounded-full bg-[#FFF0F1] border border-[#F3C5C8] flex items-center justify-center text-[#E30613] mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-gray-900 mb-2">MCP Bancario Banorte</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Model Context Protocol en TypeScript que conecta herramientas seguras con el core bancario para consultar saldos y congelar deudas.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-gray-300 shadow-xs transition-all">
            <div className="w-11 h-11 rounded-full bg-[#FFF0F1] border border-[#F3C5C8] flex items-center justify-center text-[#E30613] mb-4">
              <Layout className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-gray-900 mb-2">Protocolo A2UI</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Agent-to-UI declarativo en JSON que viaja al navegador, renderizando componentes interactivos que devuelven contexto al modelo.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-xs text-gray-500 bg-white">
        <p className="flex items-center justify-center gap-2 font-medium">
          <span>Solución desarrollada para el Reto Oficial Banorte × Tec de Monterrey · HackMTY 2026</span>
        </p>
      </footer>
    </div>
  );
};


