import React, { useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { A2UIScreen, PlanOption } from '../../types/a2ui';
import { HeaderBadge } from './HeaderBadge';
import { MetricComparison } from './MetricComparison';
import { PlanOptionList } from './PlanOptionList';
import { ActionButton } from './ActionButton';
import { ConfirmationCard } from './ConfirmationCard';
import { QuickSuggestions } from './QuickSuggestions';
import { InvestmentSimulator } from './InvestmentSimulator';
import { TransactionTable } from './TransactionTable';
import { TransferCard, TransferData, transferErrors } from './TransferCard';
import { FinancialHealthScore } from './FinancialHealthScore';
import { AlertBanner } from './AlertBanner';
import { money, plainText, secondaryButton } from './styles';

interface A2UIRendererProps {
  screen: A2UIScreen;
  onAction: (actionType: string, payload?: any) => void;
  loading?: boolean;
}

// A new response is a new form, even when the backend reuses screenId and component IDs.
// Reset before committing children, so a stale selection can never be submitted.
export const A2UIRenderer: React.FC<A2UIRendererProps> = props => {
  const [previousScreen, setPreviousScreen] = useState(props.screen);
  const [revision, setRevision] = useState(0);
  if (previousScreen !== props.screen) {
    setPreviousScreen(props.screen);
    setRevision(revision + 1);
  }
  return <ScreenContent key={revision} {...props} />;
};

const ScreenContent: React.FC<A2UIRendererProps> = ({ screen, onAction, loading = false }) => {
  const id = useId();
  const [selectedPlanId, setSelectedPlanId] = useState('');
  // Passing the stable setter avoids the original child effect / parent render loop.
  const [liveTransferData, setLiveTransferData] = useState<TransferData | null>(null);
  const plans: PlanOption[] = screen.components.filter(comp => comp.type === 'PlanOptionList').flatMap(comp => comp.props.options || []);
  const selectedPlan = plans.find(plan => plan.planId === selectedPlanId);
  const transferCards = screen.components.filter(comp => comp.type === 'TransferCard');
  const transfer = transferCards.length === 1 ? transferCards[0].props : undefined;
  const hasSimulator = screen.components.some(comp => comp.type === 'InvestmentSimulator');
  const transferReady = !!transfer && !!liveTransferData && !Object.values(transferErrors(
    liveTransferData,
    transfer.isNewContact === false && liveTransferData.recipient.trim() === (transfer.recipient ?? '').trim() && liveTransferData.clabe === (transfer.clabe ?? ''),
    transfer.sourceAccount
  )).some(Boolean);

  const disabledReason = (actionType: string) => {
    if (actionType === 'APPLY_RESTRUCTURE' && !selectedPlan) return 'Selecciona un plan antes de aplicarlo.';
    if (actionType === 'CONFIRM_TRANSFER' && !transferReady) return 'Completa y revisa los datos de la transferencia para continuar.';
    return '';
  };

  const dispatch = (actionType: string, payload: Record<string, any> = {}) => {
    if (loading || disabledReason(actionType)) return;
    if (actionType === 'APPLY_RESTRUCTURE') {
      onAction(actionType, { ...payload, planId: selectedPlan!.planId });
    } else if (actionType === 'CONFIRM_TRANSFER' && liveTransferData) {
      onAction(actionType, {
        ...payload,
        ...liveTransferData,
        recipient: liveTransferData.recipient.trim(),
        concept: liveTransferData.concept.trim()
      });
    } else {
      onAction(actionType, payload);
    }
  };

  return (
    <div aria-busy={loading} className="a2ui-catalog min-w-0 space-y-6 rounded-2xl border border-[#DED6D0] bg-[#FFFFFF] p-4 text-base leading-relaxed text-[#222222] shadow-sm [color-scheme:light] sm:p-6">
      {screen.assistantMessage && <p className="rounded-xl border-l-4 border-[#EC0000] bg-[#FBF1EA] p-4">{plainText(screen.assistantMessage)}</p>}
      <div className="space-y-5">
        {screen.components.map(comp => {
          switch (comp.type) {
            case 'HeaderBadge':
              return <HeaderBadge key={comp.id} tag={comp.props.tag} title={comp.props.title} />;
            case 'AlertBanner':
              return <AlertBanner key={comp.id} variant={comp.props.variant} message={comp.props.message} />;
            case 'MetricComparison':
              return <MetricComparison key={comp.id} balance={comp.props.balance} currentCat={comp.props.currentCat} preferentialCat={comp.props.preferentialCat} estimatedSavings={comp.props.estimatedSavings} />;
            case 'PlanOptionList':
              return <PlanOptionList key={comp.id} options={comp.props.options || []} selectedPlanId={selectedPlanId} onSelectPlan={setSelectedPlanId} disabled={loading} />;
            case 'InvestmentSimulator':
              return <InvestmentSimulator key={comp.id} amount={comp.props.amount} initialDays={comp.props.initialDays} options={comp.props.options || []} onAction={dispatch} loading={loading} />;
            case 'TransactionTable':
              return <TransactionTable key={comp.id} transactions={comp.props.transactions || []} totalExpenses={comp.props.totalExpenses ?? 0} topCategory={comp.props.topCategory ?? 'Varios'} />;
            case 'TransferCard':
              return <TransferCard key={comp.id} recipient={comp.props.recipient} amount={comp.props.amount} concept={comp.props.concept} sourceAccount={comp.props.sourceAccount} isNewContact={comp.props.isNewContact} clabe={comp.props.clabe} onChangeData={setLiveTransferData} disabled={loading} />;
            case 'FinancialHealthScore':
              return <FinancialHealthScore key={comp.id} score={comp.props.score} scoreRange={comp.props.scoreRange} dti={comp.props.dti} recommendations={comp.props.recommendations || []} />;
            case 'ActionButton': {
              const actionType = comp.props.actionType;
              // The simulator owns its one explicit calculation button and current parameters.
              if (hasSimulator && (actionType === 'SIMULATE_INVESTMENT' || actionType === 'CONFIRM_INVESTMENT')) return null;
              const reason = disabledReason(actionType);
              let label = comp.props.label;
              if (actionType === 'CONFIRM_TRANSFER') {
                label = transferReady && liveTransferData ? 'Confirmar envío de ' + money(liveTransferData.amount) + ' a ' + liveTransferData.recipient : 'Confirmar transferencia';
              } else if (actionType === 'APPLY_RESTRUCTURE' && selectedPlan) {
                label = 'Aplicar plan de ' + selectedPlan.months + ' meses';
              }
              // Legacy investment actions are now explicitly simulations, never a purchase.
              const isLegacyInvestment = actionType === 'CONFIRM_INVESTMENT';
              const simulationValid = Number.isFinite(comp.props.amount) && comp.props.amount > 0 && Number.isInteger(comp.props.days) && comp.props.days > 0;
              const help = reason || (isLegacyInvestment && !simulationValid ? 'Abre el simulador para elegir el monto y el plazo.' : '');
              const helpId = id + '-' + comp.id + '-help';
              return <div key={comp.id} className="space-y-2">
                <ActionButton label={isLegacyInvestment ? 'Calcular rendimiento' : label} actionType={actionType} variant={comp.props.variant} loading={loading} disabled={!!help} describedBy={help ? helpId : undefined}
                  onClick={() => {
                    if (isLegacyInvestment) {
                      if (simulationValid) dispatch('SIMULATE_INVESTMENT', { amount: comp.props.amount, days: comp.props.days });
                    } else dispatch(actionType, comp.props);
                  }} />
                {help && <p id={helpId} className="text-base text-[#625A55]">{help}</p>}
              </div>;
            }
            case 'ConfirmationCard':
              return <ConfirmationCard key={comp.id} operationId={comp.props.operationId} cardName={comp.props.cardName} last4={comp.props.last4} months={comp.props.months} monthlyQuota={comp.props.monthlyQuota} appliedAt={comp.props.appliedAt} nextPaymentDate={comp.props.nextPaymentDate} screenId={screen.screenId} />;
            case 'QuickSuggestions':
              return <QuickSuggestions key={comp.id} suggestions={comp.props.suggestions || []} onSelectSuggestion={text => dispatch('USER_PROMPT', { text })} disabled={loading} />;
            case 'ActionList':
              return <section key={comp.id} className="space-y-3" aria-label={plainText(comp.props.title) || 'Acciones disponibles'}>
                {comp.props.title && <h3 className="text-lg font-semibold">{plainText(comp.props.title)}</h3>}
                <div className="grid gap-3 sm:grid-cols-2">
                  {(comp.props.actions || []).map((action: any, index: number) => {
                    const actionType = action.actionType || 'USER_PROMPT';
                    const reason = disabledReason(actionType);
                    const helpId = id + '-' + comp.id + '-' + index;
                    return <div key={index} className="space-y-2"><button type="button" disabled={loading || !!reason} aria-describedby={reason ? helpId : undefined} onClick={() => dispatch(actionType, { text: action.label })} className={secondaryButton + ' flex w-full items-center justify-between gap-3 text-left'}><span>{plainText(action.label)}</span><ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-[#EC0000]" /></button>{reason && <p id={helpId}>{reason}</p>}</div>;
                  })}
                </div>
              </section>;
            default:
              return <p key={comp.id} role="status" className="rounded-xl border border-[#DED6D0] bg-[#FBF1EA] p-4">Este contenido no está disponible: {plainText(comp.type)}.</p>;
          }
        })}
      </div>
    </div>
  );
};
