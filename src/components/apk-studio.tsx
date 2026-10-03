import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  buildProjectBundle,
  getBundleFilename,
  getBundleFileList,
  validateBuildConfig,
  validateWebsiteZip,
  type BuildConfig,
} from "@/lib/build-bundle";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CheckCircle2,
  Code2,
  FileArchive,
  Globe2,
  LockKeyhole,
  LoaderCircle,
  PackageCheck,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

type SourceMode = "url" | "zip";
type BuildStatus = {
  kind: "idle" | "pending" | "error" | "success";
  message?: string;
  errors?: string[];
};
type FormState = {
  websiteUrl: string;
  appName: string;
  packageName: string;
  language: string;
  versionName: string;
  versionCode: string;
  orientation: string;
  notifications: boolean;
  privacyPolicyUrl: string;
  outputFormat: string;
  ubuntuVersion: string;
  docker: boolean;
  nginx: boolean;
  ssl: boolean;
  domain: string;
  letsEncryptEmail: string;
};

const initial: FormState = {
  websiteUrl: "",
  appName: "",
  packageName: "",
  language: "az",
  versionName: "1.0.0",
  versionCode: "1",
  orientation: "portrait",
  notifications: false,
  privacyPolicyUrl: "",
  outputFormat: "apk",
  ubuntuVersion: "22.04",
  docker: true,
  nginx: true,
  ssl: false,
  domain: "",
  letsEncryptEmail: "",
};

const STACK = [
  "Ubuntu",
  "Java 17",
  "Node.js",
  "Android SDK",
  "Gradle",
  "Capacitor",
  "Docker",
  "Firewall",
  "Nginx",
  "SSL / HTTPS",
];

function prettySize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

async function imageToPngDataUrl(file: File) {
  const image = await createImageBitmap(file);
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    image.close();
    throw new Error("İkon şəkli emal edilə bilmədi.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  const scale = Math.max(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  image.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("İkon PNG formatına çevrilə bilmədi."));
    }, "image/png");
  });
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("İkon faylı oxuna bilmədi."));
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("İkon faylı oxuna bilmədi."));
    reader.readAsDataURL(blob);
  });
}

function makePackageSuggestion(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.{2,}/g, ".");
  return `az.studio.${slug || "tetbiq"}`;
}

export function ApkStudio() {
  const [form, setForm] = useState<FormState>(initial);
  const [source, setSource] = useState<SourceMode>("url");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipError, setZipError] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState("");
  const [packageEdited, setPackageEdited] = useState(false);
  const [status, setStatus] = useState<BuildStatus>({ kind: "idle" });
  const [bundleFiles, setBundleFiles] = useState<string[]>([]);
  const zipCheckId = useRef(0);

  const update = (key: keyof FormState, value: string | boolean) =>
    setForm((old) => ({ ...old, [key]: value }));

  useEffect(() => {
    if (!iconFile) {
      setIconPreview("");
      return;
    }
    const url = URL.createObjectURL(iconFile);
    setIconPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [iconFile]);

  const config = useMemo<BuildConfig>(
    () => ({
      sourceMode: source,
      websiteUrl: form.websiteUrl.trim(),
      appName: form.appName.trim(),
      packageName: form.packageName.trim(),
      language: form.language as BuildConfig["language"],
      versionName: form.versionName.trim(),
      versionCode: Number(form.versionCode),
      orientation: (form.orientation === "auto" ? "unspecified" : form.orientation) as BuildConfig["orientation"],
      notifications: form.notifications,
      privacyUrl: form.privacyPolicyUrl.trim(),
      format: form.outputFormat as BuildConfig["format"],
      ubuntu: form.ubuntuVersion as BuildConfig["ubuntu"],
      enableDocker: form.docker,
      enableNginx: form.nginx,
      enableSsl: form.ssl,
      domain: form.domain.trim(),
      sslEmail: form.letsEncryptEmail.trim(),
      iconDataUrl: null,
    }),
    [form, source],
  );

  const basicErrors = useMemo(() => {
    const errors: string[] = [];
    if (!form.appName.trim()) errors.push("Tətbiq adını daxil edin.");
    if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*){2,}$/.test(form.packageName.trim())) {
      errors.push("Android package adı az.studio.sayt formatında olmalıdır.");
    }
    if (!/^\d+$/.test(form.versionCode) || Number(form.versionCode) < 1) {
      errors.push("Versiya kodu 1 və ya daha böyük tam ədəd olmalıdır.");
    }
    if (!form.versionName.trim()) errors.push("Versiya adını daxil edin.");
    if (source === "url" && !isHttpUrl(form.websiteUrl)) {
      errors.push("Etibarlı sayt ünvanı daxil edin (https://...).");
    }
    if (source === "zip" && !zipFile) errors.push(zipError || "index.html olan sayt ZIP faylını seçin.");
    if (form.privacyPolicyUrl && !isHttpUrl(form.privacyPolicyUrl)) {
      errors.push("Məxfilik siyasəti üçün etibarlı URL daxil edin.");
    }
    if (form.ssl && !form.nginx) errors.push("SSL konfiqurasiyası üçün əvvəlcə Nginx-i aktiv edin.");
    if (form.ssl && form.nginx && !form.domain) errors.push("SSL üçün domen adını daxil edin.");
    if (form.ssl && form.nginx && !form.letsEncryptEmail) {
      errors.push("Let’s Encrypt üçün e-poçt ünvanını daxil edin.");
    }
    return errors;
  }, [form, source, zipFile, zipError]);

  const setName = (value: string) => {
    setForm((old) => ({
      ...old,
      appName: value,
      ...(!packageEdited ? { packageName: makePackageSuggestion(value) } : {}),
    }));
  };

  const handleZip = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = event.target.files?.[0];
    input.value = "";
    const checkId = ++zipCheckId.current;
    setZipFile(null);
    setZipError("");
    setStatus({ kind: "idle" });
    if (!file) return;
    const reason = await validateWebsiteZip(file);
    if (checkId !== zipCheckId.current) return;
    if (reason) {
      setZipError(reason);
      return;
    }
    setZipFile(file);
  };

  const handleIcon = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = event.target.files?.[0];
    input.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setStatus({ kind: "error", message: "İkon PNG, JPEG və ya WebP formatında olmalıdır." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ kind: "error", message: "İkon faylı 10 MB-dan kiçik olmalıdır." });
      return;
    }
    setIconFile(file);
    setStatus({ kind: "idle" });
  };

  const createBundle = async () => {
    if (basicErrors.length) {
      setStatus({
        kind: "error",
        message: "Davam etmək üçün qeyd olunan sahələri düzəldin.",
        errors: basicErrors,
      });
      document.getElementById("validation-summary")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    setStatus({ kind: "pending", message: "Build kit hazırlanır…" });
    try {
      const buildConfig: BuildConfig = {
        ...config,
        iconDataUrl: iconFile ? await imageToPngDataUrl(iconFile) : null,
      };
      const issues = await validateBuildConfig(buildConfig, source === "zip" ? zipFile : null);
      if (issues.length) {
        setStatus({
          kind: "error",
          message: "Davam etmək üçün qeyd olunan sahələri düzəldin.",
          errors: issues,
        });
        return;
      }
      const fileList = getBundleFileList(buildConfig, source === "zip" ? zipFile : null);
      setBundleFiles(fileList);
      const blob = await buildProjectBundle(buildConfig, source === "zip" ? zipFile : null);
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = getBundleFilename(buildConfig);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus({
        kind: "success",
        message:
          "Tam hazır ZIP endirildi. Ubuntu serverində açın — qalanını siz edəcəksiniz.",
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Build kit yaradılarkən xəta baş verdi.",
      });
    }
  };

  const field = (
    key: keyof FormState,
    label: string,
    options: { placeholder?: string; hint?: string; type?: string; testId?: string; full?: boolean } = {},
  ) => (
    <label className={`field${options.full ? " full" : ""}`} key={key}>
      <span className="field-label">{label}</span>
      <input
        className="control"
        type={options.type || "text"}
        value={String(form[key])}
        placeholder={options.placeholder}
        onChange={(event) => update(key, event.target.value)}
        data-testid={options.testId || `input-${key}`}
      />
      {options.hint ? <p className="field-hint">{options.hint}</p> : null}
    </label>
  );

  const segment = (
    key: keyof FormState,
    choices: { value: string; label: string }[],
    testId: string,
  ) => (
    <div className="segmented" role="group" aria-label={key}>
      {choices.map((choice) => (
        <button
          type="button"
          className={`segment ${form[key] === choice.value ? "active" : ""}`}
          key={choice.value}
          aria-pressed={form[key] === choice.value}
          onClick={() => update(key, choice.value)}
          data-testid={`${testId}-${choice.value}`}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );

  const orientationLabel = { portrait: "Şaquli", landscape: "Üfüqi", auto: "Avtomatik" }[
    form.orientation
  ];

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" data-testid="link-home" aria-label="APK Studio ana səhifə">
          <span className="brand-mark">
            <Code2 size={19} strokeWidth={2.5} />
          </span>
          <span>
            apk<span className="brand-light">studio</span>
          </span>
        </a>
        <div className="top-note">
          <i aria-hidden="true" /> Lokal iş sahəsi <span aria-hidden="true">·</span> Fayllarınız brauzerdə qalır
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">Saytdan Android layihəsinə</div>
          <h1>
            Saytınızı tətbiqə
            <br />
            <em>çevirin.</em>
          </h1>
          <p>
            Sayt linkini yazın və ya hazır statik ZIP yükləyin. APK Studio tam hazır build kitini
            endirir — Ubuntu serverində APK və ya AAB-ni siz yığacaqsınız.
          </p>
          <div className="stack-strip" aria-label="Build kitə daxil olanlar">
            {STACK.map((item) => (
              <span className="stack-chip" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="hero-stamp">
          <strong>NO. 01 / BUILD KIT</strong>
          APK deyil — onu hazırlayan layihə
        </div>
      </section>

      <div className="workspace">
        <form
          className="form-panel"
          onSubmit={(event) => {
            event.preventDefault();
            void createBundle();
          }}
        >
          <section className="section">
            <div className="section-head">
              <span className="section-num">01</span>
              <div>
                <h2>Mənbə sayt</h2>
                <p>İki üsuldan birini seçin: canlı URL və ya index.html olan ZIP.</p>
              </div>
            </div>
            <div className="source-tabs" role="group" aria-label="Mənbə növü">
              <button
                type="button"
                className={`source-card ${source === "url" ? "selected" : ""}`}
                onClick={() => {
                  setSource("url");
                  setStatus({ kind: "idle" });
                }}
                aria-pressed={source === "url"}
                data-testid="button-source-url"
              >
                <span className="source-icon">
                  <Globe2 size={17} />
                </span>
                <span>
                  <strong>Sayt ünvanı</strong>
                  <span>İnternetdə yayımlanmış sayt</span>
                </span>
              </button>
              <button
                type="button"
                className={`source-card ${source === "zip" ? "selected" : ""}`}
                onClick={() => {
                  setSource("zip");
                  setStatus({ kind: "idle" });
                }}
                aria-pressed={source === "zip"}
                data-testid="button-source-zip"
              >
                <span className="source-icon">
                  <FileArchive size={17} />
                </span>
                <span>
                  <strong>Hazır statik ZIP</strong>
                  <span>index.html olan sayt faylları</span>
                </span>
              </button>
            </div>
            {source === "url" ? (
              field("websiteUrl", "Sayt URL-i", {
                placeholder: "https://saytiniz.az",
                type: "url",
                full: true,
                hint: "Tətbiq açıldıqda bu ünvana qoşulacaq.",
              })
            ) : (
              <>
                <div className="drop-zone">
                  <span className="drop-icon">
                    {zipFile ? <Check size={18} /> : <ArrowUpFromLine size={18} />}
                  </span>
                  <div className="drop-copy">
                    <strong>{zipFile ? zipFile.name : "Sayt ZIP faylını seçin"}</strong>
                    <span>
                      {zipFile
                        ? `${prettySize(zipFile.size)} · index.html tapıldı`
                        : "ZIP · maksimum 60 MB · index.html olan statik sayt"}
                    </span>
                  </div>
                  <label className="subtle-button" htmlFor="zip-upload">
                    {zipFile ? "Başqa fayl" : "Fayl seçin"}
                  </label>
                  <input
                    id="zip-upload"
                    type="file"
                    accept=".zip,application/zip"
                    onChange={(event) => void handleZip(event)}
                    data-testid="input-website-zip"
                    className="hidden-file"
                  />
                </div>
                {zipError ? (
                  <div className="inline-alert upload-invalid" role="alert" data-testid="status-zip-error">
                    <AlertCircle size={14} />
                    {zipError}
                  </div>
                ) : null}
                {zipFile ? (
                  <button
                    type="button"
                    className="remove-zip"
                    onClick={() => {
                      zipCheckId.current += 1;
                      setZipFile(null);
                      setZipError("");
                    }}
                    data-testid="button-remove-zip"
                  >
                    ZIP faylını sil
                  </button>
                ) : null}
                <div className="inline-alert">
                  <ShieldCheck size={14} />
                  ZIP-in içindəki fayllar build kitə daxil edilir. Yüklənmiş skriptlər icra edilmir.
                </div>
              </>
            )}
          </section>

          <section className="section">
            <div className="section-head">
              <span className="section-num">02</span>
              <div>
                <h2>Tətbiq məlumatları</h2>
                <p>APK yaratmazdan əvvəl ad, paket, ikon, dil və versiya.</p>
              </div>
            </div>
            <div className="field-grid">
              <label className="field full">
                <span className="field-label">
                  Tətbiqin adı <small>Android launcher-də görünür</small>
                </span>
                <input
                  className="control"
                  value={form.appName}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Məsələn, Şəhər Bələdçisi"
                  data-testid="input-app-name"
                />
              </label>
              <label className="field full">
                <span className="field-label">
                  Android package adı <small>unikal identifikator</small>
                </span>
                <input
                  className="control mono"
                  value={form.packageName}
                  onChange={(event) => {
                    setPackageEdited(true);
                    update("packageName", event.target.value);
                  }}
                  placeholder="az.studio.mysite"
                  data-testid="input-package-name"
                />
                <p className="field-hint">
                  Hər hissə hərflə başlamalıdır; nümunə: <span className="mono">az.studio.saytiniz</span>
                </p>
              </label>
              <div className="field full">
                <span className="field-label">
                  Tətbiq ikonu <small>PNG və ya JPEG · 10 MB-a qədər</small>
                </span>
                <div className="icon-upload">
                  <span className="icon-preview">
                    {iconPreview ? (
                      <img src={iconPreview} alt="Tətbiq ikonunun önizləməsi" data-testid="img-icon-preview" />
                    ) : form.appName.trim().slice(0, 2).toUpperCase() || <Smartphone size={22} />}
                  </span>
                  <div className="icon-details">
                    <strong>{iconFile ? iconFile.name : "Öz ikonunuzu əlavə edin"}</strong>
                    <p>{iconFile ? prettySize(iconFile.size) : "İstəyə bağlıdır. Sonradan dəyişə bilərsiniz."}</p>
                  </div>
                  <label htmlFor="icon-upload" className="subtle-button">
                    Yüklə
                  </label>
                  <input
                    id="icon-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleIcon}
                    data-testid="input-app-icon"
                    className="hidden-file"
                  />
                  {iconFile ? (
                    <button
                      type="button"
                      className="subtle-button"
                      onClick={() => setIconFile(null)}
                      data-testid="button-remove-icon"
                    >
                      Sil
                    </button>
                  ) : null}
                </div>
              </div>
              <label className="field">
                <span className="field-label">Tətbiq dili</span>
                <select
                  className="control"
                  value={form.language}
                  onChange={(event) => update("language", event.target.value)}
                  data-testid="select-language"
                >
                  <option value="az">Azərbaycan dili</option>
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="tr">Türkçe</option>
                </select>
              </label>
              {field("versionName", "Versiya adı", { placeholder: "1.0.0" })}
              {field("versionCode", "Versiya kodu", {
                type: "number",
                placeholder: "1",
                hint: "Hər buraxılışda artırılmalıdır.",
              })}
              <div className="field">
                <span className="field-label">Ekran istiqaməti</span>
                {segment(
                  "orientation",
                  [
                    { value: "portrait", label: "Şaquli" },
                    { value: "landscape", label: "Üfüqi" },
                    { value: "auto", label: "Avtomatik" },
                  ],
                  "orientation",
                )}
              </div>
              <div className="field full">
                <div className="toggle-row">
                  <div>
                    <strong>Bildiriş icazəsi</strong>
                    <small>Android 13+ üçün icazə əlavə edilir; push xidməti ayrıca qurulmalıdır.</small>
                  </div>
                  <button
                    type="button"
                    className={`switch ${form.notifications ? "on" : ""}`}
                    role="switch"
                    aria-checked={form.notifications}
                    aria-label="Bildiriş icazəsini aktiv et"
                    onClick={() => update("notifications", !form.notifications)}
                    data-testid="switch-notifications"
                  />
                </div>
              </div>
              {field("privacyPolicyUrl", "Məxfilik siyasəti URL-i", {
                placeholder: "https://saytiniz.az/privacy",
                type: "url",
                full: true,
                hint: "İstəyə bağlıdır. Tətbiq parametrlərində istifadə olunur.",
              })}
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <span className="section-num">03</span>
              <div>
                <h2>Build sazlamaları</h2>
                <p>APK, AAB və Ubuntu server mühiti — ZIP-ə bütün quraşdırma əmrləri daxil edilir.</p>
              </div>
            </div>
            <div className="field-grid">
              <div className="field full">
                <span className="field-label">Android çıxış formatı</span>
                {segment(
                  "outputFormat",
                  [
                    { value: "apk", label: "APK" },
                    { value: "aab", label: "AAB" },
                    { value: "both", label: "Hər ikisi" },
                  ],
                  "output-format",
                )}
                <p className="field-hint">Build kit seçdiyiniz formatı serverinizdə yaradacaq.</p>
              </div>
              <div className="field full">
                <span className="field-label">Ubuntu versiyası</span>
                {segment(
                  "ubuntuVersion",
                  [
                    { value: "22.04", label: "Ubuntu 22.04 LTS" },
                    { value: "24.04", label: "Ubuntu 24.04 LTS" },
                  ],
                  "ubuntu-version",
                )}
              </div>
              <div className="field full">
                <div className="config-note">
                  <strong className="note-strong">Serverə daxil olanlar</strong>
                  <br />
                  Tam hazır ZIP-də quraşdırma skriptləri var. Siz serverdə işə salırsınız.
                  <ul className="kit-list">
                    <li>Java 17</li>
                    <li>Node.js 20</li>
                    <li>Android SDK</li>
                    <li>Gradle</li>
                    <li>Capacitor</li>
                    <li>Firewall (UFW)</li>
                    <li>Docker (seçimlə)</li>
                    <li>Nginx + SSL (seçimlə)</li>
                  </ul>
                </div>
              </div>
              <div className="field full">
                <div className="toggle-row">
                  <div>
                    <strong>Docker</strong>
                    <small>Konteyner əsaslı qurulum üçün</small>
                  </div>
                  <button
                    type="button"
                    className={`switch ${form.docker ? "on" : ""}`}
                    role="switch"
                    aria-checked={form.docker}
                    aria-label="Docker-i aktiv et"
                    onClick={() => update("docker", !form.docker)}
                    data-testid="switch-docker"
                  />
                </div>
              </div>
              <div className="field full">
                <div className="toggle-row">
                  <div>
                    <strong>Nginx</strong>
                    <small>Veb server və reverse proxy</small>
                  </div>
                  <button
                    type="button"
                    className={`switch ${form.nginx ? "on" : ""}`}
                    role="switch"
                    aria-checked={form.nginx}
                    aria-label="Nginx-i aktiv et"
                    onClick={() => update("nginx", !form.nginx)}
                    data-testid="switch-nginx"
                  />
                </div>
              </div>
              <div className="field full">
                <div className="toggle-row">
                  <div>
                    <strong>SSL / HTTPS</strong>
                    <small>Let’s Encrypt sertifikatının avtomatik alınması</small>
                  </div>
                  <button
                    type="button"
                    className={`switch ${form.ssl ? "on" : ""}`}
                    role="switch"
                    aria-checked={form.ssl}
                    aria-label="SSL-i aktiv et"
                    onClick={() => update("ssl", !form.ssl)}
                    data-testid="switch-ssl"
                  />
                </div>
              </div>
              {form.ssl ? (
                <>
                  {field("domain", "Domen adı", { placeholder: "saytiniz.az" })}
                  {field("letsEncryptEmail", "Let’s Encrypt e-poçtu", {
                    placeholder: "admin@saytiniz.az",
                    type: "email",
                  })}
                </>
              ) : null}
            </div>
          </section>
        </form>

        <aside className="side-column" aria-label="Build xülasəsi">
          <div className="summary-card">
            <div className="summary-top">
              <div className="summary-label">Layihə xülasəsi</div>
              <div className="summary-title">{form.appName.trim() || "Yeni Android tətbiqi"}</div>
              <div className="summary-package">{form.packageName || "az.studio.tetbiq"}</div>
            </div>
            <div className="summary-list">
              <div className="summary-item">
                <span>Mənbə</span>
                <strong>{source === "url" ? "Veb URL" : "Statik ZIP"}</strong>
              </div>
              <div className="summary-item">
                <span>Çıxış</span>
                <strong>{form.outputFormat.toUpperCase()}</strong>
              </div>
              <div className="summary-item">
                <span>Orientasiya</span>
                <strong>{orientationLabel}</strong>
              </div>
              <div className="summary-divider" />
              <div className="summary-item">
                <span>Server</span>
                <strong>Ubuntu {form.ubuntuVersion}</strong>
              </div>
              <div className="summary-item">
                <span>HTTPS</span>
                <strong>{form.ssl ? "Let’s Encrypt" : "Sazlanmayıb"}</strong>
              </div>
            </div>
          </div>
          <div id="validation-summary">
            {basicErrors.length > 0 ? (
              <div className="status-card error" role="status" data-testid="status-validation">
                <div className="status-head">
                  <AlertCircle size={15} />
                  {basicErrors.length} məsələ yoxlanmalıdır
                </div>
                <ul className="error-list">
                  {basicErrors.slice(0, 4).map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {status.kind === "pending" ? (
              <div className="status-card pending" role="status" data-testid="status-building">
                <div className="status-head">
                  <LoaderCircle size={15} className="spinner" />
                  Build kit hazırlanır
                </div>
                <p>{status.message}</p>
              </div>
            ) : null}
            {status.kind === "error" ? (
              <div className="status-card error" role="alert" data-testid="status-error">
                <div className="status-head">
                  <AlertCircle size={15} />
                  Hazırlamaq mümkün olmadı
                </div>
                <p>{status.message}</p>
                {status.errors ? (
                  <ul className="error-list">
                    {status.errors.slice(0, 4).map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
            {status.kind === "success" ? (
              <div className="status-card success" role="status" data-testid="status-success">
                <div className="status-head">
                  <CheckCircle2 size={15} />
                  Fayl endirildi
                </div>
                <p>{status.message}</p>
                {bundleFiles.length > 0 ? (
                  <p className="status-extra">{bundleFiles.length} fayl build kitə əlavə edildi.</p>
                ) : null}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="build-button"
            disabled={status.kind === "pending"}
            onClick={() => void createBundle()}
            data-testid="button-create-build-kit"
          >
            {status.kind === "pending" ? (
              <>
                <LoaderCircle size={16} className="spinner" />
                Hazırlanır…
              </>
            ) : (
              <>
                <PackageCheck size={17} />
                Tam hazır ZIP ver <ArrowDownToLine size={15} />
              </>
            )}
          </button>
          <p className="build-help">
            Endirilən ZIP serverdə işə salınan layihə və skriptlərdir — APK/AAB faylının özü deyil. Qalanını
            siz edəcəksiniz.
          </p>
          <div className="secure-note">
            <LockKeyhole size={15} />
            <span>
              Fayllar bu brauzerdə emal edilir. ZIP daxilindəki mənbə kodu icra olunmur; server məlumatları
              build kit sazlaması üçündür.
            </span>
          </div>
        </aside>
      </div>
      <footer className="footer-note">
        <span>
          <strong>APK Studio</strong> · Android build üçün açıq və sadə iş axını.
        </span>
        <span>Ubuntu · Docker · Nginx · SSL</span>
      </footer>
    </main>
  );
}
