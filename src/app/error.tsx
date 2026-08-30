"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-page">
      <Image className="error-brand-seal" src="/brand/nioli-seal-transparent-v2.png" alt="NIOLI" width={320} height={320} sizes="92px" />
      <p className="eyebrow">NIOLI</p>
      <h1>Este desvÃ­o no estaba en el itinerario.</h1>
      <p>La informaciÃ³n de tu viaje sigue segura. Intentemos abrirla de nuevo.</p>
      <button type="button" className="primary-button" onClick={reset}>
        <RotateCcw size={17} aria-hidden="true" /> Reintentar
      </button>
    </main>
  );
}

