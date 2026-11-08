import logoImage from "@/assets/clearestate-logo.png";
import inverseLogoImage from "@/assets/clearestate-logo-inverse.png";

interface BrandLogoProps {
  isCompact?: boolean;
  isInverse?: boolean;
}

export function BrandLogo({ isCompact = false, isInverse = false }: BrandLogoProps) {
  return (
    <div className={isCompact ? "h-9 w-9 shrink-0" : "w-full min-w-0 max-w-[280px]"}>
      <img
        src={isCompact ? "/favicon.svg" : isInverse ? inverseLogoImage : logoImage}
        alt={isCompact ? "ClearEstate" : "ClearEstate · PLATAFORMA INMOBILIARIA ERP"}
        width={isCompact ? 64 : 927}
        height={isCompact ? 64 : 194}
        className="block h-auto w-full object-contain"
      />
    </div>
  );
}
