import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { RoleAvatar } from "@/components/RoleAvatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createPhase3Head, performPrototypeAction } from "@/components/phase3/Phase3Shared";
import { ERP_ROLES } from "@/config/erpConfig";
import {
  PERMISSION_LABELS,
  SEED_PERMISSION_MATRIX,
  type PrototypePermission,
} from "@/config/phase3Config";
import { usePhase3 } from "@/context/Phase3Context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_erp/modulo/roles")({
  head: () =>
    createPhase3Head(
      "/modulo/roles",
      "Matriz ilustrativa de autorizaciones para los ocho roles del prototipo ClearEstate.",
    ),
  component: RolesPage,
});

function RolesPage() {
  const { permissions, savePermissions } = usePhase3();
  const [draft, setDraft] = useState(permissions);

  useEffect(() => setDraft(permissions), [permissions]);

  const allPermissions = Object.keys(PERMISSION_LABELS) as PrototypePermission[];

  const handleToggleAllForRole = (roleId: (typeof ERP_ROLES)[number]["id"]) => {
    const current = draft[roleId] ?? [];
    const shouldSelectAll = current.length < allPermissions.length;
    setDraft((prev) => ({
      ...prev,
      [roleId]: shouldSelectAll ? [...allPermissions] : [],
    }));
  };

  return (
    <div className="phase2-view">
      <PageHeader
        title="Administración y Roles"
        description="Matriz ilustrativa · 8 roles del sistema"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-semibold"
              onClick={() => setDraft(SEED_PERMISSION_MATRIX)}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restaurar propuesta
            </Button>
            <Button
              size="sm"
              className="rounded-full text-xs font-semibold"
              onClick={() =>
                performPrototypeAction(() => savePermissions(draft), "Matriz ilustrativa guardada.")
              }
            >
              <Save className="mr-1.5 h-3.5 w-3.5" /> Guardar matriz
            </Button>
          </div>
        }
      />

      <p className="mb-6 rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
        Prototipo sin autenticación real: esta matriz documenta autorizaciones propuestas; no
        protege datos ni restringe accesos.
      </p>

      <div className="space-y-5">
        {ERP_ROLES.map((role) => {
          const rolePermissions = draft[role.id] ?? [];
          const isAllSelected = rolePermissions.length === allPermissions.length;

          return (
            <article
              key={role.id}
              className="surface-card p-6 transition-all hover:border-primary/20 hover:shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
                <div className="flex items-center gap-3.5">
                  <RoleAvatar role={role} sizeClass="h-11 w-11" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-foreground">{role.roleName}</h2>
                      {role.isExternal && (
                        <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          Externo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {role.personName} · {role.jobTitle}
                    </p>
                  </div>
                </div>

                {!role.isExternal && (
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {rolePermissions.length} de {allPermissions.length} permisos
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleAllForRole(role.id)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {isAllSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                    </button>
                  </div>
                )}
              </div>

              {role.isExternal ? (
                <p className="mt-4 text-xs italic text-muted-foreground">
                  Proveedor externo · Solo portal por invitación, sin menú interno.
                </p>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {allPermissions.map((permission) => {
                    const isChecked = rolePermissions.includes(permission);
                    return (
                      <label
                        key={permission}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 text-xs font-medium cursor-pointer transition-all select-none",
                          isChecked
                            ? "border-primary/30 bg-primary/5 text-foreground font-semibold"
                            : "border-border bg-background text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                        )}
                      >
                        <Checkbox
                          aria-label={`${role.area}: ${PERMISSION_LABELS[permission]}`}
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            setDraft((previous) => ({
                              ...previous,
                              [role.id]:
                                checked === true
                                  ? [...previous[role.id], permission]
                                  : previous[role.id].filter((item) => item !== permission),
                            }))
                          }
                        />
                        <span className="truncate">{PERMISSION_LABELS[permission]}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
