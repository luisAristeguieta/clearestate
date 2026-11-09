import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Link2,
  Package,
  Receipt,
  Scale,
  Search,
  Send,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useCallback, useMemo, useState, type FormEvent } from "react";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getViewTitle } from "@/config/brandConfig";
import { formatCurrency, PROJECTS, SEED_PHASES, type ProjectId } from "@/config/erpConfig";
import {
  buildInvitationPath,
  REQUISITION_STATUS_LABELS,
  type Requisition,
} from "@/config/phase2Config";
import { useErp } from "@/context/ErpContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_erp/modulo/logistica")({
  head: () => ({
    meta: [
      { title: getViewTitle("/modulo/logistica") },
      {
        name: "description",
        content:
          "Bandeja de adquisiciones, invitaciones a proveedores, cuadro comparativo y emisión de órdenes.",
      },
      { property: "og:title", content: getViewTitle("/modulo/logistica") },
      {
        property: "og:description",
        content: "Adquisiciones con portal de proveedores y adjudicación trazable.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LogisticsPage,
});

type AcquisitionStatusFilter = "all" | "pending_quote" | "in_comparison" | "ordered";

interface SimulationSupplier {
  name: string;
  email: string;
  conditions: string;
}

const SAMPLE_SUPPLIERS: SimulationSupplier[] = [
  {
    name: "Aceros & Prefabricados Andinos S.A.",
    email: "cotizaciones@acerosandinos.com",
    conditions: "Entrega en almacén de obra. 30 días de crédito comercial.",
  },
  {
    name: "Geoservicios y Control Satelital S.A.C.",
    email: "proyectos@geoservicios.com",
    conditions: "Informes con firma de ingeniero colegiado y ensayos in-situ.",
  },
  {
    name: "Seguridad y Vigilancia Patrimonial 24/7",
    email: "operaciones@seguridadpatrimonial.com",
    conditions: "Personal armado certificado y póliza de responsabilidad civil.",
  },
  {
    name: "Distribuidora Eléctrica del Pacífico S.A.",
    email: "ventas@electricadelpacifico.com",
    conditions: "Luminarias LED con certificación internacional y 5 años de garantía.",
  },
  {
    name: "Pavimentos & Asfaltos del Norte S.R.L.",
    email: "licitaciones@pavimentosnorte.com",
    conditions: "Disponibilidad inmediata de maquinaria y cuadrilla técnica.",
  },
];

const getSampleSupplier = (excludeNames: Set<string> = new Set()): SimulationSupplier => {
  const match = SAMPLE_SUPPLIERS.find((s) => !excludeNames.has(s.name.toLowerCase()));
  if (match) return match;
  return (
    SAMPLE_SUPPLIERS[0] ?? {
      name: "Aceros & Prefabricados Andinos S.A.",
      email: "cotizaciones@acerosandinos.com",
      conditions: "Entrega en almacén de obra. 30 días de crédito comercial.",
    }
  );
};

function LogisticsPage() {
  const {
    budgetLines,
    requisitions,
    invitations,
    purchaseOrders,
    createInvitation,
    adjudicateInvitation,
    submitSupplierOffer,
    projectFilter,
  } = useErp();

  const [activeTab, setActiveTab] = useState<"bandeja" | "comparador" | "ordenes">("bandeja");
  const [selectedStatus, setSelectedStatus] = useState<AcquisitionStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteRequisitionId, setInviteRequisitionId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [awardCriteria, setAwardCriteria] = useState<Record<string, string>>({});
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<string | null>(null);

  const selectedRequisition = useMemo(
    () => requisitions.find((r) => r.id === selectedRequisitionId) ?? null,
    [requisitions, selectedRequisitionId],
  );

  // Logistics deals with requisitions that have progressed beyond draft / initial approval
  const logisticsRequisitions = useMemo(() => {
    return requisitions.filter(
      (r) =>
        r.status === "approved" ||
        r.status === "in_procurement" ||
        r.status === "ordered" ||
        r.status === "invoiced",
    );
  }, [requisitions]);

  // Helper to determine the acquisition state of each requisition
  const getRequisitionProcurementState = useCallback(
    (req: Requisition) => {
      if (req.status === "ordered" || req.status === "invoiced") {
        return {
          key: "ordered" as const,
          label: "Orden emitida",
          tone: "emerald" as const,
        };
      }
      const reqInvitations = invitations.filter((inv) => inv.requisitionId === req.id);
      const hasSubmittedOffers = reqInvitations.some(
        (inv) => inv.status === "submitted" && inv.offer !== null,
      );
      if (hasSubmittedOffers) {
        return {
          key: "in_comparison" as const,
          label: "En comparación",
          tone: "blue" as const,
        };
      }
      if (reqInvitations.length > 0) {
        return {
          key: "pending_quote" as const,
          label: "En cotización",
          tone: "yellow" as const,
        };
      }
      return {
        key: "pending_quote" as const,
        label: "Pendiente de cotización",
        tone: "yellow" as const,
      };
    },
    [invitations],
  );

  // Filtered requisitions based on global project filter, status filter, and search
  const filteredRequisitions = useMemo(() => {
    return logisticsRequisitions.filter((req) => {
      if (projectFilter !== "all" && req.projectId !== projectFilter) {
        return false;
      }
      const state = getRequisitionProcurementState(req);
      if (selectedStatus !== "all" && state.key !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = req.code.toLowerCase().includes(query);
        const matchesTitle = req.title.toLowerCase().includes(query);
        const matchesArea = req.requesterArea.toLowerCase().includes(query);
        const reqInvs = invitations.filter((i) => i.requisitionId === req.id);
        const matchesSupplier = reqInvs.some((i) => i.supplierName.toLowerCase().includes(query));
        if (!matchesCode && !matchesTitle && !matchesArea && !matchesSupplier) {
          return false;
        }
      }
      return true;
    });
  }, [
    logisticsRequisitions,
    projectFilter,
    selectedStatus,
    searchQuery,
    invitations,
    getRequisitionProcurementState,
  ]);

  // Requisitions with submitted offers for the comparative matrix
  const requisitionsWithOffers = useMemo(() => {
    return logisticsRequisitions.filter((requisition) => {
      if (projectFilter !== "all" && requisition.projectId !== projectFilter) {
        return false;
      }
      return invitations.some(
        (invitation) =>
          invitation.requisitionId === requisition.id &&
          invitation.status === "submitted" &&
          invitation.offer !== null,
      );
    });
  }, [logisticsRequisitions, invitations, projectFilter]);

  // Filtered purchase orders based on global project filter
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((order) => {
      if (projectFilter !== "all" && order.projectId !== projectFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = order.code.toLowerCase().includes(query);
        const matchesSupplier = order.supplierName.toLowerCase().includes(query);
        const matchesBy = order.issuedBy.toLowerCase().includes(query);
        if (!matchesCode && !matchesSupplier && !matchesBy) {
          return false;
        }
      }
      return true;
    });
  }, [purchaseOrders, projectFilter, searchQuery]);

  // KPI Calculations
  const kpiData = useMemo(() => {
    const scopedRequisitions = logisticsRequisitions.filter(
      (r) => projectFilter === "all" || r.projectId === projectFilter,
    );
    const inProcurementCount = scopedRequisitions.filter(
      (r) => r.status === "in_procurement" || r.status === "approved",
    ).length;
    const orderedCount = scopedRequisitions.filter(
      (r) => r.status === "ordered" || r.status === "invoiced",
    ).length;

    const scopedInvitations = invitations.filter((inv) =>
      scopedRequisitions.some((r) => r.id === inv.requisitionId),
    );
    const submittedInvitationsCount = scopedInvitations.filter(
      (inv) => inv.status === "submitted" && inv.offer !== null,
    ).length;

    const scopedOrders = purchaseOrders.filter(
      (order) => projectFilter === "all" || order.projectId === projectFilter,
    );
    const totalCommitted = scopedOrders.reduce((sum, order) => sum + order.amount, 0);

    return {
      totalRequisitions: scopedRequisitions.length,
      inProcurementCount,
      orderedCount,
      totalInvitations: scopedInvitations.length,
      submittedInvitationsCount,
      totalOrders: scopedOrders.length,
      totalCommitted,
    };
  }, [logisticsRequisitions, invitations, purchaseOrders, projectFilter]);

  // Simulation: Quick invite supplier
  const handleQuickInvite = async (requisition: Requisition) => {
    const existingInvs = invitations.filter((i) => i.requisitionId === requisition.id);
    const existingNames = new Set(existingInvs.map((i) => i.supplierName.toLowerCase()));
    const candidate = getSampleSupplier(existingNames);

    try {
      const invitation = createInvitation({
        requisitionId: requisition.id,
        supplierName: candidate.name,
        supplierEmail: candidate.email,
      });
      const fullUrl = `${window.location.origin}${buildInvitationPath(invitation.token)}`;
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(fullUrl);
        }
      } catch {
        // Fallback gracefully
      }
      toast.success(
        `Invitación simulada generada para "${candidate.name}". Enlace copiado al portapapeles.`,
      );
    } catch (inviteError) {
      toast.error(
        inviteError instanceof Error ? inviteError.message : "No se pudo generar la invitación.",
      );
    }
  };

  // Simulation: Submit offer for an invitation
  const handleQuickSubmitOffer = (
    _invitationId: string,
    token: string,
    supplierNameStr: string,
    estimatedAmount: number,
  ) => {
    try {
      // Calculate realistic price around 92% - 98% of estimated amount
      const discountFactor = 0.92 + Math.floor(Math.random() * 6) / 100;
      const price = Math.round(estimatedAmount * discountFactor);
      const termDays = Math.floor(Math.random() * 8) + 8; // 8 to 15 days
      const validityDays = 30;

      const slug = supplierNameStr
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-");

      submitSupplierOffer(token, {
        price,
        termDays,
        validityDays,
        conditions:
          "Validez de oferta 30 días. Incluye traslado hasta almacén de obra, seguros vigentes y pruebas de calidad.",
        pdfFileName: `propuesta-tecnica-economica-${slug}.pdf`,
      });

      toast.success(
        `Oferta de ${supplierNameStr} recibida por ${formatCurrency(price)}. Ya visible en el Cuadro comparativo.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar la oferta de prueba.");
    }
  };

  // Simulation: 1-click invite and submit offer directly
  const handleQuickQuoteComplete = async (requisition: Requisition) => {
    const existingInvs = invitations.filter((i) => i.requisitionId === requisition.id);
    const existingNames = new Set(existingInvs.map((i) => i.supplierName.toLowerCase()));
    const candidate = getSampleSupplier(existingNames);

    try {
      const invitation = createInvitation({
        requisitionId: requisition.id,
        supplierName: candidate.name,
        supplierEmail: candidate.email,
      });

      const price = Math.round(requisition.estimatedAmount * 0.94);
      submitSupplierOffer(invitation.token, {
        price,
        termDays: 10,
        validityDays: 30,
        conditions: candidate.conditions,
        pdfFileName: `cotizacion-${candidate.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`,
      });

      toast.success(
        `Oferta de prueba registrada para ${candidate.name} por ${formatCurrency(price)}. Disponible en el Cuadro comparativo.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo completar la simulación de oferta.",
      );
    }
  };

  // Form handle for manual invitation
  const handleCreateInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inviteRequisitionId) return;
    try {
      const invitation = createInvitation({
        requisitionId: inviteRequisitionId,
        supplierName: supplierName.trim(),
        supplierEmail: supplierEmail.trim(),
      });
      const fullUrl = `${window.location.origin}${buildInvitationPath(invitation.token)}`;
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(fullUrl);
        }
      } catch {
        // Fallback gracefully
      }
      toast.success("Invitación generada y enlace copiado al portapapeles.");
      setSupplierName("");
      setSupplierEmail("");
      setInviteRequisitionId(null);
    } catch (inviteError) {
      toast.error(
        inviteError instanceof Error ? inviteError.message : "No se pudo generar la invitación.",
      );
    }
  };

  const handleCopyLink = async (token: string) => {
    try {
      const fullUrl = `${window.location.origin}${buildInvitationPath(token)}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
      }
      toast.success("Enlace de invitación copiado al portapapeles.");
    } catch {
      toast.error("No se pudo copiar el enlace al portapapeles.");
    }
  };

  const handlePreloadCriterion = (invitationId: string) => {
    setAwardCriteria((prev) => ({
      ...prev,
      [invitationId]:
        "Adjudicado por presentar la mejor propuesta técnico-económica, garantizar el menor plazo de entrega y contar con acreditación técnica validada en obra.",
    }));
  };

  const handleAdjudicateOrder = (invitationId: string, supplier: string) => {
    try {
      const criterion =
        awardCriteria[invitationId]?.trim() ||
        "Adjudicado por cumplimiento pleno de requerimientos técnicos, solvencia y mejor precio ofertado.";
      const order = adjudicateInvitation(invitationId, criterion);
      toast.success(
        `${order.code} emitida exitosamente a ${supplier}. El monto comprometido se actualizó en el presupuesto.`,
      );
      setActiveTab("ordenes");
    } catch (adjudicateError) {
      toast.error(
        adjudicateError instanceof Error ? adjudicateError.message : "No se pudo adjudicar.",
      );
    }
  };

  const getProjectName = (projectId: ProjectId) => {
    const found = PROJECTS.find((p) => p.id === projectId);
    return found ? found.name : projectId;
  };

  return (
    <div className="phase2-view">
      <PageHeader
        title="Logística y Adquisiciones"
        description="Recibe los requerimientos aprobados, invita proveedores al portal externo, evalúa cotizaciones en cuadro comparativo y emite órdenes de compra."
      />

      {/* KPI Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card flex items-center justify-between p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">Requerimientos en Proceso</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {kpiData.totalRequisitions}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {kpiData.inProcurementCount} en adquisición · {kpiData.orderedCount} adjudicados
            </p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-primary">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="surface-card flex items-center justify-between p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">Cotizaciones Activas</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {kpiData.totalInvitations}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {kpiData.submittedInvitationsCount} ofertas presentadas
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3 text-indigo-600">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
        </div>

        <div className="surface-card flex items-center justify-between p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">Órdenes Emitidas</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {kpiData.totalOrders}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {purchaseOrders.filter((o) => o.status === "invoiced").length} facturadas
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
            <Award className="h-5 w-5" />
          </div>
        </div>

        <div className="surface-card flex items-center justify-between p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">Total Comprometido</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {formatCurrency(kpiData.totalCommitted)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Órdenes de compra y servicios</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-700">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar: Status & Search (Project filter is handled globally in the top header) */}
      <div className="surface-card mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Estado:
            </span>
            {(
              [
                { id: "all", label: "Todos" },
                { id: "pending_quote", label: "Pendiente cotización" },
                { id: "in_comparison", label: "En comparación" },
                { id: "ordered", label: "Orden emitida" },
              ] as const
            ).map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={selectedStatus === item.id ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 rounded-full text-xs",
                  selectedStatus === item.id ? "font-semibold shadow-xs" : "text-muted-foreground",
                )}
                onClick={() => setSelectedStatus(item.id as AcquisitionStatusFilter)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar título, código o proveedor..."
              className="h-8 rounded-full pl-8 text-xs bg-background"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)}>
        <TabsList className="h-auto max-w-full flex-wrap rounded-full">
          <TabsTrigger value="bandeja" className="rounded-full">
            Bandeja de requerimientos ({filteredRequisitions.length})
          </TabsTrigger>
          <TabsTrigger value="comparador" className="rounded-full">
            Cuadro comparativo ({requisitionsWithOffers.length})
          </TabsTrigger>
          <TabsTrigger value="ordenes" className="rounded-full">
            Órdenes emitidas ({filteredPurchaseOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: BANDEJA DE REQUERIMIENTOS */}
        <TabsContent value="bandeja" className="mt-6 space-y-4">
          {filteredRequisitions.length === 0 && (
            <div className="surface-card p-10 text-center">
              <Package className="text-muted-foreground mx-auto h-10 w-10 opacity-40" />
              <p className="mt-2 text-sm font-semibold text-foreground">
                No hay requerimientos en este filtro.
              </p>
              <p className="text-xs text-muted-foreground">
                Prueba cambiando los filtros de estado o el proyecto seleccionado en la cabecera.
              </p>
            </div>
          )}

          {filteredRequisitions.map((requisition) => {
            const requisitionInvitations = invitations.filter(
              (invitation) => invitation.requisitionId === requisition.id,
            );
            const procurementState = getRequisitionProcurementState(requisition);
            const hasOffers = requisitionInvitations.some(
              (i) => i.status === "submitted" && i.offer !== null,
            );
            const pendingInvitations = requisitionInvitations.filter((i) => i.status === "sent");
            const budgetLine = budgetLines.find((line) => line.id === requisition.budgetLineId);

            return (
              <article
                key={requisition.id}
                className="surface-card p-5 sm:p-6 transition-shadow hover:shadow-xs"
              >
                {/* Cabecera limpia y resumida (estilo Aprobaciones) */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className="font-bold text-primary">{requisition.code}</span>
                      <span>·</span>
                      <span>{requisition.requesterArea}</span>
                      <span>·</span>
                      <span>{getProjectName(requisition.projectId)}</span>
                      {budgetLine && (
                        <>
                          <span>·</span>
                          <span className="font-normal text-muted-foreground/80">
                            Partida {budgetLine.code} (Disp.{" "}
                            {formatCurrency(
                              budgetLine.approved - budgetLine.committed - budgetLine.executed,
                            )}
                            )
                          </span>
                        </>
                      )}
                      <StatusBadge tone={procurementState.tone}>
                        {procurementState.label}
                      </StatusBadge>
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
                      className="rounded-full text-xs font-semibold"
                      onClick={() => setSelectedRequisitionId(requisition.id)}
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

                {/* Proveedores invitados */}
                <div className="mt-4 space-y-2 border-t border-border/70 pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Proveedores Invitados ({requisitionInvitations.length})
                    </p>
                  </div>

                  {requisitionInvitations.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-4 text-center">
                      <p className="text-xs text-muted-foreground">
                        Aún no se han enviado invitaciones a proveedores para este requerimiento.
                      </p>
                    </div>
                  ) : (
                    requisitionInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary px-4 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {invitation.supplierName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {invitation.supplierEmail}
                          </p>
                          {invitation.offer && (
                            <p className="mt-0.5 text-xs font-medium text-emerald-700">
                              Oferta: {formatCurrency(invitation.offer.price)} · Plazo:{" "}
                              {invitation.offer.termDays} días · Adjunto:{" "}
                              {invitation.offer.pdfFileName}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            tone={invitation.status === "submitted" ? "complete" : "yellow"}
                          >
                            {invitation.status === "submitted"
                              ? "Oferta recibida"
                              : "Esperando cotización"}
                          </StatusBadge>

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-full text-xs"
                            onClick={() => handleCopyLink(invitation.token)}
                            title="Copiar enlace directo al portal del proveedor"
                          >
                            <Copy className="h-3 w-3" /> Enlace
                          </Button>

                          {invitation.status === "sent" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-full border-blue-200 bg-blue-50 text-xs text-blue-700 hover:bg-blue-100"
                              onClick={() =>
                                handleQuickSubmitOffer(
                                  invitation.id,
                                  invitation.token,
                                  invitation.supplierName,
                                  requisition.estimatedAmount,
                                )
                              }
                            >
                              <Send className="h-3 w-3" /> Simular oferta
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Acciones Rápidas */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
                  {inviteRequisitionId === requisition.id ? (
                    <form
                      onSubmit={handleCreateInvitation}
                      className="grid w-full gap-3 rounded-2xl border border-border bg-secondary/50 p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
                    >
                      <div className="space-y-1">
                        <Label htmlFor={`sup-name-${requisition.id}`} className="text-xs">
                          Razón social del proveedor
                        </Label>
                        <Input
                          id={`sup-name-${requisition.id}`}
                          required
                          maxLength={100}
                          value={supplierName}
                          onChange={(event) => setSupplierName(event.target.value)}
                          placeholder="Ej. Comercializadora Industrial S.A."
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`sup-email-${requisition.id}`} className="text-xs">
                          Correo electrónico de contacto
                        </Label>
                        <Input
                          id={`sup-email-${requisition.id}`}
                          required
                          type="email"
                          maxLength={255}
                          value={supplierEmail}
                          onChange={(event) => setSupplierEmail(event.target.value)}
                          placeholder="cotizaciones@proveedor.com"
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-full text-xs"
                          onClick={() => {
                            const candidate = getSampleSupplier();
                            setSupplierName(candidate.name);
                            setSupplierEmail(candidate.email);
                          }}
                        >
                          <FileText className="h-3 w-3" /> Cargar ejemplo
                        </Button>
                        <Button
                          type="submit"
                          variant="default"
                          size="sm"
                          className="h-9 rounded-full text-xs"
                        >
                          <Send className="h-3 w-3" /> Generar invitación
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-full text-xs"
                          onClick={() => setInviteRequisitionId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-blue-200 bg-blue-50 text-xs font-semibold text-primary hover:bg-blue-100"
                        onClick={() => handleQuickInvite(requisition)}
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Simular invitación rápida
                      </Button>

                      {pendingInvitations.length === 0 && requisition.status !== "ordered" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          onClick={() => handleQuickQuoteComplete(requisition)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Simular cotización directa
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs"
                        onClick={() => {
                          setInviteRequisitionId(requisition.id);
                          setSupplierName("");
                          setSupplierEmail("");
                        }}
                      >
                        <Link2 className="h-3.5 w-3.5" /> Invitar proveedor manualmente
                      </Button>

                      {hasOffers && (
                        <Button
                          variant="default"
                          size="sm"
                          className="ml-auto rounded-full text-xs font-semibold"
                          onClick={() => setActiveTab("comparador")}
                        >
                          <Scale className="h-3.5 w-3.5" /> Ver en Cuadro comparativo
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </TabsContent>

        {/* TAB 2: CUADRO COMPARATIVO */}
        <TabsContent value="comparador" className="mt-6 space-y-6">
          {requisitionsWithOffers.length === 0 && (
            <div className="surface-card p-10 text-center">
              <Scale className="text-muted-foreground mx-auto h-10 w-10 opacity-40" />
              <p className="mt-2 text-sm font-semibold text-foreground">
                Aún no hay ofertas presentadas para comparar en el alcance seleccionado.
              </p>
              <p className="text-xs text-muted-foreground">
                Puedes simular ofertas directamente desde la pestaña de Bandeja con el botón
                &quot;Simular cotización directa&quot;.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-full"
                onClick={() => setActiveTab("bandeja")}
              >
                Volver a la bandeja de requerimientos
              </Button>
            </div>
          )}

          {requisitionsWithOffers.map((requisition) => {
            const requisitionInvitations = invitations.filter(
              (invitation) => invitation.requisitionId === requisition.id,
            );
            const submittedOffers = requisitionInvitations.filter(
              (invitation) => invitation.status === "submitted" && invitation.offer !== null,
            );
            const bestPrice = Math.min(
              ...submittedOffers.map(
                (invitation) => invitation.offer?.price ?? Number.POSITIVE_INFINITY,
              ),
            );
            const shortestTerm = Math.min(
              ...submittedOffers.map(
                (invitation) => invitation.offer?.termDays ?? Number.POSITIVE_INFINITY,
              ),
            );

            return (
              <article key={requisition.id} className="surface-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {requisition.code} · {requisition.requesterArea}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {getProjectName(requisition.projectId)}
                      </span>
                      {requisition.status === "ordered" && (
                        <StatusBadge tone="emerald">Orden emitida</StatusBadge>
                      )}
                    </div>
                    <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground">
                      {requisition.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground">Presupuesto de referencia</p>
                      <p className="text-lg font-bold tabular-nums tracking-tight text-foreground">
                        {formatCurrency(requisition.estimatedAmount)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs font-semibold"
                      onClick={() => setSelectedRequisitionId(requisition.id)}
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5 text-primary" />
                      Ver expediente
                    </Button>
                  </div>
                </div>

                {/* Offer Comparison Grid */}
                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {requisitionInvitations.map((invitation) => {
                    const isBestPrice =
                      invitation.offer !== null && invitation.offer.price === bestPrice;
                    const isShortestTerm =
                      invitation.offer !== null && invitation.offer.termDays === shortestTerm;
                    const diffPercent = invitation.offer
                      ? ((invitation.offer.price - requisition.estimatedAmount) /
                          requisition.estimatedAmount) *
                        100
                      : 0;

                    return (
                      <div
                        key={invitation.id}
                        className={cn(
                          "flex flex-col justify-between rounded-2xl border p-4 transition-all",
                          isBestPrice
                            ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                            : "border-border bg-secondary/30",
                        )}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {invitation.supplierName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {invitation.supplierEmail}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {invitation.offer ? (
                                <>
                                  {isBestPrice && (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                      Mejor precio
                                    </span>
                                  )}
                                  {isShortestTerm && (
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                      Menor plazo
                                    </span>
                                  )}
                                </>
                              ) : (
                                <StatusBadge tone="neutral">Sin oferta aún</StatusBadge>
                              )}
                            </div>
                          </div>

                          {invitation.offer ? (
                            <dl className="mt-4 space-y-2 text-xs">
                              <div className="flex items-baseline justify-between border-b border-border/60 pb-1.5">
                                <dt className="text-muted-foreground">Precio cotizado</dt>
                                <dd className="text-base font-bold tabular-nums text-foreground">
                                  {formatCurrency(invitation.offer.price)}
                                  <span
                                    className={cn(
                                      "ml-1.5 text-[10px] font-semibold",
                                      diffPercent <= 0 ? "text-emerald-700" : "text-amber-700",
                                    )}
                                  >
                                    ({diffPercent > 0 ? "+" : ""}
                                    {diffPercent.toFixed(1)}%)
                                  </span>
                                </dd>
                              </div>

                              <div className="flex justify-between">
                                <dt className="text-muted-foreground">Plazo de entrega</dt>
                                <dd className="font-semibold text-foreground">
                                  {invitation.offer.termDays} días calendario
                                </dd>
                              </div>

                              {invitation.offer.validityDays ? (
                                <div className="flex justify-between">
                                  <dt className="text-muted-foreground">Vigencia de oferta</dt>
                                  <dd className="font-semibold text-foreground">
                                    {invitation.offer.validityDays} días
                                  </dd>
                                </div>
                              ) : null}

                              <div className="flex items-center justify-between">
                                <dt className="text-muted-foreground">Dossier PDF</dt>
                                <dd className="flex items-center gap-1 font-mono text-[11px] font-semibold text-primary">
                                  <FileText className="h-3 w-3" />
                                  <span className="max-w-[140px] truncate">
                                    {invitation.offer.pdfFileName}
                                  </span>
                                </dd>
                              </div>

                              <div className="pt-1.5">
                                <dt className="text-muted-foreground">Condiciones comerciales:</dt>
                                <dd className="mt-0.5 rounded-lg bg-background p-2 text-[11px] text-muted-foreground">
                                  {invitation.offer.conditions}
                                </dd>
                              </div>
                            </dl>
                          ) : (
                            <div className="mt-6 text-center">
                              <p className="text-xs text-muted-foreground">
                                Proveedor aún no envía su cotización económica.
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 rounded-full text-xs"
                                onClick={() =>
                                  handleQuickSubmitOffer(
                                    invitation.id,
                                    invitation.token,
                                    invitation.supplierName,
                                    requisition.estimatedAmount,
                                  )
                                }
                              >
                                <Send className="h-3 w-3" /> Simular oferta recibida
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Quick action helper if offer exists */}
                        {invitation.offer && (
                          <div className="mt-4 pt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full rounded-full text-xs text-primary hover:bg-primary/10"
                              onClick={() => handlePreloadCriterion(invitation.id)}
                            >
                              <CheckCircle2 className="h-3 w-3" /> Seleccionar criterio recomendado
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Adjudication actions */}
                {submittedOffers.length > 0 && requisition.status !== "ordered" && (
                  <div className="mt-6 space-y-4 border-t border-border pt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Emisión de Orden de Compra / Servicio
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {submittedOffers.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="rounded-2xl border border-border bg-secondary/30 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-foreground">
                              Adjudicar a {invitation.supplierName}
                            </p>
                            <span className="text-sm font-bold tabular-nums text-foreground">
                              {invitation.offer ? formatCurrency(invitation.offer.price) : ""}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1">
                            <Textarea
                              rows={2}
                              maxLength={300}
                              value={awardCriteria[invitation.id] ?? ""}
                              onChange={(event) =>
                                setAwardCriteria((previous) => ({
                                  ...previous,
                                  [invitation.id]: event.target.value,
                                }))
                              }
                              placeholder="Criterio de adjudicación (mínimo 10 caracteres)..."
                              className="text-xs"
                            />
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-muted-foreground"
                              onClick={() => handlePreloadCriterion(invitation.id)}
                            >
                              Autocompletar
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 rounded-full text-xs font-semibold"
                              onClick={() =>
                                handleAdjudicateOrder(invitation.id, invitation.supplierName)
                              }
                            >
                              <Award className="h-3.5 w-3.5" /> Emitir orden de compra
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {requisition.status === "ordered" && (
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      Este requerimiento fue adjudicado y su orden de compra fue emitida.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-emerald-300 bg-white text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                      onClick={() => setActiveTab("ordenes")}
                    >
                      Ver en Órdenes emitidas
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </TabsContent>

        {/* TAB 3: ÓRDENES EMITIDAS */}
        <TabsContent value="ordenes" className="mt-6">
          <div className="surface-card divide-y divide-border overflow-hidden">
            <div className="bg-secondary/40 px-6 py-4">
              <h3 className="text-sm font-bold text-foreground">
                Registro de Órdenes de Compra y Servicios ({filteredPurchaseOrders.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Documentos formales emitidos a proveedores con afectación presupuestaria inmediata.
              </p>
            </div>

            {filteredPurchaseOrders.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">
                <Receipt className="mx-auto h-8 w-8 opacity-40" />
                <p className="mt-2 text-sm font-semibold">No se encontraron órdenes emitidas.</p>
                <p className="text-xs">
                  Adjudica una cotización desde el Cuadro comparativo para generar una orden formal.
                </p>
              </div>
            )}

            {filteredPurchaseOrders.map((order) => {
              const linkedRequisition = requisitions.find((r) => r.id === order.requisitionId);

              return (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-secondary/20"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold tracking-tight text-foreground">
                        {order.code}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {getProjectName(order.projectId)}
                      </span>
                      <StatusBadge
                        tone={
                          order.status === "invoiced"
                            ? "complete"
                            : order.status === "issued"
                              ? "blue"
                              : "neutral"
                        }
                      >
                        {order.status === "issued"
                          ? "Emitida"
                          : order.status === "invoiced"
                            ? "Facturada"
                            : "Cerrada"}
                      </StatusBadge>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {order.supplierName}
                    </p>

                    {linkedRequisition && (
                      <p className="text-xs text-muted-foreground">
                        Requerimiento: {linkedRequisition.code} · {linkedRequisition.title}
                      </p>
                    )}

                    <p className="mt-1 text-xs italic text-muted-foreground">
                      Criterio: &quot;{order.awardCriterion}&quot;
                    </p>

                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>Emitida por: {order.issuedBy}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.issuedAt).toLocaleDateString("es-PE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-lg font-bold tabular-nums tracking-tight text-foreground">
                      {formatCurrency(order.amount)}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full text-xs"
                        onClick={async () => {
                          try {
                            if (navigator.clipboard) {
                              await navigator.clipboard.writeText(order.code);
                            }
                            toast.success(`Código ${order.code} copiado.`);
                          } catch {
                            // Fallback
                          }
                        }}
                      >
                        <Copy className="h-3 w-3" /> Copiar código
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8 rounded-full text-xs"
                      >
                        <Link to="/modulo/comprobantes">
                          <ExternalLink className="h-3 w-3" /> Ver comprobantes
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Frontal Centrado: Ficha del Requerimiento / Expediente */}
      <Dialog
        open={selectedRequisition !== null}
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
              const phase = SEED_PHASES.find((item) => item.id === selectedRequisition.phaseId);
              const lineAvailable = line ? line.approved - line.committed - line.executed : 0;
              const isOverdrawn = line
                ? selectedRequisition.estimatedAmount > lineAvailable
                : false;

              return (
                <div className="space-y-6">
                  {/* Encabezado del Modal */}
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
                      <StatusBadge tone="blue">
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
                        Importe Estimado
                      </p>
                      <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                        {formatCurrency(selectedRequisition.estimatedAmount)}
                      </p>
                    </div>
                  </DialogHeader>

                  {/* Datos del Solicitante y Ubicación */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl border border-border bg-secondary/30 p-4 text-xs">
                    <div>
                      <p className="text-muted-foreground">Solicitante</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {selectedRequisition.createdBy}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Área de origen</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {selectedRequisition.requesterArea}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Proyecto</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {project?.name ?? "General"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fase de obra</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {phase ? phase.name : "Sin fase asociada"}
                      </p>
                    </div>
                  </div>

                  {/* Justificación de la Solicitud */}
                  <div className="space-y-2 rounded-2xl border border-border bg-secondary/20 p-4.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Justificación de la Solicitud
                    </p>
                    <p className="text-sm leading-relaxed text-foreground">
                      {selectedRequisition.justification}
                    </p>
                  </div>

                  {/* Partida Presupuestaria Afectada */}
                  <div className="space-y-3 rounded-2xl border border-border bg-background p-4.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Partida Presupuestaria Afectada
                    </p>
                    {line ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {line.code} · {line.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Disponible actual:{" "}
                            <strong className="text-foreground">
                              {formatCurrency(lineAvailable)}
                            </strong>
                          </span>
                        </div>
                        {isOverdrawn && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                            <p className="flex items-center gap-1.5 font-semibold">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                              Sobregiro presupuestario detectado
                            </p>
                            <p className="mt-1">
                              El monto requerido excede el saldo disponible por{" "}
                              <strong>
                                {formatCurrency(
                                  selectedRequisition.estimatedAmount - lineAvailable,
                                )}
                              </strong>
                              .
                            </p>
                            {selectedRequisition.overdraftJustification && (
                              <p className="mt-1.5 italic text-amber-800">
                                &ldquo;{selectedRequisition.overdraftJustification}&rdquo;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Partida no identificada.</p>
                    )}
                  </div>

                  {/* Línea de Tiempo y Auditoría */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Línea de Tiempo y Auditoría
                    </h4>
                    <RequisitionTimeline events={selectedRequisition.timeline} />
                  </div>

                  <DialogFooter className="border-t border-border pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedRequisitionId(null)}
                      className="rounded-full text-xs font-semibold"
                    >
                      Cerrar ficha
                    </Button>
                  </DialogFooter>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
