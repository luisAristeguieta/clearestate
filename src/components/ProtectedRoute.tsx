import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";

import { isExternalRole, isRouteAllowedForRole, navigateToRoleHome } from "@/auth/permissions";
import { useErp } from "@/context/ErpContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isHydrated, activeRole } = useErp();
  const navigate = useNavigate();
  const currentPath = useRouterState({
    select: (routerState) => routerState.location.pathname,
  });

  useEffect(() => {
    if (!isHydrated) return;

    if (!activeRole) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (isExternalRole(activeRole.id)) {
      toast.info(
        "Acceso restringido: los proveedores externos usan exclusivamente su portal con enlace seguro.",
      );
      navigateToRoleHome(navigate, activeRole.id);
      return;
    }

    if (!isRouteAllowedForRole(activeRole.id, currentPath)) {
      toast.warning("Acceso restringido: tu rol no tiene permisos para este módulo.");
      navigateToRoleHome(navigate, activeRole.id);
    }
  }, [isHydrated, activeRole, currentPath, navigate]);

  if (!isHydrated || !activeRole) return null;
  if (isExternalRole(activeRole.id)) return null;
  if (!isRouteAllowedForRole(activeRole.id, currentPath)) return null;

  return <>{children}</>;
}
