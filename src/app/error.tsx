"use client";

import { RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-page">
      <div className="error-mark">旅</div>
      <p className="eyebrow">Travel OS</p>
      <h1>Este desvío no estaba en el itinerario.</h1>
      <p>La información de tu viaje sigue segura. Intentemos abrirla de nuevo.</p>
      <button type="button" className="primary-button" onClick={reset}>
        <RotateCcw size={17} aria-hidden="true" /> Reintentar
      </button>
    </main>
  );
}
