import { createFileRoute } from "@tanstack/react-router";
import {
  FileSignature,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/phase2/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getViewTitle } from "@/config/brandConfig";
import {
  PROJECTS,
  SEED_PHASES,
  formatCurrency,
  type ProjectFilter,
  type ProjectId,
} from "@/config/erpConfig";
import {
  MILESTONE_STATUS_LABELS,
  validateMilestoneSplit,
  type WorkContract,
} from "@/config/phase2Config";
import { useErp } from "@/context/ErpContext";

export const Route = createFileRoute("/_erp/modulo/contratos")({
  head: () => ({
    meta: [
      { title: getViewTitle("/modulo/contratos") },
      {
        name: "description",
        content:
          "Contratos de obras tercerizadas con hitos de avance y valorizaciones que afectan el presupuesto.",
      },
      { property: "og:title", content: getViewTitle("/modulo/contratos") },
      {
        property: "og:description",
        content: "Contratos con constructoras externas, hitos y valorizaciones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContractsPage,
});

interface MilestoneDraft {
  name: string;
  percent: string;
  amount: string;
}

const EMPTY_MILESTONE: MilestoneDraft = { name: "", percent: "", amount: "" };

type ContractStatusFilter = "all" | "active" | "completed";

function ContractsPage() {
  const { budgetLines, contracts, createContract, validateMilestone } = useErp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [contractorName, setContractorName] = useState("");
  const [projectId, setProjectId] = useState<ProjectId>("paris");
  const [phaseId, setPhaseId] = useState<string>("none");
  const [budgetLineId, setBudgetLineId] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([{ ...EMPTY_MILESTONE }]);

  // Advanced Filters State
  const [statusFilter, setStatusFilter] = useState<ContractStatusFilter>("all");
  const [selectedProject, setSelectedProject] = useState<ProjectFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const projectPhases = useMemo(
    () => SEED_PHASES.filter((phase) => phase.projectId === projectId),
    [projectId],
  );
  const projectLines = useMemo(
    () =>
      budgetLines.filter(
        (line) => line.projectId === projectId && line.area === "Proyectos y Obras",
      ),
    [budgetLines, projectId],
  );

  const calculateContractProgress = (contract: WorkContract) => {
    const validatedAmount = contract.milestones
      .filter((milestone) => milestone.status === "validated")
      .reduce((sum, milestone) => sum + milestone.amount, 0);
    const progressPercent =
      contract.amount > 0 ? Math.round((validatedAmount / contract.amount) * 100) : 0;
    const isCompleted = progressPercent >= 100;
    return { validatedAmount, progressPercent, isCompleted };
  };

  const handleUpdateMilestone = (index: number, patch: Partial<MilestoneDraft>) => {
    setMilestones((previous) =>
      previous.map((milestone, position) =>
        position === index ? { ...milestone, ...patch } : milestone,
      ),
    );
  };

  const handleContractSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const parsedAmount = Number(amount) || 0;
      const parsedMilestones = milestones.map((milestone) => ({
        name: milestone.name.trim(),
        percent: Number(milestone.percent) || 0,
        amount: Number(milestone.amount) || 0,
      }));
      const splitError = validateMilestoneSplit(parsedAmount, parsedMilestones);
      if (splitError) throw new Error(splitError);
      const contract = createContract({
        contractorName: contractorName.trim(),
        projectId,
        phaseId: phaseId === "none" ? null : phaseId,
        budgetLineId,
        amount: parsedAmount,
        startDate,
        endDate,
        milestones: parsedMilestones,
      });
      toast.success(`${contract.code} registrado. El comprometido de la partida se actualizó.`);
      setIsFormOpen(false);
      setContractorName("");
      setAmount("");
      setStartDate("");
      setEndDate("");
      setMilestones([{ ...EMPTY_MILESTONE }]);
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "No se pudo registrar el contrato.",
      );
    }
  };

  const handleValidateMilestone = (
    contractId: string,
    milestoneId: string,
    milestoneName: string,
  ) => {
    try {
      validateMilestone(contractId, milestoneId);
      toast.success(
        `Valorización de "${milestoneName}" validada: pasó de Comprometido a Ejecutado.`,
      );
    } catch (validateError) {
      toast.error(
        validateError instanceof Error ? validateError.message : "No se pudo validar el hito.",
      );
    }
  };

  // Filter calculations
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const { isCompleted } = calculateContractProgress(contract);

      // Status filter
      if (statusFilter === "active" && isCompleted) return false;
      if (statusFilter === "completed" && !isCompleted) return false;

      // Project filter
      if (selectedProject !== "all" && contract.projectId !== selectedProject) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesContractor = contract.contractorName.toLowerCase().includes(query);
        const matchesCode = contract.code.toLowerCase().includes(query);
        const matchesMilestone = contract.milestones.some((m) =>
          m.name.toLowerCase().includes(query),
        );
        if (!matchesContractor && !matchesCode && !matchesMilestone) return false;
      }

      return true;
    });
  }, [contracts, statusFilter, selectedProject, searchQuery]);

  const activeContractsCount = useMemo(
    () => contracts.filter((c) => !calculateContractProgress(c).isCompleted).length,
    [contracts],
  );
  const completedContractsCount = useMemo(
    () => contracts.filter((c) => calculateContractProgress(c).isCompleted).length,
    [contracts],
  );

  const totalContractedAmount = useMemo(
    () => contracts.reduce((sum, c) => sum + c.amount, 0),
    [contracts],
  );
  const totalValidatedAmount = useMemo(
    () =>
      contracts.reduce(
        (sum, c) =>
          sum +
          c.milestones
            .filter((m) => m.status === "validated")
            .reduce((mSum, m) => mSum + m.amount, 0),
        0,
      ),
    [contracts],
  );

  return (
    <div className="phase2-view space-y-6">
      <PageHeader
        title="Contratos de Obras Tercerizadas"
        description="Contratos con constructoras y consultores externos. La empresa no compra materiales: solo servicios y avances por hitos."
        actions={
          <Button
            variant="default"
            className="rounded-full bg-[#0f68ea] hover:bg-blue-700 text-white shadow-xs font-semibold text-xs px-5"
            onClick={() => setIsFormOpen((previous) => !previous)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {isFormOpen ? "Cerrar formulario" : "Nuevo contrato"}
          </Button>
        }
      />

      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#e5e6e8] bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Contratado
          </p>
          <p className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f]">
            {formatCurrency(totalContractedAmount)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e6e8] bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Avance Validado
          </p>
          <p className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-[#0f68ea]">
            {formatCurrency(totalValidatedAmount)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e6e8] bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            En Ejecución
          </p>
          <p className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f] flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#0f68ea]" />
            {activeContractsCount} contratos
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e6e8] bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Finalizados 100%
          </p>
          <p className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {completedContractsCount} contratos
          </p>
        </div>
      </div>

      {isFormOpen && (
        <form onSubmit={handleContractSubmit} className="surface-card mb-6 space-y-5 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
              <FileSignature className="h-5 w-5 text-foreground" />
            </span>
            <h2 className="text-lg font-bold tracking-tight">Registrar contrato de obra</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ctr-name">Contratista / consultor</Label>
              <Input
                id="ctr-name"
                required
                maxLength={120}
                value={contractorName}
                onChange={(event) => setContractorName(event.target.value)}
                placeholder="Constructora Andes S.A."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctr-amount">Monto del contrato (USD)</Label>
              <Input
                id="ctr-amount"
                required
                type="number"
                min={1}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Proyecto</Label>
              <Select
                value={projectId}
                onValueChange={(value) => {
                  setProjectId(value as ProjectId);
                  setPhaseId("none");
                  setBudgetLineId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECTS.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fase de obra</Label>
              <Select value={phaseId} onValueChange={setPhaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin fase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin fase asociada</SelectItem>
                  {projectPhases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Partida presupuestaria</Label>
              <Select value={budgetLineId} onValueChange={setBudgetLineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la partida" />
                </SelectTrigger>
                <SelectContent>
                  {projectLines.map((line) => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.code} · {line.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ctr-start">Inicio</Label>
                <Input
                  id="ctr-start"
                  required
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctr-end">Fin</Label>
                <Input
                  id="ctr-end"
                  required
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Label>Hitos de avance (la suma debe igualar el monto)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setMilestones((previous) => [...previous, { ...EMPTY_MILESTONE }])}
              >
                <Plus /> Añadir hito
              </Button>
            </div>
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="grid gap-3 border-t border-border py-4 lg:grid-cols-[minmax(0,1fr)_100px_140px_auto]"
              >
                <Input
                  required
                  maxLength={120}
                  value={milestone.name}
                  onChange={(event) => handleUpdateMilestone(index, { name: event.target.value })}
                  placeholder="Nombre del hito"
                />
                <Input
                  required
                  type="number"
                  min={1}
                  max={100}
                  value={milestone.percent}
                  onChange={(event) =>
                    handleUpdateMilestone(index, { percent: event.target.value })
                  }
                  placeholder="%"
                />
                <Input
                  required
                  type="number"
                  min={1}
                  step="0.01"
                  value={milestone.amount}
                  onChange={(event) => handleUpdateMilestone(index, { amount: event.target.value })}
                  placeholder="Monto"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Eliminar hito"
                  title="Eliminar hito"
                  disabled={milestones.length === 1}
                  onClick={() =>
                    setMilestones((previous) =>
                      previous.filter((_, position) => position !== index),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="submit" variant="default" className="rounded-full">
            Registrar contrato
          </Button>
        </form>
      )}

      {/* Barra de Filtros Avanzados (Propuesta 1) */}
      <section className="rounded-[24px] border border-[#e5e6e8] bg-white p-4 shadow-xs space-y-4">
        {/* Pestañas de estado superior */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e6e8] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "all"
                  ? "bg-[#0f68ea] text-white shadow-xs"
                  : "bg-[#f0f2f4] text-[#1d1d1f] hover:bg-slate-200"
              }`}
            >
              Todos ({contracts.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "active"
                  ? "bg-[#0f68ea] text-white shadow-xs"
                  : "bg-[#f0f2f4] text-[#1d1d1f] hover:bg-slate-200"
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>En ejecución ({activeContractsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "completed"
                  ? "bg-[#0f68ea] text-white shadow-xs"
                  : "bg-[#f0f2f4] text-[#1d1d1f] hover:bg-slate-200"
              }`}
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>Finalizados 100% ({completedContractsCount})</span>
            </button>
          </div>

          <span className="text-xs text-muted-foreground">
            Mostrando {filteredContracts.length} de {contracts.length} contratos
          </span>
        </div>

        {/* Buscador libre y selector rápido de proyecto */}
        <div className="grid gap-3 sm:grid-cols-[1fr_240px_auto] items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por contratista, código CTR o hito..."
              className="pl-9 h-9 rounded-xl text-xs border-[#e5e6e8]"
            />
          </div>

          <div>
            <Select
              value={selectedProject}
              onValueChange={(val) => setSelectedProject(val as ProjectFilter)}
            >
              <SelectTrigger className="h-9 rounded-xl text-xs border-[#e5e6e8] bg-[#f8f9fa]">
                <SelectValue placeholder="Filtrar por proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {PROJECTS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== "all" || selectedProject !== "all" || searchQuery.trim()) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setSelectedProject("all");
                setSearchQuery("");
              }}
              className="h-9 rounded-xl text-xs text-muted-foreground hover:text-[#1d1d1f]"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Limpiar filtros
            </Button>
          )}
        </div>
      </section>

      {/* Listado de Contratos Filtrados */}
      <section className="space-y-4">
        {filteredContracts.length === 0 ? (
          <div className="surface-card p-12 text-center text-muted-foreground text-sm space-y-2">
            <Building2 className="h-10 w-10 mx-auto text-slate-400" />
            <p className="font-semibold text-[#1d1d1f]">
              No se encontraron contratos con los filtros aplicados.
            </p>
            <p className="text-xs">
              Prueba modificando el buscador, el estado o el proyecto seleccionado.
            </p>
          </div>
        ) : (
          filteredContracts.map((contract) => {
            const project = PROJECTS.find((item) => item.id === contract.projectId);
            const line = budgetLines.find((item) => item.id === contract.budgetLineId);
            const { validatedAmount, progressPercent, isCompleted } =
              calculateContractProgress(contract);

            return (
              <article
                key={contract.id}
                className="rounded-[24px] border border-[#e5e6e8] bg-white p-6 shadow-xs space-y-4 transition-all hover:border-[#0f68ea]/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="pill-badge bg-secondary font-semibold text-primary text-xs">
                        {contract.code}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {project?.name} · {line?.code}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                          isCompleted
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-[#0f68ea] border-blue-200"
                        }`}
                      >
                        {isCompleted ? "Finalizado 100%" : "En ejecución"}
                      </span>
                    </div>

                    <h3 className="mt-1.5 text-base sm:text-lg font-bold tracking-tight text-[#1d1d1f]">
                      {contract.contractorName}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Vigencia {contract.startDate} → {contract.endDate} · Registrado por{" "}
                      {contract.createdBy}
                    </p>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f]">
                    {formatCurrency(contract.amount)}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#f8f9fa] border border-[#e5e6e8] p-4">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground font-medium">
                      Avance físico validado:
                    </span>
                    <span className="font-bold text-[#1d1d1f]">
                      {progressPercent}% · {formatCurrency(validatedAmount)}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="mt-2.5 h-2.5" />
                </div>

                <div className="space-y-2 pt-2 border-t border-[#e5e6e8]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Hitos de obra y valorizaciones:
                  </p>
                  {contract.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e6e8]/80 py-3 last:border-0"
                    >
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-[#1d1d1f]">
                          {milestone.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {milestone.percent}% del contrato · {formatCurrency(milestone.amount)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          tone={
                            milestone.status === "validated"
                              ? "complete"
                              : milestone.status === "billed"
                                ? "yellow"
                                : "neutral"
                          }
                        >
                          {MILESTONE_STATUS_LABELS[milestone.status]}
                        </StatusBadge>
                        {milestone.status !== "validated" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs h-7 px-3 text-[#0f68ea] hover:bg-blue-50"
                            onClick={() =>
                              handleValidateMilestone(contract.id, milestone.id, milestone.name)
                            }
                          >
                            Validar valorización
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
