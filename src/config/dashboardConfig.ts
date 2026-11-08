import { calculateAvailableBalance, evaluateBudgetHealth, type BudgetLine, type ProjectFilter } from "@/config/erpConfig";

export interface DashboardAction {
  id: string;
  title: string;
  detail: string;
  priority: number;
  dueLabel: string;
  moduleId?: string;
  isBudget?: boolean;
}

export function buildCriticalActions(budgetLines: BudgetLine[], projectFilter: ProjectFilter): DashboardAction[] {
  const budgetActions: DashboardAction[] = budgetLines
    .filter((line) => (projectFilter === "all" || line.projectId === projectFilter) && evaluateBudgetHealth(line) !== "healthy")
    .map((line) => ({
      id: line.id,
      title: `Revisar ${line.code}`,
      detail: `Saldo disponible: ${new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(calculateAvailableBalance(line))}`,
      priority: evaluateBudgetHealth(line) === "overdrawn" ? 0 : 1,
      dueLabel: evaluateBudgetHealth(line) === "overdrawn" ? "Urgente" : "Hoy",
      isBudget: true,
    }));
  const pendingActions: DashboardAction[] = [
    { id: "approval", title: "Aprobar requerimiento REQ-0142", detail: "Logística · Contratación de servicios", priority: 2, dueLabel: "Hoy", moduleId: "aprobaciones" },
    { id: "valuation", title: "Validar valorización N.º 5", detail: "Proyectos · Agua y Desagüe París", priority: 3, dueLabel: "Mañana", moduleId: "contratos" },
    { id: "reconciliation", title: "Conciliar comprobantes", detail: "Finanzas · Contasis", priority: 4, dueLabel: "12 nov", moduleId: "comprobantes" },
    { id: "post-sales", title: "Responder 7 tickets de posventa", detail: "Posventa · Seguimiento de entregas", priority: 5, dueLabel: "Esta semana", moduleId: "posventa" },
  ].filter((action) => action.id !== "valuation" || projectFilter !== "sagaleta");
  return [...budgetActions, ...pendingActions].sort((firstAction, secondAction) => firstAction.priority - secondAction.priority);
}