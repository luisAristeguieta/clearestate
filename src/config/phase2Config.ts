import type { BudgetLine, ProjectId } from "@/config/erpConfig";
import { calculateAvailableBalance } from "@/config/erpConfig";

/* ---------- Requisitions (P-04 / P-05) ---------- */

export type RequisitionStatus =
  "pending_approval" | "approved" | "returned" | "in_procurement" | "ordered" | "invoiced";

export const REQUISITION_STATUS_LABELS: Record<RequisitionStatus, string> = {
  pending_approval: "Pendiente de aprobación",
  approved: "Aprobado",
  returned: "Devuelto con observación",
  in_procurement: "En adquisición",
  ordered: "Orden emitida",
  invoiced: "Facturado",
};

export interface TimelineEvent {
  id: string;
  at: string;
  actorName: string;
  action: string;
  note: string | null;
}

export interface Requisition {
  id: string;
  code: string;
  title: string;
  description: string;
  justification: string;
  estimatedAmount: number;
  projectId: ProjectId;
  phaseId: string | null;
  budgetLineId: string;
  requesterArea: string;
  status: RequisitionStatus;
  overdraftJustification: string | null;
  createdBy: string;
  createdAt: string;
  timeline: TimelineEvent[];
}

export interface OverdraftCheck {
  isOverdrawn: boolean;
  availableBalance: number;
  deficit: number;
}

/** Flags a requisition whose amount exceeds the budget line's available balance. */
export const evaluateRequisitionOverdraft = (
  line: Pick<BudgetLine, "approved" | "committed" | "executed">,
  amount: number,
): OverdraftCheck => {
  const availableBalance = calculateAvailableBalance(line);
  const deficit = amount - availableBalance;
  return { isOverdrawn: deficit > 0, availableBalance, deficit: Math.max(deficit, 0) };
};

export const MIN_OVERDRAFT_JUSTIFICATION_LENGTH = 20;

/** An overdrawn requisition is only accepted with a detailed justification. */
export const validateRequisition = (
  line: Pick<BudgetLine, "approved" | "committed" | "executed">,
  amount: number,
  overdraftJustification: string,
): string | null => {
  if (amount <= 0) return "El importe estimado debe ser mayor a cero.";
  const check = evaluateRequisitionOverdraft(line, amount);
  if (
    check.isOverdrawn &&
    overdraftJustification.trim().length < MIN_OVERDRAFT_JUSTIFICATION_LENGTH
  ) {
    return "El importe supera el saldo disponible: registra una justificación detallada de al menos 20 caracteres.";
  }
  return null;
};

/* ---------- Supplier invitations & offers (P-06 / P-07) ---------- */

export interface SupplierOffer {
  price: number;
  termDays: number;
  conditions: string;
  pdfFileName: string;
  submittedAt: string;
}

export type InvitationStatus = "sent" | "submitted";

export interface SupplierInvitation {
  id: string;
  token: string;
  requisitionId: string;
  supplierName: string;
  supplierEmail: string;
  status: InvitationStatus;
  offer: SupplierOffer | null;
  createdAt: string;
}

export const buildInvitationPath = (token: string): string => `/portal-proveedor/${token}`;

/* ---------- Purchase orders (P-08 / P-09) ---------- */

export type PurchaseOrderStatus = "issued" | "invoiced" | "closed";

export interface PurchaseOrder {
  id: string;
  code: string;
  requisitionId: string;
  invitationId: string;
  supplierName: string;
  amount: number;
  awardCriterion: string;
  issuedBy: string;
  issuedAt: string;
  budgetLineId: string;
  projectId: ProjectId;
  status: PurchaseOrderStatus;
}

/** Issuing a purchase order raises the committed amount of the budget line. */
export const applyCommitment = (line: BudgetLine, amount: number): BudgetLine => ({
  ...line,
  committed: line.committed + amount,
});

/* ---------- Invoices & Contasis export (P-10 / P-11) ---------- */

export const IVA_RATE = 0.15;

export interface InvoiceTotals {
  taxAmount: number;
  total: number;
}

export const calculateInvoiceTotals = (subtotal: number): InvoiceTotals => {
  const taxAmount = Math.round(subtotal * IVA_RATE * 100) / 100;
  return { taxAmount, total: Math.round((subtotal + taxAmount) * 100) / 100 };
};

export type InvoiceStatus = "pending_review" | "validated" | "rejected";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending_review: "Pendiente de revisión",
  validated: "Validado",
  rejected: "Rechazado",
};

export interface ExpenseInvoice {
  id: string;
  purchaseOrderId: string;
  issuerName: string;
  issuerTaxId: string;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  pdfFileName: string;
  status: InvoiceStatus;
  uploadedBy: string;
  uploadedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

/** A validated invoice moves the amount from committed to executed, never double counting. */
export const applyExecution = (line: BudgetLine, amount: number): BudgetLine => ({
  ...line,
  committed: Math.max(line.committed - amount, 0),
  executed: line.executed + amount,
});

/** Simulated AI/OCR prefill: derives the draft invoice from the purchase order data. */
export const simulateInvoiceExtraction = (
  order: Pick<PurchaseOrder, "supplierName" | "amount" | "code">,
  pdfFileName: string,
): {
  issuerName: string;
  issuerTaxId: string;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  pdfFileName: string;
} => {
  const subtotal = Math.round((order.amount / (1 + IVA_RATE)) * 100) / 100;
  const { taxAmount, total } = calculateInvoiceTotals(subtotal);
  return {
    issuerName: order.supplierName,
    issuerTaxId: "1790012345001",
    invoiceNumber: `001-002-${order.code.replace(/\D/g, "").padStart(6, "0")}`,
    subtotal,
    taxAmount,
    total,
    pdfFileName,
  };
};

export interface ContasisRow {
  invoice: ExpenseInvoice;
  orderCode: string;
  budgetLineCode: string;
  projectName: string;
}

/** Builds the tabular CSV optimized for the Contasis accounting system (RF-31). */
export const buildContasisCsv = (rows: ContasisRow[]): string => {
  const header =
    "TIPO_DOC;SERIE;NUMERO;FECHA_EMISION;RUC_EMISOR;RAZON_SOCIAL;SUBTOTAL;IVA;TOTAL;PROYECTO;PARTIDA;ORDEN";
  const escapeCell = (value: string): string => value.replace(/;/g, ",").trim();
  const lines = rows.map(({ invoice, orderCode, budgetLineCode, projectName }) => {
    const [serie = "", ...numberParts] = invoice.invoiceNumber.split("-");
    const numero = numberParts.join("");
    return [
      "01",
      escapeCell(serie),
      escapeCell(numero),
      invoice.uploadedAt.slice(0, 10),
      escapeCell(invoice.issuerTaxId),
      escapeCell(invoice.issuerName),
      invoice.subtotal.toFixed(2),
      invoice.taxAmount.toFixed(2),
      invoice.total.toFixed(2),
      escapeCell(projectName),
      escapeCell(budgetLineCode),
      escapeCell(orderCode),
    ].join(";");
  });
  return [header, ...lines].join("\n");
};

/* ---------- Outsourced work contracts (P-12) ---------- */

export type MilestoneStatus = "pending" | "billed" | "validated";

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  pending: "Pendiente",
  billed: "Valorizado",
  validated: "Validado",
};

export interface ContractMilestone {
  id: string;
  name: string;
  percent: number;
  amount: number;
  status: MilestoneStatus;
}

export interface WorkContract {
  id: string;
  code: string;
  contractorName: string;
  projectId: ProjectId;
  phaseId: string | null;
  budgetLineId: string;
  amount: number;
  startDate: string;
  endDate: string;
  milestones: ContractMilestone[];
  createdBy: string;
  createdAt: string;
}

/** Milestone amounts must add up to the contract amount. */
export const validateMilestoneSplit = (
  contractAmount: number,
  milestones: Pick<ContractMilestone, "amount">[],
): string | null => {
  const total = milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
  if (milestones.length === 0) return "Define al menos un hito de avance.";
  if (Math.abs(total - contractAmount) > 0.01)
    return "La suma de los hitos debe ser igual al monto del contrato.";
  return null;
};

/* ---------- Seed data ---------- */

const seedTimeline = (
  actorName: string,
  action: string,
  at: string,
  note: string | null = null,
): TimelineEvent[] => [{ id: `ev-${at}`, at, actorName, action, note }];

export const SEED_REQUISITIONS: Requisition[] = [
  {
    id: "req-01",
    code: "REQ-2026-001",
    title: "Campaña digital de lanzamiento etapa II",
    description: "Pauta digital, producción de video y piezas para redes sociales de la etapa II.",
    justification:
      "Se requiere sostener el ritmo de ventas de la etapa II durante el último trimestre.",
    estimatedAmount: 45000,
    projectId: "paris",
    phaseId: null,
    budgetLineId: "bl-05",
    requesterArea: "Marketing",
    status: "in_procurement",
    overdraftJustification: null,
    createdBy: "Carlos Mendoza",
    createdAt: "2026-10-28T09:30:00.000Z",
    timeline: [
      ...seedTimeline("Carlos Mendoza", "Requerimiento creado", "2026-10-28T09:30:00.000Z"),
      ...seedTimeline(
        "Elena Vargas",
        "Requerimiento aprobado",
        "2026-10-29T15:10:00.000Z",
        "Aprobado dentro del saldo de la partida de Marketing.",
      ),
      ...seedTimeline("Roberto Silva", "Enviado a adquisiciones", "2026-10-30T08:05:00.000Z"),
    ],
  },
  {
    id: "req-02",
    code: "REQ-2026-002",
    title: "Topografía y replanteo de lotes",
    description: "Servicio de topografía para el replanteo de 120 lotes de la tercera etapa.",
    justification: "El replanteo es requisito municipal para la inscripción de la etapa III.",
    estimatedAmount: 38000,
    projectId: "sagaleta",
    phaseId: "ph-sag-1",
    budgetLineId: "bl-08",
    requesterArea: "Proyectos",
    status: "pending_approval",
    overdraftJustification: null,
    createdBy: "Ing. Marcos Ríos",
    createdAt: "2026-11-03T11:20:00.000Z",
    timeline: seedTimeline("Ing. Marcos Ríos", "Requerimiento creado", "2026-11-03T11:20:00.000Z"),
  },
  {
    id: "req-03",
    code: "REQ-2026-003",
    title: "Vigilancia privada de obra",
    description:
      "Servicio de vigilancia 24/7 para el almacén de obra y las maquinarias del proyecto.",
    justification:
      "Se registraron dos intentos de robo en octubre; la póliza exige vigilancia permanente.",
    estimatedAmount: 12000,
    projectId: "paris",
    phaseId: "ph-par-2",
    budgetLineId: "bl-02",
    requesterArea: "Logística",
    status: "pending_approval",
    overdraftJustification: null,
    createdBy: "Roberto Silva",
    createdAt: "2026-11-05T14:45:00.000Z",
    timeline: seedTimeline("Roberto Silva", "Requerimiento creado", "2026-11-05T14:45:00.000Z"),
  },
  {
    id: "req-04",
    code: "REQ-2026-004",
    title: "Estudio de suelos complementario",
    description:
      "Ensayos de laboratorio y calicatas adicionales para la zona de muros de contención.",
    justification: "El informe geotécnico inicial no cubre el talud norte.",
    estimatedAmount: 52000,
    projectId: "sagaleta",
    phaseId: "ph-sag-1",
    budgetLineId: "bl-08",
    requesterArea: "Proyectos",
    status: "returned",
    overdraftJustification: null,
    createdBy: "Ing. Marcos Ríos",
    createdAt: "2026-10-20T10:00:00.000Z",
    timeline: [
      ...seedTimeline("Ing. Marcos Ríos", "Requerimiento creado", "2026-10-20T10:00:00.000Z"),
      ...seedTimeline(
        "Elena Vargas",
        "Devuelto con observación",
        "2026-10-21T16:40:00.000Z",
        "Adjuntar el alcance del estudio inicial y cotizar con dos laboratorios más.",
      ),
    ],
  },
];

export const SEED_INVITATIONS: SupplierInvitation[] = [
  {
    id: "inv-01",
    token: "prov-andes-9f3k2",
    requisitionId: "req-01",
    supplierName: "Agencia Prisma Creativa S.A.",
    supplierEmail: "licitaciones@prismacreativa.ec",
    status: "submitted",
    offer: {
      price: 42500,
      termDays: 30,
      conditions: "50% de anticipo, saldo contra entrega. Incluye 2 rondas de ajustes.",
      pdfFileName: "propuesta-prisma-etapa2.pdf",
      submittedAt: "2026-11-02T13:15:00.000Z",
    },
    createdAt: "2026-10-30T08:10:00.000Z",
  },
  {
    id: "inv-02",
    token: "prov-geoandina-7x1m4",
    requisitionId: "req-01",
    supplierName: "MediaAndina Group S.A.",
    supplierEmail: "comercial@mediaandina.ec",
    status: "sent",
    offer: null,
    createdAt: "2026-10-30T08:12:00.000Z",
  },
];

export const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "oc-01",
    code: "OC-2026-001",
    requisitionId: "req-01",
    invitationId: "inv-01",
    supplierName: "Labotest Ingeniería S.A.",
    amount: 18500,
    awardCriterion: "Mejor precio con plazo de entrega menor a 15 días.",
    issuedBy: "Roberto Silva",
    issuedAt: "2026-10-25T09:00:00.000Z",
    budgetLineId: "bl-02",
    projectId: "paris",
    status: "issued",
  },
];

export const SEED_INVOICES: ExpenseInvoice[] = [
  {
    id: "fac-01",
    purchaseOrderId: "oc-01",
    issuerName: "Labotest Ingeniería S.A.",
    issuerTaxId: "1790012345001",
    invoiceNumber: "001-002-000481",
    subtotal: 16086.96,
    taxAmount: 2413.04,
    total: 18500,
    pdfFileName: "factura-labotest-000481.pdf",
    status: "pending_review",
    uploadedBy: "Roberto Silva",
    uploadedAt: "2026-11-06T10:25:00.000Z",
    reviewedBy: null,
    reviewedAt: null,
  },
];

export const SEED_CONTRACTS: WorkContract[] = [
  {
    id: "ctr-01",
    code: "CTR-2026-001",
    contractorName: "Constructora Andes S.A.",
    projectId: "sagaleta",
    phaseId: "ph-sag-1",
    budgetLineId: "bl-08",
    amount: 860000,
    startDate: "2026-03-01",
    endDate: "2026-11-30",
    milestones: [
      {
        id: "hit-01",
        name: "Movimiento de tierras y plataformas",
        percent: 40,
        amount: 344000,
        status: "validated",
      },
      {
        id: "hit-02",
        name: "Muros de contención y obras de drenaje",
        percent: 35,
        amount: 301000,
        status: "billed",
      },
      {
        id: "hit-03",
        name: "Acabados, señalización y entrega",
        percent: 25,
        amount: 215000,
        status: "pending",
      },
    ],
    createdBy: "Ing. Marcos Ríos",
    createdAt: "2026-02-20T09:00:00.000Z",
  },
];
