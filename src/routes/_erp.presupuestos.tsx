import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpDown,
  Coins,
  FileCheck,
  History,
  Receipt,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { CreateBudgetLineDialog } from "@/components/budget/BudgetDialogs";
import { BudgetMatrix } from "@/components/budget/BudgetMatrix";
import { PageHeader } from "@/components/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type BudgetSortKey =
  | "default"
  | "approved-desc"
  | "approved-asc"
  | "available-desc"
  | "available-asc"
  | "committed-desc"
  | "executed-desc"
  | "code-asc"
  | "name-asc";

function BudgetsPage() {
  const { budgetLines, phases, adjustments, projectFilter } = useErp();
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<BudgetSortKey>("default");

  const phaseNameById = useMemo(
    () => new Map(phases.map((phase) => [phase.id, phase.name])),
    [phases],
  );
  const lineCodeById = useMemo(
    () => new Map(budgetLines.map((line) => [line.id, line.code])),
    [budgetLines],
  );

  // Filter lines by project, area, and search query
  const visibleLines = useMemo(() => {
    return budgetLines.filter((line) => {
      // 1. Global project filter
      if (projectFilter !== "all" && line.projectId !== projectFilter) {
        return false;
      }
      // 2. Area pill filter
      if (areaFilter !== "Todas" && line.area !== areaFilter) {
        return false;
      }
      // 3. Free-text search query (matches code, name, or area)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const codeMatch = line.code.toLowerCase().includes(query);
        const nameMatch = line.name.toLowerCase().includes(query);
        const areaMatch = line.area.toLowerCase().includes(query);
        const phaseName = line.phaseId
          ? (phaseNameById.get(line.phaseId)?.toLowerCase() ?? "")
          : "";
        const phaseMatch = phaseName.includes(query);
        if (!codeMatch && !nameMatch && !areaMatch && !phaseMatch) {
          return false;
        }
      }
      return true;
    });
  }, [budgetLines, projectFilter, areaFilter, searchQuery, phaseNameById]);

  // Sort filtered lines according to selected value order
  const sortedLines = useMemo(() => {
    const list = [...visibleLines];
    switch (sortOption) {
      case "approved-desc":
        return list.sort((a, b) => b.approved - a.approved);
      case "approved-asc":
        return list.sort((a, b) => a.approved - b.approved);
      case "available-desc":
        return list.sort((a, b) => calculateAvailableBalance(b) - calculateAvailableBalance(a));
      case "available-asc":
        return list.sort((a, b) => calculateAvailableBalance(a) - calculateAvailableBalance(b));
      case "committed-desc":
        return list.sort((a, b) => b.committed - a.committed);
      case "executed-desc":
        return list.sort((a, b) => b.executed - a.executed);
      case "code-asc":
        return list.sort((a, b) => a.code.localeCompare(b.code));
      case "name-asc":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "default":
      default:
        return list;
    }
  }, [visibleLines, sortOption]);

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

  const totalProjectLines = useMemo(
    () =>
      budgetLines.filter((line) => projectFilter === "all" || line.projectId === projectFilter)
        .length,
    [budgetLines, projectFilter],
  );

  const hasActiveFilters =
    searchQuery.trim() !== "" || areaFilter !== "Todas" || sortOption !== "default";

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

      {/* BARRA DE FILTROS, BUSCADOR RÁPIDO Y ORDENAMIENTO POR VALORES */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Filtros por Área (Píldoras) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(["Todas", ...BUDGET_AREAS] as AreaFilter[]).map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setAreaFilter(area)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                  areaFilter === area
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                )}
              >
                {area}
              </button>
            ))}
          </div>

          {/* Buscador Rápido y Selector de Ordenamiento */}
          <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
            {/* Buscador Rápido de Texto Libre */}
            <div className="relative min-w-[240px] sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar código o nombre..."
                className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Selector Desplegable de Ordenamiento por Valor */}
            <div className="min-w-[210px]">
              <Select
                value={sortOption}
                onValueChange={(val) => setSortOption(val as BudgetSortKey)}
              >
                <SelectTrigger className="h-9 rounded-full border-border bg-card px-3.5 text-xs font-medium shadow-none focus:ring-1 focus:ring-primary">
                  <div className="flex items-center gap-2 truncate">
                    <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Ordenar por..." />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border bg-popover text-xs shadow-lg">
                  <SelectItem value="default" className="text-xs">
                    Orden predeterminado
                  </SelectItem>
                  <SelectItem value="approved-desc" className="text-xs">
                    Mayor a menor presupuesto aprobado
                  </SelectItem>
                  <SelectItem value="approved-asc" className="text-xs">
                    Menor a mayor presupuesto aprobado
                  </SelectItem>
                  <SelectItem value="available-desc" className="text-xs">
                    Mayor saldo disponible
                  </SelectItem>
                  <SelectItem value="available-asc" className="text-xs">
                    Menor saldo disponible (Crítico primero)
                  </SelectItem>
                  <SelectItem value="executed-desc" className="text-xs">
                    Mayor monto ejecutado
                  </SelectItem>
                  <SelectItem value="committed-desc" className="text-xs">
                    Mayor monto comprometido
                  </SelectItem>
                  <SelectItem value="code-asc" className="text-xs">
                    Código de partida (A-Z)
                  </SelectItem>
                  <SelectItem value="name-asc" className="text-xs">
                    Nombre de partida (A-Z)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Barra de Retroalimentación de Filtros Activos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-border/50 bg-secondary/50 px-3.5 py-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                Mostrando <strong className="text-foreground">{sortedLines.length}</strong> de{" "}
                {totalProjectLines} partidas
              </span>
              {searchQuery.trim() !== "" && (
                <span className="pill-badge bg-primary/10 text-[11px] font-semibold text-primary">
                  Búsqueda: "{searchQuery}"
                </span>
              )}
              {areaFilter !== "Todas" && (
                <span className="pill-badge bg-secondary text-[11px] font-semibold text-foreground">
                  Área: {areaFilter}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setAreaFilter("Todas");
                setSortOption("default");
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </div>

      <div className="surface-card">
        <BudgetMatrix budgetLines={sortedLines} phaseNameById={phaseNameById} />
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
