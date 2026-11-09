import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/phase2/StatusBadge";
import {
  createPhase3Head,
  Metric,
  performPrototypeAction,
  ProjectSelector,
} from "@/components/phase3/Phase3Shared";
import { PROJECTS } from "@/config/erpConfig";
import { DELIVERY_LABELS, type DeliveryStatus } from "@/config/phase3Config";
import { useErp } from "@/context/ErpContext";
import { usePhase3 } from "@/context/Phase3Context";
export const Route = createFileRoute("/_erp/modulo/campanas_/seguimiento")({
  head: () =>
    createPhase3Head(
      "/modulo/campanas/seguimiento",
      "Resultados simulados, rebotes y bandeja operativa para corregir contactos y reintentar envíos.",
    ),
  component: CampaignTrackingPage,
});
function CampaignTrackingPage() {
  const { projectFilter, setProjectFilter } = useErp();
  const { campaigns, sales, updateContact, retryDelivery, markFollowup, advanceCampaign } =
    usePhase3();
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const selected = campaigns.filter(
    (campaign) => projectFilter === "all" || campaign.projectId === projectFilter,
  );
  const deliveries = selected.flatMap((campaign) => campaign.deliveries);
  return (
    <div className="phase2-view">
      <Button asChild variant="ghost" className="mb-5">
        <Link to="/modulo/campanas">
          <ArrowLeft /> Campañas
        </Link>
      </Button>
      <PageHeader
        title="Seguimiento de Envíos"
        description="Resultados y rebotes · Simulación de canales"
      />
      <div className="mb-8 max-w-sm">
        <ProjectSelector value={projectFilter} onChange={setProjectFilter} />
      </div>
      <div className="mb-10 grid grid-cols-2 gap-6 border-y border-border py-4 lg:grid-cols-5">
        {(Object.keys(DELIVERY_LABELS) as DeliveryStatus[]).map((status) => (
          <Metric key={status} label={DELIVERY_LABELS[status]}>
            {deliveries.filter((delivery) => delivery.status === status).length}
          </Metric>
        ))}
      </div>
      <h2 className="mb-6 font-bold">Bandeja de seguimiento</h2>
      <div className="space-y-8">
        {selected.map((campaign) => (
          <section key={campaign.id} className="border-b border-border pb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">{campaign.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {PROJECTS.find((item) => item.id === campaign.projectId)?.name} ·{" "}
                  {campaign.channel === "email" ? "Correo electrónico" : "WhatsApp"}
                  {campaign.scheduledAt &&
                    ` · Programado: ${new Date(campaign.scheduledAt).toLocaleString("es-EC")}`}
                </p>
              </div>
              <Button
                variant="outline"
                disabled={
                  !campaign.deliveries.some(
                    (delivery) => delivery.status === "scheduled" || delivery.status === "sent",
                  )
                }
                onClick={() =>
                  performPrototypeAction(
                    () => advanceCampaign(campaign.id),
                    "Resultado simulado actualizado.",
                  )
                }
              >
                <RefreshCw /> Avanzar simulación
              </Button>
            </div>
            <div className="mt-5 divide-y divide-border">
              {campaign.deliveries.map((delivery) => {
                const sale = sales.find((item) => item.id === delivery.saleId);
                if (!sale) return null;
                const failed = delivery.status === "failed" || delivery.status === "followup";
                const contact = campaign.channel === "email" ? sale.email : sale.phone;
                const editKey = `${campaign.id}-${delivery.id}`;
                return (
                  <div key={delivery.id} className="py-5">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {sale.buyerName} · {sale.lot}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {delivery.contact || "Sin contacto"} · Intentos: {delivery.attempts}
                        </p>
                      </div>
                      <StatusBadge
                        tone={failed || delivery.status === "scheduled" ? "yellow" : "neutral"}
                      >
                        {DELIVERY_LABELS[delivery.status]}
                      </StatusBadge>
                    </div>
                    {delivery.reason && (
                      <p className="mt-2 text-sm text-muted-foreground">{delivery.reason}</p>
                    )}
                    {failed && (
                      <div className="mt-4 flex flex-wrap items-end gap-3">
                        <div className="min-w-0 flex-1 basis-56">
                          <Input
                            aria-label={`Contacto de ${sale.buyerName}`}
                            value={contacts[editKey] ?? contact}
                            placeholder={
                              campaign.channel === "email" ? "correo@ejemplo.ec" : "+593991234567"
                            }
                            onChange={(event) =>
                              setContacts((previous) => ({
                                ...previous,
                                [editKey]: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={() =>
                            performPrototypeAction(
                              () =>
                                updateContact(
                                  sale.id,
                                  campaign.channel === "email"
                                    ? (contacts[editKey] ?? contact)
                                    : sale.email,
                                  campaign.channel === "whatsapp"
                                    ? (contacts[editKey] ?? contact)
                                    : sale.phone,
                                ),
                              "Contacto actualizado.",
                            )
                          }
                        >
                          <Save /> Guardar contacto
                        </Button>
                        <Button
                          onClick={() =>
                            performPrototypeAction(
                              () => retryDelivery(campaign.id, delivery.id),
                              "Reintento simulado registrado.",
                            )
                          }
                        >
                          <RefreshCw /> Reintentar
                        </Button>
                        {delivery.status === "failed" && (
                          <Button
                            variant="ghost"
                            onClick={() =>
                              performPrototypeAction(
                                () => markFollowup(campaign.id, delivery.id),
                                "Contacto pendiente de seguimiento.",
                              )
                            }
                          >
                            Marcar seguimiento
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      {selected.length === 0 && (
        <p className="py-10 text-muted-foreground">No hay envíos para este proyecto.</p>
      )}
    </div>
  );
}
