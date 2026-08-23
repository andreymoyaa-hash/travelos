import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="error-page">
      <div className="error-mark">404</div>
      <p className="eyebrow">Ruta desconocida</p>
      <h1>Este lugar aún no está en el mapa.</h1>
      <p>Regresa al centro de operaciones para continuar tu aventura.</p>
      <Link href="/" className="primary-button">
        Volver a Travel OS
      </Link>
    </main>
  );
}
