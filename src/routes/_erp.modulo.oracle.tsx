import { createFileRoute } from "@tanstack/react-router";
import { Database, RefreshCw } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/phase2/StatusBadge";
import {
  createPhase3Head,
  formatMoney,
  Metric,
  performPrototypeAction,
  ProjectSelector,
} from "@/components/phase3/Phase3Shared";
import { PROJECTS } from "@/config/erpConfig";
import { useErp } from "@/context/ErpContext";
import { usePhase3 } from "@/context/Phase3Context";

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
  const { sales, cases, lastSyncedAt, syncOracle, settleSale } = usePhase3();
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
            <RefreshCw /> Sincronizar Oracle
          </Button>
        }
      />
      <div className="mb-8 flex flex-wrap items-end gap-5">
        <div className="w-64 max-w-full">
          <ProjectSelector value={projectFilter} onChange={setProjectFilter} />
        </div>
        <input
          className="h-10 rounded-[18px] border border-input bg-background px-4 text-sm"
          aria-label="Buscar comprador o lote"
          placeholder="Buscar comprador o lote"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <div className="mb-8 grid gap-6 border-y border-border py-4 sm:grid-cols-3">
        <Metric label="Ventas registradas">{selected.length}</Metric>
        <Metric label="Saldo pendiente">
          {formatMoney(selected.reduce((sum, sale) => sum + sale.balance, 0))}
        </Metric>
        <Metric label="Elegibles para posventa">
          {selected.filter((sale) => sale.balance === 0).length}
        </Metric>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Database className="h-5 w-5" />
        <span>Oracle · Origen externo simulado</span>
        <span>
          {lastSyncedAt
            ? `Última sincronización: ${new Date(lastSyncedAt).toLocaleString("es-EC")}`
            : "Carga inicial de ejemplo"}
        </span>
      </div>
      <div className="space-y-4">
        {selected.map((sale) => (
          <article className="surface-card" key={sale.id}>
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h2 className="font-bold">{sale.buyerName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {PROJECTS.find((project) => project.id === sale.projectId)?.name} · Lote{" "}
                  {sale.lot}
                </p>
              </div>
              <StatusBadge tone={sale.balance === 0 ? "complete" : "yellow"}>
                {sale.balance === 0 ? "Elegible · Saldo cero" : "En cobranza - No elegibles"}
              </StatusBadge>
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Precio de venta</dt>
                <dd className="mt-1 font-semibold">{formatMoney(sale.price)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pagado</dt>
                <dd className="mt-1 font-semibold">{formatMoney(sale.price - sale.balance)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cuotas pagadas</dt>
                <dd className="mt-1 font-semibold">
                  {sale.paidInstallments} / {sale.installments}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Saldo pendiente</dt>
                <dd className="mt-1 font-semibold">{formatMoney(sale.balance)}</dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-border pt-4">
              {sale.balance > 0 ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    performPrototypeAction(
                      () => settleSale(sale.id),
                      "Pago simulado registrado; expediente de posventa creado.",
                    )
                  }
                >
                  Simular cancelación del saldo
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {cases.some((record) => record.saleId === sale.id)
                    ? "Expediente único activo en Posventa"
                    : "Pendiente de sincronización"}
                </p>
              )}
            </div>
          </article>
        ))}
        {selected.length === 0 && (
          <p className="py-10 text-muted-foreground">No se encontraron ventas.</p>
        )}
      </div>
    </div>
  );
}
