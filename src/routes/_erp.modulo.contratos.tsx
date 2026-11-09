import { createFileRoute } from "@tanstack/react-router";
import { FileSignature, Plus, Trash2 } from "lucide-react";
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
import { PROJECTS, SEED_PHASES, formatCurrency, type ProjectId } from "@/config/erpConfig";
import { MILESTONE_STATUS_LABELS, validateMilestoneSplit } from "@/config/phase2Config";
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

  return (
    <div className="phase2-view">
      <PageHeader
        title="Contratos de Obras Tercerizadas"
        description="Contratos con constructoras y consultores externos. La empresa no compra materiales: solo servicios y avances por hitos."
        actions={
          <Button
            variant="default"
            className="rounded-full"
            onClick={() => setIsFormOpen((previous) => !previous)}
          >
            <Plus /> {isFormOpen ? "Cerrar formulario" : "Nuevo contrato"}
          </Button>
        }
      />

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

      <section className="space-y-4">
        {contracts.map((contract) => {
          const project = PROJECTS.find((item) => item.id === contract.projectId);
          const line = budgetLines.find((item) => item.id === contract.budgetLineId);
          const validatedAmount = contract.milestones
            .filter((milestone) => milestone.status === "validated")
            .reduce((sum, milestone) => sum + milestone.amount, 0);
          const progressPercent =
            contract.amount > 0 ? Math.round((validatedAmount / contract.amount) * 100) : 0;
          return (
            <article key={contract.id} className="surface-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {contract.code} · {project?.name} · {line?.code}
                  </p>
                  <h3 className="mt-1 text-base font-bold tracking-tight">
                    {contract.contractorName}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Vigencia {contract.startDate} → {contract.endDate} · Registrado por{" "}
                    {contract.createdBy}
                  </p>
                </div>
                <span className="text-xl font-bold tracking-tight">
                  {formatCurrency(contract.amount)}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avance validado</span>
                  <span className="font-semibold">
                    {progressPercent}% · {formatCurrency(validatedAmount)}
                  </span>
                </div>
                <Progress value={progressPercent} className="mt-2" />
              </div>

              <div className="mt-4 space-y-2">
                {contract.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">{milestone.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {milestone.percent}% · {formatCurrency(milestone.amount)}
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
                          className="rounded-full"
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
        })}
      </section>
    </div>
  );
}
