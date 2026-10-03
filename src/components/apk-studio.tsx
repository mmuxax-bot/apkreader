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
  ApkClientError,
  downloadUrl,
  fetchStatus,
  newJobId,
  sha256Hex,
  sleep,
  startBuild,
  uploadKit,
} from "@/lib/apk/client";
import type { JobFile } from "@/lib/apk/shared";
import { SiteBrand, SiteFooter } from "@/components/site-chrome";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CheckCircle2,
  Download,
  FileArchive,
  Globe2,
  Hammer,
  LockKeyhole,
  LoaderCircle,
  PackageCheck,
  RotateCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

type SourceMode = "url" | "zip";
type BuildStatus = {
  kind: "idle" | "pending" | "error" | "success";
  message?: string;
  errors?: string[];
};
type ApkPhase = "idle" | "preparing" | "uploading" | "queued" | "building" | "ready" | "error";
type ApkState = {
  phase: ApkPhase;
  progress: number;
  message: string;
  jobId?: string;
  files?: JobFile[];
  error?: string;
};
class FatalJobError extends Error {}
const JOB_STORAGE_KEY = "apk-studio:job";
const JOB_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const POLL_TIMEOUT_MS = 50 * 60 * 1000;
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
  const [apk, setApk] = useState<ApkState>({ phase: "idle", progress: 0, message: "" });
  const [accepted, setAccepted] = useState(false);
  const runId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

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
    return errors;
  }, [form, source, zipFile, zipError]);

  // Yalnız endirilən server kiti üçün keçərli olan qaydalar (APK düzəltməyə təsir etmir).
  const kitErrors = useMemo(() => {
    const errors: string[] = [];
    if (form.ssl && !form.nginx) errors.push("SSL konfiqurasiyası üçün əvvəlcə Nginx-i aktiv edin.");
    if (form.ssl && form.nginx && !form.domain) errors.push("SSL üçün domen adını daxil edin.");
    if (form.ssl && form.nginx && !form.letsEncryptEmail) {
      errors.push("Let’s Encrypt üçün e-poçt ünvanını daxil edin.");
    }
    return errors;
  }, [form.ssl, form.nginx, form.domain, form.letsEncryptEmail]);

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

  const requireTerms = () => {
    if (accepted) return true;
    setStatus({
      kind: "error",
      message: "Davam etmək üçün “İstifadə qaydaları ilə razıyam” xanasını işarələyin.",
    });
    return false;
  };

  const createBundle = async () => {
    if (!requireTerms()) return;
    const allErrors = [...basicErrors, ...kitErrors];
    if (allErrors.length) {
      setStatus({
        kind: "error",
        message: "Davam etmək üçün qeyd olunan sahələri düzəldin.",
        errors: allErrors,
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

  const cancelRun = () => {
    runId.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
  };

  useEffect(() => () => cancelRun(), []);

  const pollJob = async (jobId: string, id: number, signal: AbortSignal) => {
    const startedAt = Date.now();
    let failures = 0;
    let unknownSince = 0;
    while (id === runId.current) {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        throw new FatalJobError("Build çox uzun çəkdi. Yenidən cəhd edin.");
      }
      try {
        const job = await fetchStatus(jobId, signal);
        failures = 0;
        if (id !== runId.current) return;
        if (job.state === "unknown") {
          unknownSince ||= Date.now();
          if (Date.now() - unknownSince > 60_000) throw new FatalJobError(job.message);
        } else {
          unknownSince = 0;
        }
        if (job.state === "ready") {
          localStorage.removeItem(JOB_STORAGE_KEY);
          setApk({ phase: "ready", progress: 100, message: job.message, jobId, files: job.files ?? [] });
          return;
        }
        if (job.state === "failed") throw new FatalJobError(job.reason ?? job.message);
        setApk({
          phase: job.state === "building" ? "building" : "queued",
          progress: Math.max(job.progress, 3),
          message: job.message,
          jobId,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (error instanceof FatalJobError) throw error;
        // Şəbəkə xətalarını bir neçə dəfə tolere et; build GitHub-da davam edir.
        failures += 1;
        if (failures > 6) throw error;
      }
      await sleep(4000, signal);
    }
  };

  const failApk = (error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError") return;
    localStorage.removeItem(JOB_STORAGE_KEY);
    setApk({
      phase: "error",
      progress: 0,
      message: "",
      error: error instanceof Error ? error.message : "APK hazırlanarkən xəta baş verdi.",
    });
  };

  const createApk = async () => {
    if (apk.phase === "preparing" || apk.phase === "uploading") return;
    if (!requireTerms()) return;
    if (basicErrors.length) {
      setStatus({
        kind: "error",
        message: "Davam etmək üçün qeyd olunan sahələri düzəldin.",
        errors: basicErrors,
      });
      document.getElementById("validation-summary")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setStatus({ kind: "idle" });
    cancelRun();
    const id = runId.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setApk({ phase: "preparing", progress: 0, message: "Fayllar hazırlanır…" });
    try {
      // Server alətləri (Docker/Nginx/SSL) APK üçün lazım deyil.
      const buildConfig: BuildConfig = {
        ...config,
        enableDocker: false,
        enableNginx: false,
        enableSsl: false,
        domain: "",
        sslEmail: "",
        iconDataUrl: iconFile ? await imageToPngDataUrl(iconFile) : null,
      };
      const activeZip = source === "zip" ? zipFile : null;
      const issues = await validateBuildConfig(buildConfig, activeZip);
      if (issues.length) throw new ApkClientError(issues[0], false);
      const kit = await buildProjectBundle(buildConfig, activeZip);
      const sha256 = await sha256Hex(kit);
      const jobId = newJobId();
      if (id !== runId.current) return;

      setApk({ phase: "uploading", progress: 0, message: "Fayllar göndərilir…", jobId });
      const parts = await uploadKit(
        kit,
        jobId,
        (fraction) => {
          if (id === runId.current) {
            setApk({
              phase: "uploading",
              progress: Math.round(fraction * 100),
              message: `Fayllar göndərilir… ${Math.round(fraction * 100)}%`,
              jobId,
            });
          }
        },
        controller.signal,
      );
      if (id !== runId.current) return;
      await startBuild(
        { jobId, parts, size: kit.size, sha256, format: buildConfig.format },
        controller.signal,
      );
      localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify({ jobId, at: Date.now() }));
      setApk({ phase: "queued", progress: 3, message: "Build başladılır…", jobId });
      await pollJob(jobId, id, controller.signal);
    } catch (error) {
      if (id === runId.current) failApk(error);
    }
  };

  // Səhifə yenilənəndə yarımçıq qalan işi davam etdir.
  useEffect(() => {
    let saved: { jobId?: string; at?: number } | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(JOB_STORAGE_KEY) ?? "null");
    } catch {
      saved = null;
    }
    if (!saved?.jobId || !saved.at || Date.now() - saved.at > JOB_MAX_AGE_MS) {
      localStorage.removeItem(JOB_STORAGE_KEY);
      return;
    }
    const jobId = saved.jobId;
    const id = ++runId.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setApk({ phase: "queued", progress: 3, message: "Əvvəlki build yoxlanılır…", jobId });
    void pollJob(jobId, id, controller.signal).catch((error) => {
      if (id === runId.current) failApk(error);
    });
    return () => controller.abort();
  }, []);

  const apkBusy = apk.phase === "preparing" || apk.phase === "uploading" || apk.phase === "queued" || apk.phase === "building";

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
        <SiteBrand />
        <div className="top-note">
          <i aria-hidden="true" /> Bulud build <span aria-hidden="true">·</span> Fayllar yalnız APK yığmaq üçün göndərilir
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
            Sayt linkini yazın və ya hazır statik ZIP yükləyin, “APK düzəlt” düyməsinə basın. APK
            Studio tətbiqi bizim build xidmətində yığır və yükləmə linkini verir. İstəsəniz, öz
            serverinizdə yığmaq üçün build kiti də endirə bilərsiniz.
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
          <strong>NO. 01 / APK BUILD</strong>
          Düyməyə bas — hazır APK linki al
        </div>
      </section>

      <div className="workspace">
        <form
          className="form-panel"
          onSubmit={(event) => {
            event.preventDefault();
            void createApk();
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
                  ZIP-in içindəki fayllar tətbiqə daxil edilir və yığılmaq üçün build xidmətinə göndərilir. Sayt skriptləri build zamanı icra edilmir.
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
                <p>APK / AAB formatı. Öz serverinizdə yığmaq istəyirsinizsə, əlavə server seçimləri aşağıdadır.</p>
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
                <p className="field-hint">“APK düzəlt” seçdiyiniz formatı bizim build xidmətində hazırlayır. AAB imzasızdır (Play Console üçün sonradan imzalanmalıdır).</p>
              </div>
            </div>
            <details className="kit-details">
              <summary>Öz serverim üçün build kit seçimləri (əlavə)</summary>
              <p className="field-hint">Bu seçimlər yalnız endirilən ZIP-ə təsir edir; “APK düzəlt” onları nəzərə almır.</p>
            <div className="field-grid">
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
                  Endirilən ZIP-də quraşdırma skriptləri var. Siz serverdə işə salırsınız.
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
            </details>
          </section>
          <section className="section action-section" aria-label="APK düzəlt">
            <div className="action-grid">
              <div className="action-status">
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
            {apkBusy ? (
              <div className="status-card pending" role="status" data-testid="status-apk-progress">
                <div className="status-head">
                  <LoaderCircle size={15} className="spinner" />
                  {apk.phase === "preparing"
                    ? "Fayllar hazırlanır"
                    : apk.phase === "uploading"
                      ? "Fayllar göndərilir"
                      : apk.phase === "queued"
                        ? "Növbədə"
                        : "APK yığılır"}
                </div>
                <p>{apk.message}</p>
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={apk.progress}
                >
                  <i style={{ width: `${Math.min(100, Math.max(2, apk.progress))}%` }} />
                </div>
                {apk.phase === "building" || apk.phase === "queued" ? (
                  <p className="status-extra">Adətən 3–8 dəqiqə çəkir. Bu səhifəni açıq saxlayın.</p>
                ) : null}
              </div>
            ) : null}
            {apk.phase === "error" ? (
              <div className="status-card error" role="alert" data-testid="status-apk-error">
                <div className="status-head">
                  <AlertCircle size={15} />
                  APK hazırlamaq mümkün olmadı
                </div>
                <p>{apk.error}</p>
                <button
                  type="button"
                  className="retry-button"
                  onClick={() => void createApk()}
                  data-testid="button-retry-apk"
                >
                  <RotateCw size={13} /> Yenidən cəhd et
                </button>
              </div>
            ) : null}
            {apk.phase === "ready" && apk.jobId ? (
              <div className="status-card success apk-ready" role="status" data-testid="status-apk-ready">
                <div className="status-head">
                  <CheckCircle2 size={15} />
                  APK hazırdır!
                </div>
                {(apk.files?.length ? apk.files : [{ kind: "apk" as const, name: "APK", size: 0 }]).map((file) => (
                  <a
                    key={file.kind}
                    className="download-link"
                    href={downloadUrl(apk.jobId!, file.kind)}
                    download
                    data-testid={`link-download-${file.kind}`}
                  >
                    <Download size={16} />
                    {file.kind === "apk" ? "APK-nı yüklə" : "AAB-ni yüklə"}
                    {file.size ? <small>{prettySize(file.size)}</small> : null}
                  </a>
                ))}
                <p className="status-extra">
                  Link qısa müddət (bir neçə gün) işləyir. APK debug imzalıdır — telefonda “naməlum mənbələrdən
                  quraşdırma” icazəsi lazım ola bilər.
                </p>
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
              </div>
              <div className="action-buttons">
          <div className="terms-box">
            <p className="terms-warning" role="note" data-testid="notice-warning">
              <ShieldCheck size={14} />
              <span>
                Zərərli tətbiqlər hazırlamaq qadağandır (virus, casus proqram, fişinq, dələduzluq, oğurlanmış və
                ya qanunsuz məzmun). Pozuntu halında build rədd edilə bilər.{" "}
                <Link to="/terms">İstifadə qaydaları</Link> · <Link to="/privacy">Məxfilik siyasəti</Link>
              </span>
            </p>
            <label className="terms-check">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                data-testid="checkbox-terms"
              />
              <span>İstifadə qaydaları ilə razıyam</span>
            </label>
          </div>
          <button
            type="button"
            className="build-button"
            disabled={apkBusy || !accepted}
            title={accepted ? undefined : "Əvvəlcə istifadə qaydaları ilə razılaşın"}
            onClick={() => void createApk()}
            data-testid="button-create-apk"
          >
            {apkBusy ? (
              <>
                <LoaderCircle size={16} className="spinner" />
                {apk.phase === "uploading" ? `Göndərilir… ${apk.progress}%` : "Hazırlanır…"}
              </>
            ) : (
              <>
                <Hammer size={17} />
                APK düzəlt
              </>
            )}
          </button>
          <button
            type="button"
            className="kit-button"
            disabled={status.kind === "pending" || !accepted}
            onClick={() => void createBundle()}
            data-testid="button-create-build-kit"
          >
            {status.kind === "pending" ? (
              <>
                <LoaderCircle size={14} className="spinner" />
                Hazırlanır…
              </>
            ) : (
              <>
                <PackageCheck size={15} />
                Build kit ZIP-i endir <ArrowDownToLine size={14} />
              </>
            )}
          </button>
          <p className="build-help">
            “APK düzəlt” tətbiqi bizim build xidmətində yığır və yükləmə linki verir. Əlavə seçim kimi
            serverdə özünüz yığmaq üçün build kit ZIP-i də endirə bilərsiniz.
          </p>
          <div className="secure-note">
            <LockKeyhole size={15} />
            <span>
              APK düzəldəndə sayt ünvanı/ZIP-i, ikon və tətbiq parametrləri yığma üçün build xidmətimizə
              göndərilir və iş bitdikdən sonra silinir. Hazır APK qısa müddət saxlanılır; yükləmə linki
              yalnız sizdə olur.
            </span>
          </div>
              </div>
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
        </aside>
      </div>
      <SiteFooter />
    </main>
  );
}
