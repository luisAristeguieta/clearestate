import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Database, RefreshCw, Search, X } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/phase2/StatusBadge";
import {
  createPhase3Head,
  formatMoney,
  Metric,
  performPrototypeAction,
  ProjectSelector,
} from "@/components/phase3/Phase3Shared";
import { Button } from "@/components/ui/button";
import { PROJECTS } from "@/config/erpConfig";
import { useErp } from "@/context/ErpContext";
import { usePhase3 } from "@/context/Phase3Context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_erp/modulo/oracle")({
  head: () =>
    createPhase3Head(
      "/modulo/oracle",
      "Estado de cuenta Oracle simulado y activación de expedientes de posventa por proyecto.",
    ),
  component: OraclePage,
});

function OraclePage() {
  const { projectFilter, setProjectFilter } = useErp();
  const { sales, lastSyncedAt, syncOracle, settleSale } = usePhase3();
  const [search, setSearch] = useState("");

  const selected = sales.filter(
    (sale) =>
      (projectFilter === "all" || sale.projectId === projectFilter) &&
      `${sale.buyerName} ${sale.lot}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="phase2-view">
      <PageHeader
        title="Origen Oracle"
        description="Estado de cuenta · Entorno simulado · USD"
        actions={
          <Button
            onClick={() =>
              performPrototypeAction(
                syncOracle,
                "Sincronización completada sin duplicar expedientes.",
              )
            }
          >
            <RefreshCw className="mr-1.5 h-4 w-4" /> Sincronizar Oracle
          </Button>
        }
      />

      {/* Filtros superiores: Selector de Proyecto y Buscador Rápido */}
      <div className="mb-8 flex flex-wrap items-end gap-5">
        <div className="w-64 max-w-full">
          <ProjectSelector value={projectFilter} onChange={setProjectFilter} />
        </div>
        <div className="relative min-w-[240px] sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-[18px] border border-input bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Buscar comprador o lote"
            placeholder="Buscar comprador o lote..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPIs Ejecutivos de Ventas Oracle */}
      <div className="mb-8 grid gap-6 border-y border-border py-4 sm:grid-cols-3">
        <Metric label="Ventas registradas">{selected.length}</Metric>
        <Metric label="Saldo pendiente">
          {formatMoney(selected.reduce((sum, sale) => sum + sale.balance, 0))}
        </Metric>
        <Metric label="Elegibles para posventa">
          {selected.filter((sale) => sale.balance === 0).length}
        </Metric>
      </div>

      {/* Subtítulo de Auditoría y Estado de Sincronización */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">Oracle · Origen externo simulado</span>
          <span>·</span>
          <span>
            {lastSyncedAt
              ? `Última sincronización: ${new Date(lastSyncedAt).toLocaleString("es-EC")}`
              : "Carga inicial de ejemplo"}
          </span>
        </div>
        <span>
          Mostrando <strong className="text-foreground">{selected.length}</strong> de {sales.length}{" "}
          clientes
        </span>
      </div>

      {/* Listado Compacto y Resumido de Clientes (Tabla Corporativa de Alta Densidad) */}
      <div className="surface-card overflow-hidden border border-border p-0 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-border bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3.5 pl-6 pr-4">Cliente</th>
                <th className="py-3.5 pr-4">Proyecto y Lote</th>
                <th className="py-3.5 pr-4 text-right">Precio de Venta</th>
                <th className="py-3.5 pr-4 text-center">Cuotas Pagadas</th>
                <th className="py-3.5 pr-4 text-right">Saldo Pendiente</th>
                <th className="py-3.5 pr-4 text-center">Elegibilidad</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {selected.map((sale) => {
                const project = PROJECTS.find((p) => p.id === sale.projectId);
                const isEligible = sale.balance === 0;
                return (
                  <tr key={sale.id} className="transition-colors hover:bg-secondary/30">
                    {/* Cliente */}
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">
                          {sale.buyerName.charAt(0)}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{sale.buyerName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {sale.id.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Proyecto y Lote */}
                    <td className="py-4 pr-4">
                      <p className="font-medium text-foreground">
                        {project?.name || sale.projectId}
                      </p>
                      <p className="text-xs text-muted-foreground">Lote {sale.lot}</p>
                    </td>

                    {/* Precio de Venta */}
                    <td className="py-4 pr-4 text-right font-medium tabular-nums text-foreground">
                      {formatMoney(sale.price)}
                    </td>

                    {/* Cuotas Pagadas */}
                    <td className="py-4 pr-4 text-center tabular-nums">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          sale.paidInstallments === sale.installments
                            ? "border border-emerald-200/60 bg-emerald-50 text-emerald-700"
                            : "bg-secondary text-foreground",
                        )}
                      >
                        {sale.paidInstallments} / {sale.installments}
                      </span>
                    </td>

                    {/* Saldo Pendiente */}
                    <td className="py-4 pr-4 text-right font-bold tabular-nums">
                      <span
                        className={
                          isEligible ? "font-extrabold text-emerald-600" : "text-foreground"
                        }
                      >
                        {formatMoney(sale.balance)}
                      </span>
                    </td>

                    {/* Elegibilidad */}
                    <td className="py-4 pr-4 text-center">
                      <StatusBadge tone={isEligible ? "complete" : "yellow"}>
                        {isEligible ? "Elegible · Saldo cero" : "En cobranza"}
                      </StatusBadge>
                    </td>

                    {/* Acciones */}
                    <td className="py-4 pl-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isEligible && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
                            title="Simular cancelación del saldo"
                            onClick={() =>
                              performPrototypeAction(
                                () => settleSale(sale.id),
                                "Pago simulado registrado; expediente de posventa creado.",
                              )
                            }
                          >
                            Pagar saldo
                          </Button>
                        )}
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full px-3 text-xs font-semibold text-primary hover:border-primary/40 hover:bg-primary/5"
                        >
                          <Link
                            to="/modulo/posventa/comprador/$saleId"
                            params={{ saleId: sale.id }}
                          >
                            <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                            Ver en Posventa
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {selected.length === 0 && (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No se encontraron ventas para los criterios seleccionados.
          </div>
        )}
      </div>
    </div>
  );
}
