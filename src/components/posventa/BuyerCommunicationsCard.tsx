import {
  ArrowDownLeft,
  Bell,
  Check,
  CheckCheck,
  Clock,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import type { CampaignChannel, OracleSale } from "@/config/phase3Config";
import { cn } from "@/lib/utils";

export type CommunicationChannel = "email" | "whatsapp" | "both";
export type CommunicationDeliveryStatus = "sent" | "delivered" | "read" | "replied";
export type CommunicationType = "cobranza" | "obra" | "entrega" | "notificacion";

export interface CustomerReply {
  text: string;
  receivedAt: string;
  channel: "email" | "whatsapp";
}

export interface BuyerCommunicationRecord {
  id: string;
  saleId: string;
  type: CommunicationType;
  title: string;
  message: string;
  sentAt: string;
  channel: CommunicationChannel;
  status: CommunicationDeliveryStatus;
  readAt?: string | undefined;
  reply?: CustomerReply | undefined;
}

const TYPE_LABELS: Record<CommunicationType, string> = {
  cobranza: "Recordatorio de Cobranza",
  obra: "Avance de Obra",
  entrega: "Entrega de Lote",
  notificacion: "Notificación General",
};

function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

interface BuyerCommunicationsCardProps {
  sale: OracleSale;
  projectName: string;
}

export function BuyerCommunicationsCard({ sale, projectName }: BuyerCommunicationsCardProps) {
  const [filter, setFilter] = useState<"all" | CommunicationType>("all");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  // New reminder form state
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<CommunicationType>("cobranza");
  const [selectedChannels, setSelectedChannels] = useState<CampaignChannel[]>([
    "whatsapp",
    "email",
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [simulateInstantReply, setSimulateInstantReply] = useState(true);

  // Seed communications tailored to the buyer
  const [communications, setCommunications] = useState<BuyerCommunicationRecord[]>([
    {
      id: "comm-01",
      saleId: sale.id,
      type: "cobranza",
      title: "Recordatorio de pago: faltan 10 días para el vencimiento de tu cuota (Pago 10 de 24)",
      message: `Estimado/a ${sale.buyerName}, le recordamos que su cuota mensual #10 correspondiente a su lote ${sale.lot} en ${projectName} tiene como fecha de vencimiento el 30 de octubre. Le invitamos a realizar el pago vía transferencia bancaria y reportarlo por este canal.`,
      sentAt: "2026-10-20T09:30:00Z",
      channel: "both",
      status: "replied",
      readAt: "2026-10-20T09:35:00Z",
      reply: {
        text: `Hola, muchas gracias por el recordatorio. Acabo de realizar la transferencia por $3.541,67 desde mi cuenta de Banco Pichincha. Les adjunto el comprobante por correo. Saludos!`,
        receivedAt: "2026-10-20T10:14:00Z",
        channel: "whatsapp",
      },
    },
    {
      id: "comm-02",
      saleId: sale.id,
      type: "obra",
      title: "Avance de habilitación urbana y redes hidrosanitarias - Etapa I",
      message: `Hola ${sale.buyerName}, compartimos el avance de ${projectName} para tu lote ${sale.lot}. Las redes de agua potable y alcantarillado presentan un 85% de ejecución satisfactoria con pruebas de presión concluidas.`,
      sentAt: "2026-11-02T14:00:00Z",
      channel: "both",
      status: "read",
      readAt: "2026-11-02T14:22:00Z",
    },
    {
      id: "comm-03",
      saleId: sale.id,
      type: "entrega",
      title: "Aviso preventivo: inspección previa y requisitos para entrega de lote",
      message: `Estimado/a ${sale.buyerName}, le recordamos que la entrega física de su lote ${sale.lot} en ${projectName} está prevista para el ${sale.estimatedDelivery}. Recuerde tener actualizada su copia de cédula y certificado de no adeudo para coordinar la inspección técnica.`,
      sentAt: "2026-11-06T11:00:00Z",
      channel: "whatsapp",
      status: "delivered",
    },
    {
      id: "comm-04",
      saleId: sale.id,
      type: "notificacion",
      title: "Certificado de cancelación total y habilitación de expediente de posventa",
      message: `Estimado/a ${sale.buyerName}, nos complace informarle que su crédito en Oracle Financials se encuentra 100% amortizado. Su expediente ha sido habilitado con éxito en la Bandeja de Posventa para coordinar la entrega formal.`,
      sentAt: "2026-11-08T16:45:00Z",
      channel: "email",
      status: "replied",
      readAt: "2026-11-08T16:50:00Z",
      reply: {
        text: `Excelente noticia, muchísimas gracias. Ya coordiné con mi asesor para la inspección física del terreno. Un saludo cordial a todo el equipo de ClearEstate.`,
        receivedAt: "2026-11-08T17:15:00Z",
        channel: "email",
      },
    },
  ]);

  const handleSimulateReply = (commId?: string) => {
    // Target the specific communication or the first one without a reply
    const target = commId
      ? communications.find((c) => c.id === commId)
      : communications.find((c) => !c.reply);

    if (!target) {
      toast.info("Todas las comunicaciones registradas ya cuentan con respuesta del cliente.");
      return;
    }

    const replyReplies: Record<CommunicationType, string> = {
      cobranza:
        "Estimados, confirmo que he realizado el pago correspondiente a la cuota este mediodía. Adjunto la captura de la transferencia bancaria. Muchas gracias por el aviso.",
      obra: "Muchas gracias por el reporte de obra, se ve un gran avance en la urbanización. Quedo atento a la culminación de pistas.",
      entrega:
        "Confirmado, ya tengo toda la documentación lista en formato digital. ¿Qué día podemos agendar el recorrido de inspección en obra?",
      notificacion:
        "Muchas gracias por la notificación y gestión. Todo claro por mi parte para continuar con el acta formal.",
    };

    const replyText =
      replyReplies[target.type] ??
      "Recibido el mensaje, muchas gracias por mantenernos siempre informados.";

    const preferredChannel: "whatsapp" | "email" =
      target.channel === "email" ? "email" : "whatsapp";

    setCommunications((prev) =>
      prev.map((item) => {
        if (item.id === target.id) {
          return {
            ...item,
            status: "replied",
            reply: {
              text: replyText,
              receivedAt: new Date().toISOString(),
              channel: preferredChannel,
            },
          };
        }
        return item;
      }),
    );

    toast.success(
      `Respuesta simulada de ${sale.buyerName} registrada con éxito vía ${
        preferredChannel === "whatsapp" ? "WhatsApp" : "Correo electrónico"
      }.`,
    );
  };

  const handleOpenNewDialog = () => {
    setNewTitle("Recordatorio de pago: cuota programada del mes");
    setNewType("cobranza");
    setSelectedChannels(["whatsapp", "email"]);
    setNewMessage(
      `Estimado/a ${sale.buyerName}, le recordamos que la cuota correspondiente a su lote ${sale.lot} en ${projectName} se encuentra próxima a vencer. Recuerde reportar su comprobante de pago oportunamente.`,
    );
    setSimulateInstantReply(true);
    setIsNewDialogOpen(true);
  };

  const handleCreateReminderSubmit = () => {
    if (!newTitle.trim()) {
      toast.error("Ingresa un título para el recordatorio.");
      return;
    }
    if (selectedChannels.length === 0) {
      toast.error("Selecciona al menos un canal de envío (Correo o WhatsApp).");
      return;
    }

    const channelValue: CommunicationChannel =
      selectedChannels.length === 2
        ? "both"
        : selectedChannels[0] === "whatsapp"
          ? "whatsapp"
          : "email";

    const nowIso = new Date().toISOString();
    const newRecord: BuyerCommunicationRecord = {
      id: `comm-user-${Date.now()}`,
      saleId: sale.id,
      type: newType,
      title: newTitle.trim(),
      message: newMessage.trim(),
      sentAt: nowIso,
      channel: channelValue,
      status: simulateInstantReply ? "replied" : "delivered",
      readAt: nowIso,
      reply: simulateInstantReply
        ? {
            text: `Hola, recibido el recordatorio. Muchas gracias por la notificación, coordinaré la transferencia de inmediato.`,
            receivedAt: new Date(Date.now() + 600000).toISOString(),
            channel: selectedChannels.includes("whatsapp") ? "whatsapp" : "email",
          }
        : undefined,
    };

    setCommunications((prev) => [newRecord, ...prev]);
    setIsNewDialogOpen(false);
    toast.success("Recordatorio enviado y registrado en el expediente del comprador.");
  };

  const toggleChannel = (channel: CampaignChannel) => {
    if (selectedChannels.includes(channel)) {
      if (selectedChannels.length === 1) {
        toast.error("Debes mantener al menos un canal seleccionado.");
        return;
      }
      setSelectedChannels((prev) => prev.filter((c) => c !== channel));
    } else {
      setSelectedChannels((prev) => [...prev, channel]);
    }
  };

  const filteredCommunications = communications.filter((comm) => {
    if (filter === "all") return true;
    return comm.type === filter;
  });

  return (
    <section className="surface-card space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Historial de Comunicaciones y Recordatorios
            </h2>
            <p className="text-xs text-muted-foreground">
              Trazabilidad de avisos de cobranza, notificaciones de entrega e interacciones
              multicanal
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSimulateReply()}
            className="rounded-full border-border bg-background text-xs font-semibold hover:bg-secondary"
            title="Simula la recepción de una respuesta de WhatsApp o Correo por parte del comprador"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
            Simular respuesta del cliente
          </Button>

          <Button
            size="sm"
            onClick={handleOpenNewDialog}
            className="rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo recordatorio directo
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-border bg-secondary/50 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors",
              filter === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Todos ({communications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("cobranza")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors",
              filter === "cobranza"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Cobranza y Cuotas
          </button>
          <button
            type="button"
            onClick={() => setFilter("entrega")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors",
              filter === "entrega"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Entrega de Lote
          </button>
          <button
            type="button"
            onClick={() => setFilter("obra")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors",
              filter === "obra"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Avances de Obra
          </button>
        </div>

        <span className="text-xs text-muted-foreground">
          {filteredCommunications.length} mensajes registrados
        </span>
      </div>

      {/* List of communications */}
      <div className="space-y-4">
        {filteredCommunications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            No hay comunicaciones registradas para el filtro seleccionado.
          </div>
        ) : (
          filteredCommunications.map((comm) => (
            <article
              key={comm.id}
              className="rounded-2xl border border-border bg-background p-4.5 transition-shadow hover:shadow-xs"
            >
              {/* Message Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/60 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                    {TYPE_LABELS[comm.type]}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDisplayDate(comm.sentAt)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Channels Badges */}
                  {(comm.channel === "email" || comm.channel === "both") && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      <Mail className="h-3 w-3" /> Correo
                    </span>
                  )}
                  {(comm.channel === "whatsapp" || comm.channel === "both") && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      <MessageSquare className="h-3 w-3" /> WhatsApp
                    </span>
                  )}

                  {/* Delivery & Read Status Badge */}
                  {comm.status === "replied" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                      <ArrowDownLeft className="h-3 w-3 text-emerald-600" />
                      Respuesta recibida
                    </span>
                  ) : comm.status === "read" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      <CheckCheck className="h-3 w-3 text-primary" />
                      Leído
                    </span>
                  ) : comm.status === "delivered" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                      <Check className="h-3 w-3" />
                      Entregado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <Send className="h-3 w-3" />
                      Enviado
                    </span>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="mt-3 space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{comm.title}</h3>
                <div className="rounded-xl border border-border/50 bg-secondary/20 p-3 text-xs leading-relaxed text-foreground">
                  {comm.message}
                </div>
              </div>

              {/* Customer Reply Bubble */}
              {comm.reply ? (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-2 text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-900">
                      {comm.reply.channel === "whatsapp" ? (
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 text-primary" />
                      )}
                      Respuesta del comprador · {sale.buyerName} (vía{" "}
                      {comm.reply.channel === "whatsapp" ? "WhatsApp" : "Correo electrónico"})
                    </span>
                    <span className="text-[11px] text-emerald-700 tabular-nums">
                      {formatDisplayDate(comm.reply.receivedAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-emerald-950 font-medium">
                    &ldquo;{comm.reply.text}&rdquo;
                  </p>
                </div>
              ) : (
                /* Inline trigger to simulate reply specifically for this message */
                <div className="mt-2.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSimulateReply(comm.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    <ArrowDownLeft className="h-3 w-3" />
                    Simular respuesta del cliente a este mensaje
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {/* New Reminder Modal Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="max-w-lg rounded-[28px] border-border p-6 shadow-xl">
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Nuevo Recordatorio para {sale.buyerName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Lote {sale.lot} · {projectName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* Type selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de recordatorio</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["cobranza", "entrega", "obra", "notificacion"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setNewType(t);
                      if (t === "cobranza") {
                        setNewTitle("Recordatorio de pago: cuota programada del mes");
                        setNewMessage(
                          `Estimado/a ${sale.buyerName}, le recordamos que la cuota correspondiente a su lote ${sale.lot} en ${projectName} se encuentra próxima a vencer.`,
                        );
                      } else if (t === "entrega") {
                        setNewTitle("Aviso de inspección técnica previa para entrega");
                        setNewMessage(
                          `Hola ${sale.buyerName}, le invitamos a coordinar su visita de inspección técnica para el lote ${sale.lot}.`,
                        );
                      } else if (t === "obra") {
                        setNewTitle("Actualización mensual de avance de obras");
                        setNewMessage(
                          `Estimado/a ${sale.buyerName}, compartimos fotografías del avance de pavimentación y redes en ${projectName}.`,
                        );
                      } else {
                        setNewTitle("Notificación general sobre su expediente");
                        setNewMessage(
                          `Estimado/a ${sale.buyerName}, le informamos sobre la actualización en su estado de posventa en ${projectName}.`,
                        );
                      }
                    }}
                    className={cn(
                      "rounded-xl border p-2 text-left text-xs font-medium transition-colors",
                      newType === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="rem-title" className="text-xs font-semibold">
                Título del mensaje
              </Label>
              <Input
                id="rem-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            {/* Channels toggle selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Canales de envío</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleChannel("email")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-colors",
                    selectedChannels.includes("email")
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Correo electrónico
                </button>
                <button
                  type="button"
                  onClick={() => toggleChannel("whatsapp")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-colors",
                    selectedChannels.includes("whatsapp")
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <Label htmlFor="rem-msg" className="text-xs font-semibold">
                Contenido del mensaje
              </Label>
              <Textarea
                id="rem-msg"
                rows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            {/* Instant reply simulation option */}
            <div className="rounded-xl border border-border bg-secondary/30 p-2.5">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={simulateInstantReply}
                  onChange={(e) => setSimulateInstantReply(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="text-xs font-medium text-foreground">
                  Simular respuesta inmediata del cliente en el historial (demostración)
                </span>
              </label>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewDialogOpen(false)}
              className="rounded-full text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateReminderSubmit}
              className="rounded-full bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Enviar recordatorio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
