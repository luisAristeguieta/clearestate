import type { useNavigate } from "@tanstack/react-router";

import type { RoleId } from "@/config/erpConfig";

export interface RolePermissionConfig {
  homeRoute: string;
  allowedRoutes: readonly string[];
  isExternal?: boolean;
}

/** Todos los módulos y rutas internas del ERP accesibles por el Superusuario Administrador */
export const ALL_INTERNAL_ROUTES: readonly string[] = [
  "/dashboard",
  "/proyectos",
  "/modulo/requerimientos",
  "/modulo/aprobaciones",
  "/modulo/logistica",
  "/modulo/comprobantes",
  "/modulo/contratos",
  "/modulo/oracle",
  "/modulo/posventa",
  "/modulo/campanas",
  "/modulo/informes",
  "/modulo/roles",
  "/modulo/asistente-ia",
] as const;

export const ROLE_PERMISSIONS: Record<RoleId, RolePermissionConfig> = {
  systemAdmin: {
    homeRoute: "/dashboard",
    allowedRoutes: ALL_INTERNAL_ROUTES,
  },
  marketing: {
    homeRoute: "/modulo/requerimientos",
    allowedRoutes: ["/modulo/requerimientos", "/modulo/campanas"],
  },
  management: {
    homeRoute: "/dashboard",
    allowedRoutes: [
      "/dashboard",
      "/modulo/aprobaciones",
      "/modulo/informes",
      "/modulo/asistente-ia",
    ],
  },
  logistics: {
    homeRoute: "/modulo/logistica",
    allowedRoutes: ["/modulo/logistica", "/modulo/requerimientos"],
  },
  finance: {
    homeRoute: "/modulo/comprobantes",
    allowedRoutes: ["/modulo/comprobantes", "/modulo/informes"],
  },
  projects: {
    homeRoute: "/modulo/contratos",
    allowedRoutes: ["/modulo/contratos", "/proyectos", "/modulo/requerimientos"],
  },
  postSales: {
    homeRoute: "/modulo/posventa",
    allowedRoutes: ["/modulo/posventa", "/modulo/oracle", "/modulo/campanas"],
  },
  externalSupplier: {
    homeRoute: "/portal-proveedor/prov-andes-01",
    allowedRoutes: ["/portal-proveedor"],
    isExternal: true,
  },
};

export function getHomeRouteForRole(roleId: RoleId): string {
  return ROLE_PERMISSIONS[roleId]?.homeRoute ?? "/login";
}

export function getAllowedRoutesForRole(roleId: RoleId): readonly string[] {
  return ROLE_PERMISSIONS[roleId]?.allowedRoutes ?? [];
}

export function isExternalRole(roleId: RoleId): boolean {
  return ROLE_PERMISSIONS[roleId]?.isExternal === true;
}

export function isRouteAllowedForRole(roleId: RoleId, pathname: string): boolean {
  const config = ROLE_PERMISSIONS[roleId];
  if (!config) return false;

  // External supplier cannot access any internal ERP route
  if (config.isExternal) {
    return pathname.startsWith("/portal-proveedor");
  }

  // System Administrator has global audit and supervision access across all internal ERP modules
  if (roleId === "systemAdmin") {
    return !pathname.startsWith("/portal-proveedor");
  }

  // Non-external roles are allowed to access their declared paths or subpaths
  return config.allowedRoutes.some((route) => {
    if (pathname === route) return true;
    if (pathname.startsWith(`${route}/`)) return true;
    return false;
  });
}

export type RoleNavigator = ReturnType<typeof useNavigate>;

export function navigateToRoleHome(navigate: RoleNavigator, roleId: RoleId): void {
  switch (roleId) {
    case "systemAdmin":
      navigate({ to: "/dashboard", replace: true });
      break;
    case "marketing":
      navigate({ to: "/modulo/$moduleId", params: { moduleId: "requerimientos" }, replace: true });
      break;
    case "management":
      navigate({ to: "/dashboard", replace: true });
      break;
    case "logistics":
      navigate({ to: "/modulo/$moduleId", params: { moduleId: "logistica" }, replace: true });
      break;
    case "finance":
      navigate({ to: "/modulo/$moduleId", params: { moduleId: "comprobantes" }, replace: true });
      break;
    case "projects":
      navigate({ to: "/modulo/$moduleId", params: { moduleId: "contratos" }, replace: true });
      break;
    case "postSales":
      navigate({ to: "/modulo/$moduleId", params: { moduleId: "posventa" }, replace: true });
      break;
    case "externalSupplier":
      navigate({
        to: "/portal-proveedor/$token",
        params: { token: "prov-andes-01" },
        replace: true,
      });
      break;
    default:
      navigate({ to: "/login", replace: true });
      break;
  }
}
