import type { Metadata } from "next";

import { SetupAccessView } from "@/features/auth/setup-access-view";

export const metadata: Metadata = {
  title: "Configura tu acceso",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function SetupPage() {
  return <SetupAccessView />;
}
