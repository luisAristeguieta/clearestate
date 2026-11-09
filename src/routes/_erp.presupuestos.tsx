import { createFileRoute } from "@tanstack/react-router";
import { Coins, FileCheck, History, Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { CreateBudgetLineDialog } from "@/components/budget/BudgetDialogs";
import { BudgetMatrix } from "@/components/budget/BudgetMatrix";
import { PageHeader } from "@/components/PageHeader";
import {
  BUDGET_AREAS,
  calculateAvailableBalance,
  formatCurrency,
  type BudgetArea,
} from "@/config/erpConfig";
import { useErp } from "@/context/ErpContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_erp/presupuestos")({
  head: () => ({
    meta: [
      { title: "Presupuestos y Proyectos · ClearEstate ERP" },
      {
        name: "description",
        content:
          "Matriz presupuestaria con montos aprobados, comprometidos, ejecutados y disponibles.",
      },
      { property: "og:title", content: "Presupuestos y Proyectos · ClearEstate ERP" },
      { property: "og:description", content: "Partidas, ajustes e historial presupuestario." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BudgetsPage,
});

type AreaFilter = BudgetArea | "Todas";

function BudgetsPage() {
  const { budgetLines, phases, adjustments, projectFilter } = useErp();
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("Todas");
  const phaseNameById = useMemo(
    () => new Map(phases.map((phase) => [phase.id, phase.name])),
    [phases],
  );
  const lineCodeById = useMemo(
    () => new Map(budgetLines.map((line) => [line.id, line.code])),
    [budgetLines],
  );

  const visibleLines = budgetLines.filter(
    (line) =>
      (projectFilter === "all" || line.projectId === projectFilter) &&
      (areaFilter === "Todas" || line.area === areaFilter),
  );

  const totals = useMemo(() => {
    return visibleLines.reduce(
      (accumulator, line) => ({
        approved: accumulator.approved + line.approved,
        committed: accumulator.committed + line.committed,
        executed: accumulator.executed + line.executed,
      }),
      { approved: 0, committed: 0, executed: 0 },
    );
  }, [visibleLines]);

  const totalAvailable = calculateAvailableBalance(totals);
  const committedPercent =
    totals.approved > 0 ? Math.round((totals.committed / totals.approved) * 100) : 0;
  const executedPercent =
    totals.approved > 0 ? Math.round((totals.executed / totals.approved) * 100) : 0;
  const availablePercent =
    totals.approved > 0 ? Math.round((totalAvailable / totals.approved) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description="Disponible = Aprobado − Comprometido − Ejecutado. Registra partidas y ajustes con trazabilidad."
        actions={<CreateBudgetLineDialog />}
      />

      {/* Resumen financiero (KPIs de totales) */}
      <section
        aria-label="Totales de ejecución presupuestaria"
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Presupuesto Aprobado
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground">
              <Coins className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground xl:text-3xl">
            {formatCurrency(totals.approved)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {visibleLines.length} {visibleLines.length === 1 ? "partida" : "partidas"} en el alcance
          </p>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Comprometido
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground">
              <FileCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground xl:text-3xl">
            {formatCurrency(totals.committed)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {committedPercent}% del total · Órdenes emitidas
          </p>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Ejecutado
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground xl:text-3xl">
            {formatCurrency(totals.executed)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {executedPercent}% del total · Facturas validadas
          </p>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Saldo Disponible Total
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-primary xl:text-3xl">
            {formatCurrency(totalAvailable)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {availablePercent}% disponible para imputaciones
          </p>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["Todas", ...BUDGET_AREAS] as AreaFilter[]).map((area) => (
          <button
            key={area}
            type="button"
            onClick={() => setAreaFilter(area)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              areaFilter === area
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background hover:bg-secondary",
            )}
          >
            {area}
          </button>
        ))}
      </div>

      <div className="surface-card">
        <BudgetMatrix budgetLines={visibleLines} phaseNameById={phaseNameById} />
      </div>

      <div className="surface-card mt-6">
        <h3 className="flex items-center gap-2 font-bold">
          <History className="h-4 w-4" /> Historial de ajustes
        </h3>
        {adjustments.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Aún no hay ajustes registrados. Usa "Ajustar" en cualquier partida.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {adjustments.map((adjustment) => {
              const isIncrease = adjustment.adjustmentType === "Incremento";
              const AdjustmentIcon = isIncrease ? TrendingUp : TrendingDown;
              return (
                <div key={adjustment.id} className="flex items-center gap-4 py-3">
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                      isIncrease ? "bg-primary text-primary-foreground" : "bg-secondary",
                    )}
                  >
                    <AdjustmentIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {lineCodeById.get(adjustment.budgetLineId)} · {adjustment.adjustmentType} de{" "}
                      {formatCurrency(adjustment.amount)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{adjustment.reason}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>
                      {formatCurrency(adjustment.approvedBefore)} →{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(adjustment.approvedAfter)}
                      </span>
                    </p>
                    <p>
                      {adjustment.authorName} ·{" "}
                      {new Date(adjustment.createdAt).toLocaleString("es-PE")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
