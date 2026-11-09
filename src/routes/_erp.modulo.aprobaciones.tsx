import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCheck,
  FileText,
  RotateCcw,
  History,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
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

type ApprovalFilterTab = "all" | "pending" | "approved" | "returned";

function ApprovalsPage() {
  const {
    budgetLines,
    requisitions,
    approveRequisition,
    returnRequisition,
    modifyRequisitionDecision,
  } = useErp();

  const [activeTab, setActiveTab] = useState<ApprovalFilterTab>("all");
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<string | null>(null);

  // States for reversibility inside modal
  const [isModifyingDecision, setIsModifyingDecision] = useState(false);
  const [targetStatus, setTargetStatus] = useState<"pending_approval" | "approved" | "returned">(
    "pending_approval",
  );
  const [reversalReason, setReversalReason] = useState("");

  const pendingRequisitions = requisitions.filter(
    (requisition) => requisition.status === "pending_approval",
  );
  const approvedRequisitions = requisitions.filter(
    (requisition) =>
      requisition.status === "approved" ||
      requisition.status === "in_procurement" ||
      requisition.status === "ordered" ||
      requisition.status === "invoiced",
  );
  const returnedRequisitions = requisitions.filter(
    (requisition) => requisition.status === "returned",
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

  const handleExecuteReversal = () => {
    if (!selectedRequisition) return;
    try {
      if (reversalReason.trim().length < 5) {
        throw new Error("El motivo u observación de reversión debe tener al menos 5 caracteres.");
      }
      modifyRequisitionDecision(selectedRequisition.id, targetStatus, reversalReason.trim());
      toast.success("Decisión modificada exitosamente y registrada en la línea de tiempo.");
      setReversalReason("");
      setIsModifyingDecision(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo modificar la decisión.");
    }
  };

  return (
    <div className="phase2-view space-y-6">
      <PageHeader
        title="Bandeja de Aprobaciones"
        description="Gerencia aprueba o devuelve las solicitudes de las áreas. Cada decisión queda en la línea de tiempo del expediente."
      />

      {/* Pestañas de filtrado superior */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e6e8] pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "all"
              ? "bg-[#0f68ea] text-white shadow-xs"
              : "bg-[#f0f2f4] text-[#1d1d1f] hover:bg-slate-200"
          }`}
        >
          <span>Todas</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[11px]">
            {requisitions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "pending"
              ? "bg-[#0f68ea] text-white shadow-xs"
              : "bg-[#f0f2f4] text-[#1d1d1f] hover:bg-slate-200"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Pendientes</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[11px]">
            {pendingRequisitions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("approved")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "approved"
              ? "bg-[#0f68ea] text-white shadow-xs"
              : "bg-[#f0f2f4] text-[#1d1d1f] hover:bg-slate-200"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>Aprobadas</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[11px]">
            {approvedRequisitions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("returned")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "returned"
              ? "bg-[#0f68ea] text-white shadow-xs"
              : "bg-[#f0f2f4] text-[#1d1d1f] hover:bg-slate-200"
          }`}
        >
          <XCircle className="h-3.5 w-3.5 text-amber-600" />
          <span>Devueltas / Rechazadas</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[11px]">
            {returnedRequisitions.length}
          </span>
        </button>
      </div>

      {/* Sección: Pendientes de decisión */}
      {(activeTab === "all" || activeTab === "pending") && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-[#1d1d1f]">
            Pendientes de decisión ({pendingRequisitions.length})
          </h2>
          {pendingRequisitions.length === 0 && (
            <div className="surface-card p-8 text-center text-muted-foreground">
              No hay solicitudes pendientes en este momento.
            </div>
          )}
          {pendingRequisitions.map((requisition) => {
            const line = budgetLines.find((item) => item.id === requisition.budgetLineId);
            const project = PROJECTS.find((item) => item.id === requisition.projectId);
            return (
              <article
                key={requisition.id}
                className="surface-card p-5 transition-shadow hover:shadow-xs"
              >
                {/* Cabecera limpia y resumida con código, área, proyecto, título y monto */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className="font-bold text-primary">{requisition.code}</span>
                      <span>·</span>
                      <span>{requisition.requesterArea}</span>
                      <span>·</span>
                      <span>{project?.name}</span>
                      {line && (
                        <>
                          <span>·</span>
                          <span className="font-normal text-muted-foreground/80">
                            Partida {line.code} (Disp.{" "}
                            {formatCurrency(line.approved - line.committed - line.executed)})
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="mt-1 text-base font-bold tracking-tight text-foreground">
                      {requisition.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">
                      {formatCurrency(requisition.estimatedAmount)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => {
                        setSelectedRequisitionId(requisition.id);
                        setIsModifyingDecision(false);
                      }}
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5 text-primary" />
                      Ver expediente
                    </Button>
                  </div>
                </div>

                {requisition.overdraftJustification && (
                  <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span>Excepción por sobregiro declarada en solicitud</span>
                  </div>
                )}

                {/* Acciones Rápidas con caja de observación compacta */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2.5 border-t border-border/70 pt-3.5">
                  <Input
                    value={observations[requisition.id] ?? ""}
                    onChange={(event) =>
                      setObservations((previous) => ({
                        ...previous,
                        [requisition.id]: event.target.value,
                      }))
                    }
                    placeholder="Observación para devolver (obligatoria solo si devuelves)"
                    className="h-9 min-w-[240px] flex-1 rounded-full text-xs bg-background"
                    maxLength={300}
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-full text-xs font-semibold"
                      onClick={() => handleApproveRequisition(requisition.id, requisition.code)}
                    >
                      <CheckCheck className="mr-1 h-3.5 w-3.5" /> Aprobar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs font-semibold text-amber-700 hover:bg-amber-50 hover:text-amber-800 border-amber-200"
                      onClick={() => handleReturnRequisition(requisition.id, requisition.code)}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Devolver con observación
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Sección: Expedientes Resueltos / Filtrados */}
      {activeTab !== "pending" && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-[#1d1d1f]">
            {activeTab === "all"
              ? `Expedientes resueltos (${resolvedRequisitions.length})`
              : activeTab === "approved"
                ? `Expedientes aprobados (${approvedRequisitions.length})`
                : `Expedientes devueltos / rechazados (${returnedRequisitions.length})`}
          </h2>
          <div className="surface-card divide-y divide-border">
            {(activeTab === "all"
              ? resolvedRequisitions
              : activeTab === "approved"
                ? approvedRequisitions
                : returnedRequisitions
            ).map((requisition) => (
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
                <div className="flex items-center gap-2">
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
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs text-[#0f68ea] hover:bg-blue-50"
                    onClick={() => {
                      setSelectedRequisitionId(requisition.id);
                      setIsModifyingDecision(true);
                      setTargetStatus(
                        requisition.status === "returned" ? "approved" : "pending_approval",
                      );
                    }}
                  >
                    <History className="h-3.5 w-3.5 mr-1" /> Modificar decisión
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setSelectedRequisitionId(requisition.id);
                      setIsModifyingDecision(false);
                    }}
                  >
                    <FileText className="h-3.5 w-3.5" /> Ver expediente
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal Frontal Centrado para la Ficha del Expediente con Reversibilidad */}
      <Dialog
        open={Boolean(selectedRequisition)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequisitionId(null);
            setIsModifyingDecision(false);
            setReversalReason("");
          }
        }}
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

                  {/* Alerta de excepción por sobregiro si existe */}
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

                  {/* Sección de Reversibilidad de Estados para Expedientes Resueltos */}
                  {!isPending && isModifyingDecision && (
                    <div className="space-y-4 rounded-[20px] border border-[#0f68ea]/40 bg-blue-50/40 p-5">
                      <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-[#0f68ea]" />
                        <h4 className="text-sm font-bold text-[#1d1d1f]">
                          Reversibilidad de Decisión (Auditable)
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Modifica la decisión tomada. El cambio quedará registrado de forma inmutable
                        en la línea de tiempo.
                      </p>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#1d1d1f] block">
                          Nuevo Estado Destino:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setTargetStatus("pending_approval")}
                            className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
                              targetStatus === "pending_approval"
                                ? "bg-[#0f68ea] text-white border-[#0f68ea]"
                                : "bg-white text-slate-700 border-[#e5e6e8] hover:bg-slate-100"
                            }`}
                          >
                            Reabrir como Pendiente
                          </button>
                          <button
                            type="button"
                            onClick={() => setTargetStatus("approved")}
                            className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
                              targetStatus === "approved"
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-slate-700 border-[#e5e6e8] hover:bg-slate-100"
                            }`}
                          >
                            Aprobar Expediente
                          </button>
                          <button
                            type="button"
                            onClick={() => setTargetStatus("returned")}
                            className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
                              targetStatus === "returned"
                                ? "bg-amber-600 text-white border-amber-600"
                                : "bg-white text-slate-700 border-[#e5e6e8] hover:bg-slate-100"
                            }`}
                          >
                            Devolver con Observación
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="reversal-reason"
                          className="text-xs font-semibold text-[#1d1d1f] block"
                        >
                          Motivo del cambio de decisión (obligatorio para auditoría):
                        </label>
                        <Textarea
                          id="reversal-reason"
                          value={reversalReason}
                          onChange={(e) => setReversalReason(e.target.value)}
                          placeholder="Explica la justificación gerencial por la cual se revierte o modifica la decisión anterior..."
                          rows={2}
                          maxLength={300}
                          className="rounded-[14px] bg-white text-xs"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-xs"
                          onClick={() => setIsModifyingDecision(false)}
                        >
                          Cancelar modificación
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-full bg-[#0f68ea] hover:bg-blue-700 text-white text-xs"
                          disabled={reversalReason.trim().length < 5}
                          onClick={handleExecuteReversal}
                        >
                          <CheckCheck className="h-3.5 w-3.5 mr-1" />
                          Confirmar y registrar en línea de tiempo
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Observación para pendientes */}
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
                      <>
                        {!isModifyingDecision && (
                          <Button
                            variant="outline"
                            className="rounded-full text-xs text-[#0f68ea] hover:bg-blue-50"
                            onClick={() => {
                              setIsModifyingDecision(true);
                              setTargetStatus(
                                selectedRequisition.status === "returned"
                                  ? "approved"
                                  : "pending_approval",
                              );
                            }}
                          >
                            <History className="h-3.5 w-3.5 mr-1" /> Modificar decisión
                          </Button>
                        )}
                        <Button
                          variant="default"
                          className="rounded-full text-xs"
                          onClick={() => setSelectedRequisitionId(null)}
                        >
                          Cerrar expediente
                        </Button>
                      </>
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
