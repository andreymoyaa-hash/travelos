"use client";

import { type ChangeEvent, useState } from "react";
import { CalendarDays, FileCheck2, FileUp, LoaderCircle, ShieldCheck, X } from "lucide-react";

import { parseTravelOsPdf, type TravelPdfImportPreview } from "@/lib/imports/travel-os-pdf";
import type { Trip } from "@/types/travel";

export function PdfImportModal({ trip, onClose, onApply }: {
  trip: Trip;
  onClose: () => void;
  onApply: (preview: TravelPdfImportPreview) => void;
}) {
  const [preview, setPreview] = useState<TravelPdfImportPreview>();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>();

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProcessing(true); setError(undefined); setPreview(undefined);
    try {
      setPreview(await parseTravelOsPdf(file, trip));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo leer el PDF.");
    } finally { setProcessing(false); }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="expense-modal pdf-import-modal" role="dialog" aria-modal="true" aria-labelledby="pdf-import-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><p className="eyebrow">Nioli PDF Standard</p><h2 id="pdf-import-title">Importar PlannedData</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></header>
        <div className="mode-banner"><ShieldCheck size={19} /><div><strong>LiveData está protegido</strong><p>Fotos, gastos, sellos desbloqueados, XP, recuerdos y participantes no se reemplazan ni se eliminan.</p></div></div>
        <label className="pdf-file-picker"><FileUp size={24} /><span><strong>Seleccionar PDF</strong><small>Máximo 12 MB · debe incluir el bloque Nioli PDF Standard</small></span><input type="file" accept="application/pdf,.pdf" onChange={(event) => void selectFile(event)} /></label>
        {processing ? <div className="empty-state compact" aria-live="polite"><LoaderCircle className="auth-spinner" size={26} /><p>Parseando, validando y normalizando…</p></div> : null}
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        {preview ? <div className="pdf-import-preview" aria-live="polite"><div className="subsection-heading"><div><p className="eyebrow">Vista previa validada</p><h3>{preview.fileName}</h3></div><FileCheck2 size={23} /></div><dl><div><dt>Páginas</dt><dd>{preview.pageCount}</dd></div><div><dt>Días</dt><dd>{preview.summary.daysChanged}</dd></div><div><dt>Actividades</dt><dd>{preview.summary.activitiesChanged}</dd></div><div><dt>Reservas</dt><dd>{preview.summary.reservationsChanged}</dd></div><div><dt>Alojamientos</dt><dd>{preview.summary.basesChanged}</dd></div><div><dt>Versión</dt><dd>{preview.standardVersion}</dd></div></dl>{preview.days.length ? <div className="pdf-day-preview"><CalendarDays size={17} /><span>{preview.days.map((day) => `${day.date} · ${day.city}`).join(" · ")}</span></div> : null}{preview.warnings.map((warning) => <p className="data-note" key={warning}>{warning}</p>)}<button type="button" className="primary-button full-width" onClick={() => onApply(preview)}>Confirmar importación</button></div> : null}
      </section>
    </div>
  );
}
