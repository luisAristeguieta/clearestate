export const BRAND_NAME = "ClearEstate ERP";

const VIEW_TITLES: Record<string, string> = {
  "/": "Inicio",
  "/login": "Login",
  "/dashboard": "Centro de Control",
  "/presupuestos": "Presupuestos y Proyectos",
  "/proyectos": "Presupuestos y Proyectos",
  "/modulo/requerimientos": "Requerimientos y Solicitudes",
  "/modulo/aprobaciones": "Aprobaciones Gerenciales",
  "/modulo/logistica": "Adquisiciones y Proveedores",
  "/modulo/contratos": "Adquisiciones y Proveedores",
  "/modulo/comprobantes": "Ejecución de Gastos",
  "/modulo/oracle": "Posventa y Comunicaciones",
  "/modulo/posventa": "Posventa y Comunicaciones",
  "/modulo/campanas": "Posventa y Comunicaciones",
  "/modulo/informes": "Informes Gerenciales",
  "/modulo/asistente-ia": "Informes Gerenciales",
  "/modulo/roles": "Administración del Sistema",
};

export function getViewTitle(pathname: string): string {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return `${VIEW_TITLES[normalizedPath] ?? "Página no encontrada"} · ${BRAND_NAME}`;
}