import { describe, expect, it } from "vitest";

import {
  getAllowedRoutesForRole,
  getHomeRouteForRole,
  isExternalRole,
  isRouteAllowedForRole,
} from "@/auth/permissions";
import { ERP_ROLES, type RoleId } from "@/config/erpConfig";

describe("RBAC — Permisos y Redirección por Rol", () => {
  it("contiene los 8 roles oficiales del sistema", () => {
    expect(ERP_ROLES).toHaveLength(8);
    const roleIds = ERP_ROLES.map((role) => role.id);
    expect(roleIds).toEqual([
      "management",
      "systemAdmin",
      "marketing",
      "logistics",
      "finance",
      "projects",
      "postSales",
      "externalSupplier",
    ]);
  });

  describe("getHomeRouteForRole", () => {
    it("asigna la ruta de inicio canónica para cada rol", () => {
      expect(getHomeRouteForRole("systemAdmin")).toBe("/dashboard");
      expect(getHomeRouteForRole("marketing")).toBe("/modulo/requerimientos");
      expect(getHomeRouteForRole("management")).toBe("/dashboard");
      expect(getHomeRouteForRole("logistics")).toBe("/modulo/logistica");
      expect(getHomeRouteForRole("finance")).toBe("/modulo/comprobantes");
      expect(getHomeRouteForRole("projects")).toBe("/modulo/contratos");
      expect(getHomeRouteForRole("postSales")).toBe("/modulo/posventa");
      expect(getHomeRouteForRole("externalSupplier")).toBe("/portal-proveedor/prov-andes-01");
    });
  });

  describe("isExternalRole", () => {
    it("identifica exclusivamente a externalSupplier como rol externo", () => {
      expect(isExternalRole("externalSupplier")).toBe(true);

      const internalRoles: RoleId[] = [
        "systemAdmin",
        "marketing",
        "management",
        "logistics",
        "finance",
        "projects",
        "postSales",
      ];
      for (const roleId of internalRoles) {
        expect(isExternalRole(roleId)).toBe(false);
      }
    });
  });

  describe("isRouteAllowedForRole", () => {
    it("systemAdmin tiene acceso global de supervisión y auditoría a todos los módulos internos", () => {
      expect(isRouteAllowedForRole("systemAdmin", "/modulo/roles")).toBe(true);
      expect(isRouteAllowedForRole("systemAdmin", "/proyectos")).toBe(true);
      expect(isRouteAllowedForRole("systemAdmin", "/presupuestos")).toBe(true);
      expect(isRouteAllowedForRole("systemAdmin", "/dashboard")).toBe(true);
      expect(isRouteAllowedForRole("systemAdmin", "/modulo/logistica")).toBe(true);
      expect(isRouteAllowedForRole("systemAdmin", "/modulo/aprobaciones")).toBe(true);
      expect(isRouteAllowedForRole("systemAdmin", "/modulo/comprobantes")).toBe(true);
      expect(isRouteAllowedForRole("systemAdmin", "/modulo/contratos")).toBe(true);
      expect(isRouteAllowedForRole("systemAdmin", "/modulo/oracle")).toBe(true);
      expect(isRouteAllowedForRole("systemAdmin", "/modulo/posventa")).toBe(true);
      expect(isRouteAllowedForRole("systemAdmin", "/modulo/campanas")).toBe(true);
      expect(isRouteAllowedForRole("systemAdmin", "/modulo/informes")).toBe(true);
      expect(isRouteAllowedForRole("systemAdmin", "/modulo/asistente-ia")).toBe(true);

      // Bloqueado estrictamente del portal público del proveedor externo
      expect(isRouteAllowedForRole("systemAdmin", "/portal-proveedor/prov-andes-01")).toBe(false);
    });

    it("marketing solo accede a requerimientos y campañas (con subrutas)", () => {
      expect(isRouteAllowedForRole("marketing", "/modulo/requerimientos")).toBe(true);
      expect(isRouteAllowedForRole("marketing", "/modulo/campanas")).toBe(true);
      expect(isRouteAllowedForRole("marketing", "/modulo/campanas/seguimiento")).toBe(true);

      expect(isRouteAllowedForRole("marketing", "/dashboard")).toBe(false);
      expect(isRouteAllowedForRole("marketing", "/presupuestos")).toBe(false);
      expect(isRouteAllowedForRole("marketing", "/modulo/aprobaciones")).toBe(false);
      expect(isRouteAllowedForRole("marketing", "/modulo/logistica")).toBe(false);
    });

    it("management (Gerencia) accede a tablero, presupuestos, aprobaciones, informes e IA", () => {
      expect(isRouteAllowedForRole("management", "/dashboard")).toBe(true);
      expect(isRouteAllowedForRole("management", "/presupuestos")).toBe(true);
      expect(isRouteAllowedForRole("management", "/modulo/aprobaciones")).toBe(true);
      expect(isRouteAllowedForRole("management", "/modulo/informes")).toBe(true);
      expect(isRouteAllowedForRole("management", "/modulo/asistente-ia")).toBe(true);

      expect(isRouteAllowedForRole("management", "/modulo/contratos")).toBe(false);
      expect(isRouteAllowedForRole("management", "/modulo/logistica")).toBe(false);
      expect(isRouteAllowedForRole("management", "/modulo/oracle")).toBe(false);
    });

    it("logistics (Logística) accede a compras, invitaciones y lectura de requerimientos", () => {
      expect(isRouteAllowedForRole("logistics", "/modulo/logistica")).toBe(true);
      expect(isRouteAllowedForRole("logistics", "/modulo/requerimientos")).toBe(true);

      expect(isRouteAllowedForRole("logistics", "/dashboard")).toBe(false);
      expect(isRouteAllowedForRole("logistics", "/presupuestos")).toBe(false);
      expect(isRouteAllowedForRole("logistics", "/modulo/comprobantes")).toBe(false);
    });

    it("finance (Finanzas) accede a comprobantes, presupuestos e informes", () => {
      expect(isRouteAllowedForRole("finance", "/modulo/comprobantes")).toBe(true);
      expect(isRouteAllowedForRole("finance", "/presupuestos")).toBe(true);
      expect(isRouteAllowedForRole("finance", "/modulo/informes")).toBe(true);

      expect(isRouteAllowedForRole("finance", "/dashboard")).toBe(false);
      expect(isRouteAllowedForRole("finance", "/modulo/contratos")).toBe(false);
      expect(isRouteAllowedForRole("finance", "/modulo/aprobaciones")).toBe(false);
    });

    it("projects (Proyectos) accede a contratos, proyectos y requerimientos", () => {
      expect(isRouteAllowedForRole("projects", "/modulo/contratos")).toBe(true);
      expect(isRouteAllowedForRole("projects", "/proyectos")).toBe(true);
      expect(isRouteAllowedForRole("projects", "/modulo/requerimientos")).toBe(true);

      expect(isRouteAllowedForRole("projects", "/dashboard")).toBe(false);
      expect(isRouteAllowedForRole("projects", "/presupuestos")).toBe(false);
      expect(isRouteAllowedForRole("projects", "/modulo/posventa")).toBe(false);
    });

    it("postSales (Posventa) accede a posventa, oracle, comprador y campañas", () => {
      expect(isRouteAllowedForRole("postSales", "/modulo/posventa")).toBe(true);
      expect(
        isRouteAllowedForRole("postSales", "/modulo/posventa/comprador/sale-sagaleta-01"),
      ).toBe(true);
      expect(isRouteAllowedForRole("postSales", "/modulo/oracle")).toBe(true);
      expect(isRouteAllowedForRole("postSales", "/modulo/campanas")).toBe(true);
      expect(isRouteAllowedForRole("postSales", "/modulo/campanas/seguimiento")).toBe(true);

      expect(isRouteAllowedForRole("postSales", "/dashboard")).toBe(false);
      expect(isRouteAllowedForRole("postSales", "/modulo/logistica")).toBe(false);
      expect(isRouteAllowedForRole("postSales", "/modulo/comprobantes")).toBe(false);
    });

    it("externalSupplier tiene aislamiento estricto fuera del ERP interno", () => {
      expect(isRouteAllowedForRole("externalSupplier", "/portal-proveedor/prov-andes-01")).toBe(
        true,
      );
      expect(isRouteAllowedForRole("externalSupplier", "/portal-proveedor/otro-token")).toBe(true);

      expect(isRouteAllowedForRole("externalSupplier", "/dashboard")).toBe(false);
      expect(isRouteAllowedForRole("externalSupplier", "/proyectos")).toBe(false);
      expect(isRouteAllowedForRole("externalSupplier", "/presupuestos")).toBe(false);
      expect(isRouteAllowedForRole("externalSupplier", "/modulo/logistica")).toBe(false);
      expect(isRouteAllowedForRole("externalSupplier", "/modulo/requerimientos")).toBe(false);
    });
  });

  describe("getAllowedRoutesForRole", () => {
    it("systemAdmin retorna todas las rutas internas del ERP", () => {
      const adminRoutes = getAllowedRoutesForRole("systemAdmin");
      expect(adminRoutes).toContain("/dashboard");
      expect(adminRoutes).toContain("/modulo/roles");
      expect(adminRoutes).toContain("/modulo/logistica");
      expect(adminRoutes).toContain("/modulo/posventa");
      expect(adminRoutes).not.toContain("/portal-proveedor");
    });

    it("retorna la lista inmutable de rutas autorizadas", () => {
      const logisticsRoutes = getAllowedRoutesForRole("logistics");
      expect(logisticsRoutes).toContain("/modulo/logistica");
      expect(logisticsRoutes).toContain("/modulo/requerimientos");
      expect(logisticsRoutes).not.toContain("/dashboard");
    });
  });
});
