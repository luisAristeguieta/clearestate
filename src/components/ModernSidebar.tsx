import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { NAVIGATION_GROUPS, type NavigationItem } from "@/config/erpConfig";
import { cn } from "@/lib/utils";

interface ModernSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut: () => void;
}

const resolveItemPath = (item: NavigationItem): string =>
  item.target.kind === "route" ? item.target.path : `/modulo/${item.target.moduleId}`;

function SidebarLink({ item, isCollapsed, isActive }: { item: NavigationItem; isCollapsed: boolean; isActive: boolean }) {
  const ItemIcon = item.icon;
  const linkClass = cn(
    "group relative flex h-10 items-center gap-3 rounded-full px-3 text-sm font-medium transition-colors",
    isCollapsed && "justify-center px-0",
    isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary",
  );
  const content = (
    <>
      <ItemIcon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
      {!isCollapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
      {item.badgeCount ? (
        <span className={cn("pill-badge bg-highlight px-1.5 text-[10px] text-highlight-foreground", isCollapsed && "absolute -right-1 -top-1")}>{item.badgeCount}</span>
      ) : null}
    </>
  );

  if (item.target.kind === "route") {
    return <Link to={item.target.path} className={linkClass} title={item.label}>{content}</Link>;
  }
  return (
    <Link to="/modulo/$moduleId" params={{ moduleId: item.target.moduleId }} className={linkClass} title={item.label}>
      {content}
    </Link>
  );
}

export function ModernSidebar({ isCollapsed, onToggleCollapse, onSignOut }: ModernSidebarProps) {
  const currentPath = useRouterState({ select: (routerState) => routerState.location.pathname });

  return (
    <aside className={cn("sticky top-0 flex h-screen shrink-0 flex-col border-r border-border/60 bg-sidebar/55 backdrop-blur-xl transition-[width] duration-300", isCollapsed ? "w-20" : "w-64")}>
      <div className={cn("flex h-[72px] items-center gap-2 border-b border-border/60 px-5", isCollapsed && "justify-center px-0")}>
        {!isCollapsed && <BrandLogo />}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Desplegar menú" : "Colapsar menú"}
          className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/60 bg-background/60 text-foreground transition-colors hover:bg-secondary", !isCollapsed && "ml-auto")}
        >
          {isCollapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {NAVIGATION_GROUPS.map((group) => (
          <div key={group.title}>
            <p className={cn("mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/70", isCollapsed && "px-0 text-center")}>
              {isCollapsed ? group.shortTitle : group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarLink key={item.code} item={item} isCollapsed={isCollapsed} isActive={currentPath === resolveItemPath(item)} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-border/60 px-3 py-4">
        <button type="button" onClick={onSignOut} className={cn("flex h-10 w-full items-center gap-3 rounded-full px-3 text-sm font-medium text-foreground hover:bg-secondary", isCollapsed && "justify-center px-0")}>
          <LogOut className="h-[18px] w-[18px]" />
          {!isCollapsed && "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}
