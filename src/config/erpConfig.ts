import {
  BarChart3,
  Bot,
  Building2,
  CheckCheck,
  ClipboardList,
  Database,
  FileSignature,
  FileSpreadsheet,
  FolderKanban,
  HardHat,
  Inbox,
  LayoutGrid,
  Megaphone,
  MessageSquareShare,
  PackageSearch,
  Receipt,
  Settings2,
  ShieldCheck,
  Truck,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import avatarGerencia from "@/assets/avatars/gerencia.jpg";
import avatarAdmin from "@/assets/avatars/admin.jpg";
import avatarMarketing from "@/assets/avatars/marketing.jpg";
import avatarLogistica from "@/assets/avatars/logistica.jpg";
import avatarFinanzas from "@/assets/avatars/finanzas.jpg";
import avatarProyectos from "@/assets/avatars/proyectos.jpg";
import avatarPosventa from "@/assets/avatars/posventa.jpg";
import avatarProveedor from "@/assets/avatars/proveedor.jpg";
import parisImage from "@/assets/project-paris.jpg";
import sagaletaImage from "@/assets/project-sagaleta.jpg";

/* ---------- Roles ---------- */

export type RoleId =
  | "management"
  | "systemAdmin"
  | "marketing"
  | "logistics"
  | "finance"
  | "projects"
  | "postSales"
  | "externalSupplier";

export interface ErpRole {
  id: RoleId;
  area: string;
  personName: string;
  jobTitle: string;
  email: string;
  avatarUrl: string;
  icon: LucideIcon;
  isExternal: boolean;
}

export const ERP_ROLES: ErpRole[] = [
  {
    id: "management",
    area: "Gerencia",
    personName: "Elena Vargas",
    jobTitle: "Directora General",
    email: "elena.vargas@clearminds.ec",
    avatarUrl: avatarGerencia,
    icon: ShieldCheck,
    isExternal: false,
  },
  {
    id: "systemAdmin",
    area: "Administración",
    personName: "Diego Paredes",
    jobTitle: "Administrador del Sistema",
    email: "diego.paredes@clearminds.ec",
    avatarUrl: avatarAdmin,
    icon: Settings2,
    isExternal: false,
  },
  {
    id: "marketing",
    area: "Marketing",
    personName: "Carlos Mendoza",
    jobTitle: "Jefe de Marketing",
    email: "carlos.mendoza@clearminds.ec",
    avatarUrl: avatarMarketing,
    icon: Megaphone,
    isExternal: false,
  },
  {
    id: "logistics",
    area: "Logística",
    personName: "Roberto Silva",
    jobTitle: "Jefe de Logística",
    email: "roberto.silva@clearminds.ec",
    avatarUrl: avatarLogistica,
    icon: PackageSearch,
    isExternal: false,
  },
  {
    id: "finance",
    area: "Finanzas",
    personName: "Lucía Castro",
    jobTitle: "Analista de Finanzas",
    email: "lucia.castro@clearminds.ec",
    avatarUrl: avatarFinanzas,
    icon: FileSpreadsheet,
    isExternal: false,
  },
  {
    id: "projects",
    area: "Proyectos",
    personName: "Ing. Marcos Ríos",
    jobTitle: "Residente de Obra",
    email: "marcos.rios@clearminds.ec",
    avatarUrl: avatarProyectos,
    icon: HardHat,
    isExternal: false,
  },
  {
    id: "postSales",
    area: "Posventa",
    personName: "Sofía Medina",
    jobTitle: "Coordinadora de Posventa",
    email: "sofia.medina@clearminds.ec",
    avatarUrl: avatarPosventa,
    icon: MessageSquareShare,
    isExternal: false,
  },
  {
    id: "externalSupplier",
    area: "Proveedor Externo",
    personName: "Constructora Andes S.A.",
    jobTitle: "Portal de Proveedor",
    email: "contacto@constructoraandes.ec",
    avatarUrl: avatarProveedor,
    icon: Building2,
    isExternal: true,
  },
];

export const findRoleById = (roleId: RoleId): ErpRole | undefined =>
  ERP_ROLES.find((role) => role.id === roleId);

/* ---------- Navigation ---------- */

export interface NavigationItem {
  label: string;
  code: string;
  icon: LucideIcon;
  /** Built route path, or a module slug rendered by the generic module route. */
  target:
    | { kind: "route"; path: "/dashboard" | "/proyectos" | "/presupuestos" }
    | { kind: "module"; moduleId: string };
  badgeCount?: number;
}

export interface NavigationGroup {
  title: string;
  shortTitle: string;
  items: NavigationItem[];
}

export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    title: "MAIN MENU",
    shortTitle: "MAIN",
    items: [
      {
        label: "Tablero",
        code: "P-01",
        icon: LayoutGrid,
        target: { kind: "route", path: "/dashboard" },
      },
      {
        label: "Proyectos y Fases",
        code: "P-02",
        icon: FolderKanban,
        target: { kind: "route", path: "/proyectos" },
      },
      {
        label: "Presupuestos",
        code: "P-03",
        icon: Wallet,
        target: { kind: "route", path: "/presupuestos" },
      },
    ],
  },
  {
    title: "ADQUISICIONES & OBRAS",
    shortTitle: "A&O",
    items: [
      {
        label: "Requerimientos",
        code: "P-04",
        icon: ClipboardList,
        target: { kind: "module", moduleId: "requerimientos" },
      },
      {
        label: "Aprobaciones",
        code: "P-05",
        icon: CheckCheck,
        target: { kind: "module", moduleId: "aprobaciones" },
        badgeCount: 4,
      },
      {
        label: "Logística",
        code: "P-06/08/09",
        icon: Truck,
        target: { kind: "module", moduleId: "logistica" },
      },
      {
        label: "Comprobantes y Contasis",
        code: "P-10/11",
        icon: Receipt,
        target: { kind: "module", moduleId: "comprobantes" },
      },
      {
        label: "Contratos de Obra",
        code: "P-12",
        icon: FileSignature,
        target: { kind: "module", moduleId: "contratos" },
      },
    ],
  },
  {
    title: "ORACLE & POSVENTA",
    shortTitle: "O&P",
    items: [
      {
        label: "Origen Oracle",
        code: "P-13",
        icon: Database,
        target: { kind: "module", moduleId: "oracle" },
      },
      {
        label: "Bandeja Posventa",
        code: "P-14/15",
        icon: Inbox,
        target: { kind: "module", moduleId: "posventa" },
        badgeCount: 7,
      },
      {
        label: "Campañas",
        code: "P-16/17",
        icon: Megaphone,
        target: { kind: "module", moduleId: "campanas" },
      },
    ],
  },
  {
    title: "SISTEMA",
    shortTitle: "SIS",
    items: [
      {
        label: "Informes",
        code: "P-18",
        icon: BarChart3,
        target: { kind: "module", moduleId: "informes" },
      },
      {
        label: "Roles",
        code: "P-19",
        icon: UsersRound,
        target: { kind: "module", moduleId: "roles" },
      },
      {
        label: "Asistente IA",
        code: "P-20",
        icon: Bot,
        target: { kind: "module", moduleId: "asistente-ia" },
      },
    ],
  },
];

export const findModuleItem = (moduleId: string): NavigationItem | undefined =>
  NAVIGATION_GROUPS.flatMap((group) => group.items).find(
    (item) => item.target.kind === "module" && item.target.moduleId === moduleId,
  );

/* ---------- Projects & phases ---------- */

export type ProjectId = "paris" | "sagaleta";
export type ProjectFilter = ProjectId | "all";

export const BUDGET_AREAS = [
  "Proyectos y Obras",
  "Logística",
  "Marketing",
  "Posventa",
  "Administración y Finanzas",
] as const;
export type BudgetArea = (typeof BUDGET_AREAS)[number];

export type PhaseStatus = "Completada" | "En ejecución" | "Licitación" | "Planificada";

export interface ProjectPhase {
  id: string;
  projectId: ProjectId;
  name: "Habilitación Urbana" | "Agua y Desagüe" | "Pistas y Veredas";
  contractor: string;
  status: PhaseStatus;
  progressPercent: number;
  startDate: string;
  endDate: string;
}

export interface RealEstateProject {
  id: ProjectId;
  name: string;
  location: string;
  totalLots: number;
  soldLots: number;
  areaHectares: number;
  imageUrl: string;
  description: string;
}

export const PROJECTS: RealEstateProject[] = [
  {
    id: "paris",
    name: "Proyecto París",
    location: "Quito Centro Norte · Av. 10 de Agosto y Colón",
    totalLots: 420,
    soldLots: 268,
    areaHectares: 18.5,
    imageUrl: parisImage,
    description:
      "Lotización urbana con parque central, alamedas y habilitación completa de servicios.",
  },
  {
    id: "sagaleta",
    name: "Proyecto Sagaleta",
    location: "Valle de los Chillos · Sangolquí, Quito",
    totalLots: 310,
    soldLots: 142,
    areaHectares: 14.2,
    imageUrl: sagaletaImage,
    description:
      "Urbanización en ladera con lotes en terrazas, reservorio propio y vista a los volcanes.",
  },
];

export const SEED_PHASES: ProjectPhase[] = [
  {
    id: "ph-par-1",
    projectId: "paris",
    name: "Habilitación Urbana",
    contractor: "Constructora Andes S.A.",
    status: "Completada",
    progressPercent: 100,
    startDate: "2026-01-12",
    endDate: "2026-05-30",
  },
  {
    id: "ph-par-2",
    projectId: "paris",
    name: "Agua y Desagüe",
    contractor: "Hidrosur Ingenieros EIRL",
    status: "En ejecución",
    progressPercent: 64,
    startDate: "2026-05-15",
    endDate: "2026-12-20",
  },
  {
    id: "ph-par-3",
    projectId: "paris",
    name: "Pistas y Veredas",
    contractor: "Pavimentos del Norte S.A.",
    status: "Licitación",
    progressPercent: 8,
    startDate: "2027-01-10",
    endDate: "2027-06-30",
  },
  {
    id: "ph-sag-1",
    projectId: "sagaleta",
    name: "Habilitación Urbana",
    contractor: "Constructora Andes S.A.",
    status: "En ejecución",
    progressPercent: 72,
    startDate: "2026-03-01",
    endDate: "2026-11-30",
  },
  {
    id: "ph-sag-2",
    projectId: "sagaleta",
    name: "Agua y Desagüe",
    contractor: "Hidrosur Ingenieros EIRL",
    status: "Planificada",
    progressPercent: 0,
    startDate: "2026-12-01",
    endDate: "2027-05-15",
  },
  {
    id: "ph-sag-3",
    projectId: "sagaleta",
    name: "Pistas y Veredas",
    contractor: "Por adjudicar",
    status: "Planificada",
    progressPercent: 0,
    startDate: "2027-05-20",
    endDate: "2027-10-30",
  },
];

/* ---------- Budget lines ---------- */

export interface BudgetLine {
  id: string;
  code: string;
  name: string;
  projectId: ProjectId;
  area: BudgetArea;
  phaseId: string | null;
  approved: number;
  committed: number;
  executed: number;
}

export type AdjustmentType = "Incremento" | "Reducción";

export interface BudgetAdjustment {
  id: string;
  budgetLineId: string;
  adjustmentType: AdjustmentType;
  amount: number;
  reason: string;
  authorName: string;
  createdAt: string;
  approvedBefore: number;
  approvedAfter: number;
}

export const SEED_BUDGET_LINES: BudgetLine[] = [
  {
    id: "bl-01",
    code: "PAR-OBR-001",
    name: "Movimiento de tierras y lotización",
    projectId: "paris",
    area: "Proyectos y Obras",
    phaseId: "ph-par-1",
    approved: 1850000,
    committed: 0,
    executed: 1792000,
  },
  {
    id: "bl-02",
    code: "PAR-OBR-002",
    name: "Redes de agua potable y alcantarillado",
    projectId: "paris",
    area: "Proyectos y Obras",
    phaseId: "ph-par-2",
    approved: 2400000,
    committed: 980000,
    executed: 640000,
  },
  {
    id: "bl-03",
    code: "PAR-OBR-003",
    name: "Pavimentación de pistas y veredas",
    projectId: "paris",
    area: "Proyectos y Obras",
    phaseId: "ph-par-3",
    approved: 3100000,
    committed: 210000,
    executed: 0,
  },
  {
    id: "bl-04",
    code: "PAR-LOG-001",
    name: "Compra de tuberías PVC y accesorios",
    projectId: "paris",
    area: "Logística",
    phaseId: "ph-par-2",
    approved: 520000,
    committed: 318000,
    executed: 186000,
  },
  {
    id: "bl-05",
    code: "PAR-MKT-001",
    name: "Campaña de lanzamiento etapa II",
    projectId: "paris",
    area: "Marketing",
    phaseId: null,
    approved: 180000,
    committed: 42000,
    executed: 61000,
  },
  {
    id: "bl-06",
    code: "PAR-POS-001",
    name: "Atención de observaciones de lotes",
    projectId: "paris",
    area: "Posventa",
    phaseId: null,
    approved: 95000,
    committed: 12000,
    executed: 28000,
  },
  {
    id: "bl-07",
    code: "PAR-ADM-001",
    name: "Licencias, trámites municipales y notariales",
    projectId: "paris",
    area: "Administración y Finanzas",
    phaseId: null,
    approved: 140000,
    committed: 18000,
    executed: 87000,
  },
  {
    id: "bl-08",
    code: "SAG-OBR-001",
    name: "Habilitación urbana y muros de contención",
    projectId: "sagaleta",
    area: "Proyectos y Obras",
    phaseId: "ph-sag-1",
    approved: 2750000,
    committed: 860000,
    executed: 1420000,
  },
  {
    id: "bl-09",
    code: "SAG-OBR-002",
    name: "Reservorio y red de agua y desagüe",
    projectId: "sagaleta",
    area: "Proyectos y Obras",
    phaseId: "ph-sag-2",
    approved: 1900000,
    committed: 0,
    executed: 0,
  },
  {
    id: "bl-10",
    code: "SAG-LOG-001",
    name: "Agregados, cemento y acero",
    projectId: "sagaleta",
    area: "Logística",
    phaseId: "ph-sag-1",
    approved: 610000,
    committed: 254000,
    executed: 349000,
  },
  {
    id: "bl-11",
    code: "SAG-MKT-001",
    name: "Showroom y material comercial",
    projectId: "sagaleta",
    area: "Marketing",
    phaseId: null,
    approved: 120000,
    committed: 30000,
    executed: 44000,
  },
  {
    id: "bl-12",
    code: "SAG-POS-001",
    name: "Mesa de ayuda y entrega de lotes",
    projectId: "sagaleta",
    area: "Posventa",
    phaseId: null,
    approved: 60000,
    committed: 8000,
    executed: 9500,
  },
  {
    id: "bl-13",
    code: "SAG-ADM-001",
    name: "Seguros y garantías de obra",
    projectId: "sagaleta",
    area: "Administración y Finanzas",
    phaseId: null,
    approved: 85000,
    committed: 22000,
    executed: 31000,
  },
];

/* ---------- Financial rules ---------- */

/** Available = Approved − Committed − Executed. Committed and executed are never summed twice. */
export const calculateAvailableBalance = (
  line: Pick<BudgetLine, "approved" | "committed" | "executed">,
): number => line.approved - line.committed - line.executed;

/** Share of the approved amount already consumed (committed + executed), 0–100+. */
export const calculateUsagePercent = (
  line: Pick<BudgetLine, "approved" | "committed" | "executed">,
): number => (line.approved === 0 ? 0 : ((line.committed + line.executed) / line.approved) * 100);

export const OVERDRAFT_ALERT_THRESHOLD_PERCENT = 90;

export type BudgetHealth = "healthy" | "warning" | "overdrawn";

export const evaluateBudgetHealth = (
  line: Pick<BudgetLine, "approved" | "committed" | "executed">,
): BudgetHealth => {
  if (calculateAvailableBalance(line) < 0) return "overdrawn";
  if (calculateUsagePercent(line) >= OVERDRAFT_ALERT_THRESHOLD_PERCENT) return "warning";
  return "healthy";
};

/** Returns an error message when a reduction would leave the line below what is already consumed. */
export const validateAdjustment = (
  line: Pick<BudgetLine, "approved" | "committed" | "executed">,
  adjustmentType: AdjustmentType,
  amount: number,
): string | null => {
  if (amount <= 0) return "El monto debe ser mayor a cero.";
  if (adjustmentType === "Reducción" && amount > calculateAvailableBalance(line)) {
    return "La reducción supera el saldo disponible de la partida.";
  }
  return null;
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
