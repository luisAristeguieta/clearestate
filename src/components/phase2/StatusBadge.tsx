import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "complete" | "yellow" | "attention" | "neutral" | "blue" | "emerald";

const TONE_CLASSES: Record<BadgeTone, string> = {
  complete: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  yellow: "bg-amber-50 text-amber-800 border border-amber-200",
  attention: "bg-rose-50 text-rose-700 border border-rose-200",
  blue: "bg-blue-50 text-blue-700 border border-blue-200",
  neutral: "bg-secondary text-muted-foreground border border-border",
};

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={cn("pill-badge h-fit self-start", TONE_CLASSES[tone])}>{children}</span>;
}
