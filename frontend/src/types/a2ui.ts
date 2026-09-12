import type { A2UIMessage, A2UITheme } from "a2ui-shadcn";

export type {
  A2UIMessage,
  A2UITheme,
  A2UIComponent,
  ActionMessage,
  ComponentAdapterProps,
  ComponentRegistry,
} from "a2ui-shadcn";

/** Respuesta de /api/chat con protocolo A2UI v0.9 */
export interface A2UIChatResponse {
  type: "a2ui_v09";
  surfaceId: string;
  assistantMessage: string;
  suggestedPrompts?: string[];
  messages: A2UIMessage[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  surface?: A2UIChatResponse;
  timestamp: number;
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

export const banorteA2UITheme: A2UITheme = {
  primary: "#EB0029",
  primaryColor: "#EB0029",
  secondary: "#8F0017",
  radius: "md",
  typography: {
    base: { family: "Inter, Arial, sans-serif", size: "16px" },
    heading: { family: "Inter, Arial, sans-serif" },
  },
  colors: {
    primary: "#EB0029",
    wine: "#8F0017",
    ink: "#323E48",
    success: "#10B981",
    warning: "#F59E0B",
    muted: "#606B73",
    surface: "#F7F8FA",
  },
};
