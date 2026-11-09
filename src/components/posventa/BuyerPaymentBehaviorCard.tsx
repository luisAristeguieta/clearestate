import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  FileSpreadsheet,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/components/phase3/Phase3Shared";
import type { OracleSale } from "@/config/phase3Config";
import { cn } from "@/lib/utils";

export type PaymentStatus = "paid_on_time" | "paid_delayed" | "pending" | "overdue";
export type PaymentBehaviorCategory = "puntual" | "atraso_leve" | "moroso";

export interface BuyerInstallment {
  number: number;
  dueDate: string;
  amount: number;
  paidDate?: string | undefined;
  delayDays: number;
  voucherRef?: string | undefined;
  status: PaymentStatus;
}

export interface PaymentBehaviorAnalysis {
  ratingLabel: string;
  category: PaymentBehaviorCategory;
  score: number;
  scoreLabel: string;
  onTimeRate: number;
  averageDelayDays: number;
  summaryNote: string;
  totalInstallments: number;
  paidInstallments: number;
  pendingInstallments: number;
  totalPrice: number;
  totalPaid: number;
  totalBalance: number;
}

export function generateInstallmentSchedule(sale: OracleSale): BuyerInstallment[] {
  const schedule: BuyerInstallment[] = [];
  const count = sale.installments || 24;
  const paidCount = sale.paidInstallments || 0;
  const amount = count > 0 ? sale.price / count : 0;
  const baseDate = new Date(sale.soldAt || "2026-03-05");

  for (let i = 1; i <= count; i++) {
    const due = new Date(baseDate);
    due.setMonth(due.getMonth() + i);
    const dueDateStr = due.toISOString().slice(0, 10);

    const isPaid = i <= paidCount;
    let status: PaymentStatus = "pending";
    let paidDate: string | undefined = undefined;
    let delayDays = 0;

    if (isPaid) {
      if (sale.id === "sale-02" && i === 17) {
        status = "paid_delayed";
        delayDays = 5;
        const paid = new Date(due);
        paid.setDate(paid.getDate() + 5);
        paidDate = paid.toISOString().slice(0, 10);
      } else {
        status = "paid_on_time";
        delayDays = 0;
        const paid = new Date(due);
        paid.setDate(paid.getDate() - 2);
        paidDate = paid.toISOString().slice(0, 10);
      }
    } else {
      const referenceNow = new Date("2026-11-09");
      if (due < referenceNow) {
        status = "overdue";
        delayDays = Math.max(
          1,
          Math.round((referenceNow.getTime() - due.getTime()) / (1000 * 3600 * 24)),
        );
      } else {
        status = "pending";
        delayDays = 0;
      }
    }

    schedule.push({
      number: i,
      dueDate: dueDateStr,
      amount,
      paidDate,
      delayDays,
      voucherRef: isPaid
        ? `REC-ORC-${sale.id.replace("sale-", "0")}-${String(i).padStart(2, "0")}`
        : undefined,
      status,
    });
  }

  return schedule;
}

export function getPaymentBehaviorAnalysis(
  sale: OracleSale,
  schedule: BuyerInstallment[],
): PaymentBehaviorAnalysis {
  const total = schedule.length;
  const paid = schedule.filter(
    (inst) => inst.status === "paid_on_time" || inst.status === "paid_delayed",
  ).length;
  const overdue = schedule.filter((inst) => inst.status === "overdue").length;
  const onTime = schedule.filter((inst) => inst.status === "paid_on_time").length;

  let category: PaymentBehaviorCategory = "puntual";
  let ratingLabel = "Cliente Puntual";
  let score = 100;
  let scoreLabel = "Excelente · Categoría A+";
  let summaryNote = "";

  if (sale.balance === 0) {
    category = "puntual";
    ratingLabel = "Cliente Puntual";
    score = 100;
    scoreLabel = "Excelente · Categoría A+";
    summaryNote =
      "Registro intachable. 100% de las cuotas canceladas dentro de la fecha de vencimiento pactada. No registra notas de débito ni intereses por mora en Oracle Financials. Habilitado para entrega física y escrituración.";
  } else if (overdue > 0) {
    category = "atraso_leve";
    ratingLabel = "Atraso Leve";
    score = 86;
    scoreLabel = "En Gestión · Categoría B";
    summaryNote = `Registra ${overdue} cuota pendiente con retraso frente al vencimiento contractual. Se recomienda emitir recordatorio preventivo multicanal de cobranza.`;
  } else {
    category = "puntual";
    ratingLabel = "Al Día";
    score = 96;
    scoreLabel = "Puntual · Categoría A";
    summaryNote =
      "Amortizaciones al corriente según calendario contractual. Pagos efectuados de manera regular sin incidencias de cobranza.";
  }

  const onTimeRate = paid > 0 ? Math.round((onTime / paid) * 100) : 100;
  const totalDelayDays = schedule.reduce((sum, item) => sum + item.delayDays, 0);
  const averageDelayDays = paid + overdue > 0 ? Math.round(totalDelayDays / (paid + overdue)) : 0;

  return {
    ratingLabel,
    category,
    score,
    scoreLabel,
    onTimeRate,
    averageDelayDays,
    summaryNote,
    totalInstallments: total,
    paidInstallments: paid,
    pendingInstallments: total - paid,
    totalPrice: sale.price,
    totalPaid: sale.price - sale.balance,
    totalBalance: sale.balance,
  };
}

interface BuyerPaymentBehaviorCardProps {
  sale: OracleSale;
}

export function BuyerPaymentBehaviorCard({ sale }: BuyerPaymentBehaviorCardProps) {
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");
  const [showAll, setShowAll] = useState(false);

  const schedule = generateInstallmentSchedule(sale);
  const analysis = getPaymentBehaviorAnalysis(sale, schedule);

  const filteredSchedule = schedule.filter((inst) => {
    if (filter === "paid") {
      return inst.status === "paid_on_time" || inst.status === "paid_delayed";
    }
    if (filter === "pending") {
      return inst.status === "pending" || inst.status === "overdue";
    }
    return true;
  });

  const visibleSchedule = showAll ? filteredSchedule : filteredSchedule.slice(0, 6);

  return (
    <section className="surface-card space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Historial y Comportamiento de Pago
            </h2>
            <p className="text-xs text-muted-foreground">
              Sincronizado desde Oracle Financials · Evaluación crediticia y cumplimiento de cuotas
            </p>
          </div>
        </div>

        {/* Rating Badge */}
        <div className="flex items-center gap-2">
          {analysis.category === "puntual" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {analysis.ratingLabel} · {analysis.scoreLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              {analysis.ratingLabel} · {analysis.scoreLabel}
            </span>
          )}
        </div>
      </div>

      {/* Hero Financial & Behavior Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
          <span className="text-xs text-muted-foreground">Puntaje Crediticio</span>
          <p className="mt-1 flex items-baseline gap-1 text-xl font-bold tabular-nums text-foreground">
            {analysis.score}
            <span className="text-xs font-normal text-muted-foreground">/ 100</span>
          </p>
          <span className="mt-1 inline-block text-[11px] text-emerald-600 font-medium">
            {analysis.onTimeRate}% puntualidad
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
          <span className="text-xs text-muted-foreground">Cuotas Amortizadas</span>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {analysis.paidInstallments}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {analysis.totalInstallments}
            </span>
          </p>
          <span className="mt-1 inline-block text-[11px] text-muted-foreground">
            {analysis.pendingInstallments === 0
              ? "Totalmente pagado"
              : `${analysis.pendingInstallments} cuotas por vencer`}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
          <span className="text-xs text-muted-foreground">Total Pagado</span>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatMoney(analysis.totalPaid)}
          </p>
          <span className="mt-1 inline-block text-[11px] text-muted-foreground">
            De {formatMoney(analysis.totalPrice)}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
          <span className="text-xs text-muted-foreground">Saldo Pendiente</span>
          <p
            className={cn(
              "mt-1 text-xl font-bold tabular-nums",
              analysis.totalBalance === 0 ? "text-emerald-700" : "text-amber-700",
            )}
          >
            {formatMoney(analysis.totalBalance)}
          </p>
          <span className="mt-1 inline-block text-[11px] text-muted-foreground">
            {analysis.totalBalance === 0 ? "Sin saldo deudor" : "En período de amortización"}
          </span>
        </div>
      </div>

      {/* Qualitative assessment note */}
      <div className="rounded-2xl border border-border/80 bg-background p-4 text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Diagnóstico de Cobranza: </span>
        {analysis.summaryNote}
      </div>

      {/* Installment Table Header & Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">
              Cronograma Detallado de Cuotas Oracle
            </h3>
          </div>

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
              Todas ({schedule.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("paid")}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-colors",
                filter === "paid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Pagadas ({analysis.paidInstallments})
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-colors",
                filter === "pending"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Pendientes ({analysis.pendingInstallments})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow>
                <TableHead className="w-[120px] font-semibold text-xs">Nº Cuota</TableHead>
                <TableHead className="font-semibold text-xs">Vencimiento</TableHead>
                <TableHead className="font-semibold text-xs text-right">Monto</TableHead>
                <TableHead className="font-semibold text-xs">Fecha de Pago</TableHead>
                <TableHead className="font-semibold text-xs">Desviación</TableHead>
                <TableHead className="font-semibold text-xs">Comprobante Oracle</TableHead>
                <TableHead className="text-right font-semibold text-xs">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSchedule.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-xs text-muted-foreground">
                    No se encontraron cuotas para el filtro seleccionado.
                  </TableCell>
                </TableRow>
              ) : (
                visibleSchedule.map((inst) => (
                  <TableRow key={inst.number} className="text-xs">
                    <TableCell className="font-semibold tabular-nums text-foreground">
                      Cuota {String(inst.number).padStart(2, "0")} / {analysis.totalInstallments}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {inst.dueDate}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-foreground">
                      {formatMoney(inst.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {inst.paidDate ?? "—"}
                    </TableCell>
                    <TableCell>
                      {inst.status === "paid_on_time" ? (
                        <span className="text-[11px] text-emerald-700 font-medium">
                          0 días · Puntual
                        </span>
                      ) : inst.status === "paid_delayed" ? (
                        <span className="text-[11px] text-amber-700 font-medium">
                          +{inst.delayDays}d de atraso
                        </span>
                      ) : inst.status === "overdue" ? (
                        <span className="text-[11px] text-rose-700 font-semibold">
                          +{inst.delayDays}d vencida
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">A término</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {inst.voucherRef ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {inst.status === "paid_on_time" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Pagado a tiempo
                        </span>
                      ) : inst.status === "paid_delayed" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          <Clock className="h-3 w-3" /> Pagado con mora
                        </span>
                      ) : inst.status === "overdue" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                          <AlertCircle className="h-3 w-3" /> Vencida
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          <Calendar className="h-3 w-3" /> Programada
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Toggle to view all installments */}
        {filteredSchedule.length > 6 && (
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll((prev) => !prev)}
              className="text-xs text-primary hover:text-primary/80"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5 mr-1" />
                  Ver resumen de cuotas recientes
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5 mr-1" />
                  Ver las {filteredSchedule.length} cuotas completas del cronograma
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
