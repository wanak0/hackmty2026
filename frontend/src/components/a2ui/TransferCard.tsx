import React, { useState, useEffect } from 'react';
import { UserCheck, CreditCard, Shield, Sparkles, AlertCircle, Edit2 } from 'lucide-react';

interface TransferCardProps {
  recipient: string;
  amount: number;
  concept: string;
  sourceAccount: string;
  isNewContact?: boolean;
  clabe?: string;
  onChangeData?: (data: { recipient: string; amount: number; concept: string; clabe: string }) => void;
}

export const TransferCard: React.FC<TransferCardProps> = ({
  recipient: initialRecipient,
  amount: initialAmount,
  concept: initialConcept,
  sourceAccount,
  isNewContact: initialIsNewContact = false,
  clabe: initialClabe = '',
  onChangeData
}) => {
  const [recipient, setRecipient] = useState(initialRecipient);
  const [amount, setAmount] = useState<number>(initialAmount || 500);
  const [concept, setConcept] = useState(initialConcept || 'Transferencia Banorte');
  const [clabe, setClabe] = useState(initialClabe);
  const [isEditing, setIsEditing] = useState(false);

  // Determinar si es contacto nuevo o conocido
  const isKnown =
    !initialIsNewContact &&
    (recipient.toLowerCase().includes('mamá') ||
      recipient.toLowerCase().includes('renta') ||
      recipient.toLowerCase().includes('juan'));

  useEffect(() => {
    setRecipient(initialRecipient);
    setAmount(initialAmount || 500);
    setConcept(initialConcept || 'Transferencia Banorte');
    setClabe(initialClabe);
  }, [initialRecipient, initialAmount, initialConcept, initialClabe]);

  useEffect(() => {
    if (onChangeData) {
      onChangeData({ recipient, amount, concept, clabe });
    }
  }, [recipient, amount, concept, clabe, onChangeData]);

  return (
    <div className="bg-[#14151b] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 mb-5">
      {/* Badge de Detección Agéntica NLP */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/40 border border-red-500/30 text-[11px] font-semibold text-red-300">
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span>Extracción NLP en tiempo real</span>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <Edit2 className="w-3 h-3" />
          <span>{isEditing ? 'Listo' : 'Editar datos'}</span>
        </button>
      </div>

      {/* Monto Central Interactivo */}
      <div className="text-center py-4 bg-[#0e0f13] border border-zinc-800/80 rounded-xl">
        <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">
          Monto a Transferir
        </span>
        {isEditing ? (
          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
            <span className="text-2xl font-bold text-zinc-400">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="bg-[#181922] border border-zinc-700 text-white font-extrabold text-2xl rounded-lg px-3 py-1 w-36 text-center outline-none focus:border-red-500"
            />
            <span className="text-xs text-zinc-500">MXN</span>
          </div>
        ) : (
          <div className="text-3xl font-extrabold text-white">
            ${amount.toLocaleString('es-MX')} <span className="text-xs font-normal text-zinc-500">MXN</span>
          </div>
        )}
      </div>

      {/* Datos del Envío */}
      <div className="space-y-2.5 text-xs">
        {/* Destinatario */}
        <div className="p-3 bg-[#191a22] rounded-xl border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <span className="text-[10px] text-zinc-500 block">Destinatario detectado</span>
              {isEditing ? (
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Nombre de la persona o comercio..."
                  className="w-full bg-[#121318] border border-zinc-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-red-500 mt-0.5"
                />
              ) : (
                <span className="font-semibold text-white text-sm">{recipient}</span>
              )}
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ml-2 ${
              isKnown
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
            }`}
          >
            {isKnown ? 'CONTACTO AGENDADO' : 'NUEVO DESTINATARIO'}
          </span>
        </div>

        {/* Cuenta Destino / CLABE */}
        {!isKnown && (
          <div className="p-3 bg-[#191a22] rounded-xl border border-amber-500/30">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Cuenta CLABE o Tarjeta Destino</span>
            </div>
            <input
              type="text"
              value={clabe}
              onChange={(e) => setClabe(e.target.value)}
              placeholder="Ingresa los 18 dígitos CLABE o 16 de tarjeta..."
              maxLength={18}
              className="w-full bg-[#121318] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-red-500 font-mono"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Se guardará en tus contactos frecuentes al transferir.
            </span>
          </div>
        )}

        {/* Cuenta de Retiro */}
        <div className="p-3 bg-[#191a22] rounded-xl border border-zinc-800 flex items-center gap-2.5">
          <CreditCard className="w-4 h-4 text-zinc-400" />
          <div>
            <span className="text-[10px] text-zinc-500 block">Cuenta de Retiro</span>
            <span className="font-semibold text-zinc-200">{sourceAccount}</span>
          </div>
        </div>

        {/* Concepto */}
        <div className="p-3 bg-[#191a22] rounded-xl border border-zinc-800 flex items-center justify-between">
          <span className="text-zinc-400">Concepto:</span>
          {isEditing ? (
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="bg-[#121318] border border-zinc-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-red-500 w-1/2 text-right"
            />
          ) : (
            <span className="font-medium text-white">{concept}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 justify-center">
        <Shield className="w-3 h-3 text-red-500" /> Transferencia inmediata vía SPEI Banorte
      </div>
    </div>
  );
};
