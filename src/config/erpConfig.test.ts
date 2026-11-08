import { describe, expect, it } from "vitest";

import { calculateAvailableBalance, evaluateBudgetHealth, validateAdjustment } from "@/config/erpConfig";

describe("budget rules", () => {
  it("available = approved - committed - executed", () => {
    expect(calculateAvailableBalance({ approved: 1000, committed: 300, executed: 200 })).toBe(500);
  });

  it("flags a line at or above 90% usage as warning", () => {
    expect(evaluateBudgetHealth({ approved: 1000, committed: 500, executed: 400 })).toBe("warning");
    expect(evaluateBudgetHealth({ approved: 1000, committed: 100, executed: 100 })).toBe("healthy");
  });

  it("flags negative available balance as overdrawn", () => {
    expect(evaluateBudgetHealth({ approved: 1000, committed: 600, executed: 500 })).toBe("overdrawn");
  });

  it("rejects a reduction larger than the available balance", () => {
    expect(validateAdjustment({ approved: 1000, committed: 300, executed: 200 }, "Reducción", 600)).not.toBeNull();
    expect(validateAdjustment({ approved: 1000, committed: 300, executed: 200 }, "Reducción", 500)).toBeNull();
  });
});
