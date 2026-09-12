import React, { useState } from 'react';
import { A2UIScreen, A2UIComponent } from '../../types/a2ui';
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
import { Icon } from './Icon';
import { StatTile } from './StatTile';
import { ProgressBar } from './ProgressBar';
import { BarChart } from './BarChart';
import { DonutChart } from './DonutChart';
import { SectionHeader } from './SectionHeader';
import {
  ChevronRight,
  Sliders,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

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

  // Renderizador recursivo de componentes (Atómicos + Compuestos)
  const renderComponent = (comp: A2UIComponent): React.ReactNode => {
    switch (comp.type) {
      // 1. LAYOUT Y CONTENEDORES ATÓMICOS
      case 'Card': {
        const variantStyles =
          comp.props.variant === 'highlight'
            ? 'border-[#EB0029] bg-[#FFF8F9]'
            : comp.props.variant === 'danger'
            ? 'border-red-300 bg-red-50/50'
            : comp.props.variant === 'success'
            ? 'border-emerald-300 bg-emerald-50/50'
            : 'border-gray-200 bg-white';

        return (
          <div
            key={comp.id}
            className={`p-4 sm:p-5 rounded-2xl border shadow-xs transition-all ${variantStyles}`}
          >
            {comp.props.title && (
              <div className="mb-3">
                <h4 className="text-sm font-black text-gray-900">{comp.props.title}</h4>
                {comp.props.subtitle && (
                  <p className="text-xs text-gray-500 font-medium">{comp.props.subtitle}</p>
                )}
              </div>
            )}
            {comp.children && comp.children.length > 0 && (
              <div className="space-y-3">{comp.children.map((child) => renderComponent(child))}</div>
            )}
          </div>
        );
      }

      case 'Grid': {
        const cols = comp.props.columns === 3 ? 'md:grid-cols-3' : comp.props.columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-2';
        return (
          <div key={comp.id} className={`grid grid-cols-1 ${cols} gap-3`}>
            {comp.children ? comp.children.map((child) => renderComponent(child)) : null}
          </div>
        );
      }

      case 'Stack': {
        const isRow = comp.props.direction === 'horizontal';
        const gapClass =
          comp.props.gap === 'sm' ? 'gap-2' : comp.props.gap === 'lg' ? 'gap-5' : 'gap-3';
        return (
          <div
            key={comp.id}
            className={`flex ${isRow ? 'flex-row flex-wrap items-center' : 'flex-col'} ${gapClass}`}
          >
            {comp.children ? comp.children.map((child) => renderComponent(child)) : null}
          </div>
        );
      }

      case 'Divider':
        return <hr key={comp.id} className="border-gray-200 my-3" />;

      case 'Icon':
        return (
          <Icon
            key={comp.id}
            name={comp.props.name}
            tone={comp.props.tone}
            size={comp.props.size}
          />
        );

      case 'SectionHeader':
        return (
          <SectionHeader
            key={comp.id}
            icon={comp.props.icon}
            title={comp.props.title}
            subtitle={comp.props.subtitle}
            tag={comp.props.tag}
          />
        );

      case 'StatTile':
        return (
          <StatTile
            key={comp.id}
            icon={comp.props.icon}
            label={comp.props.label}
            value={comp.props.value}
            subtext={comp.props.subtext}
            tone={comp.props.tone}
            trend={comp.props.trend}
          />
        );

      case 'ProgressBar':
        return (
          <ProgressBar
            key={comp.id}
            label={comp.props.label}
            value={Number(comp.props.value) || 0}
            max={comp.props.max}
            unit={comp.props.unit}
            tone={comp.props.tone}
            icon={comp.props.icon}
            subtext={comp.props.subtext}
          />
        );

      case 'BarChart':
        return (
          <BarChart
            key={comp.id}
            title={comp.props.title}
            unit={comp.props.unit}
            orientation={comp.props.orientation}
            bars={comp.props.bars || []}
          />
        );

      case 'DonutChart':
        return (
          <DonutChart
            key={comp.id}
            title={comp.props.title}
            centerLabel={comp.props.centerLabel}
            centerValue={comp.props.centerValue}
            segments={comp.props.segments || []}
          />
        );

      // 2. CONTENIDO Y MÉTRICAS ATÓMICAS
      case 'Text': {
        const sizeClass =
          comp.props.size === 'xs'
            ? 'text-xs'
            : comp.props.size === 'lg'
            ? 'text-base font-bold'
            : 'text-sm';
        const colorClass =
          comp.props.color === 'primary'
            ? 'text-[#EB0029]'
            : comp.props.color === 'muted'
            ? 'text-gray-500'
            : comp.props.color === 'danger'
            ? 'text-red-600'
            : comp.props.color === 'success'
            ? 'text-emerald-700'
            : 'text-gray-800';

        return (
          <p
            key={comp.id}
            className={`${sizeClass} ${colorClass} ${
              comp.props.bold ? 'font-black' : 'font-medium'
            } leading-relaxed`}
          >
            {comp.props.content || comp.props.text}
          </p>
        );
      }

      case 'MetricItem':
        return (
          <div
            key={comp.id}
            className={`p-3.5 rounded-xl border ${
              comp.props.variant === 'primary'
                ? 'bg-[#FFF5F6] border-[#FECDD3]'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
              {comp.props.label}
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-lg font-black ${
                  comp.props.variant === 'primary' ? 'text-[#EB0029]' : 'text-gray-900'
                }`}
              >
                {comp.props.value}
              </span>
              {comp.props.trend === 'positive' && (
                <TrendingUp className="w-4 h-4 text-emerald-600 inline" />
              )}
              {comp.props.trend === 'negative' && (
                <TrendingDown className="w-4 h-4 text-[#EB0029] inline" />
              )}
            </div>
            {comp.props.subtext && (
              <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                {comp.props.subtext}
              </span>
            )}
          </div>
        );

      case 'MetricGrid':
        return (
          <div key={comp.id} className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
            {(comp.props.items || []).map((item: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border ${
                  item.highlight
                    ? 'bg-[#FFF5F6] border-[#EB0029] text-[#EB0029]'
                    : 'bg-[#F9FAFB] border-gray-200 text-gray-900'
                }`}
              >
                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  {item.label}
                </span>
                <span className="text-base font-black">{item.value}</span>
                {item.subtext && (
                  <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
                    {item.subtext}
                  </span>
                )}
              </div>
            ))}
          </div>
        );

      // 3. CONTROLES INTERACTIVOS ATÓMICOS
      case 'SliderInput':
        return (
          <div key={comp.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-800">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#EB0029]" />
                {comp.props.label}
              </span>
              <span className="text-[#EB0029] font-black">
                {comp.props.defaultValue} {comp.props.unit || ''}
              </span>
            </div>
            <input
              type="range"
              min={comp.props.min || 1000}
              max={comp.props.max || 100000}
              step={comp.props.step || 1000}
              defaultValue={comp.props.defaultValue || 25000}
              onMouseUp={(e: any) =>
                onAction(comp.props.actionType || 'SLIDER_CHANGE', {
                  value: Number(e.target.value)
                })
              }
              onTouchEnd={(e: any) =>
                onAction(comp.props.actionType || 'SLIDER_CHANGE', {
                  value: Number(e.target.value)
                })
              }
              className="w-full accent-[#EB0029] cursor-pointer"
            />
          </div>
        );

      case 'OptionPills':
        return (
          <div key={comp.id} className="space-y-1.5">
            {comp.props.label && (
              <span className="text-xs font-bold text-gray-600 block">{comp.props.label}</span>
            )}
            <div className="flex flex-wrap gap-2">
              {(comp.props.options || []).map((opt: any) => (
                <button
                  key={opt.id}
                  onClick={() =>
                    onAction(opt.actionType || 'OPTION_SELECT', {
                      id: opt.id,
                      label: opt.label,
                      ...opt.payload
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    opt.selected
                      ? 'bg-[#EB0029] text-white border-[#EB0029] shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#EB0029] hover:text-[#EB0029]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      // 4. COMPONENTES DE ALTO NIVEL FINANCIERO
      case 'HeaderBadge':
        return (
          <HeaderBadge key={comp.id} tag={comp.props.tag} title={comp.props.title} />
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
            onSelectPlan={(id) => {
              setSelectedPlanId(id);
              // Cerrando ciclo evento a evento (Requisito 3.2)
              onAction('SELECT_PLAN', { planId: id });
            }}
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
                planId: comp.props.planId || selectedPlanId,
                ...(comp.props.payload || {}),
                ...comp.props,
                ...(comp.props.actionType === 'CONFIRM_TRANSFER' && liveTransferData
                  ? liveTransferData
                  : {})
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
          <div key={comp.id} className="space-y-2.5 mb-4">
            {comp.props.title && (
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                {comp.props.title}
              </span>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(comp.props.actions || []).map((act: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => onAction(act.actionType || 'USER_PROMPT', { text: act.label })}
                  className="p-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 hover:border-[#EB0029] text-xs font-bold text-gray-800 hover:text-gray-900 transition-all flex items-center justify-between text-left group shadow-xs"
                >
                  <span>{act.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#EB0029] group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div
            key={comp.id}
            className="p-4 bg-gray-50 border border-gray-200 text-xs text-gray-600 rounded-2xl"
          >
            Componente A2UI: {comp.type}
          </div>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-sm transition-all duration-300">
      {/* Lienzo A2UI puro: solo componentes generados (el texto de Maya vive en el chat) */}
      <div className="space-y-4">{screen.components.map((comp) => renderComponent(comp))}</div>
    </div>
  );
};



