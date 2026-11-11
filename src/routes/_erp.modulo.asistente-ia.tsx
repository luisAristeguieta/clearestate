import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Send, RotateCcw, CheckCircle2, BrainCircuit, Layers, Loader2, Bot } from "lucide-react";
import { useState, useRef, useEffect, type FormEvent } from "react";
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
import { calculateAvailableBalance } from "@/config/erpConfig";
import { buildManagementReport } from "@/config/phase3Config";
import { useErp } from "@/context/ErpContext";
import { usePhase3 } from "@/context/Phase3Context";
import { DatasetsSidebar, AVAILABLE_DATASETS } from "@/components/assistant/DatasetsSidebar";
import { AssistantMessageItem } from "@/components/assistant/AssistantMessageItem";
import type { ChatMessage, DatasetCategory, AiModelId } from "@/components/assistant/types";
import { sendMessageToFidel } from "@/services/fidelChatService";

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
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_clearestate_${Math.random().toString(36).substring(2, 9)}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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

  const handleSendMessage = async (userText: string) => {
    const text = userText.trim();
    if (!text || isLoading) return;

    const nowTime = formatCurrentTime();
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      time: nowTime,
    };

    // 1. Mostrar mensaje del usuario en el chat
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setIsLoading(true);

    try {
      // 2. Detectar alcance del proyecto
      const normalized = text.toLowerCase();
      const projectId = normalized.includes("sagaleta")
        ? "sagaleta"
        : normalized.includes("parís") || normalized.includes("paris")
          ? "paris"
          : projectFilter;

      const currentSelectedProject =
        projectId === "all"
          ? "Todos"
          : projectId === "paris"
            ? "Proyecto París"
            : "Proyecto Sagaleta";

      const scopeName =
        projectId === "all"
          ? "Todos los proyectos (París y Sagaleta)"
          : projectId === "paris"
            ? "Proyecto París"
            : "Proyecto Sagaleta";

      // Datasets activos marcados con checkbox
      const activeDatasets = AVAILABLE_DATASETS.filter((d) => selectedDatasetIds.has(d.id)).map(
        (d) => d.name,
      );

      // Datos locales calculados de presupuestos, obras y posventa
      const report = buildManagementReport(
        budgetLines,
        invoices,
        purchaseOrders,
        contracts,
        sales,
        cases,
        { projectId, area: "all", from: "", to: "" },
      );

      const filteredPOs = purchaseOrders.filter((po) =>
        projectId === "all" ? true : po.projectId === projectId,
      );

      const currentMockDataSubset = {
        proyectoSeleccionado: currentSelectedProject,
        alcance: scopeName,
        metricasPresupuesto: {
          presupuestoAprobadoTotal: report.approved,
          totalComprometido: report.committed,
          totalEjecutado: report.executed,
          saldoDisponible: report.available,
          porcentajeComprometido:
            report.approved > 0 ? Number(((report.committed / report.approved) * 100).toFixed(1)) : 0,
          porcentajeEjecutado:
            report.approved > 0 ? Number(((report.executed / report.approved) * 100).toFixed(1)) : 0,
        },
        partidasPresupuestarias: report.selectedLines.slice(0, 15).map((l) => ({
          codigo: l.code,
          nombre: l.name,
          area: l.area,
          aprobado: l.approved,
          comprometido: l.committed,
          ejecutado: l.executed,
          disponible: calculateAvailableBalance(l),
        })),
        adquisicionesYCompras: {
          totalOrdenesCompra: filteredPOs.length,
          montoTotalAdjudicado: filteredPOs.reduce((sum, po) => sum + po.amount, 0),
          solicitudesRequerimientos: requisitions.length,
          ordenesRecientes: filteredPOs.slice(0, 5).map((po) => ({
            numero: po.code,
            proveedor: po.supplierName,
            monto: po.amount,
            estado: po.status,
          })),
          contratosObra: contracts.slice(0, 5).map((c) => ({
            numero: c.code,
            contratista: c.contractorName,
            montoTotal: c.amount,
            hitosCount: c.milestones.length,
          })),
        },
        posventa: {
          totalVentas: report.selectedSales.length,
          expedientesHabilitados: report.selectedCases.length,
          lotesEntregadosConActa: report.selectedCases.filter((c) => c.status === "delivered").length,
        },
      };

      // 3. Consultar a Fidel
      const res = await sendMessageToFidel({
        message: text,
        sessionId,
        activeProject: currentSelectedProject,
        activeDatasets,
        injectedDataSummary: JSON.stringify(currentMockDataSubset, null, 2),
      });

      // 4. Renderizar respuesta de Fidel
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: res.replyText,
        time: formatCurrentTime(),
        mode: "chat",
        scope: scopeName,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Error al comunicarse con Fidel:", err);
      toast.error(err.message || "Error al conectar con Fidel");
      const systemMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "system",
        text: `Error: ${err.message || "No fue posible conectar con el Asistente Fidel."}`,
        time: formatCurrentTime(),
      };
      setMessages((prev) => [...prev, systemMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssistantQuerySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSendMessage(question);
  };

  const handleSelectQuickSuggestion = (suggestion: string) => {
    setQuestion(suggestion);
    void handleSendMessage(suggestion);
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
                <span>Conectado Fidel</span>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <span className={`h-1.5 w-1.5 rounded-full ${isLoading ? "bg-amber-500 animate-ping" : "bg-emerald-600 animate-pulse"}`} />
                <span>{isLoading ? "Consultando..." : "Listo"}</span>
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
                disabled={isLoading}
                onClick={() => handleSelectQuickSuggestion(sug)}
                className="shrink-0 rounded-full border border-[#e5e6e8] bg-[#f8f9fa] px-3 py-1 text-xs text-[#1d1d1f] hover:border-[#0f68ea] hover:bg-blue-50/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

            {/* Estado de carga animado "Escribiendo..." */}
            {isLoading && (
              <article
                className="flex items-start gap-3.5 rounded-2xl border border-[#e5e6e8] bg-white p-4 shadow-xs"
                aria-label="Asistente respondiendo"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f68ea] text-white shadow-xs">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2 border-b border-[#e5e6e8]/60 pb-1.5">
                    <span className="text-xs font-bold text-[#1d1d1f]">Asistente Gerencial IA</span>
                    <span className="text-[11px] text-muted-foreground">· Consultando backend Fidel en producción...</span>
                  </div>
                  <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[#0f68ea] animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-[#0f68ea] animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-[#0f68ea] animate-bounce" />
                    </span>
                    <span className="ml-1 text-xs italic text-slate-500">
                      Analizando datos en tiempo real...
                    </span>
                  </div>
                </div>
              </article>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form Bar (Pure standard chat, no mode tabs) */}
          <form
            onSubmit={handleAssistantQuerySubmit}
            className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[#e5e6e8] bg-[#f8f9fa] p-1.5 focus-within:border-[#0f68ea] focus-within:bg-white transition-colors"
          >
            <Input
              aria-label="Escribe tu consulta gerencial"
              placeholder={
                isLoading
                  ? "El Asistente está consultando a Fidel..."
                  : "Escribe tu consulta gerencial (ej: '¿Cuál es el saldo disponible de París?' o 'Estado de órdenes de compra')..."
              }
              maxLength={500}
              disabled={isLoading}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-xs md:text-sm px-3 placeholder:text-muted-foreground/80 disabled:opacity-60"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!question.trim() || isLoading}
              className="bg-[#0f68ea] hover:bg-blue-700 text-white rounded-xl px-4 py-2 font-medium text-xs md:text-sm flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar</span>
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
