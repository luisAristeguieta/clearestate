import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange, Construction, Droplets, Grid3x3, MapPin, Route as RoadIcon } from "lucide-react";

import { BlueprintPlan } from "@/components/BlueprintPlan";
import { PageHeader } from "@/components/PageHeader";
import { PROJECTS, calculateAvailableBalance, formatCurrency, type ProjectPhase } from "@/config/erpConfig";
import { useErp } from "@/context/ErpContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_erp/proyectos")({
  head: () => ({
    meta: [
      { title: "Proyectos y Fases · Clear Minds ERP" },
      { name: "description", content: "Masterplan, fases de obra tercerizada y avance de Proyecto París y Proyecto Sagaleta." },
      { property: "og:title", content: "Proyectos y Fases · Clear Minds ERP" },
      { property: "og:description", content: "Fases de obra y avance por proyecto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

const PHASE_ICONS: Record<ProjectPhase["name"], typeof Construction> = {
  "Habilitación Urbana": Construction,
  "Agua y Desagüe": Droplets,
  "Pistas y Veredas": RoadIcon,
};

function ProjectsPage() {
  const { phases, budgetLines, projectFilter } = useErp();
  const visibleProjects = PROJECTS.filter((project) => projectFilter === "all" || project.id === projectFilter);

  return (
    <div>
      <PageHeader title="Proyectos y Fases" description="Habilitación urbana tercerizada por proyecto, con presupuesto vinculado a cada fase." />
      <div className="space-y-8">
        {visibleProjects.map((project) => {
          const projectPhases = phases.filter((phase) => phase.projectId === project.id);
          return (
            <section key={project.id} className="surface-card p-0">
              <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
                <img src={project.imageUrl} alt={`Masterplan de ${project.name}`} className="h-full max-h-[380px] w-full rounded-t-[28.8px] object-cover lg:rounded-l-[28.8px] lg:rounded-tr-none" loading="lazy" width={1280} height={800} />
                <div className="p-6">
                  <h2 className="display-title text-3xl">{project.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{project.location}</p>
                  <p className="mt-3 text-sm">{project.description}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Lotes", value: project.totalLots },
                      { label: "Vendidos", value: project.soldLots },
                      { label: "Hectáreas", value: project.areaHectares },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-[18px] bg-secondary py-3">
                        <p className="text-xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mb-2 mt-5 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-muted-foreground"><Grid3x3 className="h-3.5 w-3.5" />PLANO DE URBANIZACIÓN</p>
                  <BlueprintPlan />
                </div>
              </div>
              <div className="grid gap-4 border-t border-border p-6 md:grid-cols-3">
                {projectPhases.map((phase) => {
                  const PhaseIcon = PHASE_ICONS[phase.name];
                  const phaseLines = budgetLines.filter((line) => line.phaseId === phase.id);
                  const phaseAvailable = phaseLines.reduce((sum, line) => sum + calculateAvailableBalance(line), 0);
                  return (
                    <div key={phase.id} className="rounded-[22px] border border-border p-5">
                      <div className="flex items-center justify-between">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary"><PhaseIcon className="h-5 w-5" /></span>
                        <span className={cn("pill-badge", phase.status === "En ejecución" ? "bg-primary text-primary-foreground" : phase.status === "Licitación" ? "bg-highlight text-highlight-foreground" : "bg-secondary text-foreground")}>{phase.status}</span>
                      </div>
                      <h3 className="mt-4 font-bold">{phase.name}</h3>
                      <p className="text-sm text-muted-foreground">{phase.contractor}</p>
                      <div className="mt-4 flex items-center justify-between text-sm"><span>Avance</span><span className="font-semibold">{phase.progressPercent}%</span></div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${phase.progressPercent}%` }} /></div>
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CalendarRange className="h-3.5 w-3.5" />{phase.startDate} → {phase.endDate}</span>
                      </div>
                      <p className="mt-2 text-sm">Disponible: <span className="font-semibold text-primary">{formatCurrency(phaseAvailable)}</span></p>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
