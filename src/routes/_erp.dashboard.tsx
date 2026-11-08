import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, ClipboardCheck, Coins, FileClock, HardHat, Landmark, Wallet } from "lucide-react";

import { BudgetHealthBadge } from "@/components/budget/BudgetMatrix";
import { PageHeader } from "@/components/PageHeader";
import { PROJECTS, calculateAvailableBalance, evaluateBudgetHealth, formatCurrency } from "@/config/erpConfig";
import { useErp } from "@/context/ErpContext";

export const Route = createFileRoute("/_erp/dashboard")({
  head: () => ({
    meta: [
      { title: "Tablero · Clear Minds ERP" },
      { name: "description", content: "Indicadores presupuestarios, alertas y pendientes de los proyectos inmobiliarios." },
      { property: "og:title", content: "Tablero · Clear Minds ERP" },
      { property: "og:description", content: "Indicadores presupuestarios, alertas y pendientes." },
    ],
  }),
  component: DashboardPage,
});

const PENDING_TASKS = [
  { title: "Aprobar requerimiento REQ-0142 · Tuberías PVC 6\"", area: "Logística", icon: ClipboardCheck, dueLabel: "Hoy" },
  { title: "Valorización N.º 5 · Agua y Desagüe París", area: "Proyectos", icon: HardHat, dueLabel: "Mañana" },
  { title: "Conciliar comprobantes con Contasis", area: "Finanzas", icon: FileClock, dueLabel: "12 nov" },
  { title: "Responder 7 tickets de posventa", area: "Posventa", icon: ClipboardCheck, dueLabel: "Esta semana" },
];

function DashboardPage() {
  const { budgetLines, phases, projectFilter, activeRole } = useErp();
  const visibleLines = budgetLines.filter((line) => projectFilter === "all" || line.projectId === projectFilter);
  const visibleProjects = PROJECTS.filter((project) => projectFilter === "all" || project.id === projectFilter);

  const totals = visibleLines.reduce(
    (accumulator, line) => ({
      approved: accumulator.approved + line.approved,
      committed: accumulator.committed + line.committed,
      executed: accumulator.executed + line.executed,
    }),
    { approved: 0, committed: 0, executed: 0 },
  );
  const alertLines = visibleLines.filter((line) => evaluateBudgetHealth(line) !== "healthy");

  const kpiCards = [
    { label: "Aprobado", amount: totals.approved, icon: Landmark },
    { label: "Comprometido", amount: totals.committed, icon: FileClock },
    { label: "Ejecutado", amount: totals.executed, icon: Coins },
    { label: "Disponible", amount: calculateAvailableBalance(totals), icon: Wallet, isPrimary: true },
  ];

  return (
    <div>
      <PageHeader code="P-01" title={`Hola, ${activeRole?.personName.split(" ")[0] ?? ""}`} description="Resumen consolidado de presupuestos, obras y pendientes." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <div key={kpi.label} className={kpi.isPrimary ? "surface-card border-primary bg-primary text-primary-foreground" : "surface-card"}>
              <div className="flex items-center justify-between">
                <p className={kpi.isPrimary ? "text-sm font-medium text-primary-foreground/80" : "text-sm font-medium text-muted-foreground"}>{kpi.label}</p>
                <span className={kpi.isPrimary ? "grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/15" : "grid h-9 w-9 place-items-center rounded-full bg-secondary"}>
                  <KpiIcon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums">{formatCurrency(kpi.amount)}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="grid content-start items-start gap-6 md:grid-cols-2">
          {visibleProjects.map((project) => {
            const projectPhases = phases.filter((phase) => phase.projectId === project.id);
            const averageProgress = Math.round(projectPhases.reduce((sum, phase) => sum + phase.progressPercent, 0) / projectPhases.length);
            return (
              <Link key={project.id} to="/proyectos" className="surface-card group overflow-hidden p-0">
                <img src={project.imageUrl} alt={`Render de ${project.name}`} className="aspect-[16/9] w-full object-cover" loading="lazy" width={1280} height={800} />
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tight">{project.name}</h3>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{project.location}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span>{project.soldLots}/{project.totalLots} lotes vendidos</span>
                    <span className="font-semibold">{averageProgress}% avance</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${averageProgress}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid content-start gap-6">
          <div className="surface-card">
            <h3 className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> Alertas presupuestarias</h3>
            <div className="mt-4 space-y-3">
              {alertLines.length === 0 && <p className="text-sm text-muted-foreground">Sin alertas activas.</p>}
              {alertLines.map((line) => (
                <div key={line.id} className="rounded-[18px] bg-secondary p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{line.name}</p>
                    <BudgetHealthBadge budgetLine={line} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{line.code} · Disponible {formatCurrency(calculateAvailableBalance(line))}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="surface-card">
            <h3 className="font-bold">Bandeja de pendientes</h3>
            <div className="mt-4 divide-y divide-border">
              {PENDING_TASKS.map((task) => {
                const TaskIcon = task.icon;
                return (
                  <div key={task.title} className="flex items-center gap-3 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary"><TaskIcon className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.area}</p>
                    </div>
                    <span className="text-xs font-semibold text-primary">{task.dueLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
