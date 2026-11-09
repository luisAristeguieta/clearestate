import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/phase2/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PROJECTS, type ProjectId } from "@/config/erpConfig";
import {
  REMINDER_STATUS_LABELS,
  REMINDER_TYPE_LABELS,
  type AutomatedReminder,
  type CampaignChannel,
  type ReminderStatus,
  type ReminderType,
} from "@/config/phase3Config";
import { cn } from "@/lib/utils";

interface RemindersTabProps {
  reminders: AutomatedReminder[];
  onCreateReminder: (reminder: Omit<AutomatedReminder, "id" | "createdAt">) => void;
  onUpdateReminder: (id: string, patch: Partial<AutomatedReminder>) => void;
  onDeleteReminder: (id: string) => void;
}

export function RemindersTab({
  reminders,
  onCreateReminder,
  onUpdateReminder,
  onDeleteReminder,
}: RemindersTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<AutomatedReminder | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReminderType>("entrega_lote");
  const [projectId, setProjectId] = useState<ProjectId>("paris");
  const [channels, setChannels] = useState<CampaignChannel[]>(["whatsapp", "email"]);
  const [targetDate, setTargetDate] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<ReminderStatus>("scheduled");

  const resetForm = () => {
    setTitle("");
    setType("entrega_lote");
    setProjectId("paris");
    setChannels(["whatsapp", "email"]);
    setTargetDate("");
    setMessage("");
    setStatus("scheduled");
    setEditingReminder(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reminder: AutomatedReminder) => {
    setEditingReminder(reminder);
    setTitle(reminder.title);
    setType(reminder.type);
    setProjectId(reminder.projectId);
    const initialChannels =
      reminder.channels && reminder.channels.length > 0
        ? reminder.channels
        : [reminder.channel ?? "whatsapp"];
    setChannels(initialChannels);
    setTargetDate(reminder.targetDate);
    setMessage(reminder.message);
    setStatus(reminder.status);
    setIsModalOpen(true);
  };

  const handleToggleChannel = (chan: CampaignChannel, checked: boolean) => {
    if (checked) {
      if (!channels.includes(chan)) {
        setChannels([...channels, chan]);
      }
    } else {
      setChannels(channels.filter((c) => c !== chan));
    }
  };

  const handleSimulatePreset = (preset: "entrega" | "documentacion") => {
    if (preset === "entrega") {
      setTitle("Recordatorio: Inspección técnica y entrega formal de lote");
      setType("entrega_lote");
      setProjectId("paris");
      setChannels(["whatsapp", "email"]);
      setTargetDate("2026-11-28");
      setMessage(
        "Estimado/a {{nombre}}, le recordamos que la entrega física de su lote {{lote}} en Proyecto París está programada para el 28 de noviembre. Nuestro equipo técnico le espera para el recorrido de inspección.",
      );
      setStatus("active");
      toast.info("Campos completados: Simulación de Entrega de Lote (Multicanal).");
    } else {
      setTitle("Aviso de documentación pendiente para firma de escrituras");
      setType("documentacion");
      setProjectId("sagaleta");
      setChannels(["email", "whatsapp"]);
      setTargetDate("2026-12-05");
      setMessage(
        "Estimado/a {{nombre}}, solicitamos remitir su certificado de no adeudo y copia de documento de identidad para completar el expediente de entrega de su lote {{lote}} en Proyecto Sagaleta.",
      );
      setStatus("scheduled");
      toast.info("Campos completados: Simulación de Documentación Pendiente (Multicanal).");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!title.trim() || !message.trim() || !targetDate) {
        throw new Error("Por favor completa todos los campos del recordatorio.");
      }
      if (channels.length === 0) {
        throw new Error("Por favor selecciona al menos un canal de envío (Correo o WhatsApp).");
      }

      const primaryChannel = channels[0] ?? "whatsapp";

      if (editingReminder) {
        onUpdateReminder(editingReminder.id, {
          title: title.trim(),
          type,
          projectId,
          channel: primaryChannel,
          channels,
          targetDate,
          message: message.trim(),
          status,
        });
        toast.success("Recordatorio automático actualizado exitosamente.");
      } else {
        onCreateReminder({
          title: title.trim(),
          type,
          projectId,
          channel: primaryChannel,
          channels,
          targetDate,
          message: message.trim(),
          status,
        });
        toast.success("Recordatorio automático configurado exitosamente.");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar recordatorio.");
    }
  };

  const getTypeIcon = (t: ReminderType) => {
    switch (t) {
      case "entrega_lote":
        return <Calendar className="h-4 w-4 text-[#0f68ea]" />;
      case "documentacion":
        return <FileText className="h-4 w-4 text-amber-600" />;
      case "hito_obra":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e6e8] pb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#1d1d1f]">
            Recordatorios Automáticos de Posventa
          </h2>
          <p className="text-xs text-muted-foreground">
            Configura y automatiza alertas multicanal para entregas físicas de lotes, documentación
            pendiente e hitos de obra.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          className="rounded-full bg-[#0f68ea] hover:bg-blue-700 text-white shadow-xs text-xs font-semibold px-4"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo Recordatorio
        </Button>
      </div>

      {reminders.length === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground text-sm">
          No hay recordatorios automáticos configurados en este momento.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reminders.map((reminder) => {
            const project = PROJECTS.find((p) => p.id === reminder.projectId);
            const effectiveChannels =
              reminder.channels && reminder.channels.length > 0
                ? reminder.channels
                : [reminder.channel ?? "whatsapp"];

            return (
              <div
                key={reminder.id}
                className="rounded-[20px] border border-[#e5e6e8] bg-white p-5 shadow-xs flex flex-col justify-between gap-4 transition-all hover:border-[#0f68ea]/40"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-[#1d1d1f]">
                      {getTypeIcon(reminder.type)}
                      {REMINDER_TYPE_LABELS[reminder.type]}
                    </span>

                    <StatusBadge
                      tone={
                        reminder.status === "sent"
                          ? "complete"
                          : reminder.status === "active"
                            ? "neutral"
                            : "yellow"
                      }
                    >
                      {REMINDER_STATUS_LABELS[reminder.status]}
                    </StatusBadge>
                  </div>

                  <h3 className="font-bold text-sm text-[#1d1d1f] leading-snug">
                    {reminder.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-3 bg-[#f8f9fa] rounded-xl p-3 border border-[#e5e6e8]">
                    {reminder.message}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-[#e5e6e8]">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-[#1d1d1f]">{project?.name}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Fecha: {reminder.targetDate}
                    </span>

                    {/* Canales múltiples activos */}
                    <div className="flex items-center gap-1.5">
                      {effectiveChannels.map((ch) => (
                        <span
                          key={ch}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                            ch === "whatsapp"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-[#0f68ea] border border-blue-200",
                          )}
                        >
                          {ch === "whatsapp" ? (
                            <MessageSquare className="h-2.5 w-2.5" />
                          ) : (
                            <Mail className="h-2.5 w-2.5" />
                          )}
                          {ch === "whatsapp" ? "WhatsApp" : "Correo"}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1">
                      {reminder.status !== "sent" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-[11px] h-7 px-2.5"
                          onClick={() => {
                            const nextStatus: ReminderStatus =
                              reminder.status === "scheduled" ? "active" : "sent";
                            onUpdateReminder(reminder.id, { status: nextStatus });
                            toast.success(
                              `Recordatorio marcado como: ${REMINDER_STATUS_LABELS[nextStatus]}`,
                            );
                          }}
                        >
                          {reminder.status === "scheduled" ? "Activar ahora" : "Marcar enviado"}
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-slate-700 hover:text-[#0f68ea] hover:bg-blue-50 text-[11px] h-7 px-2.5"
                        onClick={() => handleOpenEdit(reminder)}
                      >
                        <Pencil className="h-3 w-3 mr-1 text-[#0f68ea]" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 text-[11px] h-7 px-2"
                        onClick={() => {
                          onDeleteReminder(reminder.id);
                          toast.success("Recordatorio eliminado.");
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog: Crear / Editar Recordatorio con Simulación y Multicanal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg rounded-[28px] border border-[#e5e6e8] bg-white p-6 shadow-xl">
          <DialogHeader className="border-b border-[#e5e6e8] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0f68ea]">
                {editingReminder ? <Pencil className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[#1d1d1f]">
                  {editingReminder
                    ? "Editar Recordatorio Automático"
                    : "Nuevo Recordatorio Automático"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {editingReminder
                    ? "Modifica los parámetros, canales y plantilla de la notificación programada."
                    : "Programa una notificación preventiva para los compradores de un proyecto."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Botones de Simulación Automática en el Formulario */}
          <div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-3 space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0f68ea]">
                <Sparkles className="h-3.5 w-3.5 text-[#0f68ea]" />
                Acciones rápidas de simulación
              </span>
              <span className="text-[10px] text-muted-foreground">Autocompletar formulario</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSimulatePreset("entrega")}
                className="h-8 rounded-xl bg-white text-[11px] font-medium text-slate-700 hover:text-[#0f68ea] hover:border-[#0f68ea] border-[#e5e6e8] shadow-xs justify-start px-2.5 truncate"
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-[#0f68ea] shrink-0" />
                <span className="truncate">Simular: Recordatorio de Entrega</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSimulatePreset("documentacion")}
                className="h-8 rounded-xl bg-white text-[11px] font-medium text-slate-700 hover:text-amber-600 hover:border-amber-500 border-[#e5e6e8] shadow-xs justify-start px-2.5 truncate"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5 text-amber-600 shrink-0" />
                <span className="truncate">Simular: Documentación Pendiente</span>
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="rem-title" className="text-xs font-semibold text-[#1d1d1f]">
                Título del recordatorio
              </Label>
              <Input
                id="rem-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Aviso de fecha de entrega de lote"
                className="text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1d1d1f]">Tipo de alerta</Label>
                <Select value={type} onValueChange={(val) => setType(val as ReminderType)}>
                  <SelectTrigger className="text-xs rounded-xl h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrega_lote">Entrega de Lote</SelectItem>
                    <SelectItem value="documentacion">Documentación Pendiente</SelectItem>
                    <SelectItem value="hito_obra">Hito de Obra</SelectItem>
                    <SelectItem value="general">Notificación General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1d1d1f]">Proyecto</Label>
                <Select value={projectId} onValueChange={(val) => setProjectId(val as ProjectId)}>
                  <SelectTrigger className="text-xs rounded-xl h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECTS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selección Múltiple de Canales (Correo y WhatsApp simultáneos) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1d1d1f]">
                Canales de envío (selección múltiple simultánea)
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                <label
                  htmlFor="channel-email"
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-all",
                    channels.includes("email")
                      ? "border-[#0f68ea] bg-blue-50/50 shadow-xs"
                      : "border-[#e5e6e8] bg-white hover:bg-slate-50",
                  )}
                >
                  <Checkbox
                    id="channel-email"
                    checked={channels.includes("email")}
                    onCheckedChange={(checked) => handleToggleChannel("email", Boolean(checked))}
                  />
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#1d1d1f]">
                    <Mail
                      className={cn(
                        "h-3.5 w-3.5",
                        channels.includes("email") ? "text-[#0f68ea]" : "text-muted-foreground",
                      )}
                    />
                    <span>Correo electrónico</span>
                  </div>
                </label>

                <label
                  htmlFor="channel-whatsapp"
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-all",
                    channels.includes("whatsapp")
                      ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                      : "border-[#e5e6e8] bg-white hover:bg-slate-50",
                  )}
                >
                  <Checkbox
                    id="channel-whatsapp"
                    checked={channels.includes("whatsapp")}
                    onCheckedChange={(checked) => handleToggleChannel("whatsapp", Boolean(checked))}
                  />
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#1d1d1f]">
                    <MessageSquare
                      className={cn(
                        "h-3.5 w-3.5",
                        channels.includes("whatsapp")
                          ? "text-emerald-600"
                          : "text-muted-foreground",
                      )}
                    />
                    <span>WhatsApp</span>
                  </div>
                </label>
              </div>
              {channels.length === 0 && (
                <p className="text-[11px] text-red-500 font-medium">
                  Debes seleccionar al menos un canal de comunicación.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rem-date" className="text-xs font-semibold text-[#1d1d1f]">
                  Fecha objetivo
                </Label>
                <Input
                  id="rem-date"
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="text-xs rounded-xl h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1d1d1f]">
                  {editingReminder ? "Estado actual" : "Estado inicial"}
                </Label>
                <Select value={status} onValueChange={(val) => setStatus(val as ReminderStatus)}>
                  <SelectTrigger className="text-xs rounded-xl h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programado</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rem-message" className="text-xs font-semibold text-[#1d1d1f]">
                Mensaje plantilla (permite variables &#123;&#123;nombre&#125;&#125; y
                &#123;&#123;lote&#125;&#125;)
              </Label>
              <Textarea
                id="rem-message"
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Estimado/a {{nombre}}, le recordamos que la entrega de su lote {{lote}} está programada..."
                className="text-xs rounded-xl"
              />
            </div>

            {/* Vista previa en vivo reflejando canales */}
            <div className="rounded-xl border border-[#e5e6e8] bg-[#f8f9fa] p-3 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <span className="font-semibold text-slate-700">Vista previa de envío:</span>
                <div className="flex items-center gap-1.5">
                  {channels.map((c) => (
                    <span
                      key={c}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                        c === "whatsapp"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-[#0f68ea] border border-blue-200",
                      )}
                    >
                      {c === "whatsapp" ? (
                        <MessageSquare className="h-2.5 w-2.5" />
                      ) : (
                        <Mail className="h-2.5 w-2.5" />
                      )}
                      {c === "whatsapp" ? "WhatsApp activo" : "Correo activo"}
                    </span>
                  ))}
                  {channels.length === 0 && (
                    <span className="text-[10px] text-red-500 font-medium">
                      Sin canal seleccionado
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-[#e5e6e8] line-clamp-2">
                {message
                  ? `"${message.replace("{{nombre}}", "María Fernanda").replace("{{lote}}", "A-014")}"`
                  : "Ingresa el texto del mensaje para previsualizarlo con variables simuladas..."}
              </p>
            </div>

            <DialogFooter className="pt-2 border-t border-[#e5e6e8]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="rounded-full text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-full bg-[#0f68ea] hover:bg-blue-700 text-white text-xs font-semibold px-4"
              >
                {editingReminder ? "Guardar cambios" : "Guardar recordatorio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
