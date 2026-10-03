import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Code2 } from "lucide-react";

export const OWNER_SITE = "https://nibrascode.com";

export function SiteBrand() {
  return (
    <Link className="brand" to="/" data-testid="link-home" aria-label="APK Studio ana səhifə">
      <span className="brand-mark">
        <Code2 size={19} strokeWidth={2.5} />
      </span>
      <span>
        apk<span className="brand-light">studio</span>
      </span>
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer-note site-footer" data-testid="site-footer">
      <span>
        <strong>APK Studio</strong> · Saytı Android tətbiqinə çevirən build xidməti.
        <br />© 2026 NibrasCode · Bu layihə NibrasCode-a məxsusdur
      </span>
      <nav className="footer-links" aria-label="Hüquqi səhifələr">
        <Link to="/privacy" data-testid="link-privacy">
          Məxfilik siyasəti
        </Link>
        <Link to="/terms" data-testid="link-terms">
          İstifadə qaydaları
        </Link>
        <a href={OWNER_SITE} target="_blank" rel="noopener noreferrer" data-testid="link-owner">
          nibrascode.com
        </a>
      </nav>
    </footer>
  );
}

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="page-shell">
      <header className="topbar">
        <SiteBrand />
        <Link className="top-link" to="/studio">
          APK düzəlt →
        </Link>
      </header>
      <article className="legal-page">
        <div className="eyebrow">Hüquqi məlumat</div>
        <h1>{title}</h1>
        <p className="legal-updated">Son yenilənmə: {updated}</p>
        {children}
      </article>
      <SiteFooter />
    </main>
  );
}
