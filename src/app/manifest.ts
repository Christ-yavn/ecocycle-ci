import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EcoCycle CI — Gestion circulaire des déchets",
    short_name: "EcoCycle CI",
    description:
      "Plateforme SaaS de gestion circulaire des déchets à Abidjan.",
    start_url: "/",
    display: "standalone",
    background_color: "#e9e0cb",
    theme_color: "#0d1f16",
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
