import { A2UIScreen, ChatMessage } from "../types/a2ui";

export type RestoreMode = "fresh" | "snapshot";

export type RestoreIntent = {
  mode: RestoreMode;
  steps: number;
  keyword?: string;
};

const SNAPSHOT_RE =
  /exactamente|tal cual|sin cambios|como estaba|congelad|original|copia exacta|sin actualizar/;
const BACK_RE =
  /regresa|regreso|atr[aá]s|anterior|vuelve|volver|lo de antes|lo anterior|pantalla de antes|la de antes/;

export function parseRestoreIntent(message: string): RestoreIntent | null {
  const lower = message.toLowerCase().trim();
  const wantsSnapshot = SNAPSHOT_RE.test(lower);
  const hasStepPhrase = /(?:hace\s+)?\d+\s*(?:pasos?|veces|pantallas?)/.test(
    lower,
  );
  const wantsBack = BACK_RE.test(lower) || wantsSnapshot || hasStepPhrase;
  if (!wantsBack) return null;

  const stepMatch =
    lower.match(
      /(?:regresa|vuelve|atr[aá]s|hace)\s*(?:a\s*)?(\d+)\s*(?:pasos?|veces|pantallas?)?/,
    ) ||
    lower.match(/(\d+)\s*(?:pasos?|veces|pantallas?)\s*(?:atr[aá]s|antes)/);
  const steps = stepMatch ? Math.max(1, parseInt(stepMatch[1], 10)) : 1;

  let keyword: string | undefined;
  const topic = lower.match(
    /(?:a\s+lo\s+del?|a\s+la\s+de|de\s+la|del)\s+([a-záéíóúñ0-9\s]{3,40}?)(?:\s+exact|\s+tal|\s+sin|\s*$)/i,
  );
  if (topic?.[1]) {
    const k = topic[1].trim();
    if (!/antes|anterior|pasos?|veces/.test(k)) keyword = k;
  }

  return { mode: wantsSnapshot ? "snapshot" : "fresh", steps, keyword };
}

export function cloneScreen<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function assistantEntries(messages: ChatMessage[]) {
  return messages
    .map((message, index) => ({ message, index }))
    .filter(
      (entry) =>
        entry.message.role === "assistant" &&
        entry.message.screen &&
        !entry.message.screen.restoreMode,
    );
}

export function resolveRestoreIndex(
  messages: ChatMessage[],
  activeIndex: number,
  intent: RestoreIntent,
): number | null {
  const assistants = assistantEntries(messages);
  if (assistants.length === 0) return null;

  const currentPos = assistants.findIndex((entry) => entry.index === activeIndex);
  const from = currentPos >= 0 ? currentPos : assistants.length - 1;

  if (intent.keyword) {
    const needle = intent.keyword.toLowerCase();
    for (let i = from - 1; i >= 0; i -= 1) {
      const item = assistants[i].message;
      const hay =
        `${item.content} ${item.screen?.screenId || ""} ${item.screen?.assistantMessage || ""}`.toLowerCase();
      if (hay.includes(needle)) return assistants[i].index;
    }
  }

  const targetPos = Math.max(0, from - intent.steps);
  return assistants[targetPos]?.index ?? assistants[0].index;
}

export function snapshotScreen(source: A2UIScreen): A2UIScreen {
  return {
    ...cloneScreen(source),
    restoreMode: "snapshot",
    assistantMessage: `${source.assistantMessage}\n\nCopia exacta de esa pantalla. Los números no se tocaron.`,
  };
}
