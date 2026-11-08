import { describe, expect, it } from "vitest";

import { getTimeGreeting } from "@/routes/_erp.dashboard";

describe("getTimeGreeting", () => {
  it("saluda con Buenos días de 05:00 a 11:59", () => {
    expect(getTimeGreeting(5)).toBe("Buenos días");
    expect(getTimeGreeting(9)).toBe("Buenos días");
    expect(getTimeGreeting(11)).toBe("Buenos días");
  });

  it("saluda con Buenas tardes de 12:00 a 18:59", () => {
    expect(getTimeGreeting(12)).toBe("Buenas tardes");
    expect(getTimeGreeting(15)).toBe("Buenas tardes");
    expect(getTimeGreeting(18)).toBe("Buenas tardes");
  });

  it("saluda con Buenas noches de 19:00 a 04:59", () => {
    expect(getTimeGreeting(19)).toBe("Buenas noches");
    expect(getTimeGreeting(23)).toBe("Buenas noches");
    expect(getTimeGreeting(0)).toBe("Buenas noches");
    expect(getTimeGreeting(4)).toBe("Buenas noches");
  });
});
