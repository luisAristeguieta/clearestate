import { useNavigate } from "@tanstack/react-router";
import { Bell, Check, ChevronDown, MapPin, PanelLeft, Repeat2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { ModernSidebar } from "@/components/ModernSidebar";
import { RoleAvatar } from "@/components/RoleAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ERP_ROLES, PROJECTS, type ProjectFilter } from "@/config/erpConfig";
import { useErp } from "@/context/ErpContext";
import { cn } from "@/lib/utils";

const PROJECT_FILTER_OPTIONS: { value: ProjectFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  ...PROJECTS.map((project) => ({ value: project.id, label: project.name })),
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { activeRole, projectFilter, setProjectFilter, signInAsRole, signOut } = useErp();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex min-h-screen w-full bg-secondary/40">
      <div
        className={cn(
          "relative md:block",
          isMobileMenuOpen ? "fixed inset-y-0 left-0 z-30" : "hidden",
        )}
      >
        <ModernSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => {
            if (isMobileMenuOpen) setIsMobileMenuOpen(false);
            else setIsSidebarCollapsed((previous) => !previous);
          }}
          onSignOut={handleSignOut}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
            aria-label="Abrir menú"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <PanelLeft />
          </Button>
          <div className="hidden items-center gap-1 rounded-full bg-secondary p-1 sm:flex">
            <MapPin className="mx-2 h-4 w-4 text-muted-foreground" />
            {PROJECT_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setProjectFilter(option.value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  projectFilter === option.value
                    ? "bg-background text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  <MapPin />
                  {PROJECT_FILTER_OPTIONS.find((option) => option.value === projectFilter)?.label}
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {PROJECT_FILTER_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => setProjectFilter(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-secondary"
              aria-label="Notificaciones"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-highlight" />
            </button>

            {activeRole && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-3 rounded-full border border-border py-1 pl-1 pr-4 hover:bg-secondary">
                  <RoleAvatar role={activeRole} sizeClass="h-9 w-9" />
                  <div className="hidden min-w-0 text-left leading-tight md:block">
                    <p className="truncate text-sm font-semibold">{activeRole.personName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {activeRole.area} · {activeRole.jobTitle}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 rounded-[20px] p-2">
                  <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Repeat2 className="h-3.5 w-3.5" /> Conmutador rápido de rol
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ERP_ROLES.map((role) => {
                    const RoleIcon = role.icon;
                    return (
                      <DropdownMenuItem
                        key={role.id}
                        onSelect={() => signInAsRole(role.id)}
                        className="gap-3 rounded-[14px] py-2"
                      >
                        <RoleAvatar role={role} sizeClass="h-8 w-8" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{role.personName}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <RoleIcon className="h-3 w-3" /> {role.area}
                          </p>
                        </div>
                        {role.id === activeRole.id && <Check className="h-4 w-4 text-primary" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
