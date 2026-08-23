import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Travel OS",
    short_name: "Travel OS",
    description: "Tu sistema personal de viajes.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ec",
    theme_color: "#e94b48",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
