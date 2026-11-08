import { describe, expect, it } from "vitest";

import type { BudgetLine } from "@/config/erpConfig";
import {
  applyCommitment,
  applyExecution,
  buildContasisCsv,
  calculateInvoiceTotals,
  evaluateRequisitionOverdraft,
  validateMilestoneSplit,
  validateRequisition,
  type ExpenseInvoice,
} from "@/config/phase2Config";

const baseLine: BudgetLine = {
  id: "bl-test",
  code: "PAR-OBR-009",
  name: "Partida de prueba",
  projectId: "paris",
  area: "Proyectos y Obras",
  phaseId: null,
  approved: 100000,
  committed: 30000,
  executed: 20000,
};

describe("evaluateRequisitionOverdraft", () => {
  it("marca sobregiro cuando el importe supera el saldo disponible", () => {
    const check = evaluateRequisitionOverdraft(baseLine, 60000);
    expect(check.isOverdrawn).toBe(true);
    expect(check.availableBalance).toBe(50000);
    expect(check.deficit).toBe(10000);
  });

  it("no marca sobregiro cuando el importe cabe en el disponible", () => {
    expect(evaluateRequisitionOverdraft(baseLine, 50000).isOverdrawn).toBe(false);
  });
});

describe("validateRequisition", () => {
  it("exige justificación detallada cuando hay sobregiro", () => {
    expect(validateRequisition(baseLine, 60000, "corto")).toContain("justificación detallada");
    expect(validateRequisition(baseLine, 60000, "Justificación amplia y detallada del gasto")).toBeNull();
  });
});

describe("applyCommitment / applyExecution", () => {
  it("la orden de compra sube el comprometido sin tocar lo ejecutado", () => {
    const updated = applyCommitment(baseLine, 18500);
    expect(updated.committed).toBe(48500);
    expect(updated.executed).toBe(20000);
  });

  it("la factura validada mueve el monto de comprometido a ejecutado", () => {
    const updated = applyExecution(baseLine, 18500);
    expect(updated.committed).toBe(11500);
    expect(updated.executed).toBe(38500);
    expect(updated.approved - updated.committed - updated.executed).toBe(50000);
  });
});

describe("calculateInvoiceTotals", () => {
  it("calcula el IVA del 15% y el total", () => {
    const totals = calculateInvoiceTotals(1000);
    expect(totals.taxAmount).toBe(150);
    expect(totals.total).toBe(1150);
  });
});

describe("validateMilestoneSplit", () => {
  it("rechaza hitos que no suman el monto del contrato", () => {
    expect(validateMilestoneSplit(100000, [{ amount: 60000 }])).toContain("igual al monto");
    expect(validateMilestoneSplit(100000, [{ amount: 60000 }, { amount: 40000 }])).toBeNull();
  });
});

describe("buildContasisCsv", () => {
  it("exporta una fila tabular con los campos contables", () => {
    const invoice: ExpenseInvoice = {
      id: "fac-x",
      purchaseOrderId: "oc-x",
      issuerName: "Labotest Ingeniería S.A.",
      issuerTaxId: "1790012345001",
      invoiceNumber: "001-002-000481",
      subtotal: 1000,
      taxAmount: 150,
      total: 1150,
      pdfFileName: "factura.pdf",
      status: "validated",
      uploadedBy: "Roberto Silva",
      uploadedAt: "2026-11-06T10:25:00.000Z",
      reviewedBy: "Lucía Castro",
      reviewedAt: "2026-11-07T09:00:00.000Z",
    };
    const csv = buildContasisCsv([{ invoice, orderCode: "OC-2026-001", budgetLineCode: "PAR-OBR-002", projectName: "Proyecto París" }]);
    const [header, row] = csv.split("\n");
    expect(header).toBe("TIPO_DOC;SERIE;NUMERO;FECHA_EMISION;RUC_EMISOR;RAZON_SOCIAL;SUBTOTAL;IVA;TOTAL;PROYECTO;PARTIDA;ORDEN");
    expect(row).toBe("01;001;002000481;2026-11-06;1790012345001;Labotest Ingeniería S.A.;1000.00;150.00;1150.00;Proyecto París;PAR-OBR-002;OC-2026-001");
  });
});
