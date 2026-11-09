import type { ReactNode } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECTS, type ProjectFilter } from "@/config/erpConfig";
import { getViewTitle } from "@/config/brandConfig";

export function createPhase3Head(path: string, description: string) {
  const title = getViewTitle(path);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
export function ProjectSelector({
  value,
  onChange,
  allowAll = true,
}: {
  value: ProjectFilter;
  onChange: (value: ProjectFilter) => void;
  allowAll?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Label>Proyecto</Label>
      <Select value={value} onValueChange={(next) => onChange(next as ProjectFilter)}>
        <SelectTrigger aria-label="Proyecto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowAll && <SelectItem value="all">Todos los proyectos</SelectItem>}
          {PROJECTS.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-3xl font-bold tabular-nums">{children}</p>
    </div>
  );
}
export function performPrototypeAction(action: () => void, success: string) {
  try {
    action();
    toast.success(success);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "No se pudo completar la operación.");
  }
}
export function ContactField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
export function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}
