import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, ClipboardCheck, FileClock, HardHat, MapPin, RefreshCw } from "lucide-react";

import { BudgetHealthBadge } from "@/components/budget/BudgetMatrix";
import { PROJECTS, calculateAvailableBalance, evaluateBudgetHealth, formatCurrency } from "@/config/erpConfig";
import { useErp } from "@/context/ErpContext";

export const Route = createFileRoute("/_erp/dashboard")({
  head: () => ({
    meta: [
      { title: "Centro de Control Financiero · Clear Minds ERP" },
      { name: "description", content: "Panel ejecutivo de presupuestos, activos inmobiliarios, alertas y pendientes." },
      { property: "og:title", content: "Centro de Control Financiero · Clear Minds ERP" },
      { property: "og:description", content: "Panel ejecutivo de presupuestos, activos, alertas y pendientes." },
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
  const { budgetLines, phases, projectFilter } = useErp();
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
  const available = calculateAvailableBalance(totals);
  const alertLines = visibleLines.filter((line) => evaluateBudgetHealth(line) !== "healthy");

  const committedPercent = totals.approved > 0 ? (totals.committed / totals.approved) * 100 : 0;
  const executedPercent = totals.approved > 0 ? (totals.executed / totals.approved) * 100 : 0;
  const availablePercent = Math.max(0, 100 - committedPercent - executedPercent);

  const distributionSegments = [
    { label: "Comprometido", amount: totals.committed, percent: committedPercent, barClass: "bg-primary" },
    { label: "Ejecutado", amount: totals.executed, percent: executedPercent, barClass: "bg-foreground" },
    { label: "Disponible", amount: available, percent: availablePercent, barClass: "bg-border" },
  ];

  const keyFigures = [
    { label: "Presupuesto Total", amount: totals.approved },
    { label: "Comprometido", amount: totals.committed },
    { label: "Ejecutado", amount: totals.executed },
    { label: "Disponible", amount: available, isPrimary: true },
  ];

  return (
    <div>
      {/* Cabecera ejecutiva */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-title text-3xl text-foreground xl:text-4xl">Centro de Control Financiero</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> Quito, Ecuador
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground">
          <RefreshCw className="h-3.5 w-3.5 text-primary" />
          Periodo Fiscal 2026 - Q4 · Sincronizado con Oracle
        </span>
      </div>

      {/* Panel Financiero Ejecutivo */}
      <section className="surface-card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-[0.08em] text-muted-foreground">DISTRIBUCIÓN DEL PRESUPUESTO</h2>
          <p className="text-sm text-muted-foreground">
            Total <span className="font-bold text-foreground tabular-nums">{formatCurrency(totals.approved)}</span>
          </p>
        </div>

        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-secondary">
          {distributionSegments.map((segment) => (
            <div key={segment.label} className={segment.barClass} style={{ width: `${segment.percent}%` }} title={`${segment.label} ${segment.percent.toFixed(1)}%`} />
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
          {distributionSegments.map((segment) => (
            <span key={segment.label} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`h-2.5 w-2.5 rounded-full ${segment.barClass}`} />
              {segment.label} · {segment.percent.toFixed(1)}%
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-6 border-t border-border pt-6 sm:grid-cols-2 xl:grid-cols-4">
          {keyFigures.map((figure) => (
            <div key={figure.label}>
              <p className="text-sm font-medium text-muted-foreground">{figure.label}</p>
              <p className={`mt-2 text-3xl font-bold tracking-tight tabular-nums ${figure.isPrimary ? "text-primary" : "text-foreground"}`}>
                {formatCurrency(figure.amount)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        {/* Fichas de activos inmobiliarios */}
        <div className="grid content-start items-start gap-6 md:grid-cols-2">
          {visibleProjects.map((project) => {
            const projectPhases = phases.filter((phase) => phase.projectId === project.id);
            const averageProgress = Math.round(projectPhases.reduce((sum, phase) => sum + phase.progressPercent, 0) / projectPhases.length);
            const soldPercent = Math.round((project.soldLots / project.totalLots) * 100);
            return (
              <Link key={project.id} to="/proyectos" className="surface-card group overflow-hidden p-0">
                <img src={project.imageUrl} alt={`Masterplan de ${project.name}`} className="aspect-[16/9] w-full object-cover" loading="lazy" width={1280} height={800} />
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tight">{project.name}</h3>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {project.location}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Lotes vendidos</p>
                      <p className="mt-1 text-lg font-bold tabular-nums">
                        {project.soldLots}<span className="text-sm font-medium text-muted-foreground">/{project.totalLots}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{soldPercent}% comercializado</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Avance de obra</p>
                      <p className="mt-1 text-lg font-bold tabular-nums">{averageProgress}%</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${averageProgress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Sección operativa de alta prioridad */}
        <div className="grid content-start gap-6">
          <section className="rounded-[18px] border border-border bg-background p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-[0.08em] text-foreground">
              <AlertTriangle className="h-4 w-4 text-primary" /> ALERTAS PRESUPUESTARIAS
            </h3>
            <div className="mt-2 divide-y divide-border">
              {alertLines.length === 0 && <p className="py-3 text-sm text-muted-foreground">Sin alertas activas.</p>}
              {alertLines.map((line) => (
                <div key={line.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{line.name}</p>
                    <BudgetHealthBadge budgetLine={line} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{line.code} · Disponible {formatCurrency(calculateAvailableBalance(line))}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] border border-border bg-background p-6">
            <h3 className="text-sm font-semibold tracking-[0.08em] text-foreground">BANDEJA DE PENDIENTES</h3>
            <div className="mt-2 divide-y divide-border">
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
          </section>
        </div>
      </div>
    </div>
  );
}
