import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Geist } from "next/font/google";
import type { ReactNode } from "react";

import "leaflet/dist/leaflet.css";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Travel OS · Tu viaje, bien pensado",
    template: "%s · Travel OS",
  },
  description:
    "Planifica rutas, reservas, presupuesto y recuerdos en un solo lugar.",
  applicationName: "Travel OS",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f3ec",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" className={`${geist.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
