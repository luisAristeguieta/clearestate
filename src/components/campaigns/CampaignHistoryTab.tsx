import { ArrowUpRight, Eye, Mail, MessageSquare, Pencil, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PROJECTS } from "@/config/erpConfig";
import {
  renderCampaignMessage,
  type Campaign,
  type CampaignChannel,
  type OracleSale,
} from "@/config/phase3Config";

interface CampaignHistoryTabProps {
  campaigns: Campaign[];
  sales: OracleSale[];
  onUpdateCampaign: (
    id: string,
    patch: Partial<Pick<Campaign, "title" | "message" | "scheduledAt" | "channel">>,
  ) => void;
  onDeleteCampaign: (id: string) => void;
}

export function CampaignHistoryTab({
  campaigns,
  sales,
  onUpdateCampaign,
  onDeleteCampaign,
}: CampaignHistoryTabProps) {
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editChannel, setEditChannel] = useState<CampaignChannel>("email");
  const [editScheduledAt, setEditScheduledAt] = useState("");

  const handleOpenEdit = (campaign: Campaign) => {
    setEditCampaign(campaign);
    setEditTitle(campaign.title);
    setEditMessage(campaign.message);
    setEditChannel(campaign.channel);
    setEditScheduledAt(campaign.scheduledAt ? campaign.scheduledAt.slice(0, 16) : "");
  };

  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editCampaign) return;
    try {
      if (!editTitle.trim() || !editMessage.trim()) {
        throw new Error("El título y el mensaje no pueden estar vacíos.");
      }
      onUpdateCampaign(editCampaign.id, {
        title: editTitle.trim(),
        message: editMessage.trim(),
        channel: editChannel,
        scheduledAt: editScheduledAt ? new Date(editScheduledAt).toISOString() : null,
      });
      toast.success("Campaña actualizada exitosamente.");
      setEditCampaign(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar la campaña.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#e5e6e8] pb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#1d1d1f]">
            Historial de Campañas Registradas
          </h2>
          <p className="text-xs text-muted-foreground">
            Consulta, edita o elimina las comunicaciones enviadas y programadas por proyecto.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
          <Link to="/modulo/campanas/seguimiento">
            Seguimiento de entregas <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground text-sm">
          No hay campañas registradas. Puedes crear una nueva en la pestaña "Nueva Campaña".
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const project = PROJECTS.find((p) => p.id === campaign.projectId);
            const isEmail = campaign.channel === "email";

            return (
              <div
                key={campaign.id}
                className="rounded-[20px] border border-[#e5e6e8] bg-white p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[#0f68ea]/40"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-[#1d1d1f]">
                      {isEmail ? (
                        <Mail className="h-3 w-3 text-[#0f68ea]" />
                      ) : (
                        <MessageSquare className="h-3 w-3 text-emerald-600" />
                      )}
                      {isEmail ? "Correo electrónico" : "WhatsApp"}
                    </span>

                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#0f68ea]">
                      {project?.name}
                    </span>

                    {campaign.scheduledAt && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                        Programada: {new Date(campaign.scheduledAt).toLocaleDateString("es-EC")}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-[#1d1d1f] tracking-tight">
                    {campaign.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 max-w-2xl">
                    {campaign.message}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 font-medium text-[#1d1d1f]">
                      <Users className="h-3 w-3 text-[#0f68ea]" />
                      {campaign.deliveries.length} destinatarios vinculados
                    </span>
                    <span>·</span>
                    <span>
                      Creada el {new Date(campaign.createdAt).toLocaleDateString("es-EC")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => setDetailCampaign(campaign)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> Ver detalle
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs text-[#0f68ea] hover:bg-blue-50"
                    onClick={() => handleOpenEdit(campaign)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                    onClick={() => {
                      onDeleteCampaign(campaign.id);
                      toast.success(`Campaña "${campaign.title}" eliminada.`);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Ver Detalle de Campaña */}
      <Dialog
        open={Boolean(detailCampaign)}
        onOpenChange={(open) => !open && setDetailCampaign(null)}
      >
        <DialogContent className="max-w-xl rounded-[28px] border border-[#e5e6e8] bg-white p-6 shadow-xl">
          {detailCampaign && (
            <div className="space-y-4">
              <DialogHeader className="border-b border-[#e5e6e8] pb-4">
                <div className="flex items-center gap-2">
                  <StatusBadge tone="neutral">
                    {detailCampaign.channel === "email" ? "Correo electrónico" : "WhatsApp"}
                  </StatusBadge>
                  <span className="text-xs text-muted-foreground">
                    {PROJECTS.find((p) => p.id === detailCampaign.projectId)?.name}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold text-[#1d1d1f] pt-1">
                  {detailCampaign.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Registrada el {new Date(detailCampaign.createdAt).toLocaleString("es-EC")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mensaje Emitido / Plantilla:
                </p>
                <div className="rounded-2xl border border-[#e5e6e8] bg-[#f8f9fa] p-4 text-xs leading-relaxed text-[#1d1d1f] whitespace-pre-wrap">
                  {detailCampaign.message}
                </div>
              </div>

              {/* Previsualización contra el primer comprador del proyecto */}
              {(() => {
                const sampleSale = sales.find((s) => s.projectId === detailCampaign.projectId);
                if (!sampleSale) return null;
                return (
                  <div className="space-y-1 rounded-2xl bg-blue-50/50 border border-blue-100 p-3.5 text-xs">
                    <p className="font-semibold text-[#0f68ea]">
                      Previsualización con datos reales ({sampleSale.buyerName} · Lote{" "}
                      {sampleSale.lot}):
                    </p>
                    <p className="text-[#1d1d1f] pt-1 italic">
                      "{renderCampaignMessage(detailCampaign.message, sampleSale)}"
                    </p>
                  </div>
                );
              })()}

              <div className="space-y-2 pt-2 border-t border-[#e5e6e8]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1d1d1f]">
                    Destinatarios vinculados ({detailCampaign.deliveries.length})
                  </span>
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="h-6 text-xs text-[#0f68ea] p-0"
                  >
                    <Link to="/modulo/campanas/seguimiento">
                      Ver estatus de envíos <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-[#e5e6e8] rounded-xl border border-[#e5e6e8] bg-white">
                  {detailCampaign.deliveries.map((del) => {
                    const sale = sales.find((s) => s.id === del.saleId);
                    return (
                      <div key={del.id} className="flex items-center justify-between p-2.5 text-xs">
                        <span className="font-medium text-[#1d1d1f]">
                          {sale?.buyerName ?? del.contact}
                        </span>
                        <span className="text-muted-foreground">
                          Lote {sale?.lot ?? "N/A"} · {del.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-[#e5e6e8]">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setDetailCampaign(null)}
                  className="rounded-full text-xs"
                >
                  Cerrar detalle
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Campaña */}
      <Dialog open={Boolean(editCampaign)} onOpenChange={(open) => !open && setEditCampaign(null)}>
        <DialogContent className="max-w-lg rounded-[28px] border border-[#e5e6e8] bg-white p-6 shadow-xl">
          {editCampaign && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <DialogHeader className="border-b border-[#e5e6e8] pb-4">
                <DialogTitle className="text-lg font-bold text-[#1d1d1f]">
                  Editar Campaña
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Modifica los textos y programación de la campaña registrada.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <Label htmlFor="edit-title" className="text-xs font-semibold text-[#1d1d1f]">
                  Título de la campaña
                </Label>
                <Input
                  id="edit-title"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1d1d1f]">Canal</Label>
                  <Select
                    value={editChannel}
                    onValueChange={(val) => setEditChannel(val as CampaignChannel)}
                  >
                    <SelectTrigger className="text-xs rounded-xl h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Correo electrónico</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-scheduled" className="text-xs font-semibold text-[#1d1d1f]">
                    Programación (opcional)
                  </Label>
                  <Input
                    id="edit-scheduled"
                    type="datetime-local"
                    value={editScheduledAt}
                    onChange={(e) => setEditScheduledAt(e.target.value)}
                    className="text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-message" className="text-xs font-semibold text-[#1d1d1f]">
                  Mensaje
                </Label>
                <Textarea
                  id="edit-message"
                  required
                  rows={4}
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>

              <DialogFooter className="pt-2 border-t border-[#e5e6e8]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditCampaign(null)}
                  className="rounded-full text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full bg-[#0f68ea] hover:bg-blue-700 text-white text-xs font-semibold px-4"
                >
                  Guardar cambios
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
