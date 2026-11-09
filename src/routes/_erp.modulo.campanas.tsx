import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageSquare, Send, FileUp, ArrowUpRight, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPhase3Head, ProjectSelector } from "@/components/phase3/Phase3Shared";
import { StatusBadge } from "@/components/phase2/StatusBadge";
import { PROJECTS, type ProjectId } from "@/config/erpConfig";
import {
  renderCampaignMessage,
  selectCampaignRecipients,
  type CampaignChannel,
  type PrototypeAttachment,
} from "@/config/phase3Config";
import { readPrototypeAttachment, usePhase3 } from "@/context/Phase3Context";

export const Route = createFileRoute("/_erp/modulo/campanas")({
  head: () =>
    createPhase3Head(
      "/modulo/campanas",
      "Campañas simuladas de WhatsApp y correo segmentadas exclusivamente por proyecto inmobiliario.",
    ),
  component: CampaignsPage,
});
function CampaignsPage() {
  const { sales, campaigns, createCampaign } = usePhase3();
  const [projectId, setProjectId] = useState<ProjectId>("paris");
  const [channel, setChannel] = useState<CampaignChannel>("email");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState(
    "Hola {{nombre}}, compartimos el avance de {{proyecto}} para tu lote {{lote}}. Te mantendremos informado sobre la próxima entrega.",
  );
  const [scheduledAt, setScheduledAt] = useState("");
  const [attachments, setAttachments] = useState<PrototypeAttachment[]>([]);
  const recipients = selectCampaignRecipients(sales, projectId);
  const preview = recipients[0];
  const project = PROJECTS.find((item) => item.id === projectId);
  const handleCampaignSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      createCampaign({
        title,
        projectId,
        channel,
        message,
        attachments,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      toast.success(
        scheduledAt ? "Campaña programada en el simulador." : "Envío simulado registrado.",
      );
      setTitle("");
      setAttachments([]);
      setScheduledAt("");
    } catch (campaignError) {
      toast.error(
        campaignError instanceof Error ? campaignError.message : "No se pudo crear la campaña.",
      );
    }
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    try {
      const attachment = await readPrototypeAttachment(selectedFile);
      setAttachments((previous) => [...previous, attachment]);
    } catch (attachmentError) {
      toast.error(
        attachmentError instanceof Error
          ? attachmentError.message
          : "No se pudo adjuntar el archivo.",
      );
    }
  };
  return (
    <div className="phase2-view">
      <PageHeader
        title="Campañas y Comunicaciones"
        description="WhatsApp y correo · Simulador de envíos por proyecto"
        actions={
          <Button asChild variant="outline">
            <Link to="/modulo/campanas/seguimiento">
              Seguimiento de envíos <ArrowUpRight />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-8 xl:grid-cols-2">
        <form onSubmit={handleCampaignSubmit} className="space-y-5">
          <h2 className="font-bold">Nueva campaña</h2>
          <ProjectSelector
            value={projectId}
            allowAll={false}
            onChange={(next) => {
              if (next !== "all") setProjectId(next);
            }}
          />
          <div className="space-y-2">
            <Label htmlFor="campaign-title">Título de la campaña</Label>
            <Input
              id="campaign-title"
              required
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Avance de habilitación urbana"
            />
          </div>
          <fieldset>
            <legend className="mb-3 text-sm font-medium">Canal</legend>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant={channel === "email" ? "default" : "outline"}
                aria-pressed={channel === "email"}
                onClick={() => setChannel("email")}
              >
                <Mail /> Correo electrónico
              </Button>
              <Button
                type="button"
                variant={channel === "whatsapp" ? "default" : "outline"}
                aria-pressed={channel === "whatsapp"}
                onClick={() => setChannel("whatsapp")}
              >
                <MessageSquare /> WhatsApp
              </Button>
            </div>
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="campaign-message">Mensaje</Label>
            <Textarea
              id="campaign-message"
              required
              rows={5}
              maxLength={2000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-attachment" className="flex items-center gap-2">
              <FileUp className="h-4 w-4" /> Resolución o fotografías de avance
            </Label>
            <Input
              id="campaign-attachment"
              type="file"
              accept="application/pdf,image/*"
              disabled={attachments.length >= 3}
              onChange={handleAttachmentUpload}
            />
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="break-all">{attachment.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  aria-label={`Quitar ${attachment.name}`}
                  onClick={() =>
                    setAttachments((previous) =>
                      previous.filter((item) => item.id !== attachment.id),
                    )
                  }
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-date">Programación (opcional)</Label>
            <Input
              id="campaign-date"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </div>
          <Button type="submit">
            <Send /> {scheduledAt ? "Programar campaña simulada" : "Simular envío"}
          </Button>
        </form>
        <section className="space-y-6">
          <h2 className="font-bold">Previsualización</h2>
          <div className="rounded-card border border-border bg-secondary p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="font-semibold">ClearEstate</span>
              <StatusBadge tone="neutral">
                {channel === "email" ? "Correo electrónico" : "WhatsApp"}
              </StatusBadge>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              {preview?.buyerName} · {project?.name}
            </p>
            {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {preview ? renderCampaignMessage(message, preview) : message}
            </p>
            {attachments.map((attachment) =>
              attachment.type.startsWith("image/") ? (
                <img
                  key={attachment.id}
                  src={attachment.dataUrl}
                  alt={attachment.name}
                  className="mt-5 max-h-64 w-full rounded-[18px] object-contain"
                />
              ) : (
                <p key={attachment.id} className="mt-4 border-t border-border pt-4 text-sm">
                  {attachment.name}
                </p>
              ),
            )}
          </div>
          <div className="border-t border-border pt-5">
            <h3 className="font-semibold">Destinatarios · {recipients.length}</h3>
            <div className="mt-3 divide-y divide-border">
              {recipients.map((sale) => (
                <div key={sale.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                  <span>{sale.buyerName}</span>
                  <span className="text-muted-foreground">Lote {sale.lot}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <section className="mt-12">
        <h2 className="mb-5 font-bold">Campañas registradas</h2>
        {campaigns.length === 0 && (
          <p className="py-5 text-muted-foreground">No hay campañas registradas.</p>
        )}
        <div className="divide-y divide-border">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div>
                <h3 className="font-semibold">{campaign.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {PROJECTS.find((item) => item.id === campaign.projectId)?.name} ·{" "}
                  {campaign.channel === "email" ? "Correo" : "WhatsApp"} ·{" "}
                  {campaign.deliveries.length} destinatarios
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/modulo/campanas/seguimiento">
                  Ver resultados <ArrowUpRight />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
