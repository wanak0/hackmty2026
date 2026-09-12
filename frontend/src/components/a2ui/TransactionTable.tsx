import React from 'react';
import { ShoppingBag, Coffee, Zap, Car, ArrowUpRight, ArrowDownRight, Tag, Receipt } from 'lucide-react';

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
        return <ShoppingBag className="w-4 h-4 text-amber-600" />;
      case 'Servicios':
        return <Zap className="w-4 h-4 text-blue-600" />;
      case 'Transporte':
        return <Car className="w-4 h-4 text-rose-600" />;
      case 'Transferencias':
        return <ArrowUpRight className="w-4 h-4 text-purple-600" />;
      case 'Ingreso':
        return <ArrowDownRight className="w-4 h-4 text-emerald-600" />;
      default:
        return <Coffee className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-4 mb-5">
      {/* Resumen Superior */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] text-gray-500 uppercase tracking-wider block mb-1 font-bold">
            Gasto Acumulado en el Periodo
          </span>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            ${totalExpenses.toLocaleString('es-MX')} <span className="text-xs font-normal text-gray-500">MXN</span>
          </div>
          <span className="text-[10px] text-[#EB0029] font-bold mt-1 block">
            Corte: 18 Septiembre 2026
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] text-gray-500 uppercase tracking-wider block mb-1 font-bold">
            Mayor Concentración
          </span>
          <div className="text-xl font-bold text-amber-700 tracking-tight flex items-center gap-2 mt-0.5">
            <Tag className="w-4 h-4" /> {topCategory}
          </div>
          <span className="text-[10px] text-gray-500 font-medium mt-1 block">
            Representa ~38% de tus salidas
          </span>
        </div>
      </div>

      {/* Lista de Movimientos Banorte */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FB]">
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-[#EB0029]" /> Movimientos Registrados
          </span>
          <span className="text-[11px] text-gray-500 font-medium">
            {transactions.length} operaciones
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {transactions.map((t) => {
            const isExpense = t.type === 'EXPENSE';

            return (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                    {getIcon(t.category)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{t.concept}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 font-medium">
                      <span>{t.date}</span>
                      <span>·</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px] text-gray-700 font-semibold">
                        {t.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm sm:text-base font-black flex items-center justify-end gap-1 ${isExpense ? 'text-gray-900' : 'text-emerald-700'}`}>
                    {isExpense ? (
                      <>
                        <span className="text-[#EB0029] font-bold">-</span>
                        ${t.amount.toLocaleString('es-MX')}
                      </>
                    ) : (
                      <>
                        <span className="text-emerald-700 font-bold">+</span>
                        ${t.amount.toLocaleString('es-MX')}
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 block font-medium">
                    {isExpense ? 'Cargo aprobado' : 'Depósito SPEI'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


