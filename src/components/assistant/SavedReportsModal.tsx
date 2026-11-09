import { FileText, ArrowRight, Bookmark, Calendar } from "lucide-react";
import type { SavedReport } from "./types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SavedReportsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedReports: SavedReport[];
  onSelectReport: (report: SavedReport) => void;
}

export function SavedReportsModal({
  open,
  onOpenChange,
  savedReports,
  onSelectReport,
}: SavedReportsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[28px] border border-[#e5e6e8] bg-white p-6 shadow-xl">
        <DialogHeader className="pb-4 border-b border-[#e5e6e8]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0f68ea]">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#1d1d1f]">
                Mis Reportes BI Guardados
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Consulte y cargue directamente en el chat sus informes y análisis estratégicos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {savedReports.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No tienes reportes guardados en este momento.
            </div>
          ) : (
            savedReports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#e5e6e8] bg-white p-4 transition-all hover:border-[#0f68ea]/50 hover:shadow-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#0f68ea]">
                      {report.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {report.date}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-[#1d1d1f] flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-[#0f68ea] shrink-0" />
                    {report.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>
                </div>
                <Button
                  onClick={() => {
                    onSelectReport(report);
                    onOpenChange(false);
                  }}
                  className="shrink-0 bg-[#0f68ea] text-white hover:bg-blue-700 rounded-xl text-xs font-medium h-9"
                >
                  Cargar en Chat
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
