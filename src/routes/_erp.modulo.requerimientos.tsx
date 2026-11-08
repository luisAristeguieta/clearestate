import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ClipboardList, Plus, Send } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { RequisitionTimeline } from "@/components/phase2/RequisitionTimeline";
import { StatusBadge } from "@/components/phase2/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getViewTitle } from "@/config/brandConfig";
import { PROJECTS, SEED_PHASES, formatCurrency, type ProjectId } from "@/config/erpConfig";
import {
  REQUISITION_STATUS_LABELS,
  evaluateRequisitionOverdraft,
  type RequisitionStatus,
} from "@/config/phase2Config";
import { useErp } from "@/context/ErpContext";

export const Route = createFileRoute("/_erp/modulo/requerimientos")({
  head: () => ({
    meta: [
      { title: getViewTitle("/modulo/requerimientos") },
      { name: "description", content: "Creación y seguimiento de requerimientos de bienes y servicios con control de saldo presupuestario." },
      { property: "og:title", content: getViewTitle("/modulo/requerimientos") },
      { property: "og:description", content: "Requerimientos de área con alerta de sobregiro presupuestario." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequisitionsPage,
});

const STATUS_TONES: Record<RequisitionStatus, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  pending_approval: "yellow",
  approved: "green",
  returned: "red",
  in_procurement: "blue",
  ordered: "blue",
  invoiced: "neutral",
};

function RequisitionsPage() {
  const { activeRole, budgetLines, requisitions, createRequisition } = useErp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [justification, setJustification] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [projectId, setProjectId] = useState<ProjectId>("paris");
  const [phaseId, setPhaseId] = useState<string>("none");
  const [budgetLineId, setBudgetLineId] = useState<string>("");
  const [overdraftJustification, setOverdraftJustification] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const projectPhases = useMemo(() => SEED_PHASES.filter((phase) => phase.projectId === projectId), [projectId]);
  const projectLines = useMemo(() => budgetLines.filter((line) => line.projectId === projectId), [budgetLines, projectId]);
  const selectedLine = budgetLines.find((line) => line.id === budgetLineId) ?? null;
  const parsedAmount = Number(estimatedAmount) || 0;
  const overdraftCheck = selectedLine && parsedAmount > 0 ? evaluateRequisitionOverdraft(selectedLine, parsedAmount) : null;

  const handleProjectChange = (nextProjectId: ProjectId) => {
    setProjectId(nextProjectId);
    setPhaseId("none");
    setBudgetLineId("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!selectedLine) throw new Error("Selecciona la partida presupuestaria.");
      const created = createRequisition({
        title: title.trim(),
        description: description.trim(),
        justification: justification.trim(),
        estimatedAmount: parsedAmount,
        projectId,
        phaseId: phaseId === "none" ? null : phaseId,
        budgetLineId: selectedLine.id,
        requesterArea: activeRole?.area ?? "General",
        overdraftJustification,
      });
      toast.success(`Requerimiento ${created.code} enviado a aprobación.`);
      setTitle("");
      setDescription("");
      setJustification("");
      setEstimatedAmount("");
      setOverdraftJustification("");
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "No se pudo crear el requerimiento.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Requerimientos y Solicitudes"
        description="Las áreas registran necesidades de bienes y servicios con control del saldo disponible de cada partida."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <form onSubmit={handleSubmit} className="surface-card space-y-5 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
              <ClipboardList className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Nuevo requerimiento</h2>
              <p className="text-sm text-muted-foreground">Solicitante: {activeRole?.personName} · {activeRole?.area}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="req-title">Título</Label>
            <Input id="req-title" required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej: Servicio de topografía etapa III" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="req-description">Descripción</Label>
            <Textarea id="req-description" required maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Detalla el bien o servicio requerido" rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="req-justification">Justificación</Label>
            <Textarea id="req-justification" required maxLength={500} value={justification} onChange={(event) => setJustification(event.target.value)} placeholder="¿Por qué es necesario este gasto?" rows={2} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Proyecto</Label>
              <Select value={projectId} onValueChange={(value) => handleProjectChange(value as ProjectId)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECTS.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fase de obra</Label>
              <Select value={phaseId} onValueChange={setPhaseId}>
                <SelectTrigger><SelectValue placeholder="Sin fase" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin fase asociada</SelectItem>
                  {projectPhases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Partida presupuestaria</Label>
            <Select value={budgetLineId} onValueChange={setBudgetLineId}>
              <SelectTrigger><SelectValue placeholder="Selecciona la partida" /></SelectTrigger>
              <SelectContent>
                {projectLines.map((line) => (
                  <SelectItem key={line.id} value={line.id}>
                    {line.code} · {line.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLine && (
              <p className="text-xs text-muted-foreground">
                Disponible actual: <span className="font-semibold text-foreground">{formatCurrency(selectedLine.approved - selectedLine.committed - selectedLine.executed)}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="req-amount">Importe estimado (USD)</Label>
            <Input id="req-amount" required type="number" min={1} step="0.01" value={estimatedAmount} onChange={(event) => setEstimatedAmount(event.target.value)} placeholder="0.00" />
          </div>

          {overdraftCheck?.isOverdrawn && (
            <div className="rounded-[18px] border border-red-200 bg-red-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                <AlertTriangle className="h-4 w-4" /> Alerta de sobregiro
              </p>
              <p className="mt-1 text-sm text-red-700">
                El importe supera el saldo disponible por {formatCurrency(overdraftCheck.deficit)}. Debes registrar una justificación detallada para continuar.
              </p>
              <Textarea
                className="mt-3 bg-background"
                required
                minLength={20}
                value={overdraftJustification}
                onChange={(event) => setOverdraftJustification(event.target.value)}
                placeholder="Justificación detallada de la excepción (mínimo 20 caracteres)"
                rows={3}
              />
            </div>
          )}

          <Button type="submit" variant="ink" className="w-full rounded-full">
            <Send /> Enviar a aprobación
          </Button>
        </form>

        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">Mis requerimientos</h2>
          {requisitions.length === 0 && (
            <div className="surface-card p-8 text-center text-muted-foreground">Aún no hay requerimientos registrados.</div>
          )}
          {requisitions.map((requisition) => (
            <article key={requisition.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{requisition.code} · {requisition.requesterArea}</p>
                  <h3 className="mt-1 text-base font-bold tracking-tight">{requisition.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{requisition.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge tone={STATUS_TONES[requisition.status]}>{REQUISITION_STATUS_LABELS[requisition.status]}</StatusBadge>
                  <span className="text-lg font-bold tracking-tight">{formatCurrency(requisition.estimatedAmount)}</span>
                </div>
              </div>
              {requisition.overdraftJustification && (
                <p className="mt-3 flex items-start gap-2 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Excepción por sobregiro: {requisition.overdraftJustification}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Creado por {requisition.createdBy}</p>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setExpandedId(expandedId === requisition.id ? null : requisition.id)}>
                  <Plus className={expandedId === requisition.id ? "rotate-45 transition-transform" : "transition-transform"} />
                  {expandedId === requisition.id ? "Ocultar historial" : "Ver historial"}
                </Button>
              </div>
              {expandedId === requisition.id && (
                <div className="mt-5 border-t border-border pt-5">
                  <RequisitionTimeline events={requisition.timeline} />
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
