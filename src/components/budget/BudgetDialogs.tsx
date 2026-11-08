import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BUDGET_AREAS,
  PROJECTS,
  calculateAvailableBalance,
  formatCurrency,
  validateAdjustment,
  type BudgetLine,
} from "@/config/erpConfig";
import { useErp } from "@/context/ErpContext";

const selectClass =
  "flex h-11 w-full rounded-[18px] border border-input bg-background px-4 text-sm focus:border-primary focus:outline-none";
const dialogClass = "rounded-[28.8px] border-border p-7 shadow-soft sm:max-w-lg";

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-xs font-medium text-destructive">{message}</p> : null;
}

/* ---------- Create budget line (RF-01 / RF-02) ---------- */

const budgetLineSchema = z.object({
  code: z.string().trim().min(3, "Mínimo 3 caracteres").max(20, "Máximo 20 caracteres"),
  name: z.string().trim().min(5, "Describe la partida (mín. 5 caracteres)").max(120),
  projectId: z.enum(["paris", "sagaleta"]),
  area: z.enum(BUDGET_AREAS),
  phaseId: z.string(),
  approved: z.coerce.number({ invalid_type_error: "Ingresa un monto" }).positive("El monto debe ser mayor a cero").max(100_000_000),
});
type BudgetLineFormValues = z.infer<typeof budgetLineSchema>;

export function CreateBudgetLineDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { createBudgetLine, phases } = useErp();
  const form = useForm<BudgetLineFormValues>({
    resolver: zodResolver(budgetLineSchema),
    defaultValues: { code: "", name: "", projectId: "paris", area: "Proyectos y Obras", phaseId: "", approved: 0 },
  });
  const selectedProjectId = form.watch("projectId");
  const projectPhases = phases.filter((phase) => phase.projectId === selectedProjectId);

  const handleBudgetLineSubmit = (values: BudgetLineFormValues) => {
    try {
      createBudgetLine({ ...values, phaseId: values.phaseId || null });
      toast.success(`Partida ${values.code} creada`);
      form.reset();
      setIsOpen(false);
    } catch (creationError) {
      toast.error(creationError instanceof Error ? creationError.message : "No se pudo crear la partida");
    }
  };

  const { errors } = form.formState;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button><Plus /> Nueva partida</Button>
      </DialogTrigger>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Nueva partida presupuestaria</DialogTitle>
          <DialogDescription>Se crea con saldo comprometido y ejecutado en cero.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleBudgetLineSubmit)} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="line-code">Código</Label>
              <Input id="line-code" placeholder="PAR-OBR-004" className="h-11" {...form.register("code")} />
              <FieldError message={errors.code?.message} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="line-approved">Monto aprobado (US$)</Label>
              <Input id="line-approved" type="number" step="100" className="h-11" {...form.register("approved")} />
              <FieldError message={errors.approved?.message} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="line-name">Descripción</Label>
            <Input id="line-name" placeholder="Iluminación de áreas comunes" className="h-11" {...form.register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="line-project">Proyecto</Label>
              <select id="line-project" className={selectClass} {...form.register("projectId", { onChange: () => form.setValue("phaseId", "") })}>
                {PROJECTS.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="line-area">Área</Label>
              <select id="line-area" className={selectClass} {...form.register("area")}>
                {BUDGET_AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="line-phase">Fase de obra (opcional)</Label>
            <select id="line-phase" className={selectClass} {...form.register("phaseId")}>
              <option value="">Sin fase asociada</option>
              {projectPhases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}
            </select>
          </div>
          <Button type="submit" size="lg" className="mt-2">Crear partida</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Register adjustment (RF-05 / RF-06) ---------- */

const adjustmentSchema = z.object({
  adjustmentType: z.enum(["Incremento", "Reducción"]),
  amount: z.coerce.number({ invalid_type_error: "Ingresa un monto" }).positive("El monto debe ser mayor a cero"),
  reason: z.string().trim().min(10, "Justifica el ajuste (mín. 10 caracteres)").max(300),
});
type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

export function RegisterAdjustmentDialog({ budgetLine }: { budgetLine: BudgetLine }) {
  const [isOpen, setIsOpen] = useState(false);
  const { registerAdjustment } = useErp();
  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(
      adjustmentSchema.superRefine((values, refinementContext) => {
        const validationError = validateAdjustment(budgetLine, values.adjustmentType, values.amount);
        if (validationError) refinementContext.addIssue({ code: z.ZodIssueCode.custom, path: ["amount"], message: validationError });
      }),
    ),
    defaultValues: { adjustmentType: "Incremento", amount: 0, reason: "" },
  });
  const { errors } = form.formState;

  const handleAdjustmentSubmit = (values: AdjustmentFormValues) => {
    try {
      registerAdjustment({ budgetLineId: budgetLine.id, ...values });
      toast.success(`Ajuste registrado en ${budgetLine.code}`);
      form.reset();
      setIsOpen(false);
    } catch (adjustmentError) {
      toast.error(adjustmentError instanceof Error ? adjustmentError.message : "No se pudo registrar el ajuste");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><SlidersHorizontal /> Ajustar</Button>
      </DialogTrigger>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Ajuste presupuestario</DialogTitle>
          <DialogDescription>{budgetLine.code} · {budgetLine.name}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 rounded-[18px] bg-secondary p-4 text-sm">
          <div><p className="text-muted-foreground">Aprobado</p><p className="font-semibold">{formatCurrency(budgetLine.approved)}</p></div>
          <div><p className="text-muted-foreground">Disponible</p><p className="font-semibold">{formatCurrency(calculateAvailableBalance(budgetLine))}</p></div>
        </div>
        <form onSubmit={form.handleSubmit(handleAdjustmentSubmit)} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="adjustment-type">Tipo</Label>
              <select id="adjustment-type" className={selectClass} {...form.register("adjustmentType")}>
                <option value="Incremento">Incremento</option>
                <option value="Reducción">Reducción</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adjustment-amount">Monto (US$)</Label>
              <Input id="adjustment-amount" type="number" step="100" className="h-11" {...form.register("amount")} />
            </div>
          </div>
          <FieldError message={errors.amount?.message} />
          <div className="grid gap-1.5">
            <Label htmlFor="adjustment-reason">Justificación</Label>
            <Textarea id="adjustment-reason" rows={3} placeholder="Motivo del ajuste y documento de sustento" {...form.register("reason")} />
            <FieldError message={errors.reason?.message} />
          </div>
          <Button type="submit" size="lg">Registrar ajuste</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
