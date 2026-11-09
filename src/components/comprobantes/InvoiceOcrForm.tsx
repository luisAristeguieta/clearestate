import { BrainCircuit, CheckCheck, X, Wallet, ShieldAlert } from "lucide-react";
import type { InvoiceDraft } from "./types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateAvailableBalance, formatCurrency, type BudgetLine } from "@/config/erpConfig";
import { calculateInvoiceTotals } from "@/config/phase2Config";

interface InvoiceOcrFormProps {
  draft: InvoiceDraft;
  onDraftChange: (updated: InvoiceDraft) => void;
  budgetLine?: BudgetLine | undefined;
  humanReviewed: boolean;
  onHumanReviewedChange: (reviewed: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function InvoiceOcrForm({
  draft,
  onDraftChange,
  budgetLine,
  humanReviewed,
  onHumanReviewedChange,
  onSubmit,
  onCancel,
}: InvoiceOcrFormProps) {
  const lineAvailable = budgetLine ? calculateAvailableBalance(budgetLine) : 0;
  const isOverdrawn = draft.total > lineAvailable;

  const handleSubtotalChange = (val: number) => {
    const subtotal = Math.max(0, val);
    const { taxAmount, total } = calculateInvoiceTotals(subtotal);
    onDraftChange({
      ...draft,
      subtotal,
      taxAmount,
      total,
    });
  };

  return (
    <div className="flex flex-col h-full rounded-[24px] border border-[#e5e6e8] bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-[#e5e6e8] pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0f68ea] border border-blue-100">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-[#1d1d1f]">Prellenado Inteligente IA (OCR)</h3>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#0f68ea] border border-blue-200">
              Extracción Exitosa
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Los datos han sido leídos del PDF adjunto. Verifica y ajusta cualquier valor antes del
            registro contable.
          </p>
        </div>
      </div>

      {/* Partida Presupuestaria Vinculada Card */}
      {budgetLine && (
        <div className="rounded-2xl border border-[#e5e6e8] bg-[#f8f9fa] p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f]">
              <Wallet className="h-4 w-4 text-[#0f68ea]" />
              Partida Vinculada: {budgetLine.code}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                isOverdrawn
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {isOverdrawn ? "Supera saldo disponible" : "Saldo suficiente"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {budgetLine.name} ({budgetLine.area})
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-[#e5e6e8]/80 text-[11px]">
            <span className="text-muted-foreground">Saldo disponible en partida:</span>
            <span className="font-bold text-[#1d1d1f]">{formatCurrency(lineAvailable)}</span>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="inv-issuer" className="text-xs font-semibold text-[#1d1d1f]">
              Razón Social del Emisor
            </Label>
            <Input
              id="inv-issuer"
              value={draft.issuerName}
              onChange={(e) => onDraftChange({ ...draft, issuerName: e.target.value })}
              className="text-xs h-9 rounded-xl border-[#e5e6e8]"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="inv-taxid" className="text-xs font-semibold text-[#1d1d1f]">
              R.U.C. del Emisor
            </Label>
            <Input
              id="inv-taxid"
              value={draft.issuerTaxId}
              onChange={(e) => onDraftChange({ ...draft, issuerTaxId: e.target.value })}
              className="text-xs h-9 rounded-xl border-[#e5e6e8] font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="inv-number" className="text-xs font-semibold text-[#1d1d1f]">
            Número de Factura Electrónica (Serie-Secuencial)
          </Label>
          <Input
            id="inv-number"
            value={draft.invoiceNumber}
            onChange={(e) => onDraftChange({ ...draft, invoiceNumber: e.target.value })}
            className="text-xs h-9 rounded-xl border-[#e5e6e8] font-mono"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3 pt-1">
          <div className="space-y-1">
            <Label htmlFor="inv-subtotal" className="text-xs font-semibold text-[#1d1d1f]">
              Subtotal (USD)
            </Label>
            <Input
              id="inv-subtotal"
              type="number"
              step="0.01"
              min={0}
              value={draft.subtotal}
              onChange={(e) => handleSubtotalChange(Number(e.target.value) || 0)}
              className="text-xs h-9 rounded-xl border-[#e5e6e8] font-medium"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="inv-tax" className="text-xs font-semibold text-[#1d1d1f]">
              IVA 15% (USD)
            </Label>
            <Input
              id="inv-tax"
              type="number"
              step="0.01"
              min={0}
              value={draft.taxAmount}
              onChange={(e) => {
                const tax = Number(e.target.value) || 0;
                onDraftChange({ ...draft, taxAmount: tax, total: draft.subtotal + tax });
              }}
              className="text-xs h-9 rounded-xl border-[#e5e6e8] font-medium"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="inv-total" className="text-xs font-semibold text-[#1d1d1f]">
              Importe Total (USD)
            </Label>
            <Input
              id="inv-total"
              type="number"
              step="0.01"
              value={draft.total}
              readOnly
              className="text-xs h-9 rounded-xl border-[#e5e6e8] bg-slate-50 font-bold text-[#0f68ea]"
            />
          </div>
        </div>

        {/* Human Review Checkbox */}
        <div className="rounded-2xl border border-[#e5e6e8] bg-blue-50/40 p-3.5 space-y-1.5 mt-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <Checkbox
              checked={humanReviewed}
              onCheckedChange={(checked) => onHumanReviewedChange(checked === true)}
              className="mt-0.5 rounded-md"
            />
            <span className="text-xs leading-relaxed text-[#1d1d1f] font-medium">
              Confirmo que revisé los datos extraídos contra el documento original (revisión humana
              obligatoria antes de afectar el presupuesto).
            </span>
          </label>
        </div>

        {isOverdrawn && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Nota: El monto total excede el saldo disponible actual de la partida.</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-[#e5e6e8]">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="rounded-xl text-xs"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!humanReviewed || draft.total <= 0}
          onClick={onSubmit}
          className="rounded-xl bg-[#0f68ea] hover:bg-blue-700 text-white text-xs font-medium px-4"
        >
          <CheckCheck className="h-3.5 w-3.5 mr-1" />
          Registrar gasto
        </Button>
      </div>
    </div>
  );
}
