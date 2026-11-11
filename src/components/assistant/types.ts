import type { LucideIcon } from "lucide-react";

export type DatasetCategory = "Todos" | "Presupuestos" | "Adquisiciones" | "Posventa" | "Oracle";

export interface DatasetItem {
  id: string;
  category: "Presupuestos" | "Adquisiciones" | "Posventa" | "Oracle";
  name: string;
  recordCount: string;
  description: string;
  icon: LucideIcon;
}

export type ChatMode = "chat" | "bi";

export type AiModelId = "claude-sonnet-5" | "gemini-2.5-pro" | "gpt-4o";

export interface KpiTile {
  label: string;
  value: string;
  hint?: string;
  status?: "healthy" | "warning" | "neutral";
}

export interface DynamicTableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
}

export interface DynamicTable {
  title: string;
  columns: DynamicTableColumn[];
  rows: Array<Record<string, string | number>>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  time: string;
  mode?: ChatMode | undefined;
  scope?: string | undefined;
  kpis?: KpiTile[] | undefined;
  table?: DynamicTable | undefined;
  suggestedActions?: string[] | undefined;
}

export interface SavedReport {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  query: string;
  mode: ChatMode;
}
