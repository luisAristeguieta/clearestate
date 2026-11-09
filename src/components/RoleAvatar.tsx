import type { ErpRole } from "@/config/erpConfig";
import { cn } from "@/lib/utils";

interface RoleAvatarProps {
  role: ErpRole;
  sizeClass?: string;
}

/** Portrait with the role's Lucide icon pinned to the corner. */
export function RoleAvatar({ role, sizeClass = "h-10 w-10" }: RoleAvatarProps) {
  const RoleIcon = role.icon;
  return (
    <div className={cn("relative shrink-0", sizeClass)}>
      <img
        src={role.avatarUrl}
        alt={role.personName}
        className="h-full w-full rounded-full border border-border object-cover"
        loading="lazy"
        width={256}
        height={256}
      />
      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground">
        <RoleIcon className="h-2.5 w-2.5" strokeWidth={2.5} />
      </span>
    </div>
  );
}
