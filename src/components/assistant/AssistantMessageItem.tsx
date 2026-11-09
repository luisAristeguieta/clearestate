import {
  Bot,
  UserRound,
  Download,
  Copy,
  BookmarkPlus,
  Table as TableIcon,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage, KpiTile } from "./types";
import { Button } from "@/components/ui/button";

interface AssistantMessageItemProps {
  message: ChatMessage;
  onSaveAsReport?: (message: ChatMessage) => void;
}

export function AssistantMessageItem({ message, onSaveAsReport }: AssistantMessageItemProps) {
  const isUser = message.role === "user";

  const handleCopyText = () => {
    try {
      let content = message.text;
      if (message.kpis && message.kpis.length > 0) {
        content += "\n\nKPIs:\n" + message.kpis.map((k) => `${k.label}: ${k.value}`).join("\n");
      }
      if (message.table) {
        content += "\n\n" + message.table.title + "\n";
        content += message.table.columns.map((c) => c.label).join(" | ") + "\n";
        content += message.table.rows
          .map((r) => message.table?.columns.map((c) => String(r[c.key] ?? "")).join(" | "))
          .join("\n");
      }
      void navigator.clipboard.writeText(content);
      toast.success("Contenido copiado al portapapeles.");
    } catch {
      toast.error("No se pudo copiar el contenido.");
    }
  };

  const handleExportCsv = () => {
    try {
      if (!message.table) return;
      const headers = message.table.columns.map((c) => `"${c.label}"`).join(",");
      const dataRows = message.table.rows
        .map((row) =>
          message.table?.columns
            .map((c) => `"${String(row[c.key] ?? "").replaceAll('"', '""')}"`)
            .join(","),
        )
        .join("\r\n");
      const csv = `${headers}\r\n${dataRows}`;
      const url = URL.createObjectURL(
        new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `reporte-bi-${Date.now()}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Reporte CSV exportado exitosamente.");
    } catch {
      toast.error("Error al exportar CSV.");
    }
  };

  if (isUser) {
    return (
      <article className="flex items-start justify-end gap-3" aria-label="Mensaje del usuario">
        <div className="max-w-xl rounded-2xl bg-[#0f68ea] px-4 py-3 text-white shadow-xs">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
          <p className="mt-1.5 text-right text-[11px] text-blue-100">{message.time}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-[#e5e6e8]">
          <UserRound className="h-5 w-5" />
        </div>
      </article>
    );
  }

  return (
    <article
      className="flex items-start gap-3.5 rounded-2xl border border-[#e5e6e8] bg-white p-4 shadow-xs"
      aria-label="Respuesta del Asistente"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f68ea] text-white shadow-xs">
        <Bot className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e6e8] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1d1d1f]">Asistente de Reportería IA</span>
            {message.mode === "bi" && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#0f68ea] border border-blue-200/60">
                Dashboard BI
              </span>
            )}
            {message.scope && (
              <span className="text-[11px] text-muted-foreground">· {message.scope}</span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">{message.time}</span>
        </div>

        {/* Narrative text */}
        <p className="text-sm leading-relaxed text-[#1d1d1f] whitespace-pre-wrap">{message.text}</p>

        {/* KPI Tiles Grid */}
        {message.kpis && message.kpis.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 pt-1">
            {message.kpis.map((kpi: KpiTile, idx: number) => (
              <div
                key={idx}
                className="rounded-xl border border-[#e5e6e8] bg-[#f8f9fa] p-3 text-left transition-colors hover:bg-slate-100"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block truncate">
                  {kpi.label}
                </span>
                <span className="mt-1 text-base sm:text-lg font-bold text-[#1d1d1f] block tracking-tight">
                  {kpi.value}
                </span>
                {kpi.hint && (
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    {kpi.status === "warning" ? (
                      <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    )}
                    <span className="truncate">{kpi.hint}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Table */}
        {message.table && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f]">
                <TableIcon className="h-3.5 w-3.5 text-[#0f68ea]" />
                {message.table.title}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {message.table.rows.length} registros analizados
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#e5e6e8]">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e5e6e8] bg-[#f8f9fa]">
                    {message.table.columns.map((col) => (
                      <th
                        key={col.key}
                        className={`px-3 py-2 font-semibold text-muted-foreground ${
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                              ? "text-center"
                              : "text-left"
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e6e8] bg-white">
                  {message.table.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50/80 transition-colors">
                      {message.table?.columns.map((col) => {
                        const val = row[col.key];
                        const isStatusCol = col.key === "status" || col.key === "estado";

                        if (isStatusCol) {
                          const str = String(val);
                          const isWarning = str.includes("límite") || str.includes("warning");
                          return (
                            <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  isWarning
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {str}
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={col.key}
                            className={`px-3 py-2 whitespace-nowrap text-[#1d1d1f] ${
                              col.align === "right"
                                ? "text-right font-medium"
                                : col.align === "center"
                                  ? "text-center"
                                  : "text-left"
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#e5e6e8]/80">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyText}
            className="h-7 text-xs text-muted-foreground hover:text-[#1d1d1f] hover:bg-slate-100 px-2"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copiar
          </Button>

          {message.table && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleExportCsv}
              className="h-7 text-xs text-[#0f68ea] hover:text-blue-700 hover:bg-blue-50 px-2"
            >
              <Download className="h-3 w-3 mr-1" />
              Exportar CSV
            </Button>
          )}

          {onSaveAsReport && message.table && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSaveAsReport(message)}
              className="h-7 text-xs text-muted-foreground hover:text-[#1d1d1f] hover:bg-slate-100 px-2"
            >
              <BookmarkPlus className="h-3 w-3 mr-1" />
              Guardar Reporte
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
