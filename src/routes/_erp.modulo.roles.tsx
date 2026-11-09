import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronsUpDown, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { createPhase3Head, performPrototypeAction } from "@/components/phase3/Phase3Shared";
import { RoleAvatar } from "@/components/RoleAvatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [expandedRoleIds, setExpandedRoleIds] = useState<Record<string, boolean>>({});

  useEffect(() => setDraft(permissions), [permissions]);

  const allPermissions = Object.keys(PERMISSION_LABELS) as PrototypePermission[];

  const toggleRole = (roleId: string) => {
    setExpandedRoleIds((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  };

  const areAllExpanded = ERP_ROLES.every((role) => expandedRoleIds[role.id]);

  const toggleExpandAll = () => {
    if (areAllExpanded) {
      setExpandedRoleIds({});
    } else {
      const next: Record<string, boolean> = {};
      ERP_ROLES.forEach((role) => {
        next[role.id] = true;
      });
      setExpandedRoleIds(next);
    }
  };

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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-semibold"
              onClick={toggleExpandAll}
            >
              <ChevronsUpDown className="mr-1.5 h-3.5 w-3.5" />
              {areAllExpanded ? "Colapsar todos" : "Expandir todos"}
            </Button>
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

      {/* Lista de Tarjetas de Roles con Acordeón Desplegable */}
      <div className="space-y-3.5">
        {ERP_ROLES.map((role) => {
          const rolePermissions = draft[role.id] ?? [];
          const isAllSelected = rolePermissions.length === allPermissions.length;
          const isExpanded = Boolean(expandedRoleIds[role.id]);

          return (
            <article
              key={role.id}
              className={cn(
                "surface-card overflow-hidden p-0 transition-all duration-200 border border-border",
                isExpanded
                  ? "shadow-sm border-primary/30"
                  : "hover:border-primary/30 hover:shadow-2xs",
              )}
            >
              {/* Cabecera del Acordeón (Clickeable / Desplegable) */}
              <div
                onClick={() => toggleRole(role.id)}
                className="flex cursor-pointer items-center justify-between gap-4 p-5 transition-colors select-none hover:bg-secondary/40"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleRole(role.id);
                  }
                }}
                aria-expanded={isExpanded}
              >
                {/* Lado izquierdo: Avatar + Nombre del Rol + Cargo */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <RoleAvatar role={role} sizeClass="h-10 w-10 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-foreground truncate">
                        {role.roleName}
                      </h2>
                      {role.isExternal && (
                        <span className="shrink-0 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          Externo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {role.personName} · {role.jobTitle}
                    </p>
                  </div>
                </div>

                {/* Lado derecho: Conteo de permisos activos + Flecha Indicadora de Expansión */}
                <div className="flex items-center gap-3 shrink-0">
                  {!role.isExternal && (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums transition-colors",
                        rolePermissions.length > 0
                          ? "border border-primary/20 bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {rolePermissions.length} de {allPermissions.length} permisos
                    </span>
                  )}

                  {/* Indicador de Despliegue (Flecha animada) */}
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full border border-border/80 bg-secondary/80 text-foreground transition-all duration-200",
                      isExpanded && "rotate-180 border-primary/20 bg-primary/10 text-primary",
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </div>
              </div>

              {/* Contenido Expandible: Matriz de Checkboxes de Permisos */}
              {isExpanded && (
                <div className="border-t border-border/70 bg-card p-5 pt-4 transition-all">
                  <div className="mb-3.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Permisos y módulos autorizados
                    </span>
                    {!role.isExternal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAllForRole(role.id);
                        }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {isAllSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                      </button>
                    )}
                  </div>

                  {role.isExternal ? (
                    <p className="py-2 text-xs italic text-muted-foreground">
                      Proveedor externo · Solo portal por invitación externa, sin acceso a módulos
                      internos del ERP.
                    </p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {allPermissions.map((permission) => {
                        const isChecked = rolePermissions.includes(permission);
                        return (
                          <label
                            key={permission}
                            className={cn(
                              "flex cursor-pointer select-none items-center gap-3 rounded-xl border p-3 text-xs font-medium transition-all",
                              isChecked
                                ? "border-primary/30 bg-primary/5 font-semibold text-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                            )}
                            onClick={(e) => e.stopPropagation()}
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
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
