import React from 'react';
import { money, panel, plainText } from './styles';

interface Transaction { id: string; concept: string; category: string; amount: number; date: string; type: 'EXPENSE' | 'INCOME'; }
interface TransactionTableProps { transactions: Transaction[]; totalExpenses: number; topCategory: string; }

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, totalExpenses, topCategory }) => (
  <section aria-label="Movimientos de tu cuenta" className="space-y-4 text-base text-[#222222]">
    <dl className="grid gap-3 sm:grid-cols-2"><div className={panel}><dt>Gasto acumulado del mes</dt><dd className="mt-2 text-2xl font-semibold">{money(totalExpenses)}</dd></div><div className={panel}><dt>Categoría con mayor gasto</dt><dd className="mt-2 text-xl font-semibold">{plainText(topCategory)}</dd></div></dl>
    <div className={panel}>
      <h3 className="mb-3 text-xl font-semibold">Últimos movimientos</h3>
      {transactions.length === 0 ? <p role="status">No hay movimientos para mostrar.</p> : <ul className="divide-y divide-[#DED6D0]">{transactions.map(t => <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div className="min-w-0 break-words"><p className="font-semibold">{plainText(t.concept)}</p><p className="text-[#625A55]">{plainText(t.date)} · {plainText(t.category)}</p></div><div className="sm:text-right"><p className="font-semibold">{t.type === 'EXPENSE' ? '−' : '+'}{money(Math.abs(t.amount))}</p><p>{t.type === 'EXPENSE' ? 'Salida' : 'Entrada'}</p></div></li>)}</ul>}
    </div>
  </section>
);
