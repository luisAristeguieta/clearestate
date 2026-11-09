import {
  Database,
  Wallet,
  TrendingUp,
  Truck,
  ShieldCheck,
  Building2,
  Layers,
  Megaphone,
  ChevronRight,
  Check,
} from "lucide-react";
import type { DatasetCategory, DatasetItem } from "./types";
import { Button } from "@/components/ui/button";

export const AVAILABLE_DATASETS: DatasetItem[] = [
  {
    id: "resumen-partidas",
    category: "Presupuestos",
    name: "Resumen de Partidas y Techos",
    recordCount: "13 partidas activas",
    description: "Presupuesto aprobado, comprometido, ejecutado y saldo disponible.",
    icon: Wallet,
  },
  {
    id: "comprometido-ejecutado",
    category: "Presupuestos",
    name: "Comprometido vs Ejecutado",
    recordCount: "Control $11.5M",
    description: "Desvíos de ejecución frente a compromisos y alertas de sobregiro.",
    icon: TrendingUp,
  },
  {
    id: "ordenes-compra",
    category: "Adquisiciones",
    name: "Órdenes de Compra y Proveedores",
    recordCount: "8 órdenes emitidas",
    description: "Adjudicaciones por concurso cerrado y cuadro comparativo P-08.",
    icon: Truck,
  },
  {
    id: "expedientes-aprobacion",
    category: "Adquisiciones",
    name: "Expedientes de Aprobación",
    recordCount: "5 requerimientos",
    description: "Flujo de firmas de gerencia y aprobaciones con justificación.",
    icon: ShieldCheck,
  },
  {
    id: "contratos-obra",
    category: "Adquisiciones",
    name: "Contratos de Obra Mayor",
    recordCount: "3 contratos / hitos",
    description: "Seguimiento de contratos, pólizas de garantía y avance físico.",
    icon: Building2,
  },
  {
    id: "estado-lotes",
    category: "Posventa",
    name: "Estado de Lotes y Entregas",
    recordCount: "420 lotes en gestión",
    description: "Cuentas con saldo cero, actas de entrega firmadas y preparación.",
    icon: Layers,
  },
  {
    id: "campanas-posventa",
    category: "Posventa",
    name: "Campañas y Comunicaciones",
    recordCount: "2 canales activos",
    description: "Trazabilidad de mensajes masivos vía correo y WhatsApp.",
    icon: Megaphone,
  },
  {
    id: "oracle-sync",
    category: "Oracle",
    name: "Sincronización Oracle Cloud",
    recordCount: "Tablas actualizadas",
    description: "Mapeo de ventas inmobiliarias, recaudos y estados contables.",
    icon: Database,
  },
];

const CATEGORIES: DatasetCategory[] = [
  "Todos",
  "Presupuestos",
  "Adquisiciones",
  "Posventa",
  "Oracle",
];

interface DatasetsSidebarProps {
  selectedCategory: DatasetCategory;
  onSelectCategory: (category: DatasetCategory) => void;
  selectedDatasetIds: Set<string>;
  onToggleDataset: (id: string) => void;
  onToggleAll: (selectAll: boolean) => void;
}

export function DatasetsSidebar({
  selectedCategory,
  onSelectCategory,
  selectedDatasetIds,
  onToggleDataset,
  onToggleAll,
}: DatasetsSidebarProps) {
  const filteredDatasets = AVAILABLE_DATASETS.filter((item) =>
    selectedCategory === "Todos" ? true : item.category === selectedCategory,
  );

  const allFilteredSelected = filteredDatasets.every((item) => selectedDatasetIds.has(item.id));

  return (
    <aside
      className="flex w-full flex-col rounded-[24px] border border-[#e5e6e8] bg-white p-4 shadow-xs md:w-80 lg:w-[340px] shrink-0"
      aria-label="Conjuntos de datos"
    >
      <div className="flex items-center gap-2.5 pb-4 border-b border-[#e5e6e8]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0f68ea]">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1d1d1f]">Conjuntos de Datos</h2>
          <p className="text-xs text-muted-foreground">Fuentes de información del ERP</p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="mt-3 flex flex-wrap gap-1.5 pb-3 border-b border-[#e5e6e8]">
        {CATEGORIES.map((category) => {
          const count =
            category === "Todos"
              ? AVAILABLE_DATASETS.length
              : AVAILABLE_DATASETS.filter((d) => d.category === category).length;
          const isActive = selectedCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#0f68ea] text-white"
                  : "bg-[#f0f2f4] text-[#1d1d1f] hover:bg-slate-200"
              }`}
            >
              {category} ({count})
            </button>
          );
        })}
      </div>

      {/* Subheader with selection control */}
      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
          {selectedCategory.toUpperCase()} ({filteredDatasets.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-[#0f68ea] hover:text-blue-700 hover:bg-blue-50 px-2"
          onClick={() => onToggleAll(!allFilteredSelected)}
        >
          {allFilteredSelected ? "Deseleccionar" : "Seleccionar todo"}
        </Button>
      </div>

      {/* Datasets List */}
      <div className="mt-2.5 space-y-2 overflow-y-auto max-h-[520px] pr-0.5">
        {filteredDatasets.map((dataset) => {
          const Icon = dataset.icon;
          const isSelected = selectedDatasetIds.has(dataset.id);

          return (
            <div
              key={dataset.id}
              role="button"
              tabIndex={0}
              onClick={() => onToggleDataset(dataset.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggleDataset(dataset.id);
                }
              }}
              className={`group flex items-center justify-between gap-2.5 rounded-2xl border p-2.5 transition-all text-left cursor-pointer ${
                isSelected
                  ? "border-[#0f68ea]/40 bg-blue-50/40"
                  : "border-[#e5e6e8] bg-white hover:bg-[#f0f2f4]/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                    isSelected
                      ? "border-[#0f68ea] bg-[#0f68ea] text-white"
                      : "border-[#e5e6e8] bg-white text-muted-foreground group-hover:border-slate-300"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#1d1d1f]">{dataset.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {dataset.recordCount}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
          );
        })}
      </div>
    </aside>
  );
}
