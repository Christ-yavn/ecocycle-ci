import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EcoLoop CI — Gestion circulaire des déchets",
    short_name: "EcoLoop CI",
    description:
      "Plateforme de gestion circulaire des déchets à Abidjan.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0A3D1F",
    lang: "fr",
    categories: ["environment", "productivity", "business"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
