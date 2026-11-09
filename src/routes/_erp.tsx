import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const Route = createFileRoute("/_erp")({
  ssr: false,
  component: ErpShell,
});

function ErpShell() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
}
