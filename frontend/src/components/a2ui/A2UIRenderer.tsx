import React, { useState } from 'react';
import { A2UIScreen } from '../../types/a2ui';
import { HeaderBadge } from './HeaderBadge';
import { MetricComparison } from './MetricComparison';
import { PlanOptionList } from './PlanOptionList';
import { ActionButton } from './ActionButton';
import { ConfirmationCard } from './ConfirmationCard';
import { QuickSuggestions } from './QuickSuggestions';
import { InvestmentSimulator } from './InvestmentSimulator';
import { TransactionTable } from './TransactionTable';
import { TransferCard } from './TransferCard';
import { FinancialHealthScore } from './FinancialHealthScore';
import { AlertBanner } from './AlertBanner';

interface A2UIRendererProps {
  screen: A2UIScreen;
  onAction: (actionType: string, payload?: any) => void;
  loading?: boolean;
}

export const A2UIRenderer: React.FC<A2UIRendererProps> = ({
  screen,
  onAction,
  loading = false
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_18m');
  const [liveTransferData, setLiveTransferData] = useState<any>(null);

  return (
    <div className="bg-[#101115] border border-[#23242e] rounded-2xl p-6 shadow-2xl backdrop-blur-md transition-all duration-300">
      {/* Mensaje de texto contextual del modelo */}
      {screen.assistantMessage && (
        <div className="mb-6 p-4 rounded-xl bg-[#171821] border-l-4 border-red-500 text-sm text-zinc-200 leading-relaxed">
          {screen.assistantMessage}
        </div>
      )}

      {/* Renderizado dinámico de componentes por tipo (Protocolo A2UI) */}
      <div className="space-y-4">
        {screen.components.map((comp) => {
          switch (comp.type) {
            case 'HeaderBadge':
              return (
                <HeaderBadge
                  key={comp.id}
                  tag={comp.props.tag}
                  title={comp.props.title}
                />
              );

            case 'AlertBanner':
              return (
                <AlertBanner
                  key={comp.id}
                  variant={comp.props.variant}
                  message={comp.props.message}
                />
              );

            case 'MetricComparison':
              return (
                <MetricComparison
                  key={comp.id}
                  balance={comp.props.balance}
                  currentCat={comp.props.currentCat}
                  preferentialCat={comp.props.preferentialCat}
                  estimatedSavings={comp.props.estimatedSavings}
                />
              );

            case 'PlanOptionList':
              return (
                <PlanOptionList
                  key={comp.id}
                  options={comp.props.options || []}
                  selectedPlanId={selectedPlanId}
                  onSelectPlan={(id) => setSelectedPlanId(id)}
                />
              );

            case 'InvestmentSimulator':
              return (
                <InvestmentSimulator
                  key={comp.id}
                  amount={comp.props.amount}
                  initialDays={comp.props.initialDays}
                  options={comp.props.options || []}
                />
              );

            case 'TransactionTable':
              return (
                <TransactionTable
                  key={comp.id}
                  transactions={comp.props.transactions || []}
                  totalExpenses={comp.props.totalExpenses || 0}
                  topCategory={comp.props.topCategory || 'Varios'}
                />
              );

            case 'TransferCard':
              return (
                <TransferCard
                  key={comp.id}
                  recipient={comp.props.recipient}
                  amount={comp.props.amount}
                  concept={comp.props.concept}
                  sourceAccount={comp.props.sourceAccount}
                  isNewContact={comp.props.isNewContact}
                  clabe={comp.props.clabe}
                  onChangeData={(data) => setLiveTransferData(data)}
                />
              );

            case 'FinancialHealthScore':
              return (
                <FinancialHealthScore
                  key={comp.id}
                  score={comp.props.score}
                  scoreRange={comp.props.scoreRange}
                  dti={comp.props.dti}
                  recommendations={comp.props.recommendations || []}
                />
              );

            case 'ActionButton':
              return (
                <ActionButton
                  key={comp.id}
                  label={comp.props.label}
                  actionType={comp.props.actionType}
                  variant={comp.props.variant}
                  loading={loading}
                  onClick={() =>
                    onAction(comp.props.actionType, {
                      planId: selectedPlanId,
                      ...comp.props,
                      ...(comp.props.actionType === 'CONFIRM_TRANSFER' && liveTransferData ? liveTransferData : {})
                    })
                  }
                />
              );

            case 'ConfirmationCard':
              return (
                <ConfirmationCard
                  key={comp.id}
                  operationId={comp.props.operationId}
                  cardName={comp.props.cardName}
                  last4={comp.props.last4}
                  months={comp.props.months}
                  monthlyQuota={comp.props.monthlyQuota}
                  appliedAt={comp.props.appliedAt}
                  nextPaymentDate={comp.props.nextPaymentDate}
                />
              );

            case 'QuickSuggestions':
              return (
                <QuickSuggestions
                  key={comp.id}
                  suggestions={comp.props.suggestions || []}
                  onSelectSuggestion={(text) => onAction('USER_PROMPT', { text })}
                />
              );

            case 'ActionList':
              return (
                <div key={comp.id} className="space-y-2 mb-4">
                  {comp.props.title && (
                    <span className="text-xs font-semibold text-zinc-300 block mb-2">{comp.props.title}</span>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(comp.props.actions || []).map((act: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => onAction(act.actionType || 'USER_PROMPT', { text: act.label })}
                        className="p-3.5 rounded-xl bg-[#171821] hover:bg-[#20222d] border border-[#272938] hover:border-red-500/50 text-xs font-medium text-zinc-200 hover:text-white transition-all flex items-center justify-between text-left group shadow-sm"
                      >
                        <span>{act.label}</span>
                        <span className="text-zinc-500 group-hover:text-red-400 font-bold ml-2">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              );

            default:
              return (
                <div key={comp.id} className="p-3 bg-zinc-900 text-xs text-zinc-400 rounded">
                  Componente A2UI desconocido: {comp.type}
                </div>
              );
          }
        })}
      </div>
    </div>
  );
};
