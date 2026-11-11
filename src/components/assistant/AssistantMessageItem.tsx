import { Bot, UserRound, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage } from "./types";
import { Button } from "@/components/ui/button";

interface AssistantMessageItemProps {
  message: ChatMessage;
}

export function AssistantMessageItem({ message }: AssistantMessageItemProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const handleCopyText = () => {
    try {
      void navigator.clipboard.writeText(message.text);
      toast.success("Contenido copiado al portapapeles.");
    } catch {
      toast.error("No se pudo copiar el contenido.");
    }
  };

  if (isSystem) {
    return (
      <article
        className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-4 text-red-800 shadow-xs"
        aria-label="Mensaje del sistema"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 border border-red-200">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2 border-b border-red-200/60 pb-1.5">
            <span className="text-xs font-bold text-red-900">Sistema / Error</span>
            <span className="text-[11px] text-red-500">{message.time}</span>
          </div>
          <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
        </div>
      </article>
    );
  }

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

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e6e8] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1d1d1f]">Asistente Gerencial IA</span>
            {message.scope && (
              <span className="text-[11px] text-muted-foreground">· {message.scope}</span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">{message.time}</span>
        </div>

        {/* Narrative text with key metrics */}
        <p className="text-sm leading-relaxed text-[#1d1d1f] whitespace-pre-wrap">{message.text}</p>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#e5e6e8]/80">
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
        </div>
      </div>
    </article>
  );
}
