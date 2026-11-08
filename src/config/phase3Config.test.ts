import { describe, expect, it } from "vitest";
import { advanceCampaignDelivery, buildCampaignDeliveries, matchesReportDate, retryCampaignDelivery, SEED_ORACLE_SALES, selectCampaignRecipients, triggerAfterSalesSync } from "./phase3Config";

describe("Oracle → Posventa", () => {
  it("creates cases only for balances exactly zero", () => {
    const fixture = SEED_ORACLE_SALES[0];
    if (!fixture) throw new Error("Missing fixture");
    const sales = [0, 0.01, -1, 18500].map((balance, index) => ({ ...fixture, id: `sale-${index}`, balance }));
    expect(triggerAfterSalesSync(sales, [], "2026-11-08").map((record) => record.saleId)).toEqual(["sale-0"]);
  });
  it("does not duplicate a case on repeated sync or duplicated source rows", () => {
    const first = triggerAfterSalesSync(SEED_ORACLE_SALES, [], "2026-11-08");
    expect(first).toHaveLength(4);
    expect(triggerAfterSalesSync([...SEED_ORACLE_SALES, ...SEED_ORACLE_SALES], first, "2026-11-09")).toEqual(first);
  });
});
describe("Project-segmented campaigns", () => {
  it("París never includes Sagaleta buyers", () => { expect(selectCampaignRecipients(SEED_ORACLE_SALES, "paris").map((sale) => sale.id)).toEqual(["sale-01", "sale-02", "sale-04"]); });
  it("Sagaleta never includes París buyers", () => { expect(selectCampaignRecipients(SEED_ORACLE_SALES, "sagaleta").map((sale) => sale.id)).toEqual(["sale-03", "sale-05", "sale-06"]); });
  it("schedules all recipients without claiming a send", () => { expect(buildCampaignDeliveries(SEED_ORACLE_SALES, "paris", "email", "2026-11-09", "2026-11-08").map((delivery) => [delivery.status, delivery.attempts])).toEqual([["scheduled", 0], ["scheduled", 0], ["scheduled", 0]]); });
  it("invalid contacts fail and corrected contacts can be retried", () => {
    const failed = buildCampaignDeliveries(SEED_ORACLE_SALES, "paris", "email", null, "2026-11-08").find((delivery) => delivery.saleId === "sale-04");
    const sale = SEED_ORACLE_SALES.find((item) => item.id === "sale-04");
    if (!failed || !sale) throw new Error("Missing fixture");
    expect(failed.status).toBe("failed");
    expect(retryCampaignDelivery(failed, { ...sale, email: "jorge@example.com" }, { channel: "email", projectId: "paris" }, "2026-11-09").status).toBe("delivered");
  });
  it("rejects a retry for the wrong project", () => {
    const failed = { id: "d1", saleId: "sale-03", contact: "", status: "failed" as const, attempts: 1, reason: null, updatedAt: "2026-11-08" };
    const sale = SEED_ORACLE_SALES.find((item) => item.id === "sale-03");
    if (!sale) throw new Error("Missing fixture");
    expect(() => retryCampaignDelivery(failed, sale, { channel: "email", projectId: "paris" }, "2026-11-09")).toThrow();
  });
  it("distinguishes sent from delivered", () => {
    const delivery = buildCampaignDeliveries(SEED_ORACLE_SALES, "sagaleta", "whatsapp", "2026-11-09", "2026-11-08")[0];
    if (!delivery) throw new Error("Missing fixture");
    const sent = advanceCampaignDelivery(delivery, "whatsapp", "2026-11-09");
    expect(sent.status).toBe("sent");
    expect(advanceCampaignDelivery(sent, "whatsapp", "2026-11-09").status).toBe("delivered");
  });
});
it("filters dates inclusively", () => { expect(matchesReportDate("2026-11-08T22:01:00Z", { from: "2026-11-08", to: "2026-11-08" })).toBe(true); expect(matchesReportDate("2026-11-07", { from: "2026-11-08", to: "2026-11-08" })).toBe(false); });