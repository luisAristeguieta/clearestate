import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { findModuleItem } from "@/config/erpConfig";
import { getViewTitle } from "@/config/brandConfig";

export const Route = createFileRoute("/_erp/modulo/$moduleId")({
  loader: ({ params }) => {
    const moduleItem = findModuleItem(params.moduleId);
    if (!moduleItem) throw notFound();
    return { label: moduleItem.label };
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: getViewTitle(`/modulo/${params.moduleId}`) },
      {
        name: "description",
        content: `${loaderData?.label ?? "Módulo"} del ERP inmobiliario programado para próximas fases.`,
      },
      { property: "og:title", content: getViewTitle(`/modulo/${params.moduleId}`) },
      {
        property: "og:description",
        content: `${loaderData?.label ?? "Módulo"} de ClearEstate programado para próximas fases.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ModulePage,
});

function ModulePage() {
  const { moduleId } = Route.useParams();
  const moduleItem = findModuleItem(moduleId);
  if (!moduleItem) return null;
  const ModuleIcon = moduleItem.icon;

  return (
    <div>
      <PageHeader
        title={moduleItem.label}
        description="Este módulo forma parte de las siguientes fases del ERP."
      />
      <div className="surface-card flex flex-col items-center py-16 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-secondary">
          <ModuleIcon className="h-7 w-7 text-primary" />
        </span>
        <span className="pill-badge mt-6 bg-highlight text-highlight-foreground">
          <Clock className="h-3 w-3" /> PRÓXIMA FASE
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">
          {moduleItem.label} estará disponible pronto
        </h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          La Fase 1 cubre Tablero, Proyectos y Fases y Presupuestos.
        </p>
        <Button asChild variant="ink" className="mt-6">
          <Link to="/dashboard">
            <ArrowLeft /> Ir al tablero
          </Link>
        </Button>
      </div>
    </div>
  );
}
