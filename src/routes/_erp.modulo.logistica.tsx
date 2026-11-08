import { createFileRoute } from "@tanstack/react-router";
import { Award, Copy, Link2, Scale, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/phase2/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getViewTitle } from "@/config/brandConfig";
import { formatCurrency } from "@/config/erpConfig";
import { buildInvitationPath } from "@/config/phase2Config";
import { useErp } from "@/context/ErpContext";

export const Route = createFileRoute("/_erp/modulo/logistica")({
  head: () => ({
    meta: [
      { title: getViewTitle("/modulo/logistica") },
      { name: "description", content: "Bandeja de adquisiciones, invitaciones a proveedores, cuadro comparativo y emisión de órdenes." },
      { property: "og:title", content: getViewTitle("/modulo/logistica") },
      { property: "og:description", content: "Adquisiciones con portal de proveedores y adjudicación trazable." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LogisticsPage,
});

function LogisticsPage() {
  const { requisitions, invitations, purchaseOrders, createInvitation, adjudicateInvitation } = useErp();

  const [inviteRequisitionId, setInviteRequisitionId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [awardCriteria, setAwardCriteria] = useState<Record<string, string>>({});

  const approvedRequisitions = requisitions.filter(
    (requisition) => requisition.status === "approved" || requisition.status === "in_procurement",
  );
  const requisitionsWithOffers = requisitions.filter((requisition) =>
    invitations.some((invitation) => invitation.requisitionId === requisition.id && invitation.status === "submitted"),
  );

  const handleCreateInvitation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inviteRequisitionId) return;
    try {
      const invitation = createInvitation({ requisitionId: inviteRequisitionId, supplierName: supplierName.trim(), supplierEmail: supplierEmail.trim() });
      const fullUrl = `${window.location.origin}${buildInvitationPath(invitation.token)}`;
      void navigator.clipboard?.writeText(fullUrl).catch(() => undefined);
      toast.success("Invitación generada y enlace copiado al portapapeles.");
      setSupplierName("");
      setSupplierEmail("");
      setInviteRequisitionId(null);
    } catch (inviteError) {
      toast.error(inviteError instanceof Error ? inviteError.message : "No se pudo generar la invitación.");
    }
  };

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}${buildInvitationPath(token)}`;
    void navigator.clipboard?.writeText(fullUrl).catch(() => undefined);
    toast.success("Enlace de invitación copiado.");
  };

  const handleAdjudicate = (invitationId: string, supplier: string) => {
    try {
      const order = adjudicateInvitation(invitationId, awardCriteria[invitationId] ?? "");
      toast.success(`${order.code} emitida a ${supplier}. El comprometido del presupuesto se actualizó.`);
    } catch (adjudicateError) {
      toast.error(adjudicateError instanceof Error ? adjudicateError.message : "No se pudo adjudicar.");
    }
  };

  return (
    <div className="phase2-view">
      <PageHeader
        title="Logística y Adquisiciones"
        description="Recibe los requerimientos aprobados, invita proveedores al portal externo y adjudica con cuadro comparativo."
      />

      <Tabs defaultValue="bandeja">
        <TabsList className="h-auto max-w-full flex-wrap rounded-full">
          <TabsTrigger value="bandeja" className="rounded-full">Bandeja</TabsTrigger>
          <TabsTrigger value="comparador" className="rounded-full">Cuadro comparativo</TabsTrigger>
          <TabsTrigger value="ordenes" className="rounded-full">Órdenes emitidas</TabsTrigger>
        </TabsList>

        <TabsContent value="bandeja" className="mt-6 space-y-4">
          {approvedRequisitions.length === 0 && (
            <div className="surface-card p-8 text-center text-muted-foreground">No hay requerimientos aprobados en espera de adquisición.</div>
          )}
          {approvedRequisitions.map((requisition) => {
            const requisitionInvitations = invitations.filter((invitation) => invitation.requisitionId === requisition.id);
            return (
              <article key={requisition.id} className="surface-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{requisition.code} · {requisition.requesterArea}</p>
                    <h3 className="mt-1 text-base font-bold tracking-tight">{requisition.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{requisition.description}</p>
                  </div>
                  <span className="text-lg font-bold tracking-tight">{formatCurrency(requisition.estimatedAmount)}</span>
                </div>

                <div className="mt-4 space-y-2">
                  {requisitionInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-secondary px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold">{invitation.supplierName}</p>
                        <p className="text-xs text-muted-foreground">{invitation.supplierEmail}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={invitation.status === "submitted" ? "complete" : "yellow"}>
                          {invitation.status === "submitted" ? "Oferta recibida" : "Invitado"}
                        </StatusBadge>
                        <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleCopyLink(invitation.token)}>
                          <Copy /> Copiar enlace
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {inviteRequisitionId === requisition.id ? (
                  <form onSubmit={handleCreateInvitation} className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_1fr_auto]">
                    <div className="space-y-1">
                      <Label htmlFor={`sup-name-${requisition.id}`}>Proveedor</Label>
                      <Input id={`sup-name-${requisition.id}`} required maxLength={100} value={supplierName} onChange={(event) => setSupplierName(event.target.value)} placeholder="Razón social" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`sup-email-${requisition.id}`}>Correo</Label>
                      <Input id={`sup-email-${requisition.id}`} required type="email" maxLength={255} value={supplierEmail} onChange={(event) => setSupplierEmail(event.target.value)} placeholder="contacto@proveedor.ec" />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" variant="default" className="rounded-full"><Send /> Generar enlace</Button>
                    </div>
                  </form>
                ) : (
                  <Button variant="outline" className="mt-4 rounded-full" onClick={() => setInviteRequisitionId(requisition.id)}>
                    <Link2 /> Invitar proveedor
                  </Button>
                )}
              </article>
            );
          })}
        </TabsContent>

        <TabsContent value="comparador" className="mt-6 space-y-6">
          {requisitionsWithOffers.length === 0 && (
            <div className="surface-card p-8 text-center text-muted-foreground">Aún no hay ofertas presentadas para comparar.</div>
          )}
          {requisitionsWithOffers.map((requisition) => {
            const requisitionInvitations = invitations.filter((invitation) => invitation.requisitionId === requisition.id);
            const submittedOffers = requisitionInvitations.filter((invitation) => invitation.status === "submitted" && invitation.offer);
            const bestPrice = Math.min(...submittedOffers.map((invitation) => invitation.offer?.price ?? Number.POSITIVE_INFINITY));
            return (
              <article key={requisition.id} className="surface-card">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{requisition.code}</p>
                <h3 className="mt-1 text-base font-bold tracking-tight">{requisition.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Referencia: {formatCurrency(requisition.estimatedAmount)}</p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {requisitionInvitations.map((invitation) => {
                    const isBestPrice = invitation.offer?.price === bestPrice;
                    return (
                      <div key={invitation.id} className="min-w-0 border-t border-border py-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold">{invitation.supplierName}</p>
                          {invitation.offer ? (
                            isBestPrice && <StatusBadge tone="yellow">Mejor precio</StatusBadge>
                          ) : (
                            <StatusBadge tone="neutral">Sin oferta</StatusBadge>
                          )}
                        </div>
                        {invitation.offer ? (
                          <dl className="mt-3 space-y-1 text-sm">
                            <div className="flex justify-between"><dt className="text-muted-foreground">Precio</dt><dd className="font-bold">{formatCurrency(invitation.offer.price)}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Plazo</dt><dd>{invitation.offer.termDays} días</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Propuesta</dt><dd className="truncate pl-4 text-xs">{invitation.offer.pdfFileName}</dd></div>
                            <p className="pt-1 text-xs text-muted-foreground">{invitation.offer.conditions}</p>
                          </dl>
                        ) : (
                          <p className="mt-3 text-sm text-muted-foreground">El proveedor aún no presenta su oferta.</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {submittedOffers.length > 0 && requisition.status !== "ordered" && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    {submittedOffers.map((invitation) => (
                      <div key={invitation.id} className="grid gap-3 border-t border-border py-4">
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          <Scale className="h-4 w-4 text-foreground" /> Adjudicar a {invitation.supplierName}
                        </p>
                        <Textarea
                          rows={2}
                          maxLength={300}
                          value={awardCriteria[invitation.id] ?? ""}
                          onChange={(event) => setAwardCriteria((previous) => ({ ...previous, [invitation.id]: event.target.value }))}
                          placeholder="Criterio de adjudicación (mínimo 10 caracteres)"
                        />
                        <Button variant="default" className="w-fit rounded-full" onClick={() => handleAdjudicate(invitation.id, invitation.supplierName)}>
                          <Award /> Emitir orden de compra / servicio
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {requisition.status === "ordered" && (
                  <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">Este requerimiento ya tiene una orden emitida.</p>
                )}
              </article>
            );
          })}
        </TabsContent>

        <TabsContent value="ordenes" className="mt-6">
          <div className="surface-card divide-y divide-border">
            {purchaseOrders.length === 0 && <p className="p-8 text-center text-muted-foreground">Todavía no se emiten órdenes.</p>}
            {purchaseOrders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{order.code} · {order.supplierName}</p>
                  <p className="text-xs text-muted-foreground">Criterio: {order.awardCriterion}</p>
                  <p className="text-xs text-muted-foreground">Emitida por {order.issuedBy}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold tracking-tight">{formatCurrency(order.amount)}</span>
                  <StatusBadge tone={order.status === "invoiced" ? "complete" : "neutral"}>
                    {order.status === "issued" ? "Emitida" : order.status === "invoiced" ? "Facturada" : "Cerrada"}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
