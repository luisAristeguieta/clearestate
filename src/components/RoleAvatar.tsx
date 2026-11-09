import type { ErpRole } from "@/config/erpConfig";
import { cn } from "@/lib/utils";

interface RoleAvatarProps {
  role: ErpRole;
  sizeClass?: string;
  variant?: "icon" | "photo";
}

/** Clean corporate circular avatar with the role's Lucide icon in Signal Blue (#0f68ea) over a light Mist surface (#f0f2f4). */
export function RoleAvatar({ role, sizeClass = "h-10 w-10", variant = "icon" }: RoleAvatarProps) {
  const RoleIcon = role.icon;

  if (variant === "photo" && role.avatarUrl) {
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

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-[#e5e6e8] bg-[#f0f2f4] text-[#0f68ea]",
        sizeClass,
      )}
      aria-hidden="true"
    >
      <RoleIcon className="h-1/2 w-1/2 shrink-0" strokeWidth={2} />
    </div>
  );
}
