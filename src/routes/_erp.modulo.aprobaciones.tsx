import { createFileRoute } from "@tanstack/react-router";
import { CheckCheck, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { RequisitionTimeline } from "@/components/phase2/RequisitionTimeline";
import { StatusBadge } from "@/components/phase2/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getViewTitle } from "@/config/brandConfig";
import { PROJECTS, formatCurrency } from "@/config/erpConfig";
import { REQUISITION_STATUS_LABELS } from "@/config/phase2Config";
import { useErp } from "@/context/ErpContext";

export const Route = createFileRoute("/_erp/modulo/aprobaciones")({
  head: () => ({
    meta: [
      { title: getViewTitle("/modulo/aprobaciones") },
      { name: "description", content: "Bandeja de aprobaciones gerenciales con línea de tiempo auditable de cada expediente." },
      { property: "og:title", content: getViewTitle("/modulo/aprobaciones") },
      { property: "og:description", content: "Aprobación o devolución de requerimientos con observaciones trazables." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { budgetLines, requisitions, approveRequisition, returnRequisition } = useErp();
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingRequisitions = requisitions.filter((requisition) => requisition.status === "pending_approval");
  const resolvedRequisitions = requisitions.filter((requisition) => requisition.status !== "pending_approval");

  const handleApprove = (requisitionId: string, code: string) => {
    try {
      approveRequisition(requisitionId);
      toast.success(`${code} aprobado y enviado a Logística.`);
    } catch (approveError) {
      toast.error(approveError instanceof Error ? approveError.message : "No se pudo aprobar.");
    }
  };

  const handleReturn = (requisitionId: string, code: string) => {
    try {
      returnRequisition(requisitionId, observations[requisitionId] ?? "");
      toast.success(`${code} devuelto con observación.`);
      setObservations((previous) => ({ ...previous, [requisitionId]: "" }));
    } catch (returnError) {
      toast.error(returnError instanceof Error ? returnError.message : "No se pudo devolver.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Bandeja de Aprobaciones"
        description="Gerencia aprueba o devuelve las solicitudes de las áreas. Cada decisión queda en la línea de tiempo del expediente."
      />

      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Pendientes de decisión ({pendingRequisitions.length})</h2>
        {pendingRequisitions.length === 0 && (
          <div className="surface-card p-8 text-center text-muted-foreground">No hay solicitudes pendientes. Todo está al día.</div>
        )}
        {pendingRequisitions.map((requisition) => {
          const line = budgetLines.find((item) => item.id === requisition.budgetLineId);
          const project = PROJECTS.find((item) => item.id === requisition.projectId);
          return (
            <article key={requisition.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {requisition.code} · {requisition.requesterArea} · {project?.name}
                  </p>
                  <h3 className="mt-1 text-base font-bold tracking-tight">{requisition.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{requisition.description}</p>
                  <p className="mt-2 text-sm">
                    <span className="font-semibold">Justificación:</span> {requisition.justification}
                  </p>
                  {line && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Partida {line.code} · disponible {formatCurrency(line.approved - line.committed - line.executed)}
                    </p>
                  )}
                </div>
                <span className="text-xl font-bold tracking-tight">{formatCurrency(requisition.estimatedAmount)}</span>
              </div>

              {requisition.overdraftJustification && (
                <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  Excepción por sobregiro declarada: {requisition.overdraftJustification}
                </p>
              )}

              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <Textarea
                  value={observations[requisition.id] ?? ""}
                  onChange={(event) => setObservations((previous) => ({ ...previous, [requisition.id]: event.target.value }))}
                  placeholder="Observación para devolver (obligatoria solo si devuelves)"
                  rows={2}
                  maxLength={300}
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="ink" className="rounded-full" onClick={() => handleApprove(requisition.id, requisition.code)}>
                    <CheckCheck /> Aprobar
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={() => handleReturn(requisition.id, requisition.code)}>
                    <RotateCcw /> Devolver con observación
                  </Button>
                  <Button variant="ghost" className="rounded-full" onClick={() => setExpandedId(expandedId === requisition.id ? null : requisition.id)}>
                    {expandedId === requisition.id ? "Ocultar expediente" : "Ver expediente"}
                  </Button>
                </div>
                {expandedId === requisition.id && <RequisitionTimeline events={requisition.timeline} />}
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Expedientes resueltos</h2>
        <div className="surface-card divide-y divide-border">
          {resolvedRequisitions.map((requisition) => (
            <div key={requisition.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{requisition.code} · {requisition.title}</p>
                <p className="text-xs text-muted-foreground">{requisition.requesterArea} · {formatCurrency(requisition.estimatedAmount)}</p>
              </div>
              <StatusBadge tone={requisition.status === "returned" ? "red" : requisition.status === "approved" ? "green" : "blue"}>
                {REQUISITION_STATUS_LABELS[requisition.status]}
              </StatusBadge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
