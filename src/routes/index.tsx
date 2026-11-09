import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Inicio · ClearEstate ERP" },
      {
        name: "description",
        content: "Backoffice inmobiliario para Proyecto París y Proyecto Sagaleta.",
      },
      { property: "og:title", content: "Inicio · ClearEstate ERP" },
      {
        property: "og:description",
        content: "Backoffice inmobiliario para Proyecto París y Proyecto Sagaleta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
