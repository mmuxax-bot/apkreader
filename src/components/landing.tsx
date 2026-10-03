import { Link } from "@tanstack/react-router";
import { ArrowRight, Hammer, Download, UploadCloud } from "lucide-react";
import { version } from "../../package.json";
import { SiteBrand, SiteFooter } from "@/components/site-chrome";

const STEPS = [
  {
    icon: UploadCloud,
    title: "Saytı verin",
    text: "Sayt linkini yazın və ya index.html olan hazır statik ZIP yükləyin. Ad, ikon və paket adını seçin.",
  },
  {
    icon: Hammer,
    title: "“APK düzəlt” basın",
    text: "Tətbiq bizim build xidmətində yığılır. Adətən 3–8 dəqiqə çəkir.",
  },
  {
    icon: Download,
    title: "APK-nı yükləyin",
    text: "Hazır olanda saytımızdan birbaşa yükləmə linki alırsınız — telefona quraşdırın.",
  },
];

export function Landing() {
  return (
    <main className="page-shell landing">
      <header className="topbar">
        <SiteBrand />
        <div className="top-note">
          <i aria-hidden="true" /> Android APK · Capacitor
        </div>
      </header>

      <section className="hero landing-hero">
        <div>
          <div className="eyebrow">Saytdan Android tətbiqinə</div>
          <h1>
            Saytınızı tətbiqə
            <br />
            <em>bir kliklə çevirin.</em>
          </h1>
          <p>
            Sayt linkini və ya hazır statik ZIP-i verin — APK Studio Android tətbiqini yığıb sizə
            yükləmə linki versin. Android Studio, server və ya kod bilgisi tələb olunmur.
          </p>
          <div className="landing-actions">
            <Link to="/studio" className="start-button" data-testid="button-start">
              Layihəni APK-ya çevir <ArrowRight size={18} />
            </Link>
            <span className="landing-hint">Qeydiyyat tələb olunmur</span>
          </div>
        </div>
        <div className="version-badge" data-testid="app-version">
          <span>Versiya</span>
          <strong>v{version}</strong>
        </div>
      </section>

      <section className="steps-grid" aria-label="Necə işləyir">
        {STEPS.map((step, index) => (
          <div className="step-card" key={step.title}>
            <span className="step-num">0{index + 1}</span>
            <span className="source-icon">
              <step.icon size={17} />
            </span>
            <h2>{step.title}</h2>
            <p>{step.text}</p>
          </div>
        ))}
      </section>

      <p className="landing-note">
        Diqqət: APK debug imzalıdır (test və birbaşa quraşdırma üçün). Zərərli tətbiqlər hazırlamaq
        qadağandır — <Link to="/terms">istifadə qaydalarına</Link> baxın.
      </p>

      <SiteFooter />
    </main>
  );
}
