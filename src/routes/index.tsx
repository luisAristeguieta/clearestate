import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Clear Minds ERP Inmobiliario" },
      { name: "description", content: "Backoffice inmobiliario para Proyecto París y Proyecto Sagaleta." },
      { property: "og:title", content: "Clear Minds ERP Inmobiliario" },
      { property: "og:description", content: "Backoffice inmobiliario para Proyecto París y Proyecto Sagaleta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
