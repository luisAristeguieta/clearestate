import { Link } from "@tanstack/react-router";
import { ArrowLeft, MapPinOff } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-8">
      <BrandLogo />
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-secondary">
          <MapPinOff className="h-7 w-7 text-primary" />
        </span>
        <span className="pill-badge mt-6 bg-highlight text-highlight-foreground">ERROR 404</span>
        <h1 className="display-title mt-4 text-5xl text-foreground">Lote no encontrado</h1>
        <p className="mt-4 text-muted-foreground">La página que buscas no existe en el plano del sistema o fue reubicada.</p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/">
            <ArrowLeft /> Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
