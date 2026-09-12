import React, { useEffect, useId, useState } from 'react';
import { input, panel, plainText } from './styles';

export interface TransferData { recipient: string; amount: number; concept: string; clabe: string; }
interface TransferCardProps {
  recipient: string;
  amount: number;
  concept: string;
  sourceAccount: string;
  isNewContact?: boolean;
  clabe?: string;
  onChangeData?: (data: TransferData) => void;
  disabled?: boolean;
}

function validDestination(value: string) {
  if (/^\d{18}$/.test(value)) {
    const sum = [...value.slice(0, 17)].reduce((total, digit, index) => total + (Number(digit) * [3, 7, 1][index % 3]) % 10, 0);
    return (10 - sum % 10) % 10 === Number(value[17]);
  }
  if (/^\d{16}$/.test(value)) {
    const sum = [...value].reverse().reduce((total, digit, index) => {
      const n = Number(digit) * (index % 2 ? 2 : 1);
      return total + (n > 9 ? n - 9 : n);
    }, 0);
    return sum % 10 === 0 && !/^0+$/.test(value);
  }
  return false;
}

export function transferErrors(data: TransferData, trustedDestination: boolean, sourceAccount: string) {
  return {
    recipient: data.recipient.trim() ? '' : 'Escribe el nombre del destinatario.',
    amount: Number.isFinite(data.amount) && data.amount > 0 && Number.isSafeInteger(Math.round(data.amount * 100)) && Math.abs(data.amount * 100 - Math.round(data.amount * 100)) < 0.000001
      ? '' : 'Ingresa un monto mayor a cero, con máximo dos decimales.',
    concept: data.concept.trim() ? '' : 'Escribe un concepto para identificar el envío.',
    clabe: !trustedDestination && (!validDestination(data.clabe) || /^0+$/.test(data.clabe))
      ? 'Revisa el número: CLABE de 18 dígitos o tarjeta de 16 dígitos válida.' : '',
    sourceAccount: sourceAccount?.trim() ? '' : 'No hay una cuenta de origen disponible.'
  };
}

export const TransferCard: React.FC<TransferCardProps> = ({
  recipient: initialRecipient, amount: initialAmount, concept: initialConcept, sourceAccount,
  isNewContact, clabe: initialClabe = '', onChangeData, disabled = false
}) => {
  const id = useId();
  const [recipient, setRecipient] = useState(initialRecipient ?? '');
  const [amountText, setAmountText] = useState(Number.isFinite(initialAmount) ? String(initialAmount) : '');
  const [concept, setConcept] = useState(initialConcept ?? '');
  const [clabe, setClabe] = useState(initialClabe);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const amount = /^\d+(?:\.\d{1,2})?$/.test(amountText) ? Number(amountText) : NaN;
  // Only trust the supplied contact flag, and require an account after changing the recipient.
  const isKnown = isNewContact === false && recipient.trim() === (initialRecipient ?? '').trim();
  const trustedDestination = isKnown && clabe === initialClabe;
  const errors = transferErrors({ recipient, amount, concept, clabe }, trustedDestination, sourceAccount);

  useEffect(() => {
    setRecipient(initialRecipient ?? '');
    setAmountText(Number.isFinite(initialAmount) ? String(initialAmount) : '');
    setConcept(initialConcept ?? '');
    setClabe(initialClabe);
    setTouched({});
  }, [initialRecipient, initialAmount, initialConcept, initialClabe]);

  useEffect(() => {
    onChangeData?.({ recipient, amount, concept, clabe });
  }, [recipient, amount, concept, clabe, onChangeData]);

  const showError = (field: keyof typeof errors) => !!errors[field] && (touched[field] || field === 'sourceAccount');
  const touch = (field: keyof typeof errors) => setTouched(current => ({ ...current, [field]: true }));
  const fieldError = (field: keyof typeof errors) => showError(field)
    ? <p id={id + '-' + field + '-error'} className="mt-2 text-base text-[#B80000]">{errors[field]}</p>
    : null;

  return (
    <section className={panel} aria-label="Datos de la transferencia">
      <h3 className="text-xl font-semibold">Revisa tu transferencia</h3>
      <p className="mt-2 mb-5">Puedes corregir los datos antes de confirmar el envío.</p>
      <fieldset disabled={disabled} className="min-w-0 space-y-5">
        <legend className="sr-only">Datos del envío</legend>
        <div className="rounded-xl bg-[#FBF1EA] p-4">
          <label htmlFor={id + '-amount'} className="mb-2 block font-semibold">Monto a transferir (MXN)</label>
          <input id={id + '-amount'} type="text" inputMode="decimal" autoComplete="off" value={amountText} onChange={e => setAmountText(e.target.value)} onBlur={() => touch('amount')} aria-invalid={showError('amount')} aria-describedby={showError('amount') ? id + '-amount-error' : undefined} className={input} />
          {fieldError('amount')}
        </div>
        <div>
          <label htmlFor={id + '-recipient'} className="mb-2 block font-semibold">Destinatario</label>
          <input id={id + '-recipient'} type="text" autoComplete="off" value={recipient} onChange={e => setRecipient(e.target.value)} onBlur={() => touch('recipient')} aria-invalid={showError('recipient')} aria-describedby={showError('recipient') ? id + '-recipient-error' : undefined} className={input} />
          {fieldError('recipient')}
          <p className="mt-2">{isKnown ? 'Contacto registrado' : 'Revisa la cuenta del destinatario.'}</p>
        </div>
        <div>
          <label htmlFor={id + '-clabe'} className="mb-2 block font-semibold">CLABE o tarjeta de destino{isKnown ? ' (opcional para este contacto)' : ''}</label>
          <input id={id + '-clabe'} type="text" inputMode="numeric" autoComplete="off" value={clabe} onChange={e => setClabe(e.target.value.replace(/\s/g, ''))} onBlur={() => touch('clabe')} aria-invalid={showError('clabe')} aria-describedby={id + '-clabe-help' + (showError('clabe') ? ' ' + id + '-clabe-error' : '')} className={input + ' font-mono'} />
          <p id={id + '-clabe-help'} className="mt-2">18 dígitos para CLABE o 16 para tarjeta.</p>
          {fieldError('clabe')}
        </div>
        <div className="rounded-xl bg-[#FBF1EA] p-4"><p>Cuenta de origen</p><p className="mt-1 font-semibold">{plainText(sourceAccount) || 'No disponible'}</p>{fieldError('sourceAccount')}</div>
        <div>
          <label htmlFor={id + '-concept'} className="mb-2 block font-semibold">Concepto</label>
          <input id={id + '-concept'} type="text" value={concept} onChange={e => setConcept(e.target.value)} onBlur={() => touch('concept')} aria-invalid={showError('concept')} aria-describedby={showError('concept') ? id + '-concept-error' : undefined} className={input} />
          {fieldError('concept')}
        </div>
      </fieldset>
    </section>
  );
};
