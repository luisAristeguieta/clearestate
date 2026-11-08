import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, Building2, Check, ClipboardCheck, MapPin, RefreshCw, Wallet } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { buildCriticalActions } from "@/config/dashboardConfig";
import { PROJECTS, calculateAvailableBalance, formatCurrency, type ProjectId } from "@/config/erpConfig";
import { useErp } from "@/context/ErpContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_erp/dashboard")({
  head: () => ({
    meta: [
      { title: "Tablero Inmobiliario · Clear Minds ERP" },
      { name: "description", content: "Saldo disponible, inversión de los proyectos París y Sagaleta y acciones prioritarias en Quito, Ecuador." },
      { property: "og:title", content: "Tablero Inmobiliario · Clear Minds ERP" },
      { property: "og:description", content: "Control financiero y seguimiento inmobiliario de París y Sagaleta en Quito." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

export function getTimeGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function DashboardPage() {
  const { budgetLines, projectFilter, activeRole } = useErp();
  const greeting = `${getTimeGreeting(new Date().getHours())}, ${activeRole?.personName ?? ""} · ${activeRole?.jobTitle ?? ""}`;
  const [selectedProjectId, setSelectedProjectId] = useState<ProjectId>("paris");
  const visibleLines = budgetLines.filter((line) => projectFilter === "all" || line.projectId === projectFilter);
  const visibleProjects = PROJECTS.filter((project) => projectFilter === "all" || project.id === projectFilter);
  const selectedProject = visibleProjects.find((project) => project.id === selectedProjectId) ?? visibleProjects[0];
  const totals = visibleLines.reduce(
    (accumulator, line) => ({
      approved: accumulator.approved + line.approved,
      committed: accumulator.committed + line.committed,
      executed: accumulator.executed + line.executed,
    }),
    { approved: 0, committed: 0, executed: 0 },
  );
  const available = calculateAvailableBalance(totals);
  const availablePercent = totals.approved > 0 ? (available / totals.approved) * 100 : 0;
  const actions = buildCriticalActions(budgetLines, projectFilter);
  const urgentCount = actions.filter((action) => action.priority <= 2).length;
  const projectInvestment = budgetLines
    .filter((line) => line.projectId === selectedProject?.id && line.area === "Proyectos y Obras")
    .reduce((accumulator, line) => ({ approved: accumulator.approved + line.approved, executed: accumulator.executed + line.executed }), { approved: 0, executed: 0 });
  const investmentPercent = projectInvestment.approved > 0 ? Math.round((projectInvestment.executed / projectInvestment.approved) * 100) : 0;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Quito, Ecuador · Portafolio inmobiliario</p>
          <p className="mt-3 text-sm font-medium text-muted-foreground">{greeting}</p>
          <h1 className="display-title mt-1 text-3xl text-foreground">Centro de Control Financiero</h1>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 text-primary" /> Periodo fiscal 2026 · Q4
        </span>
      </div>

      <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section aria-labelledby="balance-title" className="rounded-[28px] border border-border bg-background p-6 sm:p-8 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="balance-title" className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Wallet className="h-4 w-4 text-primary" /> Saldo Disponible Total</h2>
            <span className="text-xs text-muted-foreground">{projectFilter === "all" ? "París + Sagaleta" : selectedProject?.name} · USD</span>
          </div>
          <div className="mt-5 grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <p className="display-title break-words text-4xl tabular-nums text-primary sm:text-5xl 2xl:text-6xl">{formatCurrency(available)}</p>
              <p className="mt-3 text-xs text-muted-foreground">{availablePercent.toFixed(1)}% del presupuesto aprobado disponible</p>
            </div>
            <div className="grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-3 lg:border-t-0 lg:pt-0">
              {[
                { label: "Presupuesto Aprobado", amount: totals.approved },
                { label: "Comprometido", amount: totals.committed },
                { label: "Ejecutado", amount: totals.executed },
              ].map((figure) => (
                <div key={figure.label} className="min-w-0">
                  <p className="text-xs leading-5 text-muted-foreground">{figure.label}</p>
                  <p className="mt-1 break-words text-lg font-semibold tabular-nums text-foreground">{formatCurrency(figure.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="projects-title" className="min-w-0 overflow-hidden rounded-[28px] border border-border bg-secondary">
          <div className="p-6 pb-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="projects-title" className="display-title text-xl">Portafolio de proyectos</h2>
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2" role="group" aria-label="Seleccionar proyecto">
              {visibleProjects.map((project) => (
                <Button key={project.id} variant="ghost" onClick={() => setSelectedProjectId(project.id)} aria-pressed={selectedProject?.id === project.id}
                  className={cn("h-auto min-w-0 justify-start gap-3 rounded-[18px] border p-2 text-left whitespace-normal", selectedProject?.id === project.id ? "border-primary bg-background text-foreground" : "border-border bg-secondary text-muted-foreground")}>
                  <img src={project.imageUrl} alt="" className="h-11 w-14 shrink-0 rounded-[10px] object-cover" width={56} height={44} />
                  <span className="min-w-0 flex-1 text-xs font-semibold">{project.name}</span>
                  {selectedProject?.id === project.id && <Check className="h-4 w-4 text-primary" />}
                </Button>
              ))}
            </div>
          </div>
          {selectedProject && (
            <>
              <img src={selectedProject.imageUrl} alt={`Masterplan panorámico de ${selectedProject.name} en Quito`} className="aspect-[2/1] w-full object-cover" width={1280} height={640} />
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="display-title text-2xl">{selectedProject.name}</h3>
                  <Button asChild variant="outline" size="icon" aria-label={`Ver ${selectedProject.name}`} title={`Ver ${selectedProject.name}`}><Link to="/proyectos"><ArrowUpRight /></Link></Button>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{selectedProject.location}</p>
                <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-[1fr_1.4fr]">
                  <div>
                    <p className="text-xs text-muted-foreground">Lotes vendidos</p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums">{selectedProject.soldLots}<span className="text-sm font-normal text-muted-foreground"> / {selectedProject.totalLots}</span></p>
                    <p className="mt-1 text-xs text-muted-foreground">{Math.round((selectedProject.soldLots / selectedProject.totalLots) * 100)}% comercializado</p>
                  </div>
                  <div>
                    <div className="flex justify-between gap-2 text-xs"><span className="text-muted-foreground">Inversión de obra</span><span className="font-semibold text-primary">{investmentPercent}%</span></div>
                    <div role="progressbar" aria-label="Inversión de obra ejecutada" aria-valuenow={investmentPercent} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, investmentPercent)}%` }} /></div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground"><span className="font-semibold text-foreground">{formatCurrency(projectInvestment.executed)}</span> ejecutados de {formatCurrency(projectInvestment.approved)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        <section aria-labelledby="actions-title" className="min-w-0 rounded-[28px] border border-border bg-background p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="actions-title" className="display-title text-xl">Acciones Críticas del Día</h2>
              <p className="mt-2 text-xs text-muted-foreground">{actions.length} acciones pendientes</p>
            </div>
            <span className="pill-badge shrink-0 bg-highlight text-highlight-foreground">{urgentCount} prioritarias</span>
          </div>
          <div className="mt-4 divide-y divide-border">
            {actions.map((action) => {
              const ActionIcon = action.isBudget ? AlertTriangle : ClipboardCheck;
              return (
                <div key={action.id} className="flex items-start gap-3 py-4">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-primary"><ActionIcon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1"><p className="text-sm font-semibold leading-5">{action.title}</p><span className="text-xs font-medium text-primary">{action.dueLabel}</span></div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{action.detail}</p>
                  </div>
                  <Button asChild variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={action.title} title={action.title}>
                    {action.isBudget ? <Link to="/presupuestos"><ArrowUpRight /></Link> : <Link to="/modulo/$moduleId" params={{ moduleId: action.moduleId ?? "aprobaciones" }}><ArrowUpRight /></Link>}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
