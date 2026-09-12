export interface A2UIComponent {
  id: string;
  type: 'HeaderBadge' | 'MetricComparison' | 'PlanOptionList' | 'ActionButton' | 'ConfirmationCard' | 'QuickSuggestions' | string;
  props: Record<string, any>;
}

export interface A2UIScreen {
  type: 'a2ui_screen';
  screenId: string;
  assistantMessage: string;
  components: A2UIComponent[];
}

export interface PlanOption {
  planId: string;
  months: number;
  cat: number;
  monthlyPayment: number;
  totalToPay?: number;
  estimatedSavings?: number;
  recommended?: boolean;
}
