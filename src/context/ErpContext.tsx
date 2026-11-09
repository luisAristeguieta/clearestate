import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
import {
  SEED_CONTRACTS,
  SEED_INVITATIONS,
  SEED_INVOICES,
  SEED_PURCHASE_ORDERS,
  SEED_REQUISITIONS,
  applyCommitment,
  applyExecution,
  calculateInvoiceTotals,
  validateRequisition,
  type ContractMilestone,
  type ExpenseInvoice,
  type PurchaseOrder,
  type Requisition,
  type SupplierInvitation,
  type SupplierOffer,
  type TimelineEvent,
  type WorkContract,
} from "@/config/phase2Config";

const STORAGE_KEY = "clearminds-erp-state-v1";

interface PersistedState {
  activeRoleId: RoleId | null;
  projectFilter: ProjectFilter;
  budgetLines: BudgetLine[];
  adjustments: BudgetAdjustment[];
  requisitions: Requisition[];
  invitations: SupplierInvitation[];
  purchaseOrders: PurchaseOrder[];
  invoices: ExpenseInvoice[];
  contracts: WorkContract[];
}

export type NewBudgetLineInput = Omit<BudgetLine, "id" | "committed" | "executed">;

export interface NewAdjustmentInput {
  budgetLineId: string;
  adjustmentType: AdjustmentType;
  amount: number;
  reason: string;
}

export interface NewRequisitionInput {
  title: string;
  description: string;
  justification: string;
  estimatedAmount: number;
  projectId: Requisition["projectId"];
  phaseId: string | null;
  budgetLineId: string;
  requesterArea: string;
  overdraftJustification: string;
}

export interface NewInvitationInput {
  requisitionId: string;
  supplierName: string;
  supplierEmail: string;
}

export interface NewInvoiceInput {
  purchaseOrderId: string;
  issuerName: string;
  issuerTaxId: string;
  invoiceNumber: string;
  subtotal: number;
  pdfFileName: string;
}

export interface NewContractInput {
  contractorName: string;
  projectId: WorkContract["projectId"];
  phaseId: string | null;
  budgetLineId: string;
  amount: number;
  startDate: string;
  endDate: string;
  milestones: Array<Pick<ContractMilestone, "name" | "percent" | "amount">>;
}

interface ErpContextValue {
  isHydrated: boolean;
  activeRole: ErpRole | null;
  projectFilter: ProjectFilter;
  budgetLines: BudgetLine[];
  phases: ProjectPhase[];
  adjustments: BudgetAdjustment[];
  requisitions: Requisition[];
  invitations: SupplierInvitation[];
  purchaseOrders: PurchaseOrder[];
  invoices: ExpenseInvoice[];
  contracts: WorkContract[];
  signInAsRole: (roleId: RoleId) => void;
  signOut: () => void;
  setProjectFilter: (filter: ProjectFilter) => void;
  createBudgetLine: (input: NewBudgetLineInput) => BudgetLine;
  registerAdjustment: (input: NewAdjustmentInput) => BudgetAdjustment;
  createRequisition: (input: NewRequisitionInput) => Requisition;
  approveRequisition: (requisitionId: string) => void;
  returnRequisition: (requisitionId: string, observation: string) => void;
  createInvitation: (input: NewInvitationInput) => SupplierInvitation;
  submitSupplierOffer: (token: string, offer: Omit<SupplierOffer, "submittedAt">) => void;
  adjudicateInvitation: (invitationId: string, awardCriterion: string) => PurchaseOrder;
  registerInvoice: (input: NewInvoiceInput) => ExpenseInvoice;
  reviewInvoice: (invoiceId: string, decision: "validate" | "reject") => void;
  createContract: (input: NewContractInput) => WorkContract;
  validateMilestone: (contractId: string, milestoneId: string) => void;
}

const ErpContext = createContext<ErpContextValue | null>(null);

const buildInitialState = (): PersistedState => ({
  activeRoleId: null,
  projectFilter: "all",
  budgetLines: SEED_BUDGET_LINES,
  adjustments: [],
  requisitions: SEED_REQUISITIONS,
  invitations: SEED_INVITATIONS,
  purchaseOrders: SEED_PURCHASE_ORDERS,
  invoices: SEED_INVOICES,
  contracts: SEED_CONTRACTS,
});

const generateId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const buildTimelineEvent = (
  actorName: string,
  action: string,
  note: string | null = null,
): TimelineEvent => ({
  id: generateId("ev"),
  at: new Date().toISOString(),
  actorName,
  action,
  note,
});

const nextCode = (prefix: string, existingCodes: string[]): string => {
  const year = new Date().getFullYear();
  const maxSequence = existingCodes.reduce((max, code) => {
    const match = code.match(/(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${year}-${String(maxSequence + 1).padStart(3, "0")}`;
};

export function ErpProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(buildInitialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      if (storedValue) {
        const parsed = JSON.parse(storedValue) as Partial<PersistedState>;
        const initial = buildInitialState();

        // Merge invitations so all SEED_INVITATIONS (including prov-andes-01) always exist
        const storedInvitations = parsed.invitations ?? [];
        const existingTokens = new Set(storedInvitations.map((item) => item.token));
        const missingSeedInvitations = SEED_INVITATIONS.filter(
          (seed) => !existingTokens.has(seed.token),
        );
        const mergedInvitations = [...storedInvitations, ...missingSeedInvitations];

        // Ensure seed requisitions exist if referenced
        const storedRequisitions = parsed.requisitions ?? [];
        const existingReqIds = new Set(storedRequisitions.map((item) => item.id));
        const missingSeedReqs = SEED_REQUISITIONS.filter((seed) => !existingReqIds.has(seed.id));
        const mergedRequisitions = [...storedRequisitions, ...missingSeedReqs];

        setState({
          ...initial,
          ...parsed,
          invitations: mergedInvitations,
          requisitions: mergedRequisitions,
        });
      }
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

  const signInAsRole = useCallback(
    (roleId: RoleId) => setState((previous) => ({ ...previous, activeRoleId: roleId })),
    [],
  );
  const signOut = useCallback(
    () => setState((previous) => ({ ...previous, activeRoleId: null })),
    [],
  );
  const setProjectFilter = useCallback(
    (filter: ProjectFilter) => setState((previous) => ({ ...previous, projectFilter: filter })),
    [],
  );

  const activeRole = state.activeRoleId ? (findRoleById(state.activeRoleId) ?? null) : null;
  const actorName = activeRole?.personName ?? "Sistema";

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
        authorName: actorName,
        createdAt: new Date().toISOString(),
        approvedBefore: targetLine.approved,
        approvedAfter: targetLine.approved + signedAmount,
      };
      setState((previous) => ({
        ...previous,
        budgetLines: previous.budgetLines.map((line) =>
          line.id === input.budgetLineId
            ? { ...line, approved: line.approved + signedAmount }
            : line,
        ),
        adjustments: [adjustment, ...previous.adjustments],
      }));
      return adjustment;
    },
    [state.budgetLines, actorName],
  );

  /* ---------- Phase 2: requisitions & approvals ---------- */

  const createRequisition = useCallback(
    (input: NewRequisitionInput): Requisition => {
      const targetLine = state.budgetLines.find((line) => line.id === input.budgetLineId);
      if (!targetLine) throw new Error("La partida seleccionada no existe.");
      const validationError = validateRequisition(
        targetLine,
        input.estimatedAmount,
        input.overdraftJustification,
      );
      if (validationError) throw new Error(validationError);

      const requisition: Requisition = {
        id: generateId("req"),
        code: nextCode(
          "REQ",
          state.requisitions.map((item) => item.code),
        ),
        title: input.title,
        description: input.description,
        justification: input.justification,
        estimatedAmount: input.estimatedAmount,
        projectId: input.projectId,
        phaseId: input.phaseId,
        budgetLineId: input.budgetLineId,
        requesterArea: input.requesterArea,
        status: "pending_approval",
        overdraftJustification: input.overdraftJustification.trim()
          ? input.overdraftJustification.trim()
          : null,
        createdBy: actorName,
        createdAt: new Date().toISOString(),
        timeline: [buildTimelineEvent(actorName, "Requerimiento creado")],
      };
      setState((previous) => ({
        ...previous,
        requisitions: [requisition, ...previous.requisitions],
      }));
      return requisition;
    },
    [state.budgetLines, state.requisitions, actorName],
  );

  const approveRequisition = useCallback(
    (requisitionId: string) => {
      setState((previous) => ({
        ...previous,
        requisitions: previous.requisitions.map((requisition) =>
          requisition.id === requisitionId
            ? {
                ...requisition,
                status: "approved",
                timeline: [
                  ...requisition.timeline,
                  buildTimelineEvent(actorName, "Requerimiento aprobado"),
                ],
              }
            : requisition,
        ),
      }));
    },
    [actorName],
  );

  const returnRequisition = useCallback(
    (requisitionId: string, observation: string) => {
      if (observation.trim().length < 5)
        throw new Error("La observación debe tener al menos 5 caracteres.");
      setState((previous) => ({
        ...previous,
        requisitions: previous.requisitions.map((requisition) =>
          requisition.id === requisitionId
            ? {
                ...requisition,
                status: "returned",
                timeline: [
                  ...requisition.timeline,
                  buildTimelineEvent(actorName, "Devuelto con observación", observation.trim()),
                ],
              }
            : requisition,
        ),
      }));
    },
    [actorName],
  );

  /* ---------- Phase 2: procurement, portal & purchase orders ---------- */

  const createInvitation = useCallback(
    (input: NewInvitationInput): SupplierInvitation => {
      const requisition = state.requisitions.find((item) => item.id === input.requisitionId);
      if (!requisition) throw new Error("El requerimiento seleccionado no existe.");
      if (requisition.status !== "approved" && requisition.status !== "in_procurement") {
        throw new Error("Solo los requerimientos aprobados pueden enviarse a proveedores.");
      }
      const invitation: SupplierInvitation = {
        id: generateId("inv"),
        token: generateId("prov"),
        requisitionId: input.requisitionId,
        supplierName: input.supplierName,
        supplierEmail: input.supplierEmail,
        status: "sent",
        offer: null,
        createdAt: new Date().toISOString(),
      };
      setState((previous) => ({
        ...previous,
        invitations: [invitation, ...previous.invitations],
        requisitions: previous.requisitions.map((item) =>
          item.id === input.requisitionId
            ? {
                ...item,
                status: "in_procurement",
                timeline: [
                  ...item.timeline,
                  buildTimelineEvent(actorName, `Invitación enviada a ${input.supplierName}`),
                ],
              }
            : item,
        ),
      }));
      return invitation;
    },
    [state.requisitions, actorName],
  );

  const submitSupplierOffer = useCallback(
    (token: string, offer: Omit<SupplierOffer, "submittedAt">) => {
      setState((previous) => {
        const submittedAt = new Date().toISOString();
        const found = previous.invitations.some((item) => item.token === token);
        if (found) {
          return {
            ...previous,
            invitations: previous.invitations.map((invitation) =>
              invitation.token === token
                ? {
                    ...invitation,
                    status: "submitted",
                    offer: { ...offer, submittedAt },
                  }
                : invitation,
            ),
          };
        }

        // Fallback: create and insert the invitation if it wasn't in state
        const seedMatch = SEED_INVITATIONS.find((seed) => seed.token === token);
        const fallbackInvitation: SupplierInvitation = seedMatch
          ? {
              ...seedMatch,
              status: "submitted",
              offer: { ...offer, submittedAt },
            }
          : {
              id: `inv-${Date.now().toString(36)}`,
              token,
              requisitionId: previous.requisitions[0]?.id ?? "req-01",
              supplierName: "Constructora Andes S.A.",
              supplierEmail: "contacto@constructoraandes.com",
              status: "submitted",
              offer: { ...offer, submittedAt },
              createdAt: submittedAt,
            };

        return {
          ...previous,
          invitations: [fallbackInvitation, ...previous.invitations],
        };
      });
    },
    [],
  );

  const adjudicateInvitation = useCallback(
    (invitationId: string, awardCriterion: string): PurchaseOrder => {
      const invitation = state.invitations.find((item) => item.id === invitationId);
      if (!invitation || !invitation.offer)
        throw new Error("La invitación no tiene una oferta presentada.");
      if (awardCriterion.trim().length < 10)
        throw new Error("Registra el criterio de adjudicación (mínimo 10 caracteres).");
      const requisition = state.requisitions.find((item) => item.id === invitation.requisitionId);
      if (!requisition) throw new Error("El requerimiento asociado no existe.");

      const order: PurchaseOrder = {
        id: generateId("oc"),
        code: nextCode(
          "OC",
          state.purchaseOrders.map((item) => item.code),
        ),
        requisitionId: invitation.requisitionId,
        invitationId: invitation.id,
        supplierName: invitation.supplierName,
        amount: invitation.offer.price,
        awardCriterion: awardCriterion.trim(),
        issuedBy: actorName,
        issuedAt: new Date().toISOString(),
        budgetLineId: requisition.budgetLineId,
        projectId: requisition.projectId,
        status: "issued",
      };
      setState((previous) => ({
        ...previous,
        purchaseOrders: [order, ...previous.purchaseOrders],
        budgetLines: previous.budgetLines.map((line) =>
          line.id === requisition.budgetLineId
            ? applyCommitment(line, invitation.offer?.price ?? 0)
            : line,
        ),
        requisitions: previous.requisitions.map((item) =>
          item.id === invitation.requisitionId
            ? {
                ...item,
                status: "ordered",
                timeline: [
                  ...item.timeline,
                  buildTimelineEvent(
                    actorName,
                    `Orden ${order.code} emitida a ${invitation.supplierName}`,
                    awardCriterion.trim(),
                  ),
                ],
              }
            : item,
        ),
      }));
      return order;
    },
    [state.invitations, state.requisitions, state.purchaseOrders, actorName],
  );

  /* ---------- Phase 2: invoices & execution ---------- */

  const registerInvoice = useCallback(
    (input: NewInvoiceInput): ExpenseInvoice => {
      const order = state.purchaseOrders.find((item) => item.id === input.purchaseOrderId);
      if (!order) throw new Error("La orden seleccionada no existe.");
      if (input.subtotal <= 0) throw new Error("El subtotal debe ser mayor a cero.");
      const { taxAmount, total } = calculateInvoiceTotals(input.subtotal);
      const invoice: ExpenseInvoice = {
        id: generateId("fac"),
        purchaseOrderId: input.purchaseOrderId,
        issuerName: input.issuerName,
        issuerTaxId: input.issuerTaxId,
        invoiceNumber: input.invoiceNumber,
        subtotal: input.subtotal,
        taxAmount,
        total,
        pdfFileName: input.pdfFileName,
        status: "pending_review",
        uploadedBy: actorName,
        uploadedAt: new Date().toISOString(),
        reviewedBy: null,
        reviewedAt: null,
      };
      setState((previous) => ({ ...previous, invoices: [invoice, ...previous.invoices] }));
      return invoice;
    },
    [state.purchaseOrders, actorName],
  );

  const reviewInvoice = useCallback(
    (invoiceId: string, decision: "validate" | "reject") => {
      const invoice = state.invoices.find((item) => item.id === invoiceId);
      if (!invoice) throw new Error("El comprobante no existe.");
      if (invoice.status !== "pending_review") throw new Error("El comprobante ya fue revisado.");
      const order = state.purchaseOrders.find((item) => item.id === invoice.purchaseOrderId);

      setState((previous) => ({
        ...previous,
        invoices: previous.invoices.map((item) =>
          item.id === invoiceId
            ? {
                ...item,
                status: decision === "validate" ? "validated" : "rejected",
                reviewedBy: actorName,
                reviewedAt: new Date().toISOString(),
              }
            : item,
        ),
        budgetLines:
          decision === "validate" && order
            ? previous.budgetLines.map((line) =>
                line.id === order.budgetLineId ? applyExecution(line, invoice.total) : line,
              )
            : previous.budgetLines,
        purchaseOrders:
          decision === "validate"
            ? previous.purchaseOrders.map((item) =>
                item.id === invoice.purchaseOrderId ? { ...item, status: "invoiced" } : item,
              )
            : previous.purchaseOrders,
        requisitions:
          decision === "validate"
            ? previous.requisitions.map((item) =>
                item.id === order?.requisitionId
                  ? {
                      ...item,
                      status: "invoiced",
                      timeline: [
                        ...item.timeline,
                        buildTimelineEvent(actorName, `Factura ${invoice.invoiceNumber} validada`),
                      ],
                    }
                  : item,
              )
            : previous.requisitions,
      }));
    },
    [state.invoices, state.purchaseOrders, actorName],
  );

  /* ---------- Phase 2: outsourced work contracts ---------- */

  const createContract = useCallback(
    (input: NewContractInput): WorkContract => {
      const targetLine = state.budgetLines.find((line) => line.id === input.budgetLineId);
      if (!targetLine) throw new Error("La partida seleccionada no existe.");
      const contract: WorkContract = {
        id: generateId("ctr"),
        code: nextCode(
          "CTR",
          state.contracts.map((item) => item.code),
        ),
        contractorName: input.contractorName,
        projectId: input.projectId,
        phaseId: input.phaseId,
        budgetLineId: input.budgetLineId,
        amount: input.amount,
        startDate: input.startDate,
        endDate: input.endDate,
        milestones: input.milestones.map((milestone) => ({
          ...milestone,
          id: generateId("hit"),
          status: "pending",
        })),
        createdBy: actorName,
        createdAt: new Date().toISOString(),
      };
      setState((previous) => ({
        ...previous,
        contracts: [contract, ...previous.contracts],
        budgetLines: previous.budgetLines.map((line) =>
          line.id === input.budgetLineId ? applyCommitment(line, input.amount) : line,
        ),
      }));
      return contract;
    },
    [state.budgetLines, state.contracts, actorName],
  );

  const validateMilestone = useCallback(
    (contractId: string, milestoneId: string) => {
      const contract = state.contracts.find((item) => item.id === contractId);
      if (!contract) throw new Error("El contrato no existe.");
      const milestone = contract.milestones.find((item) => item.id === milestoneId);
      if (!milestone) throw new Error("El hito no existe.");
      if (milestone.status === "validated") throw new Error("El hito ya fue validado.");

      setState((previous) => ({
        ...previous,
        contracts: previous.contracts.map((item) =>
          item.id === contractId
            ? {
                ...item,
                milestones: item.milestones.map((entry) =>
                  entry.id === milestoneId ? { ...entry, status: "validated" } : entry,
                ),
              }
            : item,
        ),
        budgetLines: previous.budgetLines.map((line) =>
          line.id === contract.budgetLineId ? applyExecution(line, milestone.amount) : line,
        ),
      }));
    },
    [state.contracts],
  );

  const contextValue = useMemo<ErpContextValue>(
    () => ({
      isHydrated,
      activeRole,
      projectFilter: state.projectFilter,
      budgetLines: state.budgetLines,
      phases: SEED_PHASES,
      adjustments: state.adjustments,
      requisitions: state.requisitions,
      invitations: state.invitations,
      purchaseOrders: state.purchaseOrders,
      invoices: state.invoices,
      contracts: state.contracts,
      signInAsRole,
      signOut,
      setProjectFilter,
      createBudgetLine,
      registerAdjustment,
      createRequisition,
      approveRequisition,
      returnRequisition,
      createInvitation,
      submitSupplierOffer,
      adjudicateInvitation,
      registerInvoice,
      reviewInvoice,
      createContract,
      validateMilestone,
    }),
    [
      isHydrated,
      activeRole,
      state,
      signInAsRole,
      signOut,
      setProjectFilter,
      createBudgetLine,
      registerAdjustment,
      createRequisition,
      approveRequisition,
      returnRequisition,
      createInvitation,
      submitSupplierOffer,
      adjudicateInvitation,
      registerInvoice,
      reviewInvoice,
      createContract,
      validateMilestone,
    ],
  );

  return <ErpContext.Provider value={contextValue}>{children}</ErpContext.Provider>;
}

export function useErp(): ErpContextValue {
  const contextValue = useContext(ErpContext);
  if (!contextValue) throw new Error("useErp debe usarse dentro de ErpProvider");
  return contextValue;
}
