import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "complete" | "yellow" | "attention" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  complete: "bg-secondary text-foreground",
  yellow: "bg-highlight text-highlight-foreground",
  attention: "bg-highlight text-highlight-foreground",
  neutral: "bg-secondary text-muted-foreground",
};

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={cn("pill-badge h-fit self-start", TONE_CLASSES[tone])}>{children}</span>;
}
