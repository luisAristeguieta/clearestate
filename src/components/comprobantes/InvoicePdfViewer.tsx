import { FileText, ZoomIn, ZoomOut, Download, ShieldCheck, QrCode } from "lucide-react";
import type { InvoiceDraft } from "./types";
import { formatCurrency } from "@/config/erpConfig";

interface InvoicePdfViewerProps {
  draft: InvoiceDraft;
  orderCode: string;
  projectName: string;
  conceptDescription: string;
}

export function InvoicePdfViewer({
  draft,
  orderCode,
  projectName,
  conceptDescription,
}: InvoicePdfViewerProps) {
  return (
    <div className="flex flex-col h-full rounded-[24px] border border-[#e5e6e8] bg-[#f8f9fa] overflow-hidden shadow-xs">
      {/* Top PDF Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e6e8] bg-white px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-200">
            <FileText className="h-4 w-4" />
          </div>
          <span className="truncate text-xs font-semibold text-[#1d1d1f] max-w-[200px] sm:max-w-[260px]">
            {draft.pdfFileName}
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
            Pág 1 de 1
          </span>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            type="button"
            title="Acercar visor"
            className="rounded p-1 hover:bg-slate-100 hover:text-[#1d1d1f]"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Alejar visor"
            className="rounded p-1 hover:bg-slate-100 hover:text-[#1d1d1f]"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] px-1 font-mono">100%</span>
          <button
            type="button"
            title="Descargar PDF simulado"
            className="rounded p-1 hover:bg-slate-100 hover:text-[#1d1d1f]"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* PDF Document Canvas / Sheet */}
      <div className="flex-1 p-3 sm:p-5 overflow-y-auto max-h-[580px]">
        <div className="mx-auto max-w-xl rounded-xl border border-[#e5e6e8] bg-white p-5 shadow-sm text-left font-sans text-xs text-[#1d1d1f] space-y-4">
          {/* Header Row: Issuer vs Tax Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#e5e6e8] pb-4">
            {/* Left: Issuer Info with OCR Badge */}
            <div className="space-y-1 relative group">
              <span className="absolute -top-2.5 -right-2 rounded bg-emerald-100/90 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-800 border border-emerald-300">
                OCR: Emisor
              </span>
              <h3 className="font-bold text-sm text-[#1d1d1f] tracking-tight">
                {draft.issuerName.toUpperCase()}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Matriz: Av. Principal y Vía Interoceánica, Edif. Corporativo
              </p>
              <p className="text-[11px] text-muted-foreground">
                Obligado a llevar contabilidad: SÍ
              </p>
              <p className="text-[10px] text-muted-foreground">Resolución NAC-DNCRASC20-00000001</p>
            </div>

            {/* Right: Electronic Invoice Box */}
            <div className="rounded-xl border border-slate-300 bg-slate-50/60 p-3 space-y-1 relative">
              <span className="absolute -top-2.5 -right-2 rounded bg-emerald-100/90 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-800 border border-emerald-300">
                OCR: RUC y Folio
              </span>
              <p className="font-bold text-xs">R.U.C.: {draft.issuerTaxId}</p>
              <p className="font-bold text-xs text-[#0f68ea]">FACTURA ELECTRÓNICA</p>
              <p className="font-mono text-xs font-semibold">Nº {draft.invoiceNumber}</p>
              <div className="pt-1">
                <p className="text-[9px] text-muted-foreground uppercase font-semibold">
                  Autorización SRI / Clave de Acceso:
                </p>
                <p className="font-mono text-[9px] break-all leading-tight text-slate-600">
                  {draft.authorizationCode}
                </p>
              </div>
            </div>
          </div>

          {/* Recipient / Client Row */}
          <div className="rounded-lg border border-[#e5e6e8] bg-[#f8f9fa] p-3 text-[11px] space-y-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Razón Social Comprador: </span>
                <span className="font-semibold">CLEARESTATE INMOBILIARIA S.A.</span>
              </div>
              <div>
                <span className="text-muted-foreground">RUC: </span>
                <span className="font-mono font-semibold">1792458921001</span>
              </div>
              <div>
                <span className="text-muted-foreground">Fecha de Emisión: </span>
                <span className="font-semibold">{draft.issueDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Orden de Compra: </span>
                <span className="font-semibold text-[#0f68ea]">{orderCode}</span>
                <span className="text-muted-foreground"> ({projectName})</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto rounded-lg border border-[#e5e6e8]">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[#e5e6e8] bg-[#f8f9fa]">
                  <th className="px-2.5 py-1.5 font-semibold">Código</th>
                  <th className="px-2.5 py-1.5 font-semibold">Descripción del Concepto</th>
                  <th className="px-2.5 py-1.5 font-semibold text-center">Cant.</th>
                  <th className="px-2.5 py-1.5 font-semibold text-right">P. Unit</th>
                  <th className="px-2.5 py-1.5 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e6e8]">
                <tr>
                  <td className="px-2.5 py-2 font-mono text-muted-foreground">SRV-01</td>
                  <td className="px-2.5 py-2 font-medium">
                    {conceptDescription || "Servicio técnico y suministro con acta de entrega"}
                  </td>
                  <td className="px-2.5 py-2 text-center">1.00</td>
                  <td className="px-2.5 py-2 text-right">{formatCurrency(draft.subtotal)}</td>
                  <td className="px-2.5 py-2 text-right font-semibold">
                    {formatCurrency(draft.subtotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Totals Summary with OCR Highlight */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-slate-500 text-[10px]">
              <QrCode className="h-9 w-9 text-slate-700" />
              <div>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> Firma Electrónica Válida
                </span>
                <p>Comprobante generado según especificación técnica del SRI</p>
              </div>
            </div>

            <div className="w-full sm:w-56 rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-[11px] space-y-1 relative">
              <span className="absolute -top-2.5 -right-2 rounded bg-emerald-100/90 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-800 border border-emerald-300">
                OCR: Montos
              </span>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SUBTOTAL 15%:</span>
                <span className="font-semibold">{formatCurrency(draft.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA 15%:</span>
                <span className="font-semibold">{formatCurrency(draft.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1 text-xs font-bold text-[#1d1d1f]">
                <span>VALOR TOTAL:</span>
                <span className="text-[#0f68ea]">{formatCurrency(draft.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
