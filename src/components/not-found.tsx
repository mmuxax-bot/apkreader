import { Link } from "@tanstack/react-router";

export function NotFoundPage() {
  return (
    <main className="not-found">
      <p className="eyebrow">404</p>
      <h1>Səhifə tapılmadı</h1>
      <p>Bu ünvan APK Studio-da yoxdur.</p>
      <p>
        <Link to="/">Ana səhifəyə qayıt</Link>
      </p>
    </main>
  );
}
