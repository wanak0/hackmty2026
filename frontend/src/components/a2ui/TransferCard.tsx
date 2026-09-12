import React, { useState, useEffect } from 'react';
import { CreditCard, Shield, Sparkles, AlertCircle, Edit2 } from 'lucide-react';

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

  const isKnown =
    !initialIsNewContact &&
    (recipient.toLowerCase().includes('mamá') ||
      recipient.toLowerCase().includes('renta') ||
      recipient.toLowerCase().includes('juan') ||
      recipient.toLowerCase().includes('rosa'));

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
    <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 mb-5">
      {/* Header Banorte SPEI */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0F2] border border-[#FECDD3] text-xs font-bold text-[#EB0029]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transferencia SPEI · Banorte Móvil</span>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold border border-gray-200"
        >
          <Edit2 className="w-3 h-3 text-[#EB0029]" />
          <span>{isEditing ? 'Listo' : 'Modificar datos'}</span>
        </button>
      </div>

      {/* Monto Central Banorte */}
      <div className="text-center py-5 px-4 bg-[#F8F9FB] border border-gray-200 rounded-2xl">
        <span className="text-[11px] text-gray-500 uppercase tracking-widest font-bold block mb-1">
          Importe a Transferir
        </span>
        {isEditing ? (
          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto my-1">
            <span className="text-2xl font-bold text-gray-400">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="bg-white border-2 border-[#EB0029] text-gray-900 font-black text-2xl rounded-xl px-3 py-1.5 w-40 text-center outline-none shadow-xs"
            />
            <span className="text-xs font-bold text-gray-500">MXN</span>
          </div>
        ) : (
          <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            ${amount.toLocaleString('es-MX')} <span className="text-xs font-semibold text-gray-500">MXN</span>
          </div>
        )}
        <div className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center justify-center gap-1">
          <span>Sin comisión por SPEI Banorte</span>
        </div>
      </div>

      {/* Campos de Transferencia */}
      <div className="space-y-3 text-xs">
        {/* Destinatario */}
        <div className="p-3.5 bg-[#F8F9FB] rounded-xl border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-sm shrink-0">
              {recipient.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Destinatario</span>
              {isEditing ? (
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Nombre de la persona o comercio..."
                  className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-900 outline-none focus:border-[#EB0029] mt-0.5"
                />
              ) : (
                <span className="font-bold text-gray-900 text-sm">{recipient}</span>
              )}
            </div>
          </div>

          <span
            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ml-2 shrink-0 ${
              isKnown
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {isKnown ? 'CONTACTO FRECUENTE' : 'NUEVO DESTINATARIO'}
          </span>
        </div>

        {/* CLABE si no es conocido */}
        {!isKnown && (
          <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-800 font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Cuenta CLABE / Tarjeta Destino</span>
            </div>
            <input
              type="text"
              value={clabe}
              onChange={(e) => setClabe(e.target.value)}
              placeholder="18 dígitos CLABE o 16 dígitos de tarjeta..."
              maxLength={18}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-[#EB0029] font-mono"
            />
          </div>
        )}

        {/* Cuenta de Retiro */}
        <div className="p-3.5 bg-[#F8F9FB] rounded-xl border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF0F2] border border-[#FECDD3] flex items-center justify-center text-[#EB0029] shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Cuenta de Cargo</span>
              <span className="font-bold text-gray-800">{sourceAccount || 'Cuenta Enlace Digital (•••• 4092)'}</span>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Saldo: $13,650 MXN
          </span>
        </div>

        {/* Concepto */}
        <div className="p-3.5 bg-[#F8F9FB] rounded-xl border border-gray-200 flex items-center justify-between">
          <span className="text-gray-500 font-bold uppercase text-[10px]">Concepto de pago:</span>
          {isEditing ? (
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-900 outline-none focus:border-[#EB0029] w-1/2 text-right"
            />
          ) : (
            <span className="font-bold text-gray-900">{concept}</span>
          )}
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-100 font-medium">
        <span className="flex items-center gap-1 text-emerald-700 font-bold">
          <Shield className="w-3.5 h-3.5" /> Token Banorte Activo (Auto-validación)
        </span>
        <span>SPEI Banorte 24/7</span>
      </div>
    </div>
  );
};


