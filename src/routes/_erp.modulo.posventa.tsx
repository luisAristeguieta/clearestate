import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Search } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/phase2/StatusBadge";
import { createPhase3Head, ProjectSelector } from "@/components/phase3/Phase3Shared";
import { PROJECTS } from "@/config/erpConfig";
import { useErp } from "@/context/ErpContext";
import { usePhase3 } from "@/context/Phase3Context";
export const Route = createFileRoute("/_erp/modulo/posventa")({ head: () => createPhase3Head("/modulo/posventa", "Expedientes únicos de compradores con saldo Oracle cero y seguimiento de entrega de lotes."), component: AfterSalesPage });
function AfterSalesPage() {
  const { cases, sales } = usePhase3(); const { projectFilter, setProjectFilter } = useErp(); const [search, setSearch] = useState("");
  const selected = cases.filter((record) => { const sale = sales.find((item) => item.id === record.saleId); return sale && (projectFilter === "all" || sale.projectId === projectFilter) && `${sale.buyerName} ${sale.lot}`.toLowerCase().includes(search.toLowerCase()); });
  return <div className="phase2-view"><PageHeader title="Bandeja Posventa" description={`${selected.length} expedientes · Compradores con saldo cero`} /><div className="mb-8 grid gap-4 sm:grid-cols-2"><ProjectSelector value={projectFilter} onChange={setProjectFilter} /><div className="flex items-end gap-3"><Search className="mb-2 h-5 w-5" /><Input aria-label="Buscar expediente" placeholder="Nombre del comprador o lote" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div><div className="grid gap-6 lg:grid-cols-2">{selected.map((record) => { const sale = sales.find((item) => item.id === record.saleId); const project = PROJECTS.find((item) => item.id === sale?.projectId); if (!sale || !project) return null; return <article key={record.id} className="surface-card overflow-hidden"><img src={project.imageUrl} alt={project.name} className="mb-5 aspect-[3/1] w-full rounded-[18px] object-cover" /><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-bold">{sale.buyerName}</h2><p className="mt-1 text-sm text-muted-foreground">{project.name} · Lote {sale.lot}</p></div><StatusBadge tone={record.status === "delivered" ? "complete" : "yellow"}>{record.status === "delivered" ? "Entregado" : record.status === "ready" ? "Listo para entrega" : "En preparación"}</StatusBadge></div><p className="mt-5 text-sm text-muted-foreground">Entrega estimada: {record.estimatedDelivery}</p><Button asChild variant="outline" className="mt-5"><Link to="/modulo/posventa/comprador/$saleId" params={{ saleId: sale.id }}>Abrir ficha <ArrowUpRight /></Link></Button></article>; })}</div>{selected.length === 0 && <p className="py-10 text-muted-foreground">No hay expedientes para esta búsqueda.</p>}</div>;
}