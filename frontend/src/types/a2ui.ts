export type A2UIComponentType =
  // Primitivas de Layout y Estructura
  | "Card"
  | "Grid"
  | "Stack"
  | "Section"
  | "SectionHeader"
  | "Divider"
  // Primitivas de Contenido y Datos
  | "HeaderBadge"
  | "Text"
  | "AlertBanner"
  | "MetricItem"
  | "MetricGrid"
  | "Icon"
  | "StatTile"
  | "ProgressBar"
  | "BarChart"
  | "DonutChart"
  // Primitivas de Controles Interactivos
  | "ActionButton"
  | "SliderInput"
  | "SelectInput"
  | "TextInput"
  | "OptionPills"
  // Componentes de Alto Nivel Bancario
  | "MetricComparison"
  | "PlanOptionList"
  | "InvestmentSimulator"
  | "TransactionTable"
  | "TransferCard"
  | "FinancialHealthScore"
  | "ConfirmationCard"
  | "QuickSuggestions"
  | "ActionList"
  | string;

export interface A2UIComponent {
  id: string;
  type: A2UIComponentType;
  props: Record<string, any>;
  children?: A2UIComponent[];
}

export interface A2UIScreen {
  type: "a2ui_screen";
  screenId: string;
  assistantMessage: string;
  components: A2UIComponent[];
  suggestedPrompts?: string[];
  restoreMode?: "fresh" | "snapshot";
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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  screen?: A2UIScreen;
  timestamp: number;
}

export interface AgentReasoningStep {
  id: string;
  label: string;
  detail?: string;
  status: "pending" | "in_progress" | "completed";
}
