import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  SEED_BUDGET_LINES,
  SEED_PHASES,
  findRoleById,
  validateAdjustment,
  type AdjustmentType,
  type BudgetAdjustment,
  type BudgetLine,
  type ErpRole,
  type ProjectFilter,
  type ProjectPhase,
  type RoleId,
} from "@/config/erpConfig";

const STORAGE_KEY = "clearminds-erp-state-v1";

interface PersistedState {
  activeRoleId: RoleId | null;
  projectFilter: ProjectFilter;
  budgetLines: BudgetLine[];
  adjustments: BudgetAdjustment[];
}

export type NewBudgetLineInput = Omit<BudgetLine, "id" | "committed" | "executed">;

export interface NewAdjustmentInput {
  budgetLineId: string;
  adjustmentType: AdjustmentType;
  amount: number;
  reason: string;
}

interface ErpContextValue {
  isHydrated: boolean;
  activeRole: ErpRole | null;
  projectFilter: ProjectFilter;
  budgetLines: BudgetLine[];
  phases: ProjectPhase[];
  adjustments: BudgetAdjustment[];
  signInAsRole: (roleId: RoleId) => void;
  signOut: () => void;
  setProjectFilter: (filter: ProjectFilter) => void;
  createBudgetLine: (input: NewBudgetLineInput) => BudgetLine;
  registerAdjustment: (input: NewAdjustmentInput) => BudgetAdjustment;
}

const ErpContext = createContext<ErpContextValue | null>(null);

const buildInitialState = (): PersistedState => ({
  activeRoleId: null,
  projectFilter: "all",
  budgetLines: SEED_BUDGET_LINES,
  adjustments: [],
});

const generateId = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function ErpProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(buildInitialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      if (storedValue) setState({ ...buildInitialState(), ...(JSON.parse(storedValue) as Partial<PersistedState>) });
    } catch (storageError) {
      console.error("No se pudo leer el estado local del ERP", storageError);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (storageError) {
      console.error("No se pudo guardar el estado local del ERP", storageError);
    }
  }, [state, isHydrated]);

  const signInAsRole = useCallback((roleId: RoleId) => setState((previous) => ({ ...previous, activeRoleId: roleId })), []);
  const signOut = useCallback(() => setState((previous) => ({ ...previous, activeRoleId: null })), []);
  const setProjectFilter = useCallback((filter: ProjectFilter) => setState((previous) => ({ ...previous, projectFilter: filter })), []);

  const activeRole = state.activeRoleId ? findRoleById(state.activeRoleId) ?? null : null;

  const createBudgetLine = useCallback((input: NewBudgetLineInput): BudgetLine => {
    const newLine: BudgetLine = { ...input, id: generateId("bl"), committed: 0, executed: 0 };
    setState((previous) => ({ ...previous, budgetLines: [...previous.budgetLines, newLine] }));
    return newLine;
  }, []);

  const registerAdjustment = useCallback(
    (input: NewAdjustmentInput): BudgetAdjustment => {
      const targetLine = state.budgetLines.find((line) => line.id === input.budgetLineId);
      if (!targetLine) throw new Error("La partida seleccionada no existe.");
      const validationError = validateAdjustment(targetLine, input.adjustmentType, input.amount);
      if (validationError) throw new Error(validationError);

      const signedAmount = input.adjustmentType === "Incremento" ? input.amount : -input.amount;
      const adjustment: BudgetAdjustment = {
        id: generateId("adj"),
        ...input,
        authorName: activeRole?.personName ?? "Sistema",
        createdAt: new Date().toISOString(),
        approvedBefore: targetLine.approved,
        approvedAfter: targetLine.approved + signedAmount,
      };
      setState((previous) => ({
        ...previous,
        budgetLines: previous.budgetLines.map((line) =>
          line.id === input.budgetLineId ? { ...line, approved: line.approved + signedAmount } : line,
        ),
        adjustments: [adjustment, ...previous.adjustments],
      }));
      return adjustment;
    },
    [state.budgetLines, activeRole],
  );

  const contextValue = useMemo<ErpContextValue>(
    () => ({
      isHydrated,
      activeRole,
      projectFilter: state.projectFilter,
      budgetLines: state.budgetLines,
      phases: SEED_PHASES,
      adjustments: state.adjustments,
      signInAsRole,
      signOut,
      setProjectFilter,
      createBudgetLine,
      registerAdjustment,
    }),
    [isHydrated, activeRole, state, signInAsRole, signOut, setProjectFilter, createBudgetLine, registerAdjustment],
  );

  return <ErpContext.Provider value={contextValue}>{children}</ErpContext.Provider>;
}

export function useErp(): ErpContextValue {
  const contextValue = useContext(ErpContext);
  if (!contextValue) throw new Error("useErp debe usarse dentro de ErpProvider");
  return contextValue;
}
