import { describe, expect, it } from "vitest";
import { buildCriticalActions } from "./dashboardConfig";
import { calculateAvailableBalance, SEED_BUDGET_LINES, type BudgetLine } from "./erpConfig";

describe("dashboard financial overview", () => {
  it("shows the requested initial total available balance of USD 6,408,500", () => {
    expect(SEED_BUDGET_LINES.reduce((total, line) => total + calculateAvailableBalance(line), 0)).toBe(6408500);
  });

  it("orders overdrafts before budget warnings and today's approvals", () => {
    const baseLine = SEED_BUDGET_LINES[0];
    if (!baseLine) throw new Error("Missing seed budget");
    const lines: BudgetLine[] = [
      { ...baseLine, id: "warning", approved: 100, committed: 90, executed: 0 },
      { ...baseLine, id: "overdraft", approved: 100, committed: 110, executed: 0 },
    ];
    expect(buildCriticalActions(lines, "all").slice(0, 3).map((action) => action.id)).toEqual(["overdraft", "warning", "approval"]);
  });
});