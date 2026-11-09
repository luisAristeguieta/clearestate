import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { isRouteAllowedForRole } from "@/auth/permissions";
import { NAVIGATION_GROUPS, type NavigationItem } from "@/config/erpConfig";
import { cn } from "@/lib/utils";
import { usePhase3 } from "@/context/Phase3Context";
import { useErp } from "@/context/ErpContext";

interface ModernSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut: () => void;
}

const resolveItemPath = (item: NavigationItem): string =>
  item.target.kind === "route" ? item.target.path : `/modulo/${item.target.moduleId}`;

/**
 * Blueprint layer painted behind the frosted panel. backdrop-filter only blurs
 * what is already on screen, so the glass needs this ambient texture to read as
 * real frosted glass instead of a flat white strip.
 */
function SidebarAmbient() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <pattern id="sidebar-ambient-grid" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M26 0H0V26" className="fill-none stroke-muted-foreground" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" className="fill-secondary" />
      <rect width="100%" height="100%" fill="url(#sidebar-ambient-grid)" opacity="0.16" />
      <rect x="-60" y="-4%" width="220%" height="30%" className="fill-primary" opacity="0.13" />
      <rect x="-40" y="26%" width="150%" height="22%" className="fill-primary" opacity="0.08" />
      <rect x="-30" y="58%" width="170%" height="24%" className="fill-foreground" opacity="0.07" />
      <line
        x1="0"
        y1="46%"
        x2="100%"
        y2="24%"
        className="stroke-primary"
        strokeWidth="46"
        opacity="0.09"
      />
      <line
        x1="0"
        y1="88%"
        x2="100%"
        y2="70%"
        className="stroke-foreground"
        strokeWidth="34"
        opacity="0.05"
      />
      <rect
        x="52%"
        y="80%"
        width="120"
        height="150"
        rx="18"
        className="fill-primary"
        opacity="0.10"
      />
    </svg>
  );
}

function SidebarLink({
  item,
  isCollapsed,
  isActive,
}: {
  item: NavigationItem;
  isCollapsed: boolean;
  isActive: boolean;
}) {
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
        <span
          className={cn(
            "pill-badge bg-highlight px-1.5 text-[10px] text-highlight-foreground",
            isCollapsed && "absolute -right-1 -top-1",
          )}
        >
          {item.badgeCount}
        </span>
      ) : null}
    </>
  );

  if (item.target.kind === "route") {
    return (
      <Link to={item.target.path} className={linkClass} title={item.label}>
        {content}
      </Link>
    );
  }
  return (
    <Link
      to="/modulo/$moduleId"
      params={{ moduleId: item.target.moduleId }}
      className={linkClass}
      title={item.label}
    >
      {content}
    </Link>
  );
}

export function ModernSidebar({ isCollapsed, onToggleCollapse, onSignOut }: ModernSidebarProps) {
  const currentPath = useRouterState({ select: (routerState) => routerState.location.pathname });
  const { cases } = usePhase3();
  const { activeRole, requisitions } = useErp();

  const visibleGroups = NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      activeRole ? isRouteAllowedForRole(activeRole.id, resolveItemPath(item)) : false,
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <SidebarAmbient />
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-glass-border bg-sidebar-glass backdrop-blur-xl transition-[width] duration-300",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-[72px] items-center gap-2 border-b border-sidebar-glass-border px-5",
            isCollapsed && "justify-center px-0",
          )}
        >
          {!isCollapsed && <BrandLogo />}
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Desplegar menú" : "Colapsar menú"}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full border border-sidebar-glass-border bg-background/60 p-0 text-foreground transition-colors hover:bg-secondary",
              !isCollapsed && "ml-auto",
            )}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-[18px] w-[18px]" />
            ) : (
              <ChevronsLeft className="h-[18px] w-[18px]" />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {visibleGroups.map((group) => (
            <div key={group.title}>
              <p
                className={cn(
                  "mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/70",
                  isCollapsed && "px-0 text-center",
                )}
              >
                {isCollapsed ? group.shortTitle : group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.code}
                    item={{
                      ...item,
                      badgeCount:
                        item.code === "P-14/15"
                          ? cases.filter((record) => record.status !== "delivered").length
                          : item.code === "P-05"
                            ? requisitions.filter((record) => record.status === "pending_approval")
                                .length
                            : (item.badgeCount ?? 0),
                    }}
                    isCollapsed={isCollapsed}
                    isActive={
                      currentPath === resolveItemPath(item) ||
                      currentPath.startsWith(`${resolveItemPath(item)}/`)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-sidebar-glass-border px-3 py-4">
          <button
            type="button"
            onClick={onSignOut}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-full px-3 text-sm font-medium text-foreground hover:bg-secondary",
              isCollapsed && "justify-center px-0",
            )}
          >
            <LogOut className="h-[18px] w-[18px]" />
            {!isCollapsed && "Cerrar sesión"}
          </button>
        </div>
      </aside>
    </>
  );
}
