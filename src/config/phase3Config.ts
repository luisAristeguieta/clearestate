import {
  calculateAvailableBalance,
  type BudgetLine,
  type ProjectFilter,
  type ProjectId,
  type RoleId,
} from "@/config/erpConfig";
import type { ExpenseInvoice, PurchaseOrder, WorkContract } from "@/config/phase2Config";

export interface OracleSale {
  id: string;
  buyerName: string;
  email: string;
  phone: string;
  projectId: ProjectId;
  lot: string;
  price: number;
  balance: number;
  installments: number;
  paidInstallments: number;
  soldAt: string;
  estimatedDelivery: string;
}
export interface PrototypeAttachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
}
export interface AfterSalesCase {
  id: string;
  saleId: string;
  createdAt: string;
  estimatedDelivery: string;
  status: "preparing" | "ready" | "delivered";
  deliveryRecord: PrototypeAttachment | null;
  deliveredAt: string | null;
}
export type CampaignChannel = "email" | "whatsapp";
export type DeliveryStatus = "scheduled" | "sent" | "delivered" | "failed" | "followup";
export const DELIVERY_LABELS: Record<DeliveryStatus, string> = {
  scheduled: "Programados",
  sent: "Enviados",
  delivered: "Entregados",
  failed: "No entregados",
  followup: "Pendientes de seguimiento",
};
export interface CampaignDelivery {
  id: string;
  saleId: string;
  contact: string;
  status: DeliveryStatus;
  attempts: number;
  reason: string | null;
  updatedAt: string;
}
export interface Campaign {
  id: string;
  title: string;
  projectId: ProjectId;
  channel: CampaignChannel;
  message: string;
  attachments: PrototypeAttachment[];
  scheduledAt: string | null;
  createdAt: string;
  deliveries: CampaignDelivery[];
}

export type ReminderType = "entrega_lote" | "documentacion" | "hito_obra" | "general";
export type ReminderStatus = "scheduled" | "active" | "sent";

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  entrega_lote: "Entrega de Lote",
  documentacion: "Documentación Pendiente",
  hito_obra: "Hito de Obra",
  general: "Notificación General",
};

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  scheduled: "Programado",
  active: "Activo",
  sent: "Enviado",
};

export interface AutomatedReminder {
  id: string;
  title: string;
  type: ReminderType;
  projectId: ProjectId;
  targetDate: string;
  channel?: CampaignChannel | undefined;
  channels: CampaignChannel[];
  message: string;
  status: ReminderStatus;
  createdAt: string;
}

export const SEED_REMINDERS: AutomatedReminder[] = [
  {
    id: "rem-01",
    title: "Recordatorio: Fecha de entrega formal de lote",
    type: "entrega_lote",
    projectId: "paris",
    targetDate: "2026-11-25",
    channel: "whatsapp",
    channels: ["whatsapp", "email"],
    message:
      "Estimado/a {{nombre}}, le recordamos que la entrega física de su lote {{lote}} en Proyecto París está programada para el 25 de noviembre.",
    status: "active",
    createdAt: "2026-11-01T10:00:00Z",
  },
  {
    id: "rem-02",
    title: "Aviso de documentación pendiente para firma de escrituras",
    type: "documentacion",
    projectId: "sagaleta",
    targetDate: "2026-11-30",
    channel: "email",
    channels: ["email"],
    message:
      "Estimado/a cliente, solicitamos enviar copia de su documento de identidad y certificado de no adeudo para completar el expediente de su lote en Proyecto Sagaleta.",
    status: "scheduled",
    createdAt: "2026-11-03T11:30:00Z",
  },
  {
    id: "rem-03",
    title: "Notificación: Hito de pavimentación y veredas concluido",
    type: "hito_obra",
    projectId: "paris",
    targetDate: "2026-11-05",
    channel: "email",
    channels: ["email", "whatsapp"],
    message:
      "Compartimos con agrado la culminación de la fase de pavimentación rígida y veredas en Proyecto París.",
    status: "sent",
    createdAt: "2026-10-20T09:00:00Z",
  },
  {
    id: "rem-04",
    title: "Inspección previa y checklist de entrega de lote",
    type: "entrega_lote",
    projectId: "sagaleta",
    targetDate: "2026-12-10",
    channel: "whatsapp",
    channels: ["whatsapp"],
    message:
      "Hola {{nombre}}, le invitamos a coordinar su recorrido de inspección técnica previo a la entrega formal de su lote {{lote}}.",
    status: "scheduled",
    createdAt: "2026-11-05T15:00:00Z",
  },
];

export const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: "cmp-seed-01",
    title: "Avance de habilitación urbana Etapa 1",
    projectId: "paris",
    channel: "email",
    message:
      "Hola {{nombre}}, compartimos el avance de {{proyecto}} para tu lote {{lote}}. Las redes de agua y desagüe presentan un 85% de ejecución.",
    attachments: [],
    scheduledAt: null,
    createdAt: "2026-11-02T14:00:00Z",
    deliveries: [
      {
        id: "del-01",
        saleId: "sale-01",
        contact: "maria.torres@example.com",
        status: "delivered",
        attempts: 1,
        reason: null,
        updatedAt: "2026-11-02T14:05:00Z",
      },
      {
        id: "del-02",
        saleId: "sale-02",
        contact: "andres.cevallos@example.com",
        status: "delivered",
        attempts: 1,
        reason: null,
        updatedAt: "2026-11-02T14:05:00Z",
      },
    ],
  },
  {
    id: "cmp-seed-02",
    title: "Inicio de obras de alumbrado subterráneo",
    projectId: "sagaleta",
    channel: "whatsapp",
    message:
      "Hola {{nombre}}, te informamos que iniciaron las obras de canalización eléctrica para tu lote {{lote}} en {{proyecto}}.",
    attachments: [],
    scheduledAt: "2026-11-20T09:00:00Z",
    createdAt: "2026-11-04T10:30:00Z",
    deliveries: [
      {
        id: "del-03",
        saleId: "sale-03",
        contact: "+593991234503",
        status: "scheduled",
        attempts: 0,
        reason: null,
        updatedAt: "2026-11-04T10:30:00Z",
      },
    ],
  },
];
export const SEED_ORACLE_SALES: OracleSale[] = [
  {
    id: "sale-01",
    buyerName: "María Fernanda Torres",
    email: "maria.torres@example.com",
    phone: "+593991234501",
    projectId: "paris",
    lot: "A-014",
    price: 85000,
    balance: 0,
    installments: 24,
    paidInstallments: 24,
    soldAt: "2026-03-05",
    estimatedDelivery: "2027-06-30",
  },
  {
    id: "sale-02",
    buyerName: "Andrés Cevallos",
    email: "andres.cevallos@example.com",
    phone: "+593991234502",
    projectId: "paris",
    lot: "B-028",
    price: 92000,
    balance: 18500,
    installments: 24,
    paidInstallments: 19,
    soldAt: "2026-04-12",
    estimatedDelivery: "2027-06-30",
  },
  {
    id: "sale-03",
    buyerName: "Daniela Maldonado",
    email: "daniela.maldonado@example.com",
    phone: "+593991234503",
    projectId: "sagaleta",
    lot: "C-007",
    price: 78000,
    balance: 0,
    installments: 18,
    paidInstallments: 18,
    soldAt: "2026-02-08",
    estimatedDelivery: "2027-10-30",
  },
  {
    id: "sale-04",
    buyerName: "Jorge Almeida",
    email: "",
    phone: "099",
    projectId: "paris",
    lot: "A-033",
    price: 88000,
    balance: 0,
    installments: 24,
    paidInstallments: 24,
    soldAt: "2026-06-18",
    estimatedDelivery: "2027-06-30",
  },
  {
    id: "sale-05",
    buyerName: "Valeria Espinosa",
    email: "valeria.espinosa@example.com",
    phone: "+593991234505",
    projectId: "sagaleta",
    lot: "D-011",
    price: 96000,
    balance: 12000,
    installments: 24,
    paidInstallments: 21,
    soldAt: "2026-05-21",
    estimatedDelivery: "2027-10-30",
  },
  {
    id: "sale-06",
    buyerName: "Sebastián Ponce",
    email: "sebastian.ponce@example.com",
    phone: "+593991234506",
    projectId: "sagaleta",
    lot: "C-021",
    price: 81000,
    balance: 0,
    installments: 12,
    paidInstallments: 12,
    soldAt: "2026-07-15",
    estimatedDelivery: "2027-10-30",
  },
];

export function triggerAfterSalesSync(
  sales: OracleSale[],
  existing: AfterSalesCase[],
  at: string,
): AfterSalesCase[] {
  const eligible = sales.filter((sale) => sale.balance === 0);
  const existingIds = new Set(existing.map((record) => record.saleId));
  const newCases: AfterSalesCase[] = [];
  for (const sale of eligible) {
    if (existingIds.has(sale.id)) continue;
    existingIds.add(sale.id);
    newCases.push({
      id: `case-${sale.id}`,
      saleId: sale.id,
      createdAt: at,
      estimatedDelivery: sale.estimatedDelivery,
      status: "preparing",
      deliveryRecord: null,
      deliveredAt: null,
    });
  }
  return [...existing, ...newCases];
}

export function validateCampaignContact(channel: CampaignChannel, contact: string): boolean {
  return channel === "email"
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
    : /^\+593\d{9}$/.test(contact.replace(/[\s-]/g, ""));
}
export function selectCampaignRecipients(sales: OracleSale[], projectId: ProjectId): OracleSale[] {
  return sales.filter((sale) => sale.projectId === projectId);
}
export function buildCampaignDeliveries(
  sales: OracleSale[],
  projectId: ProjectId,
  channel: CampaignChannel,
  scheduledAt: string | null,
  at: string,
): CampaignDelivery[] {
  return selectCampaignRecipients(sales, projectId).map((sale, index) => {
    const contact = channel === "email" ? sale.email : sale.phone;
    const valid = validateCampaignContact(channel, contact);
    return {
      id: `delivery-${sale.id}`,
      saleId: sale.id,
      contact,
      status: scheduledAt ? "scheduled" : valid ? (index === 0 ? "sent" : "delivered") : "failed",
      attempts: scheduledAt ? 0 : 1,
      reason: scheduledAt || valid ? null : "Contacto incompleto o inválido",
      updatedAt: at,
    };
  });
}
export function retryCampaignDelivery(
  delivery: CampaignDelivery,
  sale: OracleSale,
  campaign: Pick<Campaign, "channel" | "projectId">,
  at: string,
): CampaignDelivery {
  if (sale.projectId !== campaign.projectId)
    throw new Error("El comprador no pertenece al proyecto de esta campaña.");
  if (delivery.status !== "failed" && delivery.status !== "followup")
    throw new Error("Solo se reintentan contactos fallidos o pendientes de seguimiento.");
  const contact = campaign.channel === "email" ? sale.email : sale.phone;
  const valid = validateCampaignContact(campaign.channel, contact);
  return {
    ...delivery,
    contact,
    status: valid ? "delivered" : "failed",
    attempts: delivery.attempts + 1,
    updatedAt: at,
    reason: valid ? null : "Contacto incompleto o inválido",
  };
}
export function advanceCampaignDelivery(
  delivery: CampaignDelivery,
  channel: CampaignChannel,
  at: string,
): CampaignDelivery {
  if (delivery.status === "scheduled") {
    const valid = validateCampaignContact(channel, delivery.contact);
    return {
      ...delivery,
      status: valid ? "sent" : "failed",
      attempts: delivery.attempts + 1,
      updatedAt: at,
      reason: valid ? null : "Contacto incompleto o inválido",
    };
  }
  return delivery.status === "sent"
    ? { ...delivery, status: "delivered", updatedAt: at }
    : delivery;
}
export function renderCampaignMessage(message: string, sale: OracleSale): string {
  return message
    .replaceAll("{{nombre}}", sale.buyerName)
    .replaceAll("{{lote}}", sale.lot)
    .replaceAll(
      "{{proyecto}}",
      sale.projectId === "paris" ? "Proyecto París" : "Proyecto Sagaleta",
    );
}

export type PrototypePermission =
  | "budgets"
  | "approvals"
  | "procurement"
  | "expenses"
  | "contracts"
  | "afterSales"
  | "campaigns"
  | "reports"
  | "administration";
export const PERMISSION_LABELS: Record<PrototypePermission, string> = {
  budgets: "Presupuestos",
  approvals: "Aprobar solicitudes",
  procurement: "Adquisiciones",
  expenses: "Validar gastos",
  contracts: "Contratos",
  afterSales: "Gestionar posventa",
  campaigns: "Campañas",
  reports: "Informes",
  administration: "Administración",
};
export type PrototypePermissionMatrix = Record<RoleId, PrototypePermission[]>;
export const SEED_PERMISSION_MATRIX: PrototypePermissionMatrix = {
  management: ["budgets", "approvals", "reports"],
  systemAdmin: ["administration"],
  marketing: ["campaigns"],
  logistics: ["procurement"],
  finance: ["budgets", "expenses", "reports"],
  projects: ["contracts"],
  postSales: ["afterSales", "campaigns"],
  externalSupplier: [],
};

export interface ReportFilters {
  projectId: ProjectFilter;
  area: string;
  from: string;
  to: string;
}
export function matchesReportDate(
  date: string,
  filters: Pick<ReportFilters, "from" | "to">,
): boolean {
  const day = date.slice(0, 10);
  return (!filters.from || day >= filters.from) && (!filters.to || day <= filters.to);
}
export function buildManagementReport(
  lines: BudgetLine[],
  invoices: ExpenseInvoice[],
  orders: PurchaseOrder[],
  contracts: WorkContract[],
  sales: OracleSale[],
  cases: AfterSalesCase[],
  filters: ReportFilters,
) {
  const selectedLines = lines.filter(
    (line) =>
      (filters.projectId === "all" || line.projectId === filters.projectId) &&
      (filters.area === "all" || line.area === filters.area),
  );
  const lineIds = new Set(selectedLines.map((line) => line.id));
  const selectedSales = sales.filter(
    (sale) => filters.projectId === "all" || sale.projectId === filters.projectId,
  );
  const saleIds = new Set(selectedSales.map((sale) => sale.id));
  const selectedCases = cases.filter(
    (record) => saleIds.has(record.saleId) && matchesReportDate(record.createdAt, filters),
  );
  const totals = selectedLines.reduce(
    (summary, line) => ({
      approved: summary.approved + line.approved,
      committed: summary.committed + line.committed,
      executed: summary.executed + line.executed,
      available: summary.available + calculateAvailableBalance(line),
    }),
    { approved: 0, committed: 0, executed: 0, available: 0 },
  );
  const selectedOrders = new Set(
    orders.filter((order) => lineIds.has(order.budgetLineId)).map((order) => order.id),
  );
  const undatedContractExecution = contracts
    .filter((contract) => lineIds.has(contract.budgetLineId))
    .flatMap((contract) => contract.milestones)
    .filter((milestone) => milestone.status === "validated")
    .reduce((sum, milestone) => sum + milestone.amount, 0);
  return {
    ...totals,
    selectedLines,
    selectedSales,
    selectedCases,
    undatedContractExecution,
    invoices: invoices.filter(
      (invoice) =>
        selectedOrders.has(invoice.purchaseOrderId) &&
        invoice.status === "validated" &&
        matchesReportDate(invoice.reviewedAt ?? invoice.uploadedAt, filters),
    ),
    delivered: selectedCases.filter((record) => record.status === "delivered").length,
  };
}
