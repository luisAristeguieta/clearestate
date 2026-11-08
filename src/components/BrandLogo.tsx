interface BrandLogoProps {
  isCompact?: boolean;
}

export function BrandLogo({ isCompact = false }: BrandLogoProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect x="16" y="2" width="19.8" height="19.8" rx="4" transform="rotate(45 16 2)" className="fill-primary" />
        <rect x="16" y="10" width="8.5" height="8.5" rx="1.5" transform="rotate(45 16 10)" className="fill-background" />
      </svg>
      {!isCompact && (
        <div className="min-w-0 leading-none">
          <p className="truncate text-[17px] font-bold tracking-tight text-foreground">Clear Minds</p>
          <p className="mt-0.5 text-[9px] font-semibold tracking-[0.28em] text-muted-foreground">CONSULTORES</p>
        </div>
      )}
    </div>
  );
}
