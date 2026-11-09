import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  CalendarRange,
  CheckCircle2,
  Clock,
  Compass,
  Construction,
  DollarSign,
  Droplets,
  FileText,
  Grid3x3,
  HardHat,
  Layers,
  MapPin,
  Route as RoadIcon,
  Shovel,
  Trees,
  UserCheck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { BlueprintPlan } from "@/components/BlueprintPlan";
import { PageHeader } from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  calculateAvailableBalance,
  formatCurrency,
  PROJECTS,
  type PhaseStatus,
  type ProjectPhase,
} from "@/config/erpConfig";
import { useErp } from "@/context/ErpContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_erp/proyectos")({
  head: () => ({
    meta: [
      { title: "Presupuestos y Proyectos · ClearEstate ERP" },
      {
        name: "description",
        content:
          "Masterplan, fases de obra tercerizada y avance constructivo de Proyecto París y Proyecto Sagaleta.",
      },
      { property: "og:title", content: "Presupuestos y Proyectos · ClearEstate ERP" },
      {
        property: "og:description",
        content: "Fases de obra y avance constructivo por proyecto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

function getPhaseIcon(name: string) {
  const lower = name.toLowerCase();
  if (
    lower.includes("agua") ||
    lower.includes("hidro") ||
    lower.includes("desagüe") ||
    lower.includes("reservorio")
  ) {
    return Droplets;
  }
  if (
    lower.includes("vía") ||
    lower.includes("pista") ||
    lower.includes("pavimento") ||
    lower.includes("acceso")
  ) {
    return RoadIcon;
  }
  if (
    lower.includes("comunal") ||
    lower.includes("paisaj") ||
    lower.includes("parque") ||
    lower.includes("mirador")
  ) {
    return Trees;
  }
  if (
    lower.includes("tierra") ||
    lower.includes("rasante") ||
    lower.includes("terraza") ||
    lower.includes("habilitación")
  ) {
    return Shovel;
  }
  return Construction;
}

interface StatusBadgeConfig {
  label: string;
  className: string;
  dotClassName: string;
}

function getPhaseStatusConfig(status: PhaseStatus): StatusBadgeConfig {
  switch (status) {
    case "Completada":
      return {
        label: "Completada",
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
        dotClassName: "bg-emerald-500",
      };
    case "En ejecución":
      return {
        label: "En ejecución",
        className: "bg-primary/10 text-primary border border-primary/20",
        dotClassName: "bg-primary animate-pulse",
      };
    case "Licitación":
      return {
        label: "En licitación",
        className: "bg-amber-50 text-amber-700 border border-amber-200/60",
        dotClassName: "bg-amber-500",
      };
    case "Planificada":
    default:
      return {
        label: "Planificada",
        className: "bg-slate-100 text-slate-700 border border-slate-200/60",
        dotClassName: "bg-slate-400",
      };
  }
}

type PhaseFilterOption = "all" | PhaseStatus;

function ProjectsPage() {
  const { phases, budgetLines, projectFilter } = useErp();
  const [selectedPhaseForModal, setSelectedPhaseForModal] = useState<ProjectPhase | null>(null);
  const [phaseFilterByProject, setPhaseFilterByProject] = useState<
    Record<string, PhaseFilterOption>
  >({});

  const visibleProjects = useMemo(
    () => PROJECTS.filter((project) => projectFilter === "all" || project.id === projectFilter),
    [projectFilter],
  );

  return (
    <div>
      <PageHeader
        title="Proyectos y Fases"
        description="Habilitación urbana tercerizada por proyecto, con presupuesto vinculado a cada fase."
      />

      <div className="space-y-8">
        {visibleProjects.map((project) => {
          const projectPhases = phases.filter((phase) => phase.projectId === project.id);
          const activeFilter = phaseFilterByProject[project.id] ?? "all";

          const filteredPhases = projectPhases.filter((phase) => {
            if (activeFilter === "all") return true;
            return phase.status === activeFilter;
          });

          // Calculations for the executive progress summary
          const projectLines = budgetLines.filter((line) => line.projectId === project.id);
          const totalApproved = projectLines.reduce((sum, line) => sum + line.approved, 0);
          const totalCommitted = projectLines.reduce((sum, line) => sum + line.committed, 0);
          const totalExecuted = projectLines.reduce((sum, line) => sum + line.executed, 0);
          const totalAvailable = projectLines.reduce(
            (sum, line) => sum + calculateAvailableBalance(line),
            0,
          );

          // Weighted physical progress
          const weightedProgress =
            projectPhases.length > 0
              ? Math.round(
                  projectPhases.reduce((acc, p) => acc + p.progressPercent, 0) /
                    projectPhases.length,
                )
              : 0;

          const completedCount = projectPhases.filter((p) => p.status === "Completada").length;
          const inProgressCount = projectPhases.filter((p) => p.status === "En ejecución").length;
          const tenderCount = projectPhases.filter((p) => p.status === "Licitación").length;

          const salesPercent = Math.round((project.soldLots / project.totalLots) * 100);

          return (
            <section
              key={project.id}
              className="surface-card overflow-hidden p-0 transition-shadow duration-300 hover:shadow-md"
            >
              {/* UPPER SECTION: Harmoniously balanced 2-column layout to eliminate empty space */}
              <div className="grid gap-0 border-b border-border lg:grid-cols-[1.2fr_1.1fr]">
                {/* LEFT COLUMN: Render image + Executive Progress Panel (fills the vertical space flush with the right column) */}
                <div className="flex flex-col border-b border-border bg-card lg:border-b-0 lg:border-r">
                  {/* Masterplan 3D Image Banner */}
                  <div className="relative h-[250px] w-full overflow-hidden bg-muted">
                    <img
                      src={project.imageUrl}
                      alt={`Masterplan de ${project.name}`}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                      width={1280}
                      height={800}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className="pill-badge border border-white/20 bg-black/60 text-[11px] font-semibold text-white backdrop-blur-md">
                        <Compass className="mr-1 inline h-3 w-3 text-primary" />
                        Masterplan 3D Oficial
                      </span>
                      <span className="pill-badge bg-primary text-[11px] font-semibold text-white shadow-sm">
                        En Desarrollo
                      </span>
                    </div>
                    <div className="absolute bottom-3.5 left-4 right-4 text-white">
                      <p className="text-xs font-medium text-white/80">
                        Habilitación y Lotización Integral
                      </p>
                      <h3 className="text-lg font-bold tracking-tight text-white">
                        {project.name} · Plan Maestro
                      </h3>
                    </div>
                  </div>

                  {/* Executive Project Progress & Financial Breakdown */}
                  <div className="flex flex-1 flex-col justify-between space-y-4 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Layers className="h-4 w-4" />
                        </span>
                        <h4 className="text-sm font-bold text-foreground">
                          Resumen Ejecutivo de Ejecución
                        </h4>
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Actualizado en tiempo real
                      </span>
                    </div>

                    {/* Weighted Physical Progress Bar */}
                    <div className="rounded-[18px] border border-border/60 bg-secondary/50 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-semibold text-foreground">
                          <HardHat className="h-4 w-4 text-primary" />
                          Avance Físico Ponderado de Obras
                        </span>
                        <span className="text-base font-extrabold text-primary">
                          {weightedProgress}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${weightedProgress}%` }}
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>4 fases constructivas activas</span>
                        <span>
                          {completedCount} entregadas · {inProgressCount} en curso · {tenderCount}{" "}
                          en licitación
                        </span>
                      </div>
                    </div>

                    {/* Financial Metrics Micro-Grid */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="rounded-[16px] border border-border/50 bg-secondary/40 p-3">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Presupuesto Aprobado
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-foreground">
                          {formatCurrency(totalApproved)}
                        </p>
                      </div>
                      <div className="rounded-[16px] border border-border/50 bg-secondary/40 p-3">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Ejecutado a la Fecha
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-primary">
                          {formatCurrency(totalExecuted)}
                        </p>
                      </div>
                      <div className="rounded-[16px] border border-border/50 bg-secondary/40 p-3">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Saldo Disponible
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-emerald-600">
                          {formatCurrency(totalAvailable)}
                        </p>
                      </div>
                    </div>

                    {/* Commercial Sales Progress */}
                    <div className="rounded-[16px] border border-border/60 bg-card p-3.5">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground">
                          Ritmo Comercial de Ventas
                        </span>
                        <span className="font-bold text-foreground">
                          {project.soldLots} de {project.totalLots} lotes colocados ({salesPercent}
                          %)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${salesPercent}%` }}
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <CalendarRange className="h-3.5 w-3.5 text-primary" />
                          Entrega estimada:{" "}
                          <strong className="text-foreground">
                            {project.id === "paris" ? "Q3 2027" : "Q1 2028"}
                          </strong>
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          En cronograma
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Project Details + Urban Blueprint */}
                <div className="flex flex-col justify-between p-6">
                  <div>
                    <h2 className="display-title text-3xl">{project.name}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      {project.location}
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Lotes Totales", value: project.totalLots },
                        { label: "Vendidos", value: project.soldLots },
                        { label: "Hectáreas", value: `${project.areaHectares} ha` },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-[18px] border border-border/50 bg-secondary/70 px-2 py-2.5"
                        >
                          <p className="text-lg font-bold text-foreground">{stat.value}</p>
                          <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blueprint Block */}
                  <div className="mt-4 border-t border-border/60 pt-3.5">
                    <div className="mb-2.5 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground">
                        <Grid3x3 className="h-3.5 w-3.5 text-primary" />
                        PLANO DE URBANIZACIÓN Y LOTIZACIÓN
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        Pasa el cursor sobre un lote
                      </span>
                    </div>
                    <BlueprintPlan />
                  </div>
                </div>
              </div>

              {/* LOWER SECTION: Interactive Detailed Construction Phases */}
              <div className="p-6">
                {/* Section Header with Status Filter Pills */}
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="display-title text-xl">Fases Constructivas del Proyecto</h3>
                    <p className="text-xs text-muted-foreground">
                      Desglose técnico de contratos tercerizados, porcentaje de avance físico y
                      saldo presupuestario vinculado.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: "all", label: `Todas (${projectPhases.length})` },
                        { id: "En ejecución", label: "En ejecución" },
                        { id: "Licitación", label: "En licitación" },
                        { id: "Completada", label: "Completadas" },
                      ] as const
                    ).map((filter) => {
                      const isSelected = activeFilter === filter.id;
                      return (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() =>
                            setPhaseFilterByProject((prev) => ({
                              ...prev,
                              [project.id]: filter.id,
                            }))
                          }
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                          )}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Phase Cards Grid */}
                {filteredPhases.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No hay fases en este estado actualmente.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredPhases.map((phase) => {
                      const PhaseIcon = getPhaseIcon(phase.name);
                      const statusConfig = getPhaseStatusConfig(phase.status);

                      // Calculate financial balance for this specific phase
                      const phaseLines = budgetLines.filter((line) => line.phaseId === phase.id);
                      const phaseBudgetApproved =
                        phaseLines.length > 0
                          ? phaseLines.reduce((sum, line) => sum + line.approved, 0)
                          : phase.budgetAllocated || 0;
                      const phaseAvailable =
                        phaseLines.length > 0
                          ? phaseLines.reduce(
                              (sum, line) => sum + calculateAvailableBalance(line),
                              0,
                            )
                          : phase.budgetAllocated || 0;

                      return (
                        <div
                          key={phase.id}
                          className="group flex flex-col justify-between rounded-[22px] border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
                        >
                          <div>
                            {/* Card Top: Icon & Semantic Status Badge */}
                            <div className="flex items-center justify-between">
                              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary/80 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                                <PhaseIcon className="h-5 w-5" />
                              </span>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                                  statusConfig.className,
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    statusConfig.dotClassName,
                                  )}
                                />
                                {statusConfig.label}
                              </span>
                            </div>

                            {/* Phase Name & Contractor */}
                            <h4 className="mt-3.5 text-base font-bold leading-snug text-foreground">
                              {phase.name}
                            </h4>
                            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                              <span className="truncate">{phase.contractor}</span>
                            </p>

                            {/* Physical Progress */}
                            <div className="mt-4 rounded-xl border border-border/40 bg-secondary/50 p-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-muted-foreground">
                                  Avance físico
                                </span>
                                <span className="font-extrabold text-foreground">
                                  {phase.progressPercent}%
                                </span>
                              </div>
                              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    phase.progressPercent === 100
                                      ? "bg-emerald-500"
                                      : phase.progressPercent > 0
                                        ? "bg-primary"
                                        : "bg-muted-foreground/20",
                                  )}
                                  style={{ width: `${Math.max(phase.progressPercent, 4)}%` }}
                                />
                              </div>
                            </div>

                            {/* Schedule Dates */}
                            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <CalendarRange className="h-3.5 w-3.5 shrink-0 text-primary" />
                              <span>
                                {phase.startDate} → {phase.endDate}
                              </span>
                            </div>

                            {/* Linked Financial Info */}
                            <div className="mt-3.5 space-y-1 rounded-xl border border-border/50 bg-secondary/30 p-2.5 text-xs">
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span>Presupuesto asignado:</span>
                                <span className="font-semibold text-foreground">
                                  {formatCurrency(phaseBudgetApproved)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span>Saldo disponible:</span>
                                <span className="font-bold text-emerald-600">
                                  {formatCurrency(phaseAvailable)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Action: Open Detail Dialog */}
                          <button
                            type="button"
                            onClick={() => setSelectedPhaseForModal(phase)}
                            className="mt-4 flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-[14px] bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition-all hover:bg-primary hover:text-white"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Ver detalle técnico
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* DETAILED TECHNICAL PHASE DIALOG */}
      <Dialog
        open={!!selectedPhaseForModal}
        onOpenChange={(open) => !open && setSelectedPhaseForModal(null)}
      >
        <DialogContent className="max-w-2xl rounded-[28px] border-border p-6 shadow-2xl">
          {selectedPhaseForModal && (
            <div className="space-y-6">
              {/* Header */}
              <DialogHeader className="border-b border-border pb-4 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="pill-badge bg-secondary font-semibold text-primary">
                      {selectedPhaseForModal.id.toUpperCase()}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {selectedPhaseForModal.projectId === "paris"
                        ? "Proyecto París"
                        : "Proyecto Sagaleta"}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                      getPhaseStatusConfig(selectedPhaseForModal.status).className,
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        getPhaseStatusConfig(selectedPhaseForModal.status).dotClassName,
                      )}
                    />
                    {getPhaseStatusConfig(selectedPhaseForModal.status).label}
                  </span>
                </div>

                <DialogTitle className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {selectedPhaseForModal.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {selectedPhaseForModal.description ||
                    "Detalle de especificaciones técnicas, cronograma de obra y fiscalización presupuestaria."}
                </DialogDescription>
              </DialogHeader>

              {/* Technical Overview Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-[18px] border border-border bg-secondary/50 p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Contratista</p>
                  <p className="mt-1 truncate text-xs font-bold text-foreground">
                    {selectedPhaseForModal.contractor}
                  </p>
                </div>
                <div className="rounded-[18px] border border-border bg-secondary/50 p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Supervisor / Obra</p>
                  <p className="mt-1 truncate text-xs font-bold text-foreground">
                    {selectedPhaseForModal.supervisor || "Ing. Marcos Ríos"}
                  </p>
                </div>
                <div className="rounded-[18px] border border-border bg-secondary/50 p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Plazo Contractual</p>
                  <p className="mt-1 text-xs font-bold text-foreground">
                    {selectedPhaseForModal.startDate} → {selectedPhaseForModal.endDate}
                  </p>
                </div>
                <div className="rounded-[18px] border border-border bg-secondary/50 p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Avance Físico</p>
                  <p className="mt-1 text-base font-extrabold text-primary">
                    {selectedPhaseForModal.progressPercent}%
                  </p>
                </div>
              </div>

              {/* Technical Milestones Checklist */}
              <div>
                <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Hitos Constructivos y Fiscalización
                </h4>
                <div className="space-y-2 rounded-[20px] border border-border bg-card p-4">
                  {(
                    selectedPhaseForModal.milestones || [
                      {
                        id: "m-1",
                        name: "Aprobación de replanteo y expediente técnico",
                        completed: true,
                      },
                      {
                        id: "m-2",
                        name: "Ejecución de obra principal tercerizada",
                        completed: true,
                      },
                      {
                        id: "m-3",
                        name: "Pruebas técnicas de control de calidad",
                        completed: false,
                      },
                      { id: "m-4", name: "Acta de entrega y recepción de obra", completed: false },
                    ]
                  ).map((milestone) => (
                    <div
                      key={milestone.id}
                      className={cn(
                        "flex items-center justify-between rounded-[14px] p-2.5 text-xs transition-colors",
                        milestone.completed
                          ? "border border-emerald-100 bg-emerald-50/60 text-emerald-950"
                          : "border border-border/60 bg-secondary/40 text-muted-foreground",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {milestone.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground/60" />
                        )}
                        <span className={cn(milestone.completed && "font-semibold")}>
                          {milestone.name}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          milestone.completed
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {milestone.completed ? "Conforme" : "Pendiente"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Financial Breakdown */}
              {(() => {
                const lines = budgetLines.filter(
                  (line) => line.phaseId === selectedPhaseForModal.id,
                );
                const approvedSum =
                  lines.length > 0
                    ? lines.reduce((s, l) => s + l.approved, 0)
                    : selectedPhaseForModal.budgetAllocated || 0;
                const committedSum = lines.reduce((s, l) => s + l.committed, 0);
                const executedSum = lines.reduce((s, l) => s + l.executed, 0);
                const availableSum =
                  lines.length > 0
                    ? lines.reduce((s, l) => s + calculateAvailableBalance(l), 0)
                    : selectedPhaseForModal.budgetAllocated || 0;

                return (
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Balance Financiero de la Fase
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-[16px] border border-border bg-secondary/30 p-3">
                        <p className="text-[11px] text-muted-foreground">Aprobado</p>
                        <p className="text-sm font-bold text-foreground">
                          {formatCurrency(approvedSum)}
                        </p>
                      </div>
                      <div className="rounded-[16px] border border-border bg-secondary/30 p-3">
                        <p className="text-[11px] text-muted-foreground">Comprometido</p>
                        <p className="text-sm font-bold text-amber-600">
                          {formatCurrency(committedSum)}
                        </p>
                      </div>
                      <div className="rounded-[16px] border border-border bg-secondary/30 p-3">
                        <p className="text-[11px] text-muted-foreground">Ejecutado</p>
                        <p className="text-sm font-bold text-primary">
                          {formatCurrency(executedSum)}
                        </p>
                      </div>
                      <div className="rounded-[16px] border border-border bg-secondary/30 p-3">
                        <p className="text-[11px] text-muted-foreground">Saldo Disponible</p>
                        <p className="text-sm font-bold text-emerald-600">
                          {formatCurrency(availableSum)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPhaseForModal(null)}
                  className="rounded-[16px] bg-secondary px-5 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-secondary/80"
                >
                  Cerrar ficha técnica
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
