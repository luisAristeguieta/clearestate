import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "blue" | "yellow" | "green" | "red" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  blue: "bg-primary text-primary-foreground",
  yellow: "bg-highlight text-highlight-foreground",
  green: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-700",
  neutral: "bg-secondary text-muted-foreground",
};

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={cn("pill-badge", TONE_CLASSES[tone])}>{children}</span>;
}
