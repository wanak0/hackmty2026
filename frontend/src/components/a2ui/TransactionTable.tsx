import React from 'react';
import { ShoppingBag, Coffee, Zap, Car, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Transaction {
  id: string;
  concept: string;
  category: string;
  amount: number;
  date: string;
  type: 'EXPENSE' | 'INCOME';
}

interface TransactionTableProps {
  transactions: Transaction[];
  totalExpenses: number;
  topCategory: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  totalExpenses,
  topCategory
}) => {
  const getIcon = (category: string) => {
    switch (category) {
      case 'Despensa':
        return <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />;
      case 'Servicios':
        return <Zap className="w-3.5 h-3.5 text-blue-400" />;
      case 'Transporte':
        return <Car className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Coffee className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-4 mb-5">
      {/* Resumen Superior */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#14151a] border border-zinc-800 rounded-xl p-3.5">
          <span className="text-xs text-zinc-400 block mb-0.5 font-medium">Gasto acumulado del mes</span>
          <div className="text-xl font-bold text-white tracking-tight">
            ${totalExpenses.toLocaleString('es-MX')} <span className="text-xs font-normal text-zinc-500">MXN</span>
          </div>
        </div>

        <div className="bg-[#14151a] border border-zinc-800 rounded-xl p-3.5">
          <span className="text-xs text-zinc-400 block mb-0.5 font-medium">Mayor concentración</span>
          <div className="text-lg font-bold text-amber-400 tracking-tight flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4" /> {topCategory}
          </div>
        </div>
      </div>

      {/* Lista de Movimientos */}
      <div className="bg-[#121318] border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/80">
        {transactions.map((t) => {
          const isExpense = t.type === 'EXPENSE';

          return (
            <div key={t.id} className="p-3.5 flex items-center justify-between hover:bg-[#171821] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  {getIcon(t.category)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{t.concept}</div>
                  <div className="text-[10px] text-zinc-400">{t.date} · {t.category}</div>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-xs font-bold flex items-center justify-end gap-1 ${isExpense ? 'text-zinc-200' : 'text-emerald-400'}`}>
                  {isExpense ? (
                    <>
                      <ArrowDownRight className="w-3 h-3 text-red-400" />
                      -${t.amount.toLocaleString('es-MX')}
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      +${t.amount.toLocaleString('es-MX')}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
