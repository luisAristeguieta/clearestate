import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import notFoundIllustration from "@/assets/not-found-illustration.png";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-8">
      <BrandLogo />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-muted-foreground">Ups...</p>
        <h1 className="display-title mt-1 text-7xl font-extrabold tracking-tight text-primary sm:text-8xl">
          404
        </h1>
        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          Página no encontrada
        </p>
        <img
          src={notFoundIllustration}
          alt="Dos obreros sosteniendo los extremos desconectados de un cable"
          width={1200}
          height={800}
          loading="lazy"
          className="mt-8 w-full max-w-xl"
        />
        <p className="mt-6 max-w-md text-muted-foreground">
          La conexión con esta página se perdió: no existe en el plano del sistema o fue reubicada.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/">
            <ArrowLeft /> Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
