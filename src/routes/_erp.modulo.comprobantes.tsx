import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileDown, FileUp, ScanSearch, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/phase2/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getViewTitle } from "@/config/brandConfig";
import { PROJECTS, formatCurrency } from "@/config/erpConfig";
import { INVOICE_STATUS_LABELS, buildContasisCsv, simulateInvoiceExtraction } from "@/config/phase2Config";
import { useErp } from "@/context/ErpContext";

export const Route = createFileRoute("/_erp/modulo/comprobantes")({
  head: () => ({
    meta: [
      { title: getViewTitle("/modulo/comprobantes") },
      { name: "description", content: "Recepción de facturas con prellenado por IA, revisión humana y exportación a Contasis." },
      { property: "og:title", content: getViewTitle("/modulo/comprobantes") },
      { property: "og:description", content: "Ejecución de gastos con conciliación y exportación contable." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvoicesPage,
});

interface ExtractionDraft {
  issuerName: string;
  issuerTaxId: string;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  pdfFileName: string;
}

function InvoicesPage() {
  const { budgetLines, purchaseOrders, invoices, registerInvoice, reviewInvoice } = useErp();

  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [draft, setDraft] = useState<ExtractionDraft | null>(null);
  const [humanReviewed, setHumanReviewed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const eligibleOrders = purchaseOrders.filter((order) => order.status === "issued");
  const validatedInvoices = invoices.filter((invoice) => invoice.status === "validated");

  const handleSimulatedUpload = (fileName: string) => {
    try {
      const order = purchaseOrders.find((item) => item.id === selectedOrderId);
      if (!order) throw new Error("Selecciona primero la orden de compra o servicio.");
      setDraft(simulateInvoiceExtraction(order, fileName));
      setHumanReviewed(false);
      toast.success("La IA extrajo los datos del comprobante. Revisa antes de registrar.");
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "No se pudo procesar el archivo.");
    }
  };

  const handleRegister = () => {
    try {
      if (!draft) return;
      if (!humanReviewed) throw new Error("La revisión humana es obligatoria antes de registrar el gasto.");
      const invoice = registerInvoice({
        purchaseOrderId: selectedOrderId,
        issuerName: draft.issuerName,
        issuerTaxId: draft.issuerTaxId,
        invoiceNumber: draft.invoiceNumber,
        subtotal: draft.subtotal,
        pdfFileName: draft.pdfFileName,
      });
      toast.success(`Factura ${invoice.invoiceNumber} registrada y pendiente de validación.`);
      setDraft(null);
      setSelectedOrderId("");
      setHumanReviewed(false);
    } catch (registerError) {
      toast.error(registerError instanceof Error ? registerError.message : "No se pudo registrar el comprobante.");
    }
  };

  const handleReview = (invoiceId: string, decision: "validate" | "reject") => {
    try {
      reviewInvoice(invoiceId, decision);
      toast.success(decision === "validate" ? "Comprobante validado: el monto pasó de Comprometido a Ejecutado." : "Comprobante rechazado.");
    } catch (reviewError) {
      toast.error(reviewError instanceof Error ? reviewError.message : "No se pudo completar la revisión.");
    }
  };

  const handleExportContasis = () => {
    try {
      if (validatedInvoices.length === 0) throw new Error("No hay comprobantes validados para exportar.");
      const rows = validatedInvoices.map((invoice) => {
        const order = purchaseOrders.find((item) => item.id === invoice.purchaseOrderId);
        const line = budgetLines.find((item) => item.id === order?.budgetLineId);
        const project = PROJECTS.find((item) => item.id === order?.projectId);
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
      toast.success("Archivo Contasis exportado.");
    } catch (exportError) {
      toast.error(exportError instanceof Error ? exportError.message : "No se pudo exportar.");
    }
  };

  return (
    <div className="phase2-view">
      <PageHeader
        title="Comprobantes y Ejecución de Gastos"
        description="Recepción de facturas con prellenado por IA, revisión humana obligatoria y conciliación Comprometido → Ejecutado."
        actions={
          <Button variant="default" className="rounded-full" onClick={handleExportContasis}>
            <FileDown /> Exportar a Contasis
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section className="surface-card space-y-5 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
              <ScanSearch className="h-5 w-5 text-foreground" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Recepción con IA</h2>
              <p className="text-sm text-muted-foreground">Sube el PDF y la IA prellena los campos para tu revisión.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Orden de compra / servicio</Label>
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
              <SelectTrigger><SelectValue placeholder="Selecciona la orden" /></SelectTrigger>
              <SelectContent>
                {eligibleOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>{order.code} · {order.supplierName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
          <Button type="button" variant="outline" className="w-full rounded-full" onClick={() => fileInputRef.current?.click()}>
            <FileUp /> Subir factura PDF
          </Button>

          {draft && (
            <div className="space-y-4 border-t border-border pt-5">
              <p className="text-sm font-semibold">Datos extraídos por IA · {draft.pdfFileName}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="inv-issuer">Emisor</Label>
                  <Input id="inv-issuer" value={draft.issuerName} onChange={(event) => setDraft({ ...draft, issuerName: event.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-taxid">RUC</Label>
                  <Input id="inv-taxid" value={draft.issuerTaxId} onChange={(event) => setDraft({ ...draft, issuerTaxId: event.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-number">Número</Label>
                  <Input id="inv-number" value={draft.invoiceNumber} onChange={(event) => setDraft({ ...draft, invoiceNumber: event.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-subtotal">Subtotal (USD)</Label>
                  <Input id="inv-subtotal" type="number" min={1} step="0.01" value={draft.subtotal} onChange={(event) => setDraft({ ...draft, subtotal: Number(event.target.value) || 0 })} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                IVA 15%: <span className="font-semibold text-foreground">{formatCurrency(draft.taxAmount)}</span> · Total:{" "}
                <span className="font-semibold text-foreground">{formatCurrency(draft.total)}</span>
              </p>
              <label className="flex items-start gap-3 py-3 text-sm">
                <Checkbox checked={humanReviewed} onCheckedChange={(checked) => setHumanReviewed(checked === true)} className="mt-0.5" />
                Confirmo que revisé los datos extraídos contra el PDF original (revisión humana obligatoria).
              </label>
              <Button variant="default" className="w-full rounded-full" onClick={handleRegister} disabled={!humanReviewed}>
                Registrar gasto
              </Button>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">Conciliación de comprobantes</h2>
          {invoices.length === 0 && (
            <div className="surface-card p-8 text-center text-muted-foreground">No hay comprobantes registrados.</div>
          )}
          {invoices.map((invoice) => {
            const order = purchaseOrders.find((item) => item.id === invoice.purchaseOrderId);
            return (
              <article key={invoice.id} className="surface-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {invoice.invoiceNumber} · {order?.code ?? "Sin orden"}
                    </p>
                    <h3 className="mt-1 text-base font-bold tracking-tight">{invoice.issuerName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Subtotal {formatCurrency(invoice.subtotal)} · IVA {formatCurrency(invoice.taxAmount)} · {invoice.pdfFileName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Subido por {invoice.uploadedBy}
                      {invoice.reviewedBy && ` · Revisado por ${invoice.reviewedBy}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge tone={invoice.status === "validated" ? "complete" : invoice.status === "rejected" ? "attention" : "yellow"}>
                      {INVOICE_STATUS_LABELS[invoice.status]}
                    </StatusBadge>
                    <span className="text-lg font-bold tracking-tight">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
                {invoice.status === "pending_review" && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button variant="default" size="sm" className="rounded-full" onClick={() => handleReview(invoice.id, "validate")}>
                      <CheckCircle2 /> Validar y ejecutar gasto
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleReview(invoice.id, "reject")}>
                      <XCircle /> Rechazar
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
