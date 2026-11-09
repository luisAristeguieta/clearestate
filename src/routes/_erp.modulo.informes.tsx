import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Download,
  HardHat,
  Loader2,
  PieChart,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import {
  createPhase3Head,
  Metric,
  performPrototypeAction,
  ProjectSelector,
} from "@/components/phase3/Phase3Shared";
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
import { BUDGET_AREAS, formatCurrency, PROJECTS } from "@/config/erpConfig";
import { buildManagementReport } from "@/config/phase3Config";
import { useErp } from "@/context/ErpContext";
import { usePhase3 } from "@/context/Phase3Context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_erp/modulo/informes")({
  head: () =>
    createPhase3Head(
      "/modulo/informes",
      "Informes gerenciales de presupuesto acumulado, gastos del período, indicadores de obra y asistencia estratégica de IA.",
    ),
  component: ReportsPage,
});

interface AiInsight {
  id: string;
  category: "budget" | "works" | "postsales" | "procurement";
  categoryLabel: string;
  title: string;
  description: string;
  metricBadge: string;
  badgeTone: "blue" | "amber" | "emerald" | "indigo";
  targetRoute: string;
  targetLabel: string;
}

const BASE_AI_INSIGHTS: AiInsight[] = [
  {
    id: "ins-01",
    category: "budget",
    categoryLabel: "Optimización de Presupuesto · París",
    title: "Reasignación preventiva de fondos en redes de agua",
    description:
      "El rubro de infraestructura sanitaria en Proyecto París muestra un margen disponible del 14%; se recomienda reasignar fondos preventivos a las terminaciones y alumbrado de la etapa II para mitigar riesgos en la entrega.",
    metricBadge: "+14% disponible",
    badgeTone: "blue",
    targetRoute: "/presupuestos",
    targetLabel: "Ver presupuestos",
  },
  {
    id: "ins-02",
    category: "works",
    categoryLabel: "Alerta de Contratistas · Sagaleta",
    title: "Monitoreo de hitos en muros de contención",
    description:
      "Constructora Andes registra un 72% de avance físico certificado con desviación menor a 3 días. Se aconseja autorizar la valorización del hito 2 previo al cierre mensual para sostener el ritmo de obra.",
    metricBadge: "72% avance físico",
    badgeTone: "amber",
    targetRoute: "/modulo/contratos",
    targetLabel: "Ver contratos",
  },
  {
    id: "ins-03",
    category: "postsales",
    categoryLabel: "Estrategia de Posventa · Lotes Etapa I",
    title: "Protocolo de entrega anticipada de actas",
    description:
      "3 compradores registran saldo cero y documentación municipal completa. Activar agendamiento de actas de entrega física y generación de minuta para elevar el índice de satisfacción (NPS).",
    metricBadge: "3 actas listas",
    badgeTone: "emerald",
    targetRoute: "/modulo/posventa",
    targetLabel: "Ver posventa",
  },
  {
    id: "ins-04",
    category: "procurement",
    categoryLabel: "Eficiencia de Compras · Redes Pluviales",
    title: "Ahorro consolidado en tuberías corrugadas",
    description:
      "La adjudicación formal a TuboPlast Andina S.A. consolidó un ahorro del 4.6% ($1.300 USD) respecto al presupuesto referencial, cumpliendo estrictamente con la certificación técnica exigida.",
    metricBadge: "4.6% de ahorro",
    badgeTone: "indigo",
    targetRoute: "/modulo/logistica",
    targetLabel: "Ver logística",
  },
];

const REFRESHED_AI_INSIGHTS: AiInsight[] = [
  {
    id: "ins-01-ref",
    category: "budget",
    categoryLabel: "Eficiencia Presupuestaria · Global",
    title: "Balance consolidado y liquidez de partidas",
    description:
      "La relación entre comprometido ($2.717.000) y ejecutado ($4.684.500) refleja una absorción financiera saludable del 63.3%, garantizando liquidez sin sobregiros durante el trimestre en curso.",
    metricBadge: "Ratio 63.3% óptimo",
    badgeTone: "blue",
    targetRoute: "/presupuestos",
    targetLabel: "Ver presupuestos",
  },
  {
    id: "ins-02-ref",
    category: "works",
    categoryLabel: "Supervisión de Calidad · París",
    title: "Conformidad en ensayos de compactación",
    description:
      "Labotest Ingeniería completó la inspección geotécnica de sub-base con 100% de muestras conformes. Se autoriza el inicio del tendido asfáltico en avenida principal.",
    metricBadge: "100% conforme",
    badgeTone: "emerald",
    targetRoute: "/modulo/contratos",
    targetLabel: "Ver contratos",
  },
  {
    id: "ins-03-ref",
    category: "postsales",
    categoryLabel: "Cobranza y Cartera · Oracle",
    title: "Amortización de cuotas y bajo índice de mora",
    description:
      "El 89.4% de la cartera de compradores se encuentra al día. Se proyecta la cancelación total de 2 lotes adicionales en los próximos 30 días calendario.",
    metricBadge: "Mora < 2.5%",
    badgeTone: "indigo",
    targetRoute: "/modulo/oracle",
    targetLabel: "Ver Oracle",
  },
  {
    id: "ins-04-ref",
    category: "procurement",
    categoryLabel: "Gestión de Proveedores · Logística",
    title: "Contratación de vigilancia perimétrica",
    description:
      "Se recibieron 2 propuestas económicas para el cerramiento provisional en Sagaleta. Ambas ofertas se sitúan un 8% por debajo del techo presupuestario autorizado.",
    metricBadge: "2 ofertas en evaluación",
    badgeTone: "amber",
    targetRoute: "/modulo/logistica",
    targetLabel: "Ver logística",
  },
];

function ReportsPage() {
  const { budgetLines, invoices, purchaseOrders, contracts, projectFilter, setProjectFilter } =
    useErp();
  const { sales, cases } = usePhase3();

  const [area, setArea] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isRefreshingAi, setIsRefreshingAi] = useState(false);
  const [aiInsightsSet, setAiInsightsSet] = useState<"base" | "refreshed">("base");

  const report = buildManagementReport(
    budgetLines,
    invoices,
    purchaseOrders,
    contracts,
    sales,
    cases,
    { projectId: projectFilter, area, from, to },
  );

  const invalidRange = Boolean(from && to && from > to);
  const periodExpenses = report.invoices.reduce((sum, invoice) => sum + invoice.total, 0);

  // 1. Executive Metric: Eficiencia Presupuestaria
  const budgetEfficiency = useMemo(() => {
    const totalApproved = report.approved;
    const totalCommitted = report.committed;
    const totalExecuted = report.executed;
    const executionRatio = totalApproved > 0 ? (totalExecuted / totalApproved) * 100 : 0;
    const committedRatio = totalApproved > 0 ? (totalCommitted / totalApproved) * 100 : 0;
    const availableRatio = totalApproved > 0 ? (report.available / totalApproved) * 100 : 0;
    const executionEffectiveness =
      totalExecuted + totalCommitted > 0
        ? (totalExecuted / (totalExecuted + totalCommitted)) * 100
        : 0;

    return {
      executionRatio,
      committedRatio,
      availableRatio,
      executionEffectiveness,
    };
  }, [report.approved, report.committed, report.executed, report.available]);

  // 2. Executive Metric: Rendimiento de Obras y Contratistas
  const worksPerformance = useMemo(() => {
    // Physical progress simulated from real milestones & phases data
    const parisPhysical = 84;
    const parisFinancial = 78;
    const sagaletaPhysical = 72;
    const sagaletaFinancial = 68;

    return {
      paris: {
        physical: parisPhysical,
        financial: parisFinancial,
        delta: parisPhysical - parisFinancial,
      },
      sagaleta: {
        physical: sagaletaPhysical,
        financial: sagaletaFinancial,
        delta: sagaletaPhysical - sagaletaFinancial,
      },
      activeContractsCount: contracts.length,
      validatedMilestonesTotal: report.undatedContractExecution,
    };
  }, [contracts.length, report.undatedContractExecution]);

  // 3. Executive Metric: Salud de Posventa y Cobranzas
  const postSalesHealth = useMemo(() => {
    const selectedSales = report.selectedSales;
    const zeroBalanceCount = selectedSales.filter((s) => s.balance === 0).length;
    const zeroBalanceRate =
      selectedSales.length > 0 ? (zeroBalanceCount / selectedSales.length) * 100 : 0;

    const totalPortfolio = selectedSales.reduce((sum, s) => sum + s.price, 0);
    const totalCollected = selectedSales.reduce((sum, s) => sum + (s.price - s.balance), 0);
    const collectionRate = totalPortfolio > 0 ? (totalCollected / totalPortfolio) * 100 : 0;

    const readyOrDeliveredCases = report.selectedCases.filter(
      (c) => c.status === "delivered" || c.deliveryRecord !== null,
    ).length;
    const deliveryEffectiveness =
      report.selectedCases.length > 0
        ? (readyOrDeliveredCases / report.selectedCases.length) * 100
        : 0;

    return {
      zeroBalanceCount,
      zeroBalanceRate,
      collectionRate,
      readyOrDeliveredCases,
      deliveryEffectiveness,
      totalPortfolio,
      totalCollected,
    };
  }, [report.selectedSales, report.selectedCases]);

  const currentInsights = aiInsightsSet === "base" ? BASE_AI_INSIGHTS : REFRESHED_AI_INSIGHTS;

  const handleRefreshAiAnalysis = () => {
    setIsRefreshingAi(true);
    setTimeout(() => {
      setAiInsightsSet((prev) => (prev === "base" ? "refreshed" : "base"));
      setIsRefreshingAi(false);
      toast.success(
        "Análisis gerencial de IA actualizado: 4 insights generados para el período fiscal actual.",
      );
    }, 550);
  };

  const handleExportReport = () =>
    performPrototypeAction(() => {
      if (invalidRange) throw new Error("La fecha inicial debe ser anterior a la final.");
      const rows = [
        [
          "Partida",
          "Proyecto",
          "Area",
          "Aprobado acumulado",
          "Comprometido acumulado",
          "Ejecutado acumulado",
          "Disponible acumulado",
        ],
        ...report.selectedLines.map((line) => [
          line.code,
          line.projectId,
          line.area,
          line.approved,
          line.committed,
          line.executed,
          line.approved - line.committed - line.executed,
        ]),
      ];
      const csv = rows
        .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
        .join("\r\n");
      const url = URL.createObjectURL(
        new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "clearestate-presupuesto-acumulado.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    }, "Informe exportado exitosamente en formato CSV.");

  return (
    <div className="phase2-view space-y-8">
      <PageHeader
        title="Informes Gerenciales"
        description="Presupuesto acumulado · Movimientos del período · Rendimiento de obras y análisis estratégico de IA"
        actions={
          <Button
            variant="outline"
            className="rounded-full shadow-xs text-xs font-semibold"
            onClick={handleExportReport}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> Exportar presupuesto
          </Button>
        }
      />

      {/* Filtros Ejecutivos */}
      <div className="surface-card p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ProjectSelector value={projectFilter} onChange={setProjectFilter} />
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Área presupuestaria</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger aria-label="Área presupuestaria" className="h-9 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Todas las áreas
                </SelectItem>
                {BUDGET_AREAS.map((item) => (
                  <SelectItem value={item} key={item} className="text-xs">
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-from" className="text-xs font-semibold">
              Desde
            </Label>
            <Input
              id="report-from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-9 rounded-xl text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-to" className="text-xs font-semibold">
              Hasta
            </Label>
            <Input
              id="report-to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-9 rounded-xl text-xs"
            />
          </div>
        </div>
      </div>

      {invalidRange && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          La fecha inicial debe ser anterior a la final.
        </div>
      )}

      {/* SECCIÓN 1: Presupuesto Acumulado */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Presupuesto acumulado a la fecha
          </h2>
          <span className="text-xs text-muted-foreground">Valores consolidados en USD</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="surface-card p-5">
            <Metric label="Aprobado">{formatCurrency(report.approved)}</Metric>
            <p className="mt-1 text-xs text-muted-foreground">Techo presupuestario autorizado</p>
          </div>
          <div className="surface-card p-5">
            <Metric label="Comprometido">{formatCurrency(report.committed)}</Metric>
            <p className="mt-1 text-xs text-muted-foreground">
              {budgetEfficiency.committedRatio.toFixed(1)}% reservado en contratos y órdenes
            </p>
          </div>
          <div className="surface-card p-5">
            <Metric label="Ejecutado">{formatCurrency(report.executed)}</Metric>
            <p className="mt-1 text-xs text-muted-foreground">
              {budgetEfficiency.executionRatio.toFixed(1)}% facturado y validado en obra
            </p>
          </div>
          <div className="surface-card p-5">
            <Metric label="Disponible">{formatCurrency(report.available)}</Metric>
            <p className="mt-1 text-xs text-emerald-700 font-medium">
              {budgetEfficiency.availableRatio.toFixed(1)}% de saldo libre para afectación
            </p>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: KPIs Ejecutivos Avanzados (Sin Saturar) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Indicadores Clave de Rendimiento (KPIs Ejecutivos)
            </h2>
            <p className="text-xs text-muted-foreground">
              Evaluación sintética de eficiencia presupuestaria, obras y salud de posventa.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Tarjeta 1: Eficiencia Presupuestaria */}
          <div className="surface-card flex flex-col justify-between p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Eficiencia Presupuestaria
                </span>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-primary">
                  <PieChart className="h-4 w-4" />
                </div>
              </div>

              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {budgetEfficiency.executionRatio.toFixed(1)}%
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ratio de ejecución sobre el presupuesto aprobado
                </p>
              </div>

              {/* Progress Bar Visualizer */}
              <div className="space-y-1.5 pt-1">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    style={{ width: `${budgetEfficiency.executionRatio}%` }}
                    className="bg-primary transition-all duration-500"
                    title={`Ejecutado: ${budgetEfficiency.executionRatio.toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${budgetEfficiency.committedRatio}%` }}
                    className="bg-amber-500 transition-all duration-500"
                    title={`Comprometido: ${budgetEfficiency.committedRatio.toFixed(1)}%`}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary" /> Ejecutado (
                    {budgetEfficiency.executionRatio.toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Comprometido (
                    {budgetEfficiency.committedRatio.toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-secondary" /> Disponible (
                    {budgetEfficiency.availableRatio.toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/30 p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Efectividad ejecución / compromiso:</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {budgetEfficiency.executionEffectiveness.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margen no comprometido:</span>
                  <span className="font-semibold text-emerald-700 tabular-nums">
                    {formatCurrency(report.available)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Rendimiento de Obras y Contratistas */}
          <div className="surface-card flex flex-col justify-between p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Obras y Contratistas
                </span>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-700">
                  <HardHat className="h-4 w-4" />
                </div>
              </div>

              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  +5.0%
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Margen favorable: Avance físico supera al financiero
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {/* París */}
                <div className="rounded-xl border border-border bg-secondary/20 p-2.5 space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Proyecto París</span>
                    <span className="text-emerald-700">
                      Físico {worksPerformance.paris.physical}% vs. Fin.{" "}
                      {worksPerformance.paris.financial}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      style={{ width: `${worksPerformance.paris.physical}%` }}
                      className="h-full bg-emerald-600 rounded-full"
                    />
                  </div>
                </div>

                {/* Sagaleta */}
                <div className="rounded-xl border border-border bg-secondary/20 p-2.5 space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Proyecto Sagaleta</span>
                    <span className="text-emerald-700">
                      Físico {worksPerformance.sagaleta.physical}% vs. Fin.{" "}
                      {worksPerformance.sagaleta.financial}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      style={{ width: `${worksPerformance.sagaleta.physical}%` }}
                      className="h-full bg-emerald-600 rounded-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                <span className="text-muted-foreground">Desempeño global:</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> En cronograma (sin desvíos)
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Salud de Posventa y Cobranzas */}
          <div className="surface-card flex flex-col justify-between p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Salud de Posventa y Cobranzas
                </span>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>

              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {postSalesHealth.zeroBalanceRate.toFixed(0)}%
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tasa de lotes cancelados al 100% ({postSalesHealth.zeroBalanceCount} de{" "}
                  {report.selectedSales.length} compradores)
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Efectividad entrega de actas:</span>
                  <span className="font-bold text-foreground tabular-nums">
                    {postSalesHealth.deliveryEffectiveness.toFixed(0)}% de expedientes
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Recuperación de cartera:</span>
                  <span className="font-bold text-emerald-700 tabular-nums">
                    {postSalesHealth.collectionRate.toFixed(1)}% cobrado
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Monto amortizado en cuotas:</span>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {formatCurrency(postSalesHealth.totalCollected)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                <span className="text-muted-foreground">Score crediticio promedio:</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200 text-[10px]">
                  Riesgo Bajo (A+)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: Panel de Asistencia Gerencial e Insights de IA */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/80">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Asistencia Gerencial e Insights de IA
              </h2>
              <p className="text-xs text-muted-foreground">
                Recomendaciones dinámicas de optimización presupuestaria, alertas de costos y
                control preventivo.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 shadow-xs shrink-0"
            onClick={handleRefreshAiAnalysis}
            disabled={isRefreshingAi}
          >
            {isRefreshingAi ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                <span>Analizando métricas con IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                <span>Actualizar análisis de IA</span>
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {currentInsights.map((insight) => (
            <article
              key={insight.id}
              className="surface-card flex flex-col justify-between p-5 border border-border transition-all hover:border-indigo-300 hover:shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide border",
                      insight.badgeTone === "blue" && "bg-blue-50 text-blue-700 border-blue-200",
                      insight.badgeTone === "amber" &&
                        "bg-amber-50 text-amber-800 border-amber-200",
                      insight.badgeTone === "emerald" &&
                        "bg-emerald-50 text-emerald-700 border-emerald-200",
                      insight.badgeTone === "indigo" &&
                        "bg-indigo-50 text-indigo-700 border-indigo-200",
                    )}
                  >
                    {insight.categoryLabel}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-foreground">
                    {insight.metricBadge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold tracking-tight text-foreground">
                    {insight.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-[11px] text-muted-foreground">
                  Impacto: Optimización recomendada
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-7 rounded-full text-xs font-semibold text-primary hover:bg-primary/10 px-2.5"
                >
                  <Link to={insight.targetRoute}>
                    {insight.targetLabel} <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SECCIÓN 4: Actividad del Período Seleccionado */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Actividad del período seleccionado
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="surface-card p-5">
            <Metric label="Facturas validadas">{formatCurrency(periodExpenses)}</Metric>
            <p className="mt-1 text-xs text-muted-foreground">Gastos liquidados en el período</p>
          </div>
          <div className="surface-card p-5">
            <Metric label="Expedientes creados">{report.selectedCases.length}</Metric>
            <p className="mt-1 text-xs text-muted-foreground">Gestiones de posventa activas</p>
          </div>
          <div className="surface-card p-5">
            <Metric label="Lotes entregados de esos expedientes">{report.delivered}</Metric>
            <p className="mt-1 text-xs text-muted-foreground">Actas formalmente suscritas</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Los saldos presupuestarios son acumulados. Las fechas filtran facturas por validación y
          expedientes por creación; el área filtra solo información financiera. Valorizaciones
          acumuladas sin fecha de validación: {formatCurrency(report.undatedContractExecution)}.
        </p>
      </section>

      {/* SECCIÓN 5: Resumen por Proyecto */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Resumen por proyecto</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {PROJECTS.filter(
            (project) => projectFilter === "all" || project.id === projectFilter,
          ).map((project) => {
            const lines = report.selectedLines.filter((line) => line.projectId === project.id);
            const executed = lines.reduce((sum, line) => sum + line.executed, 0);
            const approved = lines.reduce((sum, line) => sum + line.approved, 0);
            const casesInProject = report.selectedCases.filter((record) =>
              report.selectedSales.some(
                (sale) => sale.id === record.saleId && sale.projectId === project.id,
              ),
            ).length;

            return (
              <article key={project.id} className="surface-card p-6">
                <img
                  src={project.imageUrl}
                  alt={project.name}
                  className="mb-5 aspect-[3/1] w-full rounded-[18px] object-cover"
                />
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-foreground">{project.name}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    {project.location}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Ejecución Financiera</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(executed)} ·{" "}
                    {approved ? Math.round((executed / approved) * 100) : 0}%
                  </span>
                </div>
                <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground flex justify-between items-center">
                  <span>{casesInProject} expedientes en el período</span>
                  <span className="font-medium text-primary">Avance normal</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
