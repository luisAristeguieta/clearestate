import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { CheckCircle2, FileText, FileUp, Lock, LogOut, Pencil } from "lucide-react";
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

  const invitation = invitations.find((item) => item.token === token);

  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(invitation?.offer ? invitation.offer.price.toString() : "");
  const [termDays, setTermDays] = useState(
    invitation?.offer ? invitation.offer.termDays.toString() : "",
  );
  const [validityDays, setValidityDays] = useState(
    invitation?.offer?.validityDays ? invitation.offer.validityDays.toString() : "30",
  );
  const [conditions, setConditions] = useState(
    invitation?.offer ? invitation.offer.conditions : "",
  );
  const [pdfFileName, setPdfFileName] = useState(
    invitation?.offer ? invitation.offer.pdfFileName : "",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isHydrated) return null;

  if (!invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <BrandLogo />
        <h1 className="mt-8 text-2xl font-bold tracking-tight text-foreground">
          Enlace no válido o expirado
        </h1>
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
      const parsedValidity = Number(validityDays);
      if (parsedPrice <= 0) throw new Error("El precio debe ser mayor a cero.");
      if (parsedTerm <= 0) throw new Error("El plazo de entrega debe ser mayor a cero.");
      if (parsedValidity <= 0) throw new Error("La vigencia de la oferta debe ser mayor a cero.");
      if (!pdfFileName) throw new Error("Adjunta tu propuesta en PDF.");

      submitSupplierOffer(token, {
        price: parsedPrice,
        termDays: parsedTerm,
        validityDays: parsedValidity,
        conditions: conditions.trim(),
        pdfFileName,
      });
      setIsEditing(false);
      toast.success("Oferta registrada y enviada a Logística correctamente.");
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "No se pudo presentar la oferta.",
      );
    }
  };

  const handleStartEditing = () => {
    if (invitation.offer) {
      setPrice(invitation.offer.price.toString());
      setTermDays(invitation.offer.termDays.toString());
      setValidityDays((invitation.offer.validityDays ?? 30).toString());
      setConditions(invitation.offer.conditions);
      setPdfFileName(invitation.offer.pdfFileName);
    }
    setIsEditing(true);
  };

  const isSubmittedView = invitation.status === "submitted" && invitation.offer && !isEditing;

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
          Invitación para cotizar
        </p>
        <h1 className="display-title mt-1 text-3xl text-foreground">{invitation.supplierName}</h1>

        {requisition && (
          <section className="mt-6 border-b border-border pb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {requisition.code} · {project?.name}
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">
              {requisition.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{requisition.description}</p>
            <p className="mt-3 text-sm text-foreground">
              Monto de referencia:{" "}
              <span className="font-semibold">{formatCurrency(requisition.estimatedAmount)}</span>
            </p>
          </section>
        )}

        {isSubmittedView && invitation.offer ? (
          <section className="surface-card mt-6 space-y-6 p-8">
            <div className="flex flex-col items-center text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </span>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
                Oferta registrada con éxito
              </h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Tu propuesta ha sido enviada al equipo de Logística de ClearEstate y ya se encuentra
                visible en el Cuadro Comparativo (P-08) para su evaluación.
              </p>
            </div>

            <div className="grid gap-4 rounded-[20px] border border-border bg-secondary/50 p-5 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Precio ofertado
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(invitation.offer.price)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Plazo de ejecución
                </p>
                <p className="text-lg font-bold text-foreground">
                  {invitation.offer.termDays} días
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Vigencia de oferta
                </p>
                <p className="text-lg font-bold text-foreground">
                  {invitation.offer.validityDays ?? 30} días
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-[16px] border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Condiciones comerciales
                </p>
                <p className="mt-1 text-sm text-foreground">{invitation.offer.conditions}</p>
              </div>
              <div className="flex items-center justify-between rounded-[16px] border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">{invitation.offer.pdfFileName}</p>
                    <p className="text-xs text-muted-foreground">
                      Enviado el{" "}
                      {new Date(invitation.offer.submittedAt).toLocaleDateString("es-EC", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span className="pill-badge bg-secondary text-xs text-foreground">PDF Adjunto</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={handleStartEditing}
              >
                <Pencil className="h-4 w-4" /> Modificar propuesta
              </Button>
              <Button asChild variant="default" className="rounded-full">
                <Link to="/login">
                  <LogOut className="h-4 w-4" /> Finalizar y salir
                </Link>
              </Button>
            </div>
          </section>
        ) : (
          <form onSubmit={handleSupplierOfferSubmit} className="surface-card mt-6 space-y-5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                {invitation.offer ? "Modificar oferta económica" : "Presentar oferta económica"}
              </h2>
              {invitation.offer && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
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
              <div className="space-y-2">
                <Label htmlFor="offer-validity">Vigencia (días)</Label>
                <Input
                  id="offer-validity"
                  required
                  type="number"
                  min={1}
                  value={validityDays}
                  onChange={(event) => setValidityDays(event.target.value)}
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
              <Label>Propuesta técnica y económica en PDF</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => setPdfFileName(event.target.files?.[0]?.name ?? "")}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="h-4 w-4" /> {pdfFileName || "Adjuntar propuesta PDF"}
                </Button>
                {!pdfFileName && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => setPdfFileName("propuesta-constructora-andes.pdf")}
                  >
                    Usar PDF demo: propuesta-constructora-andes.pdf
                  </Button>
                )}
              </div>
            </div>

            <Button type="submit" variant="default" className="w-full rounded-full">
              {invitation.offer ? "Actualizar y registrar oferta" : "Enviar oferta"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
