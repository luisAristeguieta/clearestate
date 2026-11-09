import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ClipboardList, Eye, FileText, Plus, Send } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { RequisitionTimeline } from "@/components/phase2/RequisitionTimeline";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getViewTitle } from "@/config/brandConfig";
import { PROJECTS, SEED_PHASES, formatCurrency, type ProjectId } from "@/config/erpConfig";
import {
  REQUISITION_STATUS_LABELS,
  evaluateRequisitionOverdraft,
  type RequisitionStatus,
} from "@/config/phase2Config";
import { useErp } from "@/context/ErpContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_erp/modulo/requerimientos")({
  head: () => ({
    meta: [
      { title: getViewTitle("/modulo/requerimientos") },
      {
        name: "description",
        content:
          "Creación y seguimiento de requerimientos de bienes y servicios con control del saldo presupuestario.",
      },
      { property: "og:title", content: getViewTitle("/modulo/requerimientos") },
      {
        property: "og:description",
        content: "Requerimientos de área con alerta de sobregiro presupuestario.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequisitionsPage,
});

const ALL_STATUSES: RequisitionStatus[] = [
  "pending_approval",
  "approved",
  "returned",
  "in_procurement",
  "ordered",
  "invoiced",
];

const STATUS_CONFIG: Record<
  RequisitionStatus,
  {
    label: string;
    dotClass: string;
    triggerClass: string;
  }
> = {
  pending_approval: {
    label: "Pendiente de aprobación",
    dotClass: "bg-amber-500",
    triggerClass:
      "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/80 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
  },
  approved: {
    label: "Aprobado",
    dotClass: "bg-emerald-500",
    triggerClass:
      "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  returned: {
    label: "Devuelto con observación",
    dotClass: "bg-rose-500",
    triggerClass:
      "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100/80 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300",
  },
  in_procurement: {
    label: "En adquisición",
    dotClass: "bg-blue-500",
    triggerClass:
      "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100/80 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
  },
  ordered: {
    label: "Orden emitida",
    dotClass: "bg-indigo-500",
    triggerClass:
      "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100/80 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300",
  },
  invoiced: {
    label: "Facturado",
    dotClass: "bg-slate-400",
    triggerClass:
      "border-border bg-secondary text-muted-foreground hover:bg-secondary/80 dark:border-border dark:bg-secondary dark:text-muted-foreground",
  },
};

interface RequisitionStatusSelectProps {
  status: RequisitionStatus;
  onChange: (nextStatus: RequisitionStatus) => void;
  className?: string;
  size?: "sm" | "default";
}

function RequisitionStatusSelect({
  status,
  onChange,
  className,
  size = "sm",
}: RequisitionStatusSelectProps) {
  const current = STATUS_CONFIG[status];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn("inline-flex items-center", className)}
    >
      <Select value={status} onValueChange={(val) => onChange(val as RequisitionStatus)}>
        <SelectTrigger
          className={cn(
            "h-7 w-auto min-w-[170px] gap-2 rounded-full border px-3 text-xs font-semibold shadow-none transition-colors",
            current.triggerClass,
            size === "default" && "h-8 min-w-[195px] px-3.5 text-xs",
          )}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", current.dotClass)} />
            <span className="truncate">{current.label}</span>
          </div>
        </SelectTrigger>
        <SelectContent
          align="end"
          className="rounded-2xl border-border bg-background p-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {ALL_STATUSES.map((itemStatus) => {
            const itemConfig = STATUS_CONFIG[itemStatus];
            return (
              <SelectItem
                key={itemStatus}
                value={itemStatus}
                className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium focus:bg-secondary focus:text-foreground"
              >
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", itemConfig.dotClass)} />
                  <span>{itemConfig.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

type RequisitionFilter = "all" | "pending_approval" | "approved" | "returned" | "invoiced";

function RequisitionsPage() {
  const { activeRole, budgetLines, requisitions, createRequisition, updateRequisitionStatus } =
    useErp();

  // Create Modal & Form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [justification, setJustification] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [projectId, setProjectId] = useState<ProjectId>("paris");
  const [phaseId, setPhaseId] = useState<string>("none");
  const [budgetLineId, setBudgetLineId] = useState<string>("");
  const [overdraftJustification, setOverdraftJustification] = useState("");

  // Filters & Selected Requisition (by ID for reactivity)
  const [statusFilter, setStatusFilter] = useState<RequisitionFilter>("all");
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<string | null>(null);

  const selectedRequisition = useMemo(
    () => requisitions.find((r) => r.id === selectedRequisitionId) ?? null,
    [requisitions, selectedRequisitionId],
  );

  const projectPhases = useMemo(
    () => SEED_PHASES.filter((phase) => phase.projectId === projectId),
    [projectId],
  );
  const projectLines = useMemo(
    () => budgetLines.filter((line) => line.projectId === projectId),
    [budgetLines, projectId],
  );
  const selectedLine = budgetLines.find((line) => line.id === budgetLineId) ?? null;
  const parsedAmount = Number(estimatedAmount) || 0;
  const overdraftCheck =
    selectedLine && parsedAmount > 0
      ? evaluateRequisitionOverdraft(selectedLine, parsedAmount)
      : null;

  const handleProjectChange = (nextProjectId: ProjectId) => {
    setProjectId(nextProjectId);
    setPhaseId("none");
    setBudgetLineId("");
  };

  const handleLoadExample = () => {
    const targetProject: ProjectId = "paris";
    const availablePhases = SEED_PHASES.filter((phase) => phase.projectId === targetProject);
    const targetPhase = availablePhases[0]?.id ?? "none";
    const availableLines = budgetLines.filter((line) => line.projectId === targetProject);
    const targetLine = availableLines[0]?.id ?? "";

    setProjectId(targetProject);
    setPhaseId(targetPhase);
    setBudgetLineId(targetLine);
    setTitle("Topografía satelital y replanteo de rasantes - Etapa II");
    setDescription(
      "Servicio de levantamiento topográfico de alta precisión con estación total y dron LiDAR para trazado de rasantes y lotización de 45 macrolotes.",
    );
    setJustification(
      "Requerido para validar las cotas de excavación y pendientes de drenaje pluvial previo al inicio del asfaltado vial del proyecto.",
    );
    setEstimatedAmount("24500");
    setOverdraftJustification("");

    toast.success("Ejemplo precargado aplicado con éxito en el formulario de requerimiento.");
  };

  const handleRequisitionSubmit = (event: FormEvent<HTMLFormElement>) => {
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
      setIsCreateOpen(false);
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "No se pudo crear el requerimiento.",
      );
    }
  };

  const handleStatusChange = (requisitionId: string, nextStatus: RequisitionStatus) => {
    try {
      updateRequisitionStatus(requisitionId, nextStatus);
      toast.success(`Estado actualizado a: ${REQUISITION_STATUS_LABELS[nextStatus]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el estado.");
    }
  };

  // Status Filter Counts & Data
  const filterCounts = useMemo(() => {
    return {
      all: requisitions.length,
      pending_approval: requisitions.filter((r) => r.status === "pending_approval").length,
      approved: requisitions.filter(
        (r) => r.status === "approved" || r.status === "in_procurement" || r.status === "ordered",
      ).length,
      returned: requisitions.filter((r) => r.status === "returned").length,
      invoiced: requisitions.filter((r) => r.status === "invoiced").length,
    };
  }, [requisitions]);

  const filteredRequisitions = useMemo(() => {
    if (statusFilter === "all") return requisitions;
    if (statusFilter === "pending_approval") {
      return requisitions.filter((r) => r.status === "pending_approval");
    }
    if (statusFilter === "approved") {
      return requisitions.filter(
        (r) => r.status === "approved" || r.status === "in_procurement" || r.status === "ordered",
      );
    }
    if (statusFilter === "returned") {
      return requisitions.filter((r) => r.status === "returned");
    }
    if (statusFilter === "invoiced") {
      return requisitions.filter((r) => r.status === "invoiced");
    }
    return requisitions;
  }, [requisitions, statusFilter]);

  return (
    <div className="phase2-view">
      <PageHeader
        title="Requerimientos y Solicitudes"
        description="Las áreas registran necesidades de bienes y servicios con control del saldo disponible de cada partida."
        actions={
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-full font-semibold shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo requerimiento
          </Button>
        }
      />

      {/* Sección Principal a Ancho Completo: Mis Requerimientos */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight">Mis requerimientos</h2>
          <span className="text-xs text-muted-foreground">
            {filteredRequisitions.length} de {requisitions.length} requerimientos
          </span>
        </div>

        {/* Filtros de Estado */}
        <div className="inline-flex flex-wrap rounded-full border border-border bg-secondary/50 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors",
              statusFilter === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Todos ({filterCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending_approval")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors",
              statusFilter === "pending_approval"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Pendientes de aprobación ({filterCounts.pending_approval})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors",
              statusFilter === "approved"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Aprobados ({filterCounts.approved})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("returned")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors",
              statusFilter === "returned"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Devueltos ({filterCounts.returned})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("invoiced")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors",
              statusFilter === "invoiced"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Facturados ({filterCounts.invoiced})
          </button>
        </div>

        {/* Lista de Requerimientos a Ancho Completo */}
        {filteredRequisitions.length === 0 ? (
          <div className="surface-card p-12 text-center text-muted-foreground">
            No hay requerimientos en este estado.
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredRequisitions.map((requisition) => {
              const reqProject = PROJECTS.find((p) => p.id === requisition.projectId);
              const reqLine = budgetLines.find((l) => l.id === requisition.budgetLineId);

              return (
                <article
                  key={requisition.id}
                  className="surface-card cursor-pointer transition-all hover:border-primary/40 hover:shadow-md p-5 sm:p-6"
                  onClick={() => setSelectedRequisitionId(requisition.id)}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-foreground">{requisition.code}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-semibold uppercase tracking-wide text-primary">
                          {requisition.requesterArea}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">
                          {reqProject?.name ?? "General"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold tracking-tight text-foreground">
                        {requisition.title}
                      </h3>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {requisition.description}
                      </p>
                    </div>

                    <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end shrink-0">
                      <RequisitionStatusSelect
                        status={requisition.status}
                        onChange={(nextStatus) => handleStatusChange(requisition.id, nextStatus)}
                      />
                      <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">
                        {formatCurrency(requisition.estimatedAmount)}
                      </span>
                    </div>
                  </div>

                  {requisition.overdraftJustification && (
                    <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-500/10 px-3.5 py-2 text-xs text-foreground">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <div>
                        <span className="font-semibold text-amber-900 dark:text-amber-200">
                          Excepción por sobregiro:
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {requisition.overdraftJustification}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Creado por{" "}
                        <strong className="text-foreground">{requisition.createdBy}</strong>
                      </span>
                      {reqLine && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[280px]">
                            Partida: {reqLine.code} - {reqLine.name}
                          </span>
                        </>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs font-semibold"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequisitionId(requisition.id);
                      }}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5 text-primary" />
                      Ver expediente
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Frontal Centrado de Gran Formato: Nuevo Requerimiento */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent
          overlayClassName="bg-black/40 backdrop-blur-sm"
          className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-[28px] border border-border bg-background p-6 shadow-2xl sm:p-8"
        >
          <DialogHeader className="space-y-3 border-b border-border pb-4 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
                  <ClipboardList className="h-5 w-5 text-foreground" />
                </span>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    Nuevo requerimiento
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Solicitante: {activeRole?.personName} · {activeRole?.area}
                  </DialogDescription>
                </div>
              </div>

              {/* Botón de Acción Rápida: Simulador Precargado */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadExample}
                className="rounded-full border-border bg-background text-xs font-semibold hover:bg-secondary"
                title="Carga un caso de prueba inmobiliario para simulación inmediata"
              >
                <FileText className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Cargar ejemplo precargado
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleRequisitionSubmit} className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="req-title">Título</Label>
              <Input
                id="req-title"
                required
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej: Servicio de topografía etapa III"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="req-description">Descripción</Label>
              <Textarea
                id="req-description"
                required
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Detalla el bien o servicio requerido"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="req-justification">Justificación</Label>
              <Textarea
                id="req-justification"
                required
                maxLength={500}
                value={justification}
                onChange={(event) => setJustification(event.target.value)}
                placeholder="¿Por qué es necesario este gasto?"
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Proyecto</Label>
                <Select
                  value={projectId}
                  onValueChange={(value) => handleProjectChange(value as ProjectId)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECTS.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fase de obra</Label>
                <Select value={phaseId} onValueChange={setPhaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin fase asociada</SelectItem>
                    {projectPhases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Partida presupuestaria</Label>
              <Select value={budgetLineId} onValueChange={setBudgetLineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la partida" />
                </SelectTrigger>
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
                  Disponible actual:{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(
                      selectedLine.approved - selectedLine.committed - selectedLine.executed,
                    )}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="req-amount">Importe estimado (USD)</Label>
              <Input
                id="req-amount"
                required
                type="number"
                min={1}
                step="0.01"
                value={estimatedAmount}
                onChange={(event) => setEstimatedAmount(event.target.value)}
                placeholder="0.00"
              />
            </div>

            {overdraftCheck?.isOverdrawn && (
              <div className="rounded-[18px] border border-border bg-secondary p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <AlertTriangle className="h-4 w-4" /> Alerta de sobregiro
                </p>
                <p className="mt-1 text-sm text-foreground">
                  El importe supera el saldo disponible por {formatCurrency(overdraftCheck.deficit)}
                  . Debes registrar una justificación detallada para continuar.
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

            <DialogFooter className="border-t border-border pt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full text-xs font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="default"
                className="rounded-full text-xs font-semibold"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" /> Enviar a aprobación
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Frontal Centrado: Ficha del Requerimiento */}
      <Dialog
        open={selectedRequisition !== null}
        onOpenChange={(open) => !open && setSelectedRequisitionId(null)}
      >
        <DialogContent
          overlayClassName="bg-black/40 backdrop-blur-sm"
          className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[28px] border border-border bg-background p-6 shadow-xl sm:p-8"
        >
          {selectedRequisition &&
            (() => {
              const line = budgetLines.find((item) => item.id === selectedRequisition.budgetLineId);
              const project = PROJECTS.find((item) => item.id === selectedRequisition.projectId);
              const phase = SEED_PHASES.find((item) => item.id === selectedRequisition.phaseId);
              const lineAvailable = line ? line.approved - line.committed - line.executed : 0;
              const isOverdrawn = line
                ? selectedRequisition.estimatedAmount > lineAvailable
                : false;

              return (
                <div className="space-y-6">
                  {/* Encabezado del Modal */}
                  <DialogHeader className="space-y-2 border-b border-border pb-4 text-left">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="pill-badge bg-secondary font-semibold text-primary">
                          {selectedRequisition.code}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {selectedRequisition.requesterArea} · {project?.name}
                        </span>
                      </div>

                      {/* Selector interactivo de estado en la ficha */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Estado:</span>
                        <RequisitionStatusSelect
                          status={selectedRequisition.status}
                          onChange={(nextStatus) =>
                            handleStatusChange(selectedRequisition.id, nextStatus)
                          }
                          size="default"
                        />
                      </div>
                    </div>

                    <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                      {selectedRequisition.title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      {selectedRequisition.description}
                    </DialogDescription>

                    <div className="pt-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Importe Estimado
                      </p>
                      <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                        {formatCurrency(selectedRequisition.estimatedAmount)}
                      </p>
                    </div>
                  </DialogHeader>

                  {/* Datos del Solicitante y Ubicación */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl border border-border bg-secondary/30 p-4 text-xs">
                    <div>
                      <p className="text-muted-foreground">Solicitante</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {selectedRequisition.createdBy}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Área de origen</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {selectedRequisition.requesterArea}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Proyecto</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {project?.name ?? "General"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fase de obra</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {phase ? phase.name : "Sin fase asociada"}
                      </p>
                    </div>
                  </div>

                  {/* Justificación de la Solicitud */}
                  <div className="space-y-2 rounded-2xl border border-border bg-secondary/20 p-4.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Justificación de la Solicitud
                    </p>
                    <p className="text-sm leading-relaxed text-foreground">
                      {selectedRequisition.justification}
                    </p>
                  </div>

                  {/* Partida Presupuestaria Afectada */}
                  <div className="space-y-3 rounded-2xl border border-border bg-background p-4.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Partida Presupuestaria Afectada
                    </p>
                    {line ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {line.code} · {line.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Disponible actual:{" "}
                            <strong className="text-foreground">
                              {formatCurrency(lineAvailable)}
                            </strong>
                          </span>
                        </div>
                        {isOverdrawn && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                            <p className="flex items-center gap-1.5 font-semibold">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                              Sobregiro presupuestario detectado
                            </p>
                            <p className="mt-1">
                              El monto requerido excede el saldo disponible por{" "}
                              <strong>
                                {formatCurrency(
                                  selectedRequisition.estimatedAmount - lineAvailable,
                                )}
                              </strong>
                              .
                            </p>
                            {selectedRequisition.overdraftJustification && (
                              <p className="mt-1.5 italic text-amber-800">
                                &ldquo;{selectedRequisition.overdraftJustification}&rdquo;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Partida no identificada.</p>
                    )}
                  </div>

                  {/* Línea de Tiempo y Auditoría */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Línea de Tiempo y Auditoría
                    </h4>
                    <RequisitionTimeline events={selectedRequisition.timeline} />
                  </div>

                  <DialogFooter className="border-t border-border pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedRequisitionId(null)}
                      className="rounded-full text-xs font-semibold"
                    >
                      Cerrar ficha
                    </Button>
                  </DialogFooter>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
