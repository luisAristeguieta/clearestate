import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  MessageSquare,
  Send,
  FileUp,
  ArrowUpRight,
  X,
  History,
  Bell,
  Sparkles,
} from "lucide-react";
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
import { CampaignHistoryTab } from "@/components/campaigns/CampaignHistoryTab";
import { RemindersTab } from "@/components/campaigns/RemindersTab";

export const Route = createFileRoute("/_erp/modulo/campanas")({
  head: () =>
    createPhase3Head(
      "/modulo/campanas",
      "Campañas simuladas de WhatsApp y correo segmentadas exclusivamente por proyecto inmobiliario.",
    ),
  component: CampaignsPage,
});

type CampaignModuleTab = "composer" | "history" | "reminders";

function CampaignsPage() {
  const {
    sales,
    campaigns,
    reminders,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    createReminder,
    updateReminder,
    deleteReminder,
  } = usePhase3();

  const [activeTab, setActiveTab] = useState<CampaignModuleTab>("composer");

  // Composer states
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
        scheduledAt
          ? "Campaña programada exitosamente."
          : "Campaña enviada y registrada en el historial.",
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
    <div className="phase2-view space-y-6">
      <PageHeader
        title="Campañas y Comunicaciones"
        description="WhatsApp y correo · Historial de campañas y recordatorios de posventa por proyecto"
        actions={
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/modulo/campanas/seguimiento">
              Seguimiento de envíos <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        }
      />

      {/* Navegación por pestañas principales */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e6e8] pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("composer")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "composer"
              ? "bg-[#0f68ea] text-white shadow-xs"
              : "bg-[#f0f2f4] text-[#1d1d1f] hover:bg-slate-200"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Nueva Campaña</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "history"
              ? "bg-[#0f68ea] text-white shadow-xs"
              : "bg-[#f0f2f4] text-[#1d1d1f] hover:bg-slate-200"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Historial de Campañas</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[11px]">
            {campaigns.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reminders")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "reminders"
              ? "bg-[#0f68ea] text-white shadow-xs"
              : "bg-[#f0f2f4] text-[#1d1d1f] hover:bg-slate-200"
          }`}
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Recordatorios Automáticos de Posventa</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[11px]">
            {reminders.length}
          </span>
        </button>
      </div>

      {/* Pestaña 1: Diseñador de Nueva Campaña */}
      {activeTab === "composer" && (
        <div className="grid gap-8 xl:grid-cols-2 items-start">
          <form onSubmit={handleCampaignSubmit} className="surface-card space-y-5 p-6">
            <h2 className="text-lg font-bold tracking-tight text-[#1d1d1f]">Crear nueva campaña</h2>
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
                className="rounded-xl text-xs"
              />
            </div>
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-[#1d1d1f]">Canal de envío</legend>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={channel === "email" ? "default" : "outline"}
                  aria-pressed={channel === "email"}
                  onClick={() => setChannel("email")}
                  className="rounded-xl text-xs"
                >
                  <Mail className="h-4 w-4 mr-1.5" /> Correo electrónico
                </Button>
                <Button
                  type="button"
                  variant={channel === "whatsapp" ? "default" : "outline"}
                  aria-pressed={channel === "whatsapp"}
                  onClick={() => setChannel("whatsapp")}
                  className="rounded-xl text-xs"
                >
                  <MessageSquare className="h-4 w-4 mr-1.5" /> WhatsApp
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
                className="rounded-xl text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-attachment" className="flex items-center gap-2 text-xs">
                <FileUp className="h-4 w-4 text-[#0f68ea]" /> Resolución o fotografías de avance
              </Label>
              <Input
                id="campaign-attachment"
                type="file"
                accept="application/pdf,image/*"
                disabled={attachments.length >= 3}
                onChange={handleAttachmentUpload}
                className="rounded-xl text-xs"
              />
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between gap-3 text-xs bg-slate-50 p-2 rounded-lg border border-[#e5e6e8]"
                >
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
                    className="h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-date" className="text-xs">
                Programación (opcional)
              </Label>
              <Input
                id="campaign-date"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-full bg-[#0f68ea] hover:bg-blue-700 text-white font-semibold text-xs"
            >
              <Send className="h-4 w-4 mr-1.5" />{" "}
              {scheduledAt ? "Programar campaña simulada" : "Simular envío masivo"}
            </Button>
          </form>

          <section className="space-y-6">
            <h2 className="text-lg font-bold tracking-tight text-[#1d1d1f]">
              Previsualización en vivo
            </h2>
            <div className="rounded-[24px] border border-border bg-secondary/50 p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#e5e6e8] pb-3">
                <span className="font-bold text-sm text-[#1d1d1f]">ClearEstate</span>
                <StatusBadge tone="neutral">
                  {channel === "email" ? "Correo electrónico" : "WhatsApp"}
                </StatusBadge>
              </div>
              <p className="mb-2 text-xs text-muted-foreground font-medium">
                Destinatario demo: {preview?.buyerName} · {project?.name}
              </p>
              {title && <h3 className="mb-3 text-base font-bold text-[#1d1d1f]">{title}</h3>}
              <p className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed text-[#1d1d1f]">
                {preview ? renderCampaignMessage(message, preview) : message}
              </p>
              {attachments.map((attachment) =>
                attachment.type.startsWith("image/") ? (
                  <img
                    key={attachment.id}
                    src={attachment.dataUrl}
                    alt={attachment.name}
                    className="mt-4 max-h-56 w-full rounded-[18px] object-contain border border-[#e5e6e8]"
                  />
                ) : (
                  <p
                    key={attachment.id}
                    className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground"
                  >
                    Adjunto: {attachment.name}
                  </p>
                ),
              )}
            </div>

            <div className="surface-card p-5 space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Destinatarios objetivo ({recipients.length})
              </h3>
              <div className="divide-y divide-border max-h-48 overflow-y-auto pr-1">
                {recipients.map((sale) => (
                  <div key={sale.id} className="flex flex-wrap justify-between gap-2 py-2 text-xs">
                    <span className="font-medium text-[#1d1d1f]">{sale.buyerName}</span>
                    <span className="text-muted-foreground">Lote {sale.lot}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Pestaña 2: Historial de Campañas (Ver / Editar / Eliminar) */}
      {activeTab === "history" && (
        <CampaignHistoryTab
          campaigns={campaigns}
          sales={sales}
          onUpdateCampaign={updateCampaign}
          onDeleteCampaign={deleteCampaign}
        />
      )}

      {/* Pestaña 3: Recordatorios Automáticos de Posventa */}
      {activeTab === "reminders" && (
        <RemindersTab
          reminders={reminders}
          onCreateReminder={createReminder}
          onUpdateReminder={updateReminder}
          onDeleteReminder={deleteReminder}
        />
      )}
    </div>
  );
}
