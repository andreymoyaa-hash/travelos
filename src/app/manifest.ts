import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NIOLI",
    short_name: "NIOLI",
    description: "Tu compañero para planificar y vivir cada viaje.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ec",
    theme_color: "#2E4A3A",
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
