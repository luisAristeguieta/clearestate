import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Send, RotateCcw, CheckCircle2, BrainCircuit, Layers } from "lucide-react";
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
import { formatCurrency } from "@/config/erpConfig";
import { buildManagementReport } from "@/config/phase3Config";
import { useErp } from "@/context/ErpContext";
import { usePhase3 } from "@/context/Phase3Context";
import { DatasetsSidebar, AVAILABLE_DATASETS } from "@/components/assistant/DatasetsSidebar";
import { AssistantMessageItem } from "@/components/assistant/AssistantMessageItem";
import type { ChatMessage, DatasetCategory, AiModelId } from "@/components/assistant/types";

export const Route = createFileRoute("/_erp/modulo/asistente-ia")({
  head: () =>
    createPhase3Head(
      "/modulo/asistente-ia",
      "Asistente conversacional inteligente para consultas gerenciales y análisis del ERP ClearEstate.",
    ),
  component: AssistantGerencialPage,
});

const QUICK_SUGGESTIONS = [
  "Presupuesto disponible París",
  "Comprometido vs Ejecutado general",
  "Estado de entregas y lotes posventa",
  "Márgenes y avance de obra",
  "Órdenes de compra y proveedores",
];

function AssistantGerencialPage() {
  const { budgetLines, invoices, purchaseOrders, contracts, requisitions, projectFilter } =
    useErp();
  const { sales, cases } = usePhase3();

  // Assistant UI states
  const [selectedCategory, setSelectedCategory] = useState<DatasetCategory>("Todos");
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<Set<string>>(
    () => new Set(AVAILABLE_DATASETS.map((d) => d.id)),
  );
  const [aiModel, setAiModel] = useState<AiModelId>("claude-sonnet-5");
  const [question, setQuestion] = useState("");

  const formatCurrentTime = (): string => {
    return new Date().toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const initialAssistantMessage: ChatMessage = {
    id: "msg-welcome",
    role: "assistant",
    text: "¡Hola! Soy tu Asistente Gerencial IA de ClearEstate. Puedo responder tus consultas estratégicas sobre presupuestos, compras, contratos de obra y posventa en tiempo real. Escribe tu pregunta o selecciona cualquiera de las consultas rápidas sugeridas.",
    time: "09:00 a. m.",
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

  const handleResetChat = () => {
    setMessages([
      {
        ...initialAssistantMessage,
        id: crypto.randomUUID(),
        time: formatCurrentTime(),
      },
    ]);
    toast.success("Conversación reiniciada.");
  };

  const processQuery = (rawText: string) => {
    try {
      const text = rawText.trim();
      if (!text) return;

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

      const isGreeting =
        /^(hola|buen[ao]s?\s*(d[ií]as|tardes|noches)?|saludos|que\s*tal|hey|hi|hello)$/i.test(
          normalized.trim(),
        );
      const isMargenQuery = /margen|rentabil|evoluci|hist[oó]ric|tendencia/.test(normalized);
      const isPosventaQuery = /entrega|posventa|lote|comprador|cliente|acta/.test(normalized);
      const isComprasQuery = /compra|orden|proveedor|adquisici|contrato|cotiza/.test(normalized);

      if (isGreeting) {
        responseText =
          `¡Hola! Estoy listo para asistirte en el análisis gerencial de ClearEstate.\n\n` +
          `Puedes consultarme sobre:\n` +
          `• Presupuesto disponible y techos de gasto por proyecto o área.\n` +
          `• Relación de montos comprometidos vs. ejecutados devengados.\n` +
          `• Órdenes de compra emitidas y estado de contratos de obra.\n` +
          `• Avance de entregas de lotes y actas suscritas en posventa.\n\n` +
          `Escribe tu consulta o haz clic en cualquiera de las consultas rápidas sugeridas.`;
      } else if (isMargenQuery) {
        responseText =
          `${scopeName}:\n` +
          `No se dispone de costos de ventas totales devengados ni series cronológicas cerradas para proyectar márgenes contables definitivos.\n\n` +
          `• Presupuesto Disponible Consolidado: ${formatCurrency(report.available)}\n` +
          `• Compromiso Financiero Vigente: ${formatCurrency(report.committed)}\n` +
          `• Ejecución Devengada a la Fecha: ${formatCurrency(report.executed)}\n\n` +
          `Recomendación de control: Auditar los contratos de obra vigentes y las valorizaciones de contratistas para contrastar el avance físico contra el financiero.`;
      } else if (isPosventaQuery) {
        const deliveredCount = report.selectedCases.filter((c) => c.status === "delivered").length;
        const pendingCount = report.selectedCases.length - deliveredCount;
        const deliveryRate =
          report.selectedCases.length > 0
            ? ((deliveredCount / report.selectedCases.length) * 100).toFixed(1)
            : "0.0";

        responseText =
          `${scopeName}:\n` +
          `Se registran ${report.selectedSales.length} ventas en el ERP, con ${report.selectedCases.length} expedientes habilitados para posventa (saldo cancelado al 100%).\n\n` +
          `• Lotes Entregados con Acta: ${deliveredCount} actas suscritas\n` +
          `• Lotes en Preparación / Listos: ${pendingCount} unidades\n` +
          `• Efectividad de Entrega: ${deliveryRate}%\n` +
          `• Estado de Cartera Oracle: 100% de los expedientes en posventa cuentan con saldo $0 verificado.`;
      } else if (isComprasQuery) {
        const filteredPOs = purchaseOrders.filter((po) =>
          projectId === "all" ? true : po.projectId === projectId,
        );
        const poTotal = filteredPOs.reduce((sum, po) => sum + po.amount, 0);

        responseText =
          `${scopeName}:\n` +
          `Se identifican ${filteredPOs.length} órdenes de compra emitidas y ${contracts.length} contratos de obra mayor registrados.\n\n` +
          `• Monto Total Adjudicado en Compras: ${formatCurrency(poTotal)}\n` +
          `• Solicitudes / Requerimientos: ${requisitions.length} solicitudes activas procesadas\n` +
          `• Contratos de Obra Vigentes: ${contracts.length} contratos auditados con contratistas\n` +
          `• Criterio de Adjudicación: Mejor oferta técnica-económica (procedimiento P-08 con cuadro comparativo).`;
      } else {
        // Default: Presupuesto y Finanzas
        const lineCount = report.selectedLines.length;
        const executionRate =
          report.approved > 0 ? ((report.executed / report.approved) * 100).toFixed(1) : "0.0";
        const committedRate =
          report.approved > 0 ? ((report.committed / report.approved) * 100).toFixed(1) : "0.0";

        responseText =
          `${scopeName}:\n` +
          `Se gestionan ${lineCount} partidas presupuestarias en el alcance seleccionado.\n\n` +
          `• Presupuesto Aprobado: ${formatCurrency(report.approved)}\n` +
          `• Total Comprometido: ${formatCurrency(report.committed)} (${committedRate}% del total)\n` +
          `• Total Ejecutado: ${formatCurrency(report.executed)} (${executionRate}% devengado)\n` +
          `• Saldo Disponible: ${formatCurrency(report.available)} (${report.available > 0 ? "Saldo suficiente para imputaciones" : "Al límite de capacidad"})\n\n` +
          `Las imputaciones presupuestarias se validan automáticamente con el flujo de aprobaciones de gerencia.`;
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: responseText,
        time: nowTime,
        mode: "chat",
        scope: scopeName,
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

  return (
    <div className="phase2-view space-y-6">
      {/* Top Breadcrumb & Header */}
      <section aria-label="Cabecera del Asistente">
        <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2">
          <span>Inteligencia Artificial</span>
          <span>&gt;</span>
          <span className="font-medium text-[#1d1d1f]">Asistente Gerencial IA</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[28px] border border-[#e5e6e8] bg-white p-5 md:p-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-[#0f68ea]">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1d1d1f]">
                  Asistente Gerencial IA
                </h1>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#0f68ea] border border-blue-200/60">
                  Inteligencia Artificial
                </span>
                <span className="rounded-full bg-[#f0f2f4] px-2.5 py-0.5 text-xs font-semibold text-[#1d1d1f] border border-[#e5e6e8]">
                  Chat Gerencial
                </span>
              </div>
              <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                Converse con el agente inteligente para consultar presupuestos, compras, contratos,
                posventa y métricas clave de proyectos en tiempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetChat}
              className="rounded-xl border-[#e5e6e8] bg-[#f8f9fa] hover:bg-slate-100 text-slate-700 px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar conversación
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
                    <SelectItem value="gpt-4o">GPT-4o Real Estate</SelectItem>
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
              <AssistantMessageItem key={message.id} message={message} />
            ))}
          </div>

          {/* Input Form Bar (Pure standard chat, no mode tabs) */}
          <form
            onSubmit={handleAssistantQuerySubmit}
            className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[#e5e6e8] bg-[#f8f9fa] p-1.5 focus-within:border-[#0f68ea] focus-within:bg-white transition-colors"
          >
            <Input
              aria-label="Escribe tu consulta gerencial"
              placeholder="Escribe tu consulta gerencial (ej: '¿Cuál es el saldo disponible de París?' o 'Estado de órdenes de compra')..."
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
    </div>
  );
}
