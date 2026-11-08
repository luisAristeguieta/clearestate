import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppLayout } from "@/components/AppLayout";
import { useErp } from "@/context/ErpContext";

export const Route = createFileRoute("/_erp")({
  ssr: false,
  component: ErpShell,
});

function ErpShell() {
  const { isHydrated, activeRole } = useErp();
  const navigate = useNavigate();

  useEffect(() => {
    if (isHydrated && !activeRole) navigate({ to: "/login", replace: true });
  }, [isHydrated, activeRole, navigate]);

  if (!isHydrated || !activeRole) return null;

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
