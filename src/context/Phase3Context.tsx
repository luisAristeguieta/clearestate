import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  advanceCampaignDelivery,
  buildCampaignDeliveries,
  retryCampaignDelivery,
  SEED_ORACLE_SALES,
  SEED_PERMISSION_MATRIX,
  triggerAfterSalesSync,
  type AfterSalesCase,
  type Campaign,
  type OracleSale,
  type PrototypeAttachment,
  type PrototypePermissionMatrix,
} from "@/config/phase3Config";

interface Phase3State {
  sales: OracleSale[];
  cases: AfterSalesCase[];
  campaigns: Campaign[];
  permissions: PrototypePermissionMatrix;
  lastSyncedAt: string | null;
}
const buildInitialState = (): Phase3State => ({
  sales: SEED_ORACLE_SALES,
  cases: triggerAfterSalesSync(SEED_ORACLE_SALES, [], "2026-11-08T22:01:00Z"),
  campaigns: [],
  permissions: SEED_PERMISSION_MATRIX,
  lastSyncedAt: null,
});
interface Phase3Value extends Phase3State {
  syncOracle: () => void;
  settleSale: (id: string) => void;
  updateContact: (id: string, email: string, phone: string) => void;
  updateCase: (
    id: string,
    patch: Partial<
      Pick<AfterSalesCase, "estimatedDelivery" | "status" | "deliveryRecord" | "deliveredAt">
    >,
  ) => void;
  createCampaign: (
    input: Pick<
      Campaign,
      "title" | "projectId" | "channel" | "message" | "attachments" | "scheduledAt"
    >,
  ) => void;
  advanceCampaign: (id: string) => void;
  retryDelivery: (campaignId: string, deliveryId: string) => void;
  markFollowup: (campaignId: string, deliveryId: string) => void;
  savePermissions: (matrix: PrototypePermissionMatrix) => void;
}
const Phase3Context = createContext<Phase3Value | null>(null);
const STORAGE_KEY = "clearestate-phase3-simulator-v1";
export function Phase3Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Phase3State>(buildInitialState);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const restored = {
          ...buildInitialState(),
          ...(JSON.parse(stored) as Partial<Phase3State>),
        };
        restored.cases = triggerAfterSalesSync(
          restored.sales,
          restored.cases,
          new Date().toISOString(),
        );
        setState(restored);
      }
    } catch {
      console.error("No se pudo recuperar el simulador de Fase 3.");
    } finally {
      setHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      console.error("No se pudo guardar el simulador. Reduce el tamaño de los adjuntos.");
    }
  }, [state, hydrated]);
  const syncOracle = () => {
    const at = new Date().toISOString();
    setState((previous) => ({
      ...previous,
      cases: triggerAfterSalesSync(previous.sales, previous.cases, at),
      lastSyncedAt: at,
    }));
  };
  const settleSale = (id: string) => {
    const at = new Date().toISOString();
    setState((previous) => {
      const sales = previous.sales.map((sale) =>
        sale.id === id ? { ...sale, balance: 0, paidInstallments: sale.installments } : sale,
      );
      return {
        ...previous,
        sales,
        cases: triggerAfterSalesSync(sales, previous.cases, at),
        lastSyncedAt: at,
      };
    });
  };
  const updateContact = (id: string, email: string, phone: string) =>
    setState((previous) => ({
      ...previous,
      sales: previous.sales.map((sale) =>
        sale.id === id ? { ...sale, email: email.trim(), phone: phone.trim() } : sale,
      ),
    }));
  const updateCase = (
    id: string,
    patch: Partial<
      Pick<AfterSalesCase, "estimatedDelivery" | "status" | "deliveryRecord" | "deliveredAt">
    >,
  ) => {
    const record = state.cases.find((item) => item.id === id);
    if (!record) throw new Error("Expediente no encontrado.");
    if (patch.status === "delivered" && !(patch.deliveryRecord ?? record.deliveryRecord))
      throw new Error("Adjunta el acta final antes de marcar la entrega.");
    setState((previous) => ({
      ...previous,
      cases: previous.cases.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };
  const createCampaign: Phase3Value["createCampaign"] = (input) => {
    if (!input.title.trim() || !input.message.trim())
      throw new Error("Completa el título y el mensaje.");
    const at = new Date().toISOString();
    if (input.scheduledAt && new Date(input.scheduledAt).getTime() <= Date.now())
      throw new Error("La programación debe ser futura.");
    const campaign: Campaign = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: at,
      deliveries: buildCampaignDeliveries(
        state.sales,
        input.projectId,
        input.channel,
        input.scheduledAt,
        at,
      ),
    };
    setState((previous) => ({ ...previous, campaigns: [campaign, ...previous.campaigns] }));
  };
  const advanceCampaign = (id: string) =>
    setState((previous) => ({
      ...previous,
      campaigns: previous.campaigns.map((campaign) =>
        campaign.id === id
          ? {
              ...campaign,
              deliveries: campaign.deliveries.map((delivery) =>
                advanceCampaignDelivery(delivery, campaign.channel, new Date().toISOString()),
              ),
            }
          : campaign,
      ),
    }));
  const retryDelivery = (campaignId: string, deliveryId: string) => {
    const campaign = state.campaigns.find((item) => item.id === campaignId);
    const delivery = campaign?.deliveries.find((item) => item.id === deliveryId);
    const sale = state.sales.find((item) => item.id === delivery?.saleId);
    if (!campaign || !delivery || !sale) throw new Error("Contacto no encontrado.");
    const retried = retryCampaignDelivery(delivery, sale, campaign, new Date().toISOString());
    setState((previous) => ({
      ...previous,
      campaigns: previous.campaigns.map((item) =>
        item.id === campaignId
          ? {
              ...item,
              deliveries: item.deliveries.map((record) =>
                record.id === deliveryId ? retried : record,
              ),
            }
          : item,
      ),
    }));
  };
  const markFollowup = (campaignId: string, deliveryId: string) =>
    setState((previous) => ({
      ...previous,
      campaigns: previous.campaigns.map((campaign) =>
        campaign.id === campaignId
          ? {
              ...campaign,
              deliveries: campaign.deliveries.map((delivery) =>
                delivery.id === deliveryId && delivery.status === "failed"
                  ? { ...delivery, status: "followup" }
                  : delivery,
              ),
            }
          : campaign,
      ),
    }));
  return (
    <Phase3Context.Provider
      value={{
        ...state,
        syncOracle,
        settleSale,
        updateContact,
        updateCase,
        createCampaign,
        advanceCampaign,
        retryDelivery,
        markFollowup,
        savePermissions: (permissions) => setState((previous) => ({ ...previous, permissions })),
      }}
    >
      {children}
    </Phase3Context.Provider>
  );
}
export function usePhase3() {
  const context = useContext(Phase3Context);
  if (!context) throw new Error("Falta Phase3Provider.");
  return context;
}

export async function readPrototypeAttachment(file: File): Promise<PrototypeAttachment> {
  if (file.size > 500000)
    throw new Error("Cada archivo debe pesar como máximo 500 KB en este prototipo.");
  if (file.type !== "application/pdf" && !file.type.startsWith("image/"))
    throw new Error("Selecciona un PDF o una imagen.");

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Archivo no válido."));
      reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
      reader.readAsDataURL(file);
    });
    return { id: crypto.randomUUID(), name: file.name, type: file.type, dataUrl };
  } catch (readError) {
    throw readError instanceof Error
      ? readError
      : new Error("No se pudo procesar el archivo seleccionado.");
  }
}
