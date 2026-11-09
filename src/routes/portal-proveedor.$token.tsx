import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { CheckCircle2, FileUp, Lock, LogOut } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BRAND_NAME } from "@/config/brandConfig";
import { PROJECTS, formatCurrency } from "@/config/erpConfig";
import { useErp } from "@/context/ErpContext";

export const Route = createFileRoute("/portal-proveedor/$token")({
  ssr: false,
  loader: ({ params }) => {
    if (!params.token) throw notFound();
    return { token: params.token };
  },
  head: () => ({
    meta: [
      { title: `Portal del Proveedor · ${BRAND_NAME}` },
      {
        name: "description",
        content: "Portal externo seguro para presentar ofertas económicas a ClearEstate.",
      },
      { property: "og:title", content: `Portal del Proveedor · ${BRAND_NAME}` },
      { property: "og:description", content: "Presenta tu propuesta económica de forma segura." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SupplierPortalPage,
});

function SupplierPortalPage() {
  const { token } = Route.useParams();
  const { isHydrated, invitations, requisitions, submitSupplierOffer } = useErp();

  const [price, setPrice] = useState("");
  const [termDays, setTermDays] = useState("");
  const [conditions, setConditions] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isHydrated) return null;

  const invitation = invitations.find((item) => item.token === token);

  if (!invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <BrandLogo />
        <h1 className="mt-8 text-2xl font-bold tracking-tight">Enlace no válido o expirado</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Este enlace de invitación no existe o ya no está disponible. Solicita a Logística un nuevo
          enlace de participación.
        </p>
      </div>
    );
  }

  const requisition = requisitions.find((item) => item.id === invitation.requisitionId);
  const project = requisition ? PROJECTS.find((item) => item.id === requisition.projectId) : null;

  const handleSupplierOfferSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const parsedPrice = Number(price);
      const parsedTerm = Number(termDays);
      if (parsedPrice <= 0) throw new Error("El precio debe ser mayor a cero.");
      if (parsedTerm <= 0) throw new Error("El plazo debe ser mayor a cero.");
      if (!pdfFileName) throw new Error("Adjunta tu propuesta en PDF.");
      submitSupplierOffer(token, {
        price: parsedPrice,
        termDays: parsedTerm,
        conditions: conditions.trim(),
        pdfFileName,
      });
      toast.success("Oferta presentada correctamente.");
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "No se pudo presentar la oferta.",
      );
    }
  };

  return (
    <div className="phase2-view min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <span className="pill-badge bg-secondary text-muted-foreground">
              <Lock className="h-3 w-3" /> Acceso seguro por invitación
            </span>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/login">
                <LogOut className="h-3.5 w-3.5" /> Salir
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Invitación para
        </p>
        <h1 className="display-title mt-1 text-3xl">{invitation.supplierName}</h1>

        {requisition && (
          <section className="mt-6 border-b border-border pb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {requisition.code} · {project?.name}
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">{requisition.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{requisition.description}</p>
            <p className="mt-3 text-sm">
              Monto de referencia:{" "}
              <span className="font-semibold">{formatCurrency(requisition.estimatedAmount)}</span>
            </p>
          </section>
        )}

        {invitation.status === "submitted" && invitation.offer ? (
          <section className="surface-card mt-6 flex flex-col items-center p-10 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary">
              <CheckCircle2 className="h-7 w-7 text-foreground" />
            </span>
            <h2 className="mt-4 text-xl font-bold tracking-tight">Oferta presentada</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Recibimos tu propuesta por {formatCurrency(invitation.offer.price)} a{" "}
              {invitation.offer.termDays} días. Logística te contactará con el resultado de la
              adjudicación.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Archivo recibido: {invitation.offer.pdfFileName}
            </p>
          </section>
        ) : (
          <form onSubmit={handleSupplierOfferSubmit} className="surface-card mt-6 space-y-5 p-6">
            <h2 className="text-lg font-bold tracking-tight">Presentar oferta económica</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="offer-price">Precio total (USD)</Label>
                <Input
                  id="offer-price"
                  required
                  type="number"
                  min={1}
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-term">Plazo de entrega (días)</Label>
                <Input
                  id="offer-term"
                  required
                  type="number"
                  min={1}
                  value={termDays}
                  onChange={(event) => setTermDays(event.target.value)}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer-conditions">Condiciones comerciales</Label>
              <Textarea
                id="offer-conditions"
                required
                maxLength={500}
                rows={3}
                value={conditions}
                onChange={(event) => setConditions(event.target.value)}
                placeholder="Forma de pago, garantías, validez de la oferta…"
              />
            </div>

            <div className="space-y-2">
              <Label>Propuesta en PDF</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => setPdfFileName(event.target.files?.[0]?.name ?? "")}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp /> {pdfFileName || "Adjuntar propuesta PDF"}
              </Button>
            </div>

            <Button type="submit" variant="default" className="w-full rounded-full">
              Enviar oferta
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
