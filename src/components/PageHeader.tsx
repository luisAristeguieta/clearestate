import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 grid grid-cols-1 items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <h1 className="display-title text-3xl md:text-4xl">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
