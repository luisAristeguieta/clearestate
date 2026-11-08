import { createFileRoute } from "@tanstack/react-router";
import { Save, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createPhase3Head, performPrototypeAction } from "@/components/phase3/Phase3Shared";
import { ERP_ROLES } from "@/config/erpConfig";
import { PERMISSION_LABELS, SEED_PERMISSION_MATRIX, type PrototypePermission } from "@/config/phase3Config";
import { usePhase3 } from "@/context/Phase3Context";
export const Route = createFileRoute("/_erp/modulo/roles")({ head: () => createPhase3Head("/modulo/roles", "Matriz ilustrativa de autorizaciones para los ocho roles del prototipo ClearEstate."), component: RolesPage });
function RolesPage() {
  const { permissions, savePermissions } = usePhase3(); const [draft, setDraft] = useState(permissions); useEffect(() => setDraft(permissions), [permissions]);
  return <div className="phase2-view"><PageHeader title="Administración y Roles" description="Matriz ilustrativa · 8 roles del sistema" actions={<Button onClick={() => performPrototypeAction(() => savePermissions(draft), "Matriz ilustrativa guardada.")}><Save /> Guardar matriz</Button>} /><p className="mb-8 border-y border-border py-4 text-sm text-muted-foreground">Prototipo sin autenticación real: esta matriz documenta autorizaciones propuestas; no protege datos ni restringe accesos.</p><div className="space-y-6">{ERP_ROLES.map((role) => <article key={role.id} className="surface-card"><div className="flex items-center gap-4"><img src={role.avatarUrl} alt={role.personName} className="h-12 w-12 rounded-full object-cover" /><div><h2 className="font-bold">{role.area}</h2><p className="text-sm text-muted-foreground">{role.personName} · {role.jobTitle}</p></div></div>{role.isExternal ? <p className="mt-5 text-sm text-muted-foreground">Proveedor externo · Solo portal por invitación, sin menú interno.</p> : <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{(Object.keys(PERMISSION_LABELS) as PrototypePermission[]).map((permission) => <label key={permission} className="flex items-center gap-3 text-sm"><Checkbox aria-label={`${role.area}: ${PERMISSION_LABELS[permission]}`} checked={draft[role.id].includes(permission)} onCheckedChange={(checked) => setDraft((previous) => ({ ...previous, [role.id]: checked === true ? [...previous[role.id], permission] : previous[role.id].filter((item) => item !== permission) }))} />{PERMISSION_LABELS[permission]}</label>)}</div>}</article>)}</div><Button className="mt-8" variant="outline" onClick={() => setDraft(SEED_PERMISSION_MATRIX)}><RotateCcw /> Restaurar propuesta inicial</Button></div>;
}