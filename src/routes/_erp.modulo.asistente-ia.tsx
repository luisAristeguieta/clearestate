import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  Send,
  MessageSquare,
  LayoutDashboard,
  Bookmark,
  CheckCircle2,
  BrainCircuit,
  Layers,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { createPhase3Head } from "@/components/phase3/Phase3Shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, calculateAvailableBalance, type BudgetLine } from "@/config/erpConfig";
import { buildManagementReport } from "@/config/phase3Config";
import { useErp } from "@/context/ErpContext";
import { usePhase3 } from "@/context/Phase3Context";
import { DatasetsSidebar, AVAILABLE_DATASETS } from "@/components/assistant/DatasetsSidebar";
import { SavedReportsModal } from "@/components/assistant/SavedReportsModal";
import { AssistantMessageItem } from "@/components/assistant/AssistantMessageItem";
import type {
  ChatMessage,
  ChatMode,
  DatasetCategory,
  SavedReport,
  AiModelId,
  KpiTile,
  DynamicTable,
} from "@/components/assistant/types";

export const Route = createFileRoute("/_erp/modulo/asistente-ia")({
  head: () =>
    createPhase3Head(
      "/modulo/asistente-ia",
      "Chat de Reportería Inteligente y Generador BI Inmobiliario para análisis directivo y cruce de datos ERP.",
    ),
  component: AssistantBiPage,
});

const DEFAULT_SAVED_REPORTS: SavedReport[] = [
  {
    id: "rep-01",
    title: "Reporte Ejecutivo de Presupuesto - Proyecto París",
    date: "08 nov 2026",
    category: "Presupuestos",
    description:
      "Balance consolidado de partidas, techos de gasto y saldo disponible en Proyecto París.",
    query:
      "Genera el reporte ejecutivo de presupuestos del Proyecto París con detalle de partidas.",
    mode: "bi",
  },
  {
    id: "rep-02",
    title: "Auditoría de Compras y Contratistas",
    date: "05 nov 2026",
    category: "Adquisiciones",
    description:
      "Órdenes de compra emitidas, cuadro comparativo de proveedores y contratos de obra mayor.",
    query: "Muestra un análisis de órdenes de compra emitidas y estado de contratos de obra.",
    mode: "bi",
  },
  {
    id: "rep-03",
    title: "Control de Lotes y Entregas Posventa",
    date: "03 nov 2026",
    category: "Posventa",
    description:
      "Seguimiento de lotes comercializados, actas de entrega firmadas y cuentas con saldo cero.",
    query: "Estado de entregas de lotes posventa y clientes elegibles con saldo pagado.",
    mode: "bi",
  },
  {
    id: "rep-04",
    title: "Matriz de Partidas al Límite (>90%)",
    date: "01 nov 2026",
    category: "Presupuestos",
    description: "Monitoreo preventivo de partidas presupuestarias con alto consumo de recursos.",
    query: "¿Cuáles son las partidas con consumo mayor al 90% o en alerta de sobregiro?",
    mode: "bi",
  },
];

const QUICK_SUGGESTIONS = [
  "Presupuesto disponible París",
  "Comprometido vs Ejecutado general",
  "Estado de entregas y lotes posventa",
  "Márgenes y avance de obra",
  "Órdenes de compra y proveedores",
];

function AssistantBiPage() {
  const { budgetLines, invoices, purchaseOrders, contracts, requisitions, projectFilter } =
    useErp();
  const { sales, cases } = usePhase3();

  // Assistant UI states
  const [selectedCategory, setSelectedCategory] = useState<DatasetCategory>("Todos");
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<Set<string>>(
    () => new Set(AVAILABLE_DATASETS.map((d) => d.id)),
  );
  const [chatMode, setChatMode] = useState<ChatMode>("bi");
  const [aiModel, setAiModel] = useState<AiModelId>("claude-sonnet-5");
  const [question, setQuestion] = useState("");
  const [isSavedReportsOpen, setIsSavedReportsOpen] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>(DEFAULT_SAVED_REPORTS);

  const initialAssistantMessage: ChatMessage = {
    id: "msg-welcome",
    role: "assistant",
    text: "¡Hola! Soy tu asistente de Reportería IA de ClearEstate. Puedo ayudarte a analizar los datos de presupuestos, compras, contratos y posventa para generar dashboards dinámicos. Selecciona una o más fuentes en el panel lateral y descríbeme qué tipo de reporte deseas construir.",
    time: "09:19 a. m.",
    mode: "chat",
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistantMessage]);

  const handleToggleDataset = (id: string) => {
    setSelectedDatasetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAllDatasets = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedDatasetIds(new Set(AVAILABLE_DATASETS.map((d) => d.id)));
    } else {
      setSelectedDatasetIds(new Set());
    }
  };

  const formatCurrentTime = (): string => {
    return new Date().toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const processQuery = (rawText: string, forcedMode?: ChatMode) => {
    try {
      const text = rawText.trim();
      if (!text) return;

      const activeMode = forcedMode ?? chatMode;
      const normalized = text.toLowerCase();
      const nowTime = formatCurrentTime();

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text,
        time: nowTime,
      };

      // Detect Project Scope
      const projectId = normalized.includes("sagaleta")
        ? "sagaleta"
        : normalized.includes("parís") || normalized.includes("paris")
          ? "paris"
          : projectFilter;

      const scopeName =
        projectId === "all"
          ? "Todos los proyectos (París y Sagaleta)"
          : projectId === "paris"
            ? "Proyecto París"
            : "Proyecto Sagaleta";

      const report = buildManagementReport(
        budgetLines,
        invoices,
        purchaseOrders,
        contracts,
        sales,
        cases,
        { projectId, area: "all", from: "", to: "" },
      );

      let responseText = "";
      let kpis: KpiTile[] | undefined;
      let dynamicTable: DynamicTable | undefined;

      const isMargenQuery = /margen|rentabil|evoluci|hist[oó]ric|tendencia/.test(normalized);
      const isPosventaQuery = /entrega|posventa|lote|comprador|cliente|acta/.test(normalized);
      const isComprasQuery = /compra|orden|proveedor|adquisici|contrato|cotiza/.test(normalized);

      if (isMargenQuery) {
        responseText = `${scopeName}: no se cuenta con costos de venta completos ni series cronológicas presupuestarias para estimar márgenes con total fiabilidad técnica. El presupuesto disponible actual consolidado es de ${formatCurrency(report.available)}. Se sugiere consultar los contratos de obra vigentes y órdenes emitidas.`;

        if (activeMode === "bi") {
          kpis = [
            { label: "Presupuesto Aprobado", value: formatCurrency(report.approved) },
            { label: "Comprometido", value: formatCurrency(report.committed) },
            { label: "Ejecutado Acumulado", value: formatCurrency(report.executed) },
            {
              label: "Disponible Actual",
              value: formatCurrency(report.available),
              hint: "Saldo verificado",
              status: "healthy",
            },
          ];
        }
      } else if (isPosventaQuery) {
        const deliveredCount = report.selectedCases.filter((c) => c.status === "delivered").length;
        const pendingCount = report.selectedCases.length - deliveredCount;

        responseText = `${scopeName}: Se registran ${report.selectedSales.length} ventas en el ERP, con ${report.selectedCases.length} expedientes de posventa habilitados (saldo cancelado al 100%). A la fecha se registran ${deliveredCount} lotes entregados formalmente y ${pendingCount} unidades en fase de preparación o listas para entrega.`;

        if (activeMode === "bi") {
          kpis = [
            { label: "Ventas Registradas", value: `${report.selectedSales.length} lotes` },
            { label: "Expedientes Posventa", value: `${report.selectedCases.length} activos` },
            {
              label: "Lotes Entregados",
              value: `${deliveredCount} actas`,
              hint: "Firmadas",
              status: "healthy",
            },
            {
              label: "En Preparación",
              value: `${pendingCount} lotes`,
              hint: "Pendientes",
              status: "warning",
            },
          ];

          const caseSaleMap = new Map(sales.map((s) => [s.id, s]));
          dynamicTable = {
            title: `Resumen de Posventa y Entregas - ${scopeName}`,
            columns: [
              { key: "lote", label: "Lote" },
              { key: "buyer", label: "Comprador" },
              { key: "precio", label: "Precio Venta", align: "right" },
              { key: "saldo", label: "Saldo Oracle", align: "right" },
              { key: "estado", label: "Estado Posventa" },
            ],
            rows: report.selectedCases.slice(0, 8).map((c) => {
              const s = caseSaleMap.get(c.saleId);
              const statusLabel =
                c.status === "delivered"
                  ? "Entregado"
                  : c.status === "ready"
                    ? "Listo para entrega"
                    : "En preparación";
              return {
                lote: s?.lot ?? "Lote N/A",
                buyer: s?.buyerName ?? "Comprador",
                precio: s ? formatCurrency(s.price) : "$0",
                saldo: s ? formatCurrency(s.balance) : "$0",
                estado: statusLabel,
              };
            }),
          };
        }
      } else if (isComprasQuery) {
        const filteredPOs = purchaseOrders.filter((po) =>
          projectId === "all" ? true : po.projectId === projectId,
        );
        const poTotal = filteredPOs.reduce((sum, po) => sum + po.amount, 0);

        responseText = `${scopeName}: Se identifican ${filteredPOs.length} órdenes de compra emitidas y ${contracts.length} contratos de obra mayor. El monto total comprometido en compras adjudicadas asciende a ${formatCurrency(poTotal)}, auditado con cuadro comparativo P-08.`;

        if (activeMode === "bi") {
          kpis = [
            { label: "Órdenes de Compra", value: `${filteredPOs.length} emitidas` },
            { label: "Monto Adjudicado", value: formatCurrency(poTotal) },
            { label: "Requerimientos", value: `${requisitions.length} solicitudes` },
            {
              label: "Contratos de Obra",
              value: `${contracts.length} contratistas`,
              hint: "En regla",
              status: "healthy",
            },
          ];

          dynamicTable = {
            title: `Órdenes de Compra y Proveedores - ${scopeName}`,
            columns: [
              { key: "code", label: "Código OC" },
              { key: "supplier", label: "Proveedor Adjudicado" },
              { key: "monto", label: "Monto Adjudicado", align: "right" },
              { key: "criterio", label: "Criterio Adjudicación" },
              { key: "estado", label: "Estado" },
            ],
            rows: filteredPOs.map((po) => ({
              code: po.code,
              supplier: po.supplierName,
              monto: formatCurrency(po.amount),
              criterio: po.awardCriterion || "Mejor oferta técnica-económica",
              estado: "Adjudicado",
            })),
          };
        }
      } else {
        // Default: Presupuesto y Finanzas
        const lineCount = report.selectedLines.length;
        responseText = `${scopeName}: Se gestionan ${lineCount} partidas presupuestarias. El presupuesto aprobado total es de ${formatCurrency(report.approved)}, con un compromiso financiero de ${formatCurrency(report.committed)} y una ejecución devengada de ${formatCurrency(report.executed)}. El saldo disponible total consolidado es de ${formatCurrency(report.available)}.`;

        if (activeMode === "bi") {
          kpis = [
            { label: "Presupuesto Aprobado", value: formatCurrency(report.approved) },
            { label: "Total Comprometido", value: formatCurrency(report.committed) },
            { label: "Total Ejecutado", value: formatCurrency(report.executed) },
            {
              label: "Saldo Disponible",
              value: formatCurrency(report.available),
              hint: report.available > 0 ? "Saldo suficiente" : "Al límite",
              status: report.available > 0 ? "healthy" : "warning",
            },
          ];

          dynamicTable = {
            title: `Consolidado de Partidas Presupuestarias - ${scopeName}`,
            columns: [
              { key: "code", label: "Código" },
              { key: "name", label: "Partida / Descripción" },
              { key: "area", label: "Área" },
              { key: "approved", label: "Aprobado", align: "right" },
              { key: "committed", label: "Comprometido", align: "right" },
              { key: "executed", label: "Ejecutado", align: "right" },
              { key: "available", label: "Disponible", align: "right" },
              { key: "status", label: "Estado" },
            ],
            rows: report.selectedLines.map((line: BudgetLine) => {
              const avail = calculateAvailableBalance(line);
              const isWarning = avail < line.approved * 0.1 || avail <= 0;
              return {
                code: line.code,
                name: line.name,
                area: line.area,
                approved: formatCurrency(line.approved),
                committed: formatCurrency(line.committed),
                executed: formatCurrency(line.executed),
                available: formatCurrency(avail),
                status: isWarning ? "Al límite" : "Saldo suficiente",
              };
            }),
          };
        }
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: responseText,
        time: nowTime,
        mode: activeMode,
        scope: scopeName,
        kpis,
        table: dynamicTable,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setQuestion("");
    } catch (error) {
      console.error("Error processing query in assistant:", error);
      toast.error("Ocurrió un error al procesar la consulta.");
    }
  };

  const handleAssistantQuerySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    processQuery(question);
  };

  const handleSelectQuickSuggestion = (suggestion: string) => {
    setQuestion(suggestion);
    processQuery(suggestion);
  };

  const handleSelectSavedReport = (report: SavedReport) => {
    setChatMode(report.mode);
    setQuestion(report.query);
    processQuery(report.query, report.mode);
  };

  const handleSaveMessageAsReport = (msg: ChatMessage) => {
    try {
      const newReport: SavedReport = {
        id: `rep-custom-${Date.now()}`,
        title: msg.table?.title ?? `Reporte Personalizado - ${msg.scope ?? "General"}`,
        date: new Date().toLocaleDateString("es-EC", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        category: "Personalizado",
        description: msg.text.slice(0, 120) + "...",
        query: msg.text,
        mode: msg.mode ?? "bi",
      };
      setSavedReports((prev) => [newReport, ...prev]);
      toast.success("Reporte guardado en 'Mis Reportes BI'.");
    } catch {
      toast.error("No se pudo guardar el reporte.");
    }
  };

  return (
    <div className="phase2-view space-y-6">
      {/* Top Breadcrumb & Header matching Image 1 */}
      <section aria-label="Cabecera del Asistente">
        <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2">
          <span>Inteligencia Artificial</span>
          <span>&gt;</span>
          <span className="font-medium text-[#1d1d1f]">Chat de Reportería Inteligente</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[28px] border border-[#e5e6e8] bg-white p-5 md:p-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-[#0f68ea]">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1d1d1f]">
                  Chat de Reportería Inteligente
                </h1>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#0f68ea] border border-blue-200/60">
                  Inteligencia Artificial
                </span>
                <span className="rounded-full bg-[#f0f2f4] px-2.5 py-0.5 text-xs font-semibold text-[#1d1d1f] border border-[#e5e6e8]">
                  Generador BI Inmobiliario
                </span>
              </div>
              <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                Converse con el agente inteligente para componer dashboards, gráficos y tablas
                dinámicas cruzando datos de presupuestos, compras, posventa y contratos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={() => setIsSavedReportsOpen(true)}
              className="bg-[#0a192f] hover:bg-[#112240] text-white rounded-xl px-4 py-2 text-xs md:text-sm font-medium flex items-center gap-2 shadow-xs transition-colors"
            >
              <Bookmark className="h-4 w-4" />
              Mis Reportes BI ({savedReports.length})
            </Button>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Panel: Datasets Sidebar */}
        <DatasetsSidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedDatasetIds={selectedDatasetIds}
          onToggleDataset={handleToggleDataset}
          onToggleAll={handleToggleAllDatasets}
        />

        {/* Right Main Panel: Conversación con IA */}
        <div className="flex min-w-0 flex-1 flex-col rounded-[28px] border border-[#e5e6e8] bg-white p-5 md:p-6 shadow-xs">
          {/* Top Panel Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e6e8] pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#0f68ea]" />
              <h2 className="text-sm md:text-base font-bold text-[#1d1d1f]">
                Conversación con la Inteligencia Artificial
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">IA:</span>
                <Select value={aiModel} onValueChange={(val) => setAiModel(val as AiModelId)}>
                  <SelectTrigger className="h-8 text-xs rounded-lg border-[#e5e6e8] bg-[#f8f9fa] w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-sonnet-5">Claude - claude-sonnet-5</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini - gemini-2.5-pro</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o Real Estate BI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                <span>Conectado</span>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Listo</span>
              </div>
            </div>
          </div>

          {/* Quick Query Suggestions Bar */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-2 text-xs">
            <span className="shrink-0 text-muted-foreground flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-[#0f68ea]" />
              Consultas rápidas:
            </span>
            {QUICK_SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleSelectQuickSuggestion(sug)}
                className="shrink-0 rounded-full border border-[#e5e6e8] bg-[#f8f9fa] px-3 py-1 text-xs text-[#1d1d1f] hover:border-[#0f68ea] hover:bg-blue-50/60 transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Chat Stream History */}
          <div
            className="mt-4 flex-1 space-y-4 overflow-y-auto min-h-[380px] max-h-[580px] pr-1"
            role="log"
            aria-live="polite"
          >
            {messages.map((message) => (
              <AssistantMessageItem
                key={message.id}
                message={message}
                onSaveAsReport={handleSaveMessageAsReport}
              />
            ))}
          </div>

          {/* Mode Switcher Tabs right above input */}
          <div className="mt-4 flex items-center gap-2 border-t border-[#e5e6e8] pt-4">
            <button
              type="button"
              onClick={() => setChatMode("chat")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                chatMode === "chat"
                  ? "bg-[#0f68ea] text-white shadow-xs"
                  : "bg-[#f8f9fa] text-slate-700 border border-[#e5e6e8] hover:bg-slate-100"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Chat Normal
            </button>

            <button
              type="button"
              onClick={() => setChatMode("bi")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                chatMode === "bi"
                  ? "bg-[#0f68ea] text-white shadow-xs"
                  : "bg-[#f8f9fa] text-slate-700 border border-[#e5e6e8] hover:bg-slate-100"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Generador de Dashboards/Reportes BI
            </button>
          </div>

          {/* Input Form Bar */}
          <form
            onSubmit={handleAssistantQuerySubmit}
            className="mt-3 flex items-center gap-2.5 rounded-2xl border border-[#e5e6e8] bg-[#f8f9fa] p-1.5 focus-within:border-[#0f68ea] focus-within:bg-white transition-colors"
          >
            <Input
              aria-label="Escribe tu requerimiento"
              placeholder="Escribe tu requerimiento (ej: 'Muestra un reporte del presupuesto disponible por partida de París' o 'Genera dashboard de compras')..."
              maxLength={500}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-xs md:text-sm px-3 placeholder:text-muted-foreground/80"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!question.trim()}
              className="bg-[#0f68ea] hover:bg-blue-700 text-white rounded-xl px-4 py-2 font-medium text-xs md:text-sm flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Enviar</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Saved Reports Modal */}
      <SavedReportsModal
        open={isSavedReportsOpen}
        onOpenChange={setIsSavedReportsOpen}
        savedReports={savedReports}
        onSelectReport={handleSelectSavedReport}
      />
    </div>
  );
}
