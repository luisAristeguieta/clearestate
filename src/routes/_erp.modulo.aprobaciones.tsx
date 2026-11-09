import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCheck, FileText, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { RequisitionTimeline } from "@/components/phase2/RequisitionTimeline";
import { StatusBadge } from "@/components/phase2/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getViewTitle } from "@/config/brandConfig";
import { PROJECTS, formatCurrency } from "@/config/erpConfig";
import { REQUISITION_STATUS_LABELS } from "@/config/phase2Config";
import { useErp } from "@/context/ErpContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_erp/modulo/aprobaciones")({
  head: () => ({
    meta: [
      { title: getViewTitle("/modulo/aprobaciones") },
      {
        name: "description",
        content:
          "Bandeja de aprobaciones gerenciales con línea de tiempo auditable de cada expediente.",
      },
      { property: "og:title", content: getViewTitle("/modulo/aprobaciones") },
      {
        property: "og:description",
        content: "Aprobación o devolución de requerimientos con observaciones trazables.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { budgetLines, requisitions, approveRequisition, returnRequisition } = useErp();
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<string | null>(null);

  const pendingRequisitions = requisitions.filter(
    (requisition) => requisition.status === "pending_approval",
  );
  const resolvedRequisitions = requisitions.filter(
    (requisition) => requisition.status !== "pending_approval",
  );

  const selectedRequisition =
    requisitions.find((requisition) => requisition.id === selectedRequisitionId) ?? null;

  const handleApproveRequisition = (requisitionId: string, code: string) => {
    try {
      approveRequisition(requisitionId);
      toast.success(`${code} aprobado y enviado a Logística.`);
    } catch (approveError) {
      toast.error(approveError instanceof Error ? approveError.message : "No se pudo aprobar.");
    }
  };

  const handleReturnRequisition = (requisitionId: string, code: string) => {
    try {
      returnRequisition(requisitionId, observations[requisitionId] ?? "");
      toast.success(`${code} devuelto con observación.`);
      setObservations((previous) => ({ ...previous, [requisitionId]: "" }));
    } catch (returnError) {
      toast.error(returnError instanceof Error ? returnError.message : "No se pudo devolver.");
    }
  };

  return (
    <div className="phase2-view">
      <PageHeader
        title="Bandeja de Aprobaciones"
        description="Gerencia aprueba o devuelve las solicitudes de las áreas. Cada decisión queda en la línea de tiempo del expediente."
      />

      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">
          Pendientes de decisión ({pendingRequisitions.length})
        </h2>
        {pendingRequisitions.length === 0 && (
          <div className="surface-card p-8 text-center text-muted-foreground">
            No hay solicitudes pendientes. Todo está al día.
          </div>
        )}
        {pendingRequisitions.map((requisition) => {
          const line = budgetLines.find((item) => item.id === requisition.budgetLineId);
          const project = PROJECTS.find((item) => item.id === requisition.projectId);
          return (
            <article key={requisition.id} className="surface-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {requisition.code} · {requisition.requesterArea} · {project?.name}
                  </p>
                  <h3 className="mt-1 text-base font-bold tracking-tight">{requisition.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{requisition.description}</p>
                  <p className="mt-2 text-sm">
                    <span className="font-semibold">Justificación:</span>{" "}
                    {requisition.justification}
                  </p>
                  {line && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Partida {line.code} · disponible{" "}
                      {formatCurrency(line.approved - line.committed - line.executed)}
                    </p>
                  )}
                </div>
                <span className="text-xl font-bold tracking-tight">
                  {formatCurrency(requisition.estimatedAmount)}
                </span>
              </div>

              {requisition.overdraftJustification && (
                <p className="mt-3 rounded-2xl bg-secondary px-3 py-2 text-sm text-foreground">
                  Excepción por sobregiro declarada: {requisition.overdraftJustification}
                </p>
              )}

              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <Textarea
                  value={observations[requisition.id] ?? ""}
                  onChange={(event) =>
                    setObservations((previous) => ({
                      ...previous,
                      [requisition.id]: event.target.value,
                    }))
                  }
                  placeholder="Observación para devolver (obligatoria solo si devuelves)"
                  rows={2}
                  maxLength={300}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    className="rounded-full"
                    onClick={() => handleApproveRequisition(requisition.id, requisition.code)}
                  >
                    <CheckCheck className="h-4 w-4" /> Aprobar
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => handleReturnRequisition(requisition.id, requisition.code)}
                  >
                    <RotateCcw className="h-4 w-4" /> Devolver con observación
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => setSelectedRequisitionId(requisition.id)}
                  >
                    <FileText className="h-4 w-4" /> Ver expediente
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Expedientes resueltos</h2>
        <div className="surface-card divide-y divide-border">
          {resolvedRequisitions.map((requisition) => (
            <div
              key={requisition.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {requisition.code} · {requisition.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {requisition.requesterArea} · {formatCurrency(requisition.estimatedAmount)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  tone={
                    requisition.status === "returned"
                      ? "attention"
                      : requisition.status === "approved"
                        ? "complete"
                        : "neutral"
                  }
                >
                  {REQUISITION_STATUS_LABELS[requisition.status]}
                </StatusBadge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setSelectedRequisitionId(requisition.id)}
                >
                  <FileText className="h-3.5 w-3.5" /> Ver expediente
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Frontal Centrado para la Ficha del Expediente */}
      <Dialog
        open={Boolean(selectedRequisition)}
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
              const lineAvailable = line ? line.approved - line.committed - line.executed : 0;
              const isOverdrawn = line
                ? selectedRequisition.estimatedAmount > lineAvailable
                : false;
              const isPending = selectedRequisition.status === "pending_approval";

              return (
                <div className="space-y-6">
                  <DialogHeader className="space-y-2 border-b border-border pb-4 text-left">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="pill-badge bg-secondary font-semibold text-primary">
                          {selectedRequisition.code}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {selectedRequisition.requesterArea} · {project?.name}
                        </span>
                      </div>
                      <StatusBadge
                        tone={
                          selectedRequisition.status === "pending_approval"
                            ? "yellow"
                            : selectedRequisition.status === "approved"
                              ? "complete"
                              : selectedRequisition.status === "returned"
                                ? "attention"
                                : "neutral"
                        }
                      >
                        {REQUISITION_STATUS_LABELS[selectedRequisition.status]}
                      </StatusBadge>
                    </div>

                    <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                      {selectedRequisition.title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      {selectedRequisition.description}
                    </DialogDescription>

                    <div className="pt-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Monto Requerido
                      </p>
                      <p className="text-3xl font-bold tracking-tight text-foreground">
                        {formatCurrency(selectedRequisition.estimatedAmount)}
                      </p>
                    </div>
                  </DialogHeader>

                  {/* Justificación del Requerimiento */}
                  <div className="space-y-2 rounded-[20px] border border-border bg-secondary/40 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Justificación Detallada
                    </p>
                    <p className="text-sm leading-relaxed text-foreground">
                      {selectedRequisition.justification}
                    </p>
                  </div>

                  {/* Alerta de excepción por sobregiro (RN-03) si existe */}
                  {selectedRequisition.overdraftJustification && (
                    <div className="space-y-1.5 rounded-[20px] border border-highlight/40 bg-highlight/10 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-highlight-foreground">
                        <AlertTriangle className="h-4 w-4" /> Excepción por sobregiro autorizada
                      </div>
                      <p className="text-sm text-foreground">
                        {selectedRequisition.overdraftJustification}
                      </p>
                    </div>
                  )}

                  {/* Partida presupuestaria asociada */}
                  {line && (
                    <div className="space-y-3 rounded-[20px] border border-border bg-card p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Partida Presupuestaria Asociada
                          </p>
                          <p className="text-base font-semibold text-foreground">
                            {line.code} · {line.name}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "pill-badge text-xs font-medium",
                            isOverdrawn
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          {isOverdrawn ? "Supera saldo disponible" : "Saldo suficiente"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 text-xs sm:grid-cols-4">
                        <div className="space-y-1 rounded-[14px] bg-secondary p-3">
                          <p className="text-muted-foreground">Aprobado</p>
                          <p className="font-semibold text-foreground">
                            {formatCurrency(line.approved)}
                          </p>
                        </div>
                        <div className="space-y-1 rounded-[14px] bg-secondary p-3">
                          <p className="text-muted-foreground">Comprometido</p>
                          <p className="font-semibold text-foreground">
                            {formatCurrency(line.committed)}
                          </p>
                        </div>
                        <div className="space-y-1 rounded-[14px] bg-secondary p-3">
                          <p className="text-muted-foreground">Ejecutado</p>
                          <p className="font-semibold text-foreground">
                            {formatCurrency(line.executed)}
                          </p>
                        </div>
                        <div className="space-y-1 rounded-[14px] bg-secondary p-3">
                          <p className="text-muted-foreground">Disponible</p>
                          <p
                            className={cn(
                              "font-bold",
                              lineAvailable < 0 ? "text-destructive" : "text-primary",
                            )}
                          >
                            {formatCurrency(lineAvailable)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Línea de tiempo auditable */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Trazabilidad y Línea de Tiempo del Expediente
                    </p>
                    <RequisitionTimeline events={selectedRequisition.timeline} />
                  </div>

                  {/* Observación y acciones de decisión gerencial */}
                  {isPending && (
                    <div className="space-y-3 border-t border-border pt-4">
                      <label
                        htmlFor="modal-observation"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Observación de Gerencia (obligatoria solo para devolver)
                      </label>
                      <Textarea
                        id="modal-observation"
                        value={observations[selectedRequisition.id] ?? ""}
                        onChange={(event) =>
                          setObservations((previous) => ({
                            ...previous,
                            [selectedRequisition.id]: event.target.value,
                          }))
                        }
                        placeholder="Ingresa la observación o requerimiento de ajuste si vas a devolver el expediente..."
                        rows={3}
                        maxLength={300}
                        className="rounded-[18px]"
                      />
                    </div>
                  )}

                  <DialogFooter className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
                    {isPending ? (
                      <>
                        <Button
                          variant="ghost"
                          className="rounded-full"
                          onClick={() => setSelectedRequisitionId(null)}
                        >
                          Cerrar
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-full"
                          onClick={() => {
                            handleReturnRequisition(
                              selectedRequisition.id,
                              selectedRequisition.code,
                            );
                            setSelectedRequisitionId(null);
                          }}
                        >
                          <RotateCcw className="h-4 w-4" /> Devolver con observación
                        </Button>
                        <Button
                          variant="default"
                          className="rounded-full"
                          onClick={() => {
                            handleApproveRequisition(
                              selectedRequisition.id,
                              selectedRequisition.code,
                            );
                            setSelectedRequisitionId(null);
                          }}
                        >
                          <CheckCheck className="h-4 w-4" /> Aprobar requerimiento
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="default"
                        className="rounded-full"
                        onClick={() => setSelectedRequisitionId(null)}
                      >
                        Cerrar expediente
                      </Button>
                    )}
                  </DialogFooter>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
