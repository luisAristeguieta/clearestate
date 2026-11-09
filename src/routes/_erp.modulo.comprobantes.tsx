import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  FileDown,
  FileText,
  FileUp,
  Filter,
  Loader2,
  ScanSearch,
  Search,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { InvoiceOcrForm } from "@/components/comprobantes/InvoiceOcrForm";
import { InvoicePdfViewer } from "@/components/comprobantes/InvoicePdfViewer";
import type { InvoiceDraft } from "@/components/comprobantes/types";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/phase2/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getViewTitle } from "@/config/brandConfig";
import { formatCurrency, PROJECTS } from "@/config/erpConfig";
import {
  buildContasisCsv,
  calculateInvoiceTotals,
  INVOICE_STATUS_LABELS,
  IVA_RATE,
} from "@/config/phase2Config";
import { useErp } from "@/context/ErpContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_erp/modulo/comprobantes")({
  head: () => ({
    meta: [
      { title: getViewTitle("/modulo/comprobantes") },
      {
        name: "description",
        content:
          "Recepción de facturas con prellenado por IA, revisión humana y exportación a Contasis.",
      },
      { property: "og:title", content: getViewTitle("/modulo/comprobantes") },
      {
        property: "og:description",
        content: "Ejecución de gastos con conciliación y exportación contable.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvoicesPage,
});

type InvoiceStatusFilter = "all" | "pending_review" | "validated";

function InvoicesPage() {
  const { budgetLines, purchaseOrders, invoices, registerInvoice, reviewInvoice } = useErp();

  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [draft, setDraft] = useState<InvoiceDraft | null>(null);
  const [humanReviewed, setHumanReviewed] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Eligible orders: issued or all orders
  const eligibleOrders = purchaseOrders.filter((order) => order.status === "issued");
  const availableOrders = eligibleOrders.length > 0 ? eligibleOrders : purchaseOrders;
  const validatedInvoices = invoices.filter((invoice) => invoice.status === "validated");
  const pendingInvoices = invoices.filter((invoice) => invoice.status === "pending_review");

  const selectedOrder = purchaseOrders.find(
    (item) => item.id === (draft?.purchaseOrderId || selectedOrderId),
  );
  const linkedBudgetLine = budgetLines.find((line) => line.id === selectedOrder?.budgetLineId);
  const linkedProject = PROJECTS.find((p) => p.id === selectedOrder?.projectId);

  const startExtractionSimulation = (orderId: string, fileName: string) => {
    try {
      const order = purchaseOrders.find((item) => item.id === orderId);
      if (!order) throw new Error("Selecciona primero la orden de compra o servicio.");

      setIsScanning(true);

      setTimeout(() => {
        try {
          const subtotal = Math.round((order.amount / (1 + IVA_RATE)) * 100) / 100;
          const { taxAmount, total } = calculateInvoiceTotals(subtotal);
          const rawNum = order.code.replaceAll(/\D/g, "").padStart(7, "0");

          const newDraft: InvoiceDraft = {
            purchaseOrderId: order.id,
            issuerName: order.supplierName,
            issuerTaxId: "1790012345001",
            invoiceNumber: `001-002-${rawNum || "0000481"}`,
            subtotal,
            taxAmount,
            total,
            pdfFileName: fileName,
            authorizationCode: `061120260117900123450012001002${rawNum || "0000481"}011234567819`,
            issueDate: new Date().toISOString().slice(0, 10),
          };

          setDraft(newDraft);
          setSelectedOrderId(order.id);
          setHumanReviewed(false);
          setIsScanning(false);
          toast.success(
            "IA: Factura de prueba cargada y extracción OCR completada con éxito. Revisa los datos en la vista dividida.",
          );
        } catch {
          setIsScanning(false);
          toast.error("Error al procesar el comprobante.");
        }
      }, 600);
    } catch (uploadError) {
      setIsScanning(false);
      toast.error(
        uploadError instanceof Error ? uploadError.message : "No se pudo procesar el archivo.",
      );
    }
  };

  const handleSimulatedUpload = (fileName: string) => {
    if (!selectedOrderId) {
      toast.error("Selecciona primero una orden de compra / servicio.");
      return;
    }
    startExtractionSimulation(selectedOrderId, fileName);
  };

  // Direct 1-click simulation action: Auto-fills order, file, and launches OCR extraction
  const handleSimulateAutoFill = () => {
    const unInvoicedOrder = availableOrders.find(
      (order) => !invoices.some((inv) => inv.purchaseOrderId === order.id),
    );
    const targetOrder = unInvoicedOrder ?? availableOrders[0];

    if (!targetOrder) {
      toast.error("No hay órdenes de compra disponibles para simular.");
      return;
    }

    const supplierSlug = targetOrder.supplierName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");
    const simulatedFileName = `factura-${supplierSlug}-${targetOrder.code.toLowerCase()}.pdf`;

    setSelectedOrderId(targetOrder.id);
    startExtractionSimulation(targetOrder.id, simulatedFileName);
  };

  const handleInvoiceRegister = () => {
    try {
      if (!draft) return;
      if (!humanReviewed) {
        throw new Error("La revisión humana es obligatoria antes de registrar el gasto.");
      }
      const invoice = registerInvoice({
        purchaseOrderId: draft.purchaseOrderId,
        issuerName: draft.issuerName,
        issuerTaxId: draft.issuerTaxId,
        invoiceNumber: draft.invoiceNumber,
        subtotal: draft.subtotal,
        pdfFileName: draft.pdfFileName,
      });
      toast.success(`Factura ${invoice.invoiceNumber} registrada exitosamente.`);
      setDraft(null);
      setSelectedOrderId("");
      setHumanReviewed(false);
    } catch (registerError) {
      toast.error(
        registerError instanceof Error
          ? registerError.message
          : "No se pudo registrar el comprobante.",
      );
    }
  };

  const handleInvoiceReview = (invoiceId: string, decision: "validate" | "reject") => {
    try {
      reviewInvoice(invoiceId, decision);
      toast.success(
        decision === "validate"
          ? "Comprobante validado: el monto pasó de Comprometido a Ejecutado en presupuesto."
          : "Comprobante rechazado.",
      );
    } catch (reviewError) {
      toast.error(
        reviewError instanceof Error ? reviewError.message : "No se pudo completar la revisión.",
      );
    }
  };

  const handleExportContasis = () => {
    try {
      if (validatedInvoices.length === 0) {
        throw new Error("No hay comprobantes validados para exportar.");
      }
      const rows = validatedInvoices.map((invoice) => {
        const order = purchaseOrders.find((item) => item.id === invoice.purchaseOrderId);
        const line = budgetLines.find((item) => item.id === order?.budgetLineId);
        const project = PROJECTS.find((p) => p.id === order?.projectId);
        return {
          invoice,
          orderCode: order?.code ?? "SIN-ORDEN",
          budgetLineCode: line?.code ?? "SIN-PARTIDA",
          projectName: project?.name ?? "Sin proyecto",
        };
      });
      const csvContent = buildContasisCsv(rows);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `contasis-gastos-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
      toast.success("Archivo plano Contasis exportado exitosamente.");
    } catch (exportError) {
      toast.error(exportError instanceof Error ? exportError.message : "No se pudo exportar.");
    }
  };

  // Filtered invoices based on status filter and search query
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (statusFilter !== "all" && invoice.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const order = purchaseOrders.find((item) => item.id === invoice.purchaseOrderId);
        const line = budgetLines.find((item) => item.id === order?.budgetLineId);

        const matchesIssuer = invoice.issuerName.toLowerCase().includes(query);
        const matchesNumber = invoice.invoiceNumber.toLowerCase().includes(query);
        const matchesRuc = invoice.issuerTaxId.includes(query);
        const matchesOrderCode = order?.code.toLowerCase().includes(query) ?? false;
        const matchesLine =
          (line?.code.toLowerCase().includes(query) || line?.name.toLowerCase().includes(query)) ??
          false;

        if (!matchesIssuer && !matchesNumber && !matchesRuc && !matchesOrderCode && !matchesLine) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, statusFilter, searchQuery, purchaseOrders, budgetLines]);

  return (
    <div className="phase2-view space-y-6">
      <PageHeader
        title="Comprobantes y Ejecución de Gastos"
        description="Recepción de facturas con prellenado por IA, revisión humana obligatoria y conciliación Comprometido → Ejecutado."
        actions={
          <Button
            variant="default"
            className="rounded-full bg-[#0a192f] hover:bg-slate-900 text-white shadow-xs"
            onClick={handleExportContasis}
          >
            <FileDown className="h-4 w-4 mr-1.5" /> Exportar a Contasis
          </Button>
        }
      />

      {/* Bloque Superior: Selección de Orden y Carga con IA (cuando no hay borrador activo) */}
      {!draft && (
        <section className="rounded-[28px] border border-[#e5e6e8] bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#e5e6e8] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0f68ea] border border-blue-100 shrink-0">
                <ScanSearch className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-[#1d1d1f]">
                  Recepción de Comprobantes con IA
                </h2>
                <p className="text-xs text-muted-foreground">
                  Selecciona la orden y sube la factura para activar la vista dividida y extracción
                  OCR.
                </p>
              </div>
            </div>

            {/* Direct Quick Simulation Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-blue-200 bg-blue-50 px-4 text-xs font-semibold text-[#0f68ea] hover:bg-blue-100 hover:text-blue-800 shadow-xs transition-colors shrink-0"
              onClick={handleSimulateAutoFill}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-[#0f68ea]" />
                  <span>Extrayendo con IA (OCR)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-[#0f68ea]" />
                  <span>Simular autollenado de factura</span>
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 items-end">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1d1d1f]">
                Orden de compra / servicio a vincular
              </Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger className="h-10 rounded-xl border-[#e5e6e8] text-xs">
                  <SelectValue placeholder="Selecciona una orden de compra emitida..." />
                </SelectTrigger>
                <SelectContent>
                  {availableOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id} className="text-xs">
                      {order.code} · {order.supplierName} ({formatCurrency(order.amount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => {
                  const fileName = event.target.files?.[0]?.name;
                  if (fileName) handleSimulatedUpload(fileName);
                  event.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!selectedOrderId || isScanning}
                className="w-full h-10 rounded-xl text-xs font-semibold border-[#e5e6e8] hover:border-[#0f68ea]"
                onClick={() => fileInputRef.current?.click()}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-[#0f68ea]" />
                    <span>Escaneando documento con IA (OCR)...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4 mr-2 text-[#0f68ea]" />
                    <span>Subir factura en PDF</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Vista Dividida (Split-Screen): Visor PDF a la izquierda + Formulario OCR a la derecha */}
      {draft && (
        <section className="space-y-3" aria-label="Vista dividida de factura">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-[#1d1d1f]">
                Revisión en Vista Dividida (Split-Screen OCR)
              </h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(null);
                setHumanReviewed(false);
              }}
              className="text-xs text-muted-foreground hover:text-[#1d1d1f]"
            >
              Cerrar visor dividido
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 items-stretch">
            {/* Columna Izquierda: Visor PDF Simulado */}
            <div className="min-h-[500px]">
              <InvoicePdfViewer
                draft={draft}
                orderCode={selectedOrder?.code ?? "OC-2026-001"}
                projectName={linkedProject?.name ?? "Proyecto París"}
                conceptDescription={
                  selectedOrder?.awardCriterion ?? "Suministro y servicios de obra"
                }
              />
            </div>

            {/* Columna Derecha: Formulario Prellenado Inteligente */}
            <div className="min-h-[500px]">
              <InvoiceOcrForm
                draft={draft}
                onDraftChange={setDraft}
                budgetLine={linkedBudgetLine}
                humanReviewed={humanReviewed}
                onHumanReviewedChange={setHumanReviewed}
                onSubmit={handleInvoiceRegister}
                onCancel={() => {
                  setDraft(null);
                  setHumanReviewed(false);
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Sección Inferior: Conciliación de Comprobantes Registrados */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#e5e6e8] pb-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#1d1d1f]">
              Conciliación de comprobantes ({invoices.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              {validatedInvoices.length} validados y ejecutados en presupuesto
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="surface-card flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase tracking-wide mr-1">
              <Filter className="h-3 w-3" /> Estado:
            </span>

            <Button
              type="button"
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              className="h-8 rounded-full text-xs"
              onClick={() => setStatusFilter("all")}
            >
              Todas ({invoices.length})
            </Button>

            <Button
              type="button"
              variant={statusFilter === "pending_review" ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 rounded-full text-xs",
                statusFilter !== "pending_review" && pendingInvoices.length > 0
                  ? "text-amber-800 border-amber-200 bg-amber-50/60 hover:bg-amber-100"
                  : "",
              )}
              onClick={() => setStatusFilter("pending_review")}
            >
              Pendientes de revisión ({pendingInvoices.length})
            </Button>

            <Button
              type="button"
              variant={statusFilter === "validated" ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 rounded-full text-xs",
                statusFilter !== "validated" && validatedInvoices.length > 0
                  ? "text-emerald-800 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100"
                  : "",
              )}
              onClick={() => setStatusFilter("validated")}
            >
              Validadas / Ejecutadas ({validatedInvoices.length})
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar proveedor o Nº factura..."
              className="h-8 rounded-full pl-8 pr-8 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                title="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Empty State when filteredInvoices is empty */}
        {filteredInvoices.length === 0 ? (
          <div className="surface-card p-10 text-center space-y-2">
            <FileText className="text-muted-foreground mx-auto h-8 w-8 opacity-40" />
            <p className="text-sm font-semibold text-foreground">
              No se encontraron comprobantes con los filtros seleccionados.
            </p>
            <p className="text-xs text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "Prueba cambiando el estado o limpiando el término de búsqueda."
                : "No hay comprobantes registrados aún."}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full text-xs mt-2"
                onClick={() => {
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
              >
                Restablecer filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => {
              const order = purchaseOrders.find((item) => item.id === invoice.purchaseOrderId);
              const line = budgetLines.find((item) => item.id === order?.budgetLineId);

              return (
                <article key={invoice.id} className="surface-card p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#0f68ea]" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {invoice.invoiceNumber} · {order?.code ?? "Sin orden"}
                        </p>
                      </div>
                      <h3 className="text-base font-bold tracking-tight text-[#1d1d1f]">
                        {invoice.issuerName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Subtotal {formatCurrency(invoice.subtotal)} · IVA 15%{" "}
                        {formatCurrency(invoice.taxAmount)} · Archivo: {invoice.pdfFileName}
                      </p>
                      {line && (
                        <p className="text-[11px] text-[#0f68ea] font-medium">
                          Partida afectada: {line.code} ({line.name})
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Subido por {invoice.uploadedBy}
                        {invoice.reviewedBy && ` · Validado por ${invoice.reviewedBy}`}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge
                        tone={
                          invoice.status === "validated"
                            ? "complete"
                            : invoice.status === "rejected"
                              ? "attention"
                              : "yellow"
                        }
                      >
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </StatusBadge>
                      <span className="text-lg font-bold tracking-tight text-[#1d1d1f]">
                        {formatCurrency(invoice.total)}
                      </span>
                    </div>
                  </div>

                  {invoice.status === "pending_review" && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-full bg-[#0f68ea] hover:bg-blue-700 text-white text-xs"
                        onClick={() => handleInvoiceReview(invoice.id, "validate")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Validar y ejecutar gasto
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs text-amber-700 hover:bg-amber-50"
                        onClick={() => handleInvoiceReview(invoice.id, "reject")}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Rechazar
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
