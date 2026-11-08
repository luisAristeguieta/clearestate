import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import loginDuskImage from "@/assets/login-dusk-architecture.jpg";
import { BrandLogo } from "@/components/BrandLogo";
import { RoleAvatar } from "@/components/RoleAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ERP_ROLES, type RoleId } from "@/config/erpConfig";
import { useErp } from "@/context/ErpContext";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión · Clear Minds ERP" },
      { name: "description", content: "Accede al ERP de gestión inmobiliaria integrada de Clear Minds Consultores." },
      { property: "og:title", content: "Iniciar sesión · Clear Minds ERP" },
      { property: "og:description", content: "Controla presupuestos, adquisiciones y posventa de tus proyectos de lotes." },
    ],
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { signInAsRole } = useErp();
  const navigate = useNavigate();
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;

  const enterAsRole = (roleId: RoleId) => {
    signInAsRole(roleId);
    navigate({ to: "/dashboard" });
  };

  const handleLoginSubmit = async (values: LoginFormValues) => {
    try {
      const matchedRole = ERP_ROLES.find((role) => role.email === values.email.toLowerCase());
      if (!matchedRole) throw new Error("Correo no registrado. Usa un acceso rápido por rol.");
      enterAsRole(matchedRole.id);
    } catch (loginError) {
      toast.error(loginError instanceof Error ? loginError.message : "No se pudo iniciar sesión");
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[3fr_2fr]">
      {/* Left canvas */}
      <section className="relative hidden flex-col justify-between overflow-hidden p-10 lg:sticky lg:top-0 lg:flex lg:h-screen xl:p-14">
        <img src={loginDuskImage} alt="Desarrollo residencial moderno al atardecer en Quito" className="absolute inset-0 h-full w-full object-cover" width={1280} height={1600} />
        <div className="absolute inset-0 bg-foreground/35" aria-hidden="true" />
        <div className="relative"><BrandLogo isInverse /></div>
        <div className="relative max-w-2xl">
          <h1 className="display-title text-4xl text-primary-foreground xl:text-5xl">Controla presupuestos, adquisiciones y posventa con trazabilidad total</h1>
          <p className="mt-5 text-base text-primary-foreground/85">Proyectos París y Sagaleta · Quito, Ecuador</p>
          <div className="mt-8 flex items-center gap-2" aria-hidden="true">
            <span className="h-1.5 w-8 rounded-full bg-primary-foreground" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/50" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/50" />
          </div>
        </div>
      </section>

      {/* Right form */}
      <section className="flex flex-col justify-center px-6 py-10 sm:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden"><BrandLogo /></div>
          <h2 className="display-title text-4xl">Iniciar sesión</h2>
          <p className="mt-2 text-muted-foreground">Ingresa con tu correo corporativo.</p>

          <form onSubmit={form.handleSubmit(handleLoginSubmit)} className="mt-8 grid gap-4" noValidate>
            <div className="grid gap-1.5">
              <Label htmlFor="login-email">Correo electrónico</Label>
              <div className="relative">
                <Input id="login-email" type="email" placeholder="nombre@clearminds.ec" className="h-12 pr-11" {...form.register("email")} />
                <Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="login-password">Contraseña</Label>
              <div className="relative">
                <Input id="login-password" type={isPasswordVisible ? "text" : "password"} placeholder="••••••••" className="h-12 pr-11" {...form.register("password")} />
                <button type="button" onClick={() => setIsPasswordVisible((previous) => !previous)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Mostrar contraseña">
                  {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 w-full">
              Iniciar sesión <ArrowRight />
            </Button>
          </form>

          <div className="my-8 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="pill-badge bg-secondary text-muted-foreground">Acceso Rápido por Rol (Demo)</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {ERP_ROLES.map((role) => {
              const RoleIcon = role.icon;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => enterAsRole(role.id)}
                  className={`flex min-w-0 items-center gap-3 rounded-[18px] border p-2.5 text-left transition-colors hover:border-primary ${role.isExternal ? "col-span-2 border-dashed border-primary/40 bg-secondary" : "border-border bg-background"}`}
                >
                  <RoleAvatar role={role} sizeClass="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                      <RoleIcon className="h-3 w-3 shrink-0" /> <span className="truncate">{role.area}</span>
                    </p>
                    <p className="truncate text-sm font-semibold">{role.personName}</p>
                    <p className="truncate text-xs text-muted-foreground">{role.isExternal ? "Ingresar al Portal Externo" : role.jobTitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
