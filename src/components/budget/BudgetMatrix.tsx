import { AlertTriangle, CircleCheck, OctagonAlert } from "lucide-react";

import { RegisterAdjustmentDialog } from "@/components/budget/BudgetDialogs";
import {
  calculateAvailableBalance,
  calculateUsagePercent,
  evaluateBudgetHealth,
  formatCurrency,
  type BudgetHealth,
  type BudgetLine,
} from "@/config/erpConfig";
import { cn } from "@/lib/utils";

const HEALTH_DISPLAY: Record<
  BudgetHealth,
  { label: string; className: string; icon: typeof CircleCheck }
> = {
  healthy: {
    label: "Saldo suficiente",
    className: "bg-secondary text-foreground",
    icon: CircleCheck,
  },
  warning: {
    label: "Al límite",
    className: "bg-highlight text-highlight-foreground",
    icon: AlertTriangle,
  },
  overdrawn: {
    label: "Sobregiro",
    className: "bg-destructive text-destructive-foreground",
    icon: OctagonAlert,
  },
};

export function BudgetHealthBadge({ budgetLine }: { budgetLine: BudgetLine }) {
  const health = HEALTH_DISPLAY[evaluateBudgetHealth(budgetLine)];
  const HealthIcon = health.icon;
  return (
    <span className={cn("pill-badge whitespace-nowrap", health.className)}>
      <HealthIcon className="h-3 w-3" /> {health.label}
    </span>
  );
}

export function BudgetMatrix({
  budgetLines,
  phaseNameById,
}: {
  budgetLines: BudgetLine[];
  phaseNameById: Map<string, string>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="py-3 pr-4">Partida</th>
            <th className="py-3 pr-4">Área / Fase</th>
            <th className="py-3 pr-4 text-right">Aprobado</th>
            <th className="py-3 pr-4 text-right">Comprometido</th>
            <th className="py-3 pr-4 text-right">Ejecutado</th>
            <th className="py-3 pr-4 text-right">Disponible</th>
            <th className="py-3 pr-4">Consumo</th>
            <th className="py-3" />
          </tr>
        </thead>
        <tbody>
          {budgetLines.map((budgetLine) => {
            const usagePercent = calculateUsagePercent(budgetLine);
            const availableBalance = calculateAvailableBalance(budgetLine);
            return (
              <tr key={budgetLine.id} className="border-b border-border last:border-0">
                <td className="py-4 pr-4">
                  <p className="font-semibold">{budgetLine.name}</p>
                  <p className="text-xs text-muted-foreground">{budgetLine.code}</p>
                </td>
                <td className="py-4 pr-4">
                  <p>{budgetLine.area}</p>
                  <p className="text-xs text-muted-foreground">
                    {budgetLine.phaseId ? phaseNameById.get(budgetLine.phaseId) : "General"}
                  </p>
                </td>
                <td className="py-4 pr-4 text-right font-medium tabular-nums">
                  {formatCurrency(budgetLine.approved)}
                </td>
                <td className="py-4 pr-4 text-right tabular-nums">
                  {formatCurrency(budgetLine.committed)}
                </td>
                <td className="py-4 pr-4 text-right tabular-nums">
                  {formatCurrency(budgetLine.executed)}
                </td>
                <td
                  className={cn(
                    "py-4 pr-4 text-right font-semibold tabular-nums",
                    availableBalance < 0 ? "text-destructive" : "text-primary",
                  )}
                >
                  {formatCurrency(availableBalance)}
                </td>
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                    <BudgetHealthBadge budgetLine={budgetLine} />
                  </div>
                </td>
                <td className="py-4 text-right">
                  <RegisterAdjustmentDialog budgetLine={budgetLine} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {budgetLines.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">No hay partidas para este filtro.</p>
      )}
    </div>
  );
}
