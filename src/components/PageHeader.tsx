import type { ReactNode } from "react";

interface PageHeaderProps {
  code: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ code, title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <span className="pill-badge bg-background text-muted-foreground ring-1 ring-border">{code}</span>
        <h1 className="display-title mt-3 truncate text-4xl">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
