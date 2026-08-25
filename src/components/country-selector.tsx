import { Check, X } from "lucide-react";

import { countryThemes } from "@/data/countries";
import type { CountryId } from "@/types/travel";

interface CountrySelectorProps {
  activeCountry: CountryId;
  open: boolean;
  onClose: () => void;
  onSelect: (country: CountryId) => void;
}

export function CountrySelector({ activeCountry, open, onClose, onSelect }: CountrySelectorProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="country-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="country-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="eyebrow">Nuevo horizonte</p>
            <h2 id="country-modal-title">¿A dónde viajas?</h2>
            <p>Explora el lenguaje visual y las colecciones de cada destino.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar selector">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="country-grid">
          {countryThemes.map((country) => {
            const isActive = activeCountry === country.id;
            return (
              <button
                type="button"
                key={country.id}
                className={isActive ? "country-option selected" : "country-option"}
                style={{ "--country-color": country.colors.accent } as React.CSSProperties}
                onClick={() => onSelect(country.id)}
              >
                <span className="country-flag">{country.flag}</span>
                <span>
                  <strong>{country.name}</strong>
                  <small>{country.headline}</small>
                </span>
                {isActive ? (
                  <span className="country-check">
                    <Check size={14} aria-hidden="true" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="country-modal-note">
          Japón conserva el itinerario maestro editable. Los demás destinos aplican su identidad visual sin alterar el viaje activo.
        </p>
      </section>
    </div>
  );
}
