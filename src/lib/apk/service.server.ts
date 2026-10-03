import { createHash } from "node:crypto";
import {
  CHUNK_SIZE,
  MAX_CHUNKS,
  MAX_CHUNK_BYTES,
  MAX_KIT_BYTES,
  chunkCountFor,
  isApkFormat,
  isGitSha,
  isJobId,
  isSha256,
  type ApiError,
  type JobFile,
  type JobStatus,
} from "./shared.ts";

/**
 * APK build xidməti: istifadəçi faylları GitHub-dakı şəxsi build repozitoriyasına
 * göndərilir, GitHub Actions APK-nı yığır, nəticə isə bizim serverdən yüklənir.
 * İstifadəçi GitHub-ı görmür; GITHUB_TOKEN heç vaxt brauzerə çıxmır.
 */

const WORKFLOW_FILE = "build-apk.yml";
const GITHUB_TIMEOUT_MS = 25_000;

class ServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type GithubConfig = {
  token: string;
  owner: string;
  repo: string;
  apiBase: string;
  branch: string;
};

function readConfig(): GithubConfig {
  const token = process.env.GITHUB_TOKEN?.trim();
  const repoFull = process.env.GITHUB_REPO?.trim();
  if (!token || !repoFull) {
    throw new ServiceError(
      503,
      "APK build xidməti hələ qurulmayıb: serverdə GITHUB_TOKEN və GITHUB_REPO mühit dəyişənləri təyin edilməlidir.",
    );
  }
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(repoFull);
  if (!match) {
    throw new ServiceError(503, "GITHUB_REPO dəyəri 'sahib/repo' formatında olmalıdır.");
  }
  const apiBase = (process.env.GITHUB_API_BASE?.trim() || "https://api.github.com").replace(/\/+$/, "");
  return {
    token,
    owner: match[1],
    repo: match[2],
    apiBase,
    branch: process.env.GITHUB_BRANCH?.trim() || "main",
  };
}

type GhResult = { status: number; ok: boolean; data: any };

async function gh(
  cfg: GithubConfig,
  method: string,
  path: string,
  body?: unknown,
  options: { allow?: number[] } = {},
): Promise<GhResult> {
  const url = `${cfg.apiBase}/repos/${cfg.owner}/${cfg.repo}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${cfg.token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "apk-studio",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[apk] GitHub-a qoşulmaq alınmadı:", (error as Error).message);
    throw new ServiceError(502, "Build xidməti ilə əlaqə qurulmadı. Bir azdan yenidən cəhd edin.");
  }
  let data: any = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.slice(0, 300) };
    }
  }
  if (!response.ok && !(options.allow ?? []).includes(response.status)) {
    console.error(`[apk] GitHub ${method} ${path} -> ${response.status}: ${data?.message ?? ""}`);
    throw mapGithubError(response.status, response.headers, data);
  }
  return { status: response.status, ok: response.ok, data };
}

function mapGithubError(status: number, headers: Headers, data: any) {
  if (status === 401) {
    return new ServiceError(502, "Build xidmətinə giriş rədd edildi. GITHUB_TOKEN-in etibarlı olduğunu yoxlayın.");
  }
  if (status === 403 || status === 429) {
    const limited = headers.get("x-ratelimit-remaining") === "0" || status === 429 || /rate limit|abuse/i.test(String(data?.message));
    return limited
      ? new ServiceError(503, "Build xidməti müvəqqəti məşğuldur. Bir neçə dəqiqədən sonra yenidən cəhd edin.")
      : new ServiceError(502, "Token build repozitoriyasında lazımi icazələrə malik deyil (Contents, Actions: Read and write).");
  }
  if (status === 404) {
    return new ServiceError(502, "Build repozitoriyası və ya workflow tapılmadı. GITHUB_REPO dəyərini və workflow faylını yoxlayın.");
  }
  if (status === 409 || status === 422) {
    return new ServiceError(502, "Build xidməti sorğunu qəbul etmədi. Yenidən cəhd edin.");
  }
  return new ServiceError(502, "Build xidməti gözlənilməz cavab verdi. Bir azdan yenidən cəhd edin.");
}

// ---------------------------------------------------------------------------
// Sadə (best-effort) sürət limiti. Serverless-də hər instansiya üçün ayrıdır.
// ---------------------------------------------------------------------------
const rateBuckets = new Map<string, number[]>();

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

function rateLimit(request: Request, bucket: string, max: number, windowMs: number) {
  const key = `${bucket}:${clientIp(request)}`;
  const now = Date.now();
  const hits = (rateBuckets.get(key) ?? []).filter((time) => now - time < windowMs);
  if (hits.length >= max) {
    rateBuckets.set(key, hits);
    throw new ServiceError(429, "Çox sayda sorğu göndərildi. Bir az gözləyib yenidən cəhd edin.");
  }
  hits.push(now);
  rateBuckets.set(key, hits);
  if (rateBuckets.size > 5000) {
    for (const [name, list] of rateBuckets) {
      if (!list.some((time) => now - time < windowMs)) rateBuckets.delete(name);
    }
  }
}

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

// ---------------------------------------------------------------------------
// Cavab köməkçiləri
// ---------------------------------------------------------------------------
function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });
}

function fail(error: unknown) {
  if (error instanceof ServiceError) {
    const body: ApiError = { ok: false, error: error.message };
    return json(body, error.status, error.status === 429 ? { "retry-after": "60" } : {});
  }
  console.error("[apk] gözlənilməz xəta:", error);
  const body: ApiError = { ok: false, error: "Gözlənilməz xəta baş verdi. Yenidən cəhd edin." };
  return json(body, 500);
}

function pad(index: number) {
  return String(index).padStart(3, "0");
}

// ---------------------------------------------------------------------------
// POST /api/apk/chunk?job=<id>&index=<n>&total=<n>   (raw bayt gövdəsi)
// ---------------------------------------------------------------------------
export async function handleChunk(request: Request): Promise<Response> {
  try {
    if (request.method !== "POST") throw new ServiceError(405, "Yalnız POST qəbul edilir.");
    const cfg = readConfig();
    const url = new URL(request.url);
    const job = url.searchParams.get("job");
    const index = Number(url.searchParams.get("index"));
    const total = Number(url.searchParams.get("total"));
    if (!isJobId(job)) throw new ServiceError(400, "İş identifikatoru yanlışdır.");
    if (!Number.isInteger(total) || total < 1 || total > MAX_CHUNKS) {
      throw new ServiceError(400, "Fayl çox böyükdür (maksimum təxminən 72 MB).");
    }
    if (!Number.isInteger(index) || index < 0 || index >= total) {
      throw new ServiceError(400, "Hissə nömrəsi yanlışdır.");
    }
    rateLimit(request, "chunk", numberEnv("APK_MAX_CHUNKS_PER_10MIN", 120), 10 * 60_000);

    const declared = Number(request.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_CHUNK_BYTES) {
      throw new ServiceError(413, "Hissə çox böyükdür.");
    }
    const buffer = Buffer.from(await request.arrayBuffer());
    if (buffer.length === 0) throw new ServiceError(400, "Hissə boşdur.");
    if (buffer.length > MAX_CHUNK_BYTES) throw new ServiceError(413, "Hissə çox böyükdür.");
    if (index < total - 1 && buffer.length !== CHUNK_SIZE) {
      throw new ServiceError(400, "Hissə ölçüsü yanlışdır.");
    }

    const localSha = createHash("sha1").update(`blob ${buffer.length}\0`).update(buffer).digest("hex");
    const { data } = await gh(cfg, "POST", "/git/blobs", {
      content: buffer.toString("base64"),
      encoding: "base64",
    });
    if (data?.sha !== localSha) {
      throw new ServiceError(502, "Hissə düzgün saxlanmadı. Yenidən cəhd edin.");
    }
    return json({ ok: true, sha: localSha, size: buffer.length });
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/apk/start   { jobId, parts: sha[], size, sha256, format }
// ---------------------------------------------------------------------------
export async function handleStart(request: Request): Promise<Response> {
  try {
    if (request.method !== "POST") throw new ServiceError(405, "Yalnız POST qəbul edilir.");
    const cfg = readConfig();
    rateLimit(request, "start", numberEnv("APK_MAX_BUILDS_PER_HOUR", 8), 60 * 60_000);

    const raw = await request.text();
    if (raw.length > 20_000) throw new ServiceError(413, "Sorğu çox böyükdür.");
    let body: any;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new ServiceError(400, "Sorğu formatı yanlışdır.");
    }
    const { jobId, parts, size, sha256, format } = body ?? {};
    if (!isJobId(jobId)) throw new ServiceError(400, "İş identifikatoru yanlışdır.");
    if (!Array.isArray(parts) || parts.length < 1 || parts.length > MAX_CHUNKS || !parts.every(isGitSha)) {
      throw new ServiceError(400, "Hissələrin siyahısı yanlışdır.");
    }
    if (!Number.isInteger(size) || size < 22 || size > MAX_KIT_BYTES) {
      throw new ServiceError(400, "Fayl ölçüsü yanlışdır (maksimum təxminən 72 MB).");
    }
    if (chunkCountFor(size) !== parts.length) {
      throw new ServiceError(400, "Hissələrin sayı fayl ölçüsünə uyğun gəlmir.");
    }
    if (!isSha256(sha256)) throw new ServiceError(400, "Yoxlama cəmi yanlışdır.");
    if (!isApkFormat(format)) throw new ServiceError(400, "Çıxış formatı yanlışdır.");

    const tree = await gh(cfg, "POST", "/git/trees", {
      tree: parts.map((sha: string, index: number) => ({
        path: `jobs/${jobId}/part-${pad(index)}`,
        mode: "100644",
        type: "blob",
        sha,
      })),
    });
    const commit = await gh(cfg, "POST", "/git/commits", {
      message: `job ${jobId}`,
      tree: tree.data.sha,
      parents: [],
    });
    const ref = await gh(
      cfg,
      "POST",
      "/git/refs",
      { ref: `refs/heads/jobs/${jobId}`, sha: commit.data.sha },
      { allow: [422] },
    );
    if (ref.status === 422) throw new ServiceError(409, "Bu iş artıq başladılıb.");

    try {
      await gh(cfg, "POST", `/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
        ref: cfg.branch,
        inputs: { job_id: jobId, parts: String(parts.length), sha256, format },
      });
    } catch (error) {
      await gh(cfg, "DELETE", `/git/refs/heads/jobs/${jobId}`, undefined, { allow: [404, 422] }).catch(() => {});
      throw error;
    }
    return json({ ok: true, jobId }, 202);
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/apk/<jobId>/status
// ---------------------------------------------------------------------------
const STEP_RANGES: Record<string, [number, number, string]> = {
  "Validate inputs": [6, 10, "Fayllar hazırlanır…"],
  "Checkout job files": [10, 16, "Fayllar hazırlanır…"],
  "Reassemble kit": [16, 22, "Fayllar hazırlanır…"],
  "Set up Java": [22, 28, "Android mühiti qurulur…"],
  "Set up Node": [28, 34, "Android mühiti qurulur…"],
  "Set up Android SDK": [34, 44, "Android mühiti qurulur…"],
  "Build Android app": [44, 90, "Tətbiq yığılır — bu bir neçə dəqiqə çəkə bilər…"],
  "Upload build result": [90, 94, "APK hazırlanır…"],
};

const FAILURE_REASONS: Record<string, string> = {
  "Validate inputs": "Göndərilən məlumatlar yoxlamadan keçmədi. Yenidən cəhd edin.",
  "Checkout job files": "Yüklənən fayllar build xidmətində tapılmadı. Yenidən cəhd edin.",
  "Reassemble kit": "Yüklənən fayl zədələnib. Yenidən cəhd edin.",
  "Set up Java": "Build mühiti qurula bilmədi. Bir azdan yenidən cəhd edin.",
  "Set up Node": "Build mühiti qurula bilmədi. Bir azdan yenidən cəhd edin.",
  "Set up Android SDK": "Android SDK qurula bilmədi. Bir azdan yenidən cəhd edin.",
  "Build Android app":
    "Android tətbiqi yığıla bilmədi. Sayt ünvanını/ZIP-i, package adını və ikonu yoxlayıb yenidən cəhd edin.",
  "Upload build result": "Hazır APK saxlanıla bilmədi. Yenidən cəhd edin.",
};

type StatusCacheEntry = { at: number; value: JobStatus };
const statusCache = new Map<string, StatusCacheEntry>();

function stepProgress(jobs: any[]): { progress: number; message: string } {
  let progress = 5;
  let message = "Növbədə gözləyir…";
  const build = jobs.find((job) => job.name === "Build");
  const publish = jobs.find((job) => job.name === "Publish");
  for (const step of build?.steps ?? []) {
    const range = STEP_RANGES[step.name];
    if (!range) continue;
    const [from, to, label] = range;
    if (step.status === "completed" && step.conclusion === "success") {
      progress = Math.max(progress, to);
    } else if (step.status === "in_progress") {
      let value = from;
      if (step.name === "Build Android app" && step.started_at) {
        const elapsed = (Date.now() - Date.parse(step.started_at)) / 1000;
        if (Number.isFinite(elapsed) && elapsed > 0) {
          value = from + (to - from) * (1 - Math.exp(-elapsed / 150));
        }
      }
      progress = Math.max(progress, Math.round(value));
      message = label;
    }
  }
  if (publish && publish.status !== "queued") {
    progress = Math.max(progress, 96);
    message = "APK hazırlanır…";
  } else if (progress > 5 && message === "Növbədə gözləyir…") {
    message = "Build davam edir…";
  }
  return { progress: Math.min(progress, 97), message };
}

async function findRelease(cfg: GithubConfig, jobId: string) {
  const { status, data } = await gh(cfg, "GET", `/releases/tags/job-${jobId}`, undefined, { allow: [404] });
  if (status === 404) return null;
  return data as { assets?: { id: number; name: string; size: number; state?: string }[] };
}

function releaseFiles(release: { assets?: { id: number; name: string; size: number; state?: string }[] }) {
  const files: (JobFile & { id: number })[] = [];
  for (const asset of release.assets ?? []) {
    if (asset.state && asset.state !== "uploaded") continue;
    const lower = asset.name.toLowerCase();
    if (lower.endsWith(".apk")) files.push({ kind: "apk", name: asset.name, size: asset.size, id: asset.id });
    else if (lower.endsWith(".aab")) files.push({ kind: "aab", name: asset.name, size: asset.size, id: asset.id });
  }
  return files;
}

function readyStatus(jobId: string, files: JobFile[]): JobStatus {
  return {
    ok: true,
    jobId,
    state: "ready",
    progress: 100,
    message: "APK hazırdır!",
    files: files.map(({ kind, name, size }) => ({ kind, name, size })),
  };
}

async function computeStatus(cfg: GithubConfig, jobId: string): Promise<JobStatus> {
  const runs = await gh(
    cfg,
    "GET",
    `/actions/workflows/${WORKFLOW_FILE}/runs?event=workflow_dispatch&per_page=60`,
  );
  const run = (runs.data?.workflow_runs ?? []).find((item: any) => item.display_title === `APK build ${jobId}`);

  if (!run) {
    const release = await findRelease(cfg, jobId);
    const files = release ? releaseFiles(release) : [];
    if (files.length) return readyStatus(jobId, files);
    const branch = await gh(cfg, "GET", `/git/ref/heads/jobs/${jobId}`, undefined, { allow: [404] });
    if (branch.status === 404) {
      return {
        ok: true,
        jobId,
        state: "unknown",
        progress: 0,
        message: "Bu iş tapılmadı və ya müddəti bitib.",
      };
    }
    return { ok: true, jobId, state: "queued", progress: 3, message: "Build başladılır…" };
  }

  if (run.status === "completed") {
    if (run.conclusion === "success") {
      const release = await findRelease(cfg, jobId);
      const files = release ? releaseFiles(release) : [];
      if (files.length) return readyStatus(jobId, files);
      return {
        ok: true,
        jobId,
        state: "failed",
        progress: 100,
        message: "Build tamamlandı, lakin nəticə faylı tapılmadı.",
        reason: "Nəticə faylı tapılmadı. Yenidən cəhd edin.",
      };
    }
    let reason = "Build uğursuz oldu. Yenidən cəhd edin.";
    if (run.conclusion === "cancelled") reason = "Build ləğv edildi.";
    else if (run.conclusion === "timed_out") reason = "Build çox uzun çəkdi və dayandırıldı.";
    else {
      const jobs = await gh(cfg, "GET", `/actions/runs/${run.id}/jobs?per_page=20`);
      for (const job of jobs.data?.jobs ?? []) {
        const failed = (job.steps ?? []).find((step: any) => step.conclusion === "failure");
        if (failed && job.name !== "Cleanup") {
          reason = FAILURE_REASONS[failed.name] ?? reason;
          break;
        }
      }
    }
    return { ok: true, jobId, state: "failed", progress: 100, message: "Hazırlamaq mümkün olmadı.", reason };
  }

  if (run.status === "in_progress") {
    const jobs = await gh(cfg, "GET", `/actions/runs/${run.id}/jobs?per_page=20`);
    const list: any[] = jobs.data?.jobs ?? [];
    const publish = list.find((job) => job.name === "Publish");
    if (publish?.status === "completed" && publish.conclusion === "success") {
      const release = await findRelease(cfg, jobId);
      const files = release ? releaseFiles(release) : [];
      if (files.length) return readyStatus(jobId, files);
    }
    const { progress, message } = stepProgress(list);
    return { ok: true, jobId, state: "building", progress, message };
  }

  return { ok: true, jobId, state: "queued", progress: 4, message: "Növbədə gözləyir…" };
}

export async function handleStatus(request: Request, jobId: string): Promise<Response> {
  try {
    if (request.method !== "GET") throw new ServiceError(405, "Yalnız GET qəbul edilir.");
    if (!isJobId(jobId)) throw new ServiceError(400, "İş identifikatoru yanlışdır.");
    const cfg = readConfig();
    rateLimit(request, "status", numberEnv("APK_MAX_STATUS_PER_MIN", 60), 60_000);
    const cached = statusCache.get(jobId);
    if (cached && Date.now() - cached.at < 3000) return json(cached.value);
    const value = await computeStatus(cfg, jobId);
    statusCache.set(jobId, { at: Date.now(), value });
    if (statusCache.size > 500) {
      for (const [key, entry] of statusCache) {
        if (Date.now() - entry.at > 10_000) statusCache.delete(key);
      }
    }
    return json(value);
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/apk/<jobId>/download?file=apk|aab  — GitHub-dan axın şəklində ötürür
// ---------------------------------------------------------------------------
function safeFileName(name: string, fallback: string) {
  const cleaned = name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return cleaned || fallback;
}

export async function handleDownload(request: Request, jobId: string): Promise<Response> {
  try {
    if (request.method !== "GET") throw new ServiceError(405, "Yalnız GET qəbul edilir.");
    if (!isJobId(jobId)) throw new ServiceError(400, "İş identifikatoru yanlışdır.");
    const cfg = readConfig();
    rateLimit(request, "download", numberEnv("APK_MAX_DOWNLOADS_PER_10MIN", 30), 10 * 60_000);
    const kind = new URL(request.url).searchParams.get("file") === "aab" ? "aab" : "apk";

    const release = await findRelease(cfg, jobId);
    const file = release ? releaseFiles(release).find((item) => item.kind === kind) : undefined;
    if (!file) {
      throw new ServiceError(404, "Fayl tapılmadı. Müddəti bitmiş ola bilər — APK-nı yenidən hazırlayın.");
    }

    // Aktivi tokenlə al; GitHub imzalı ünvana yönləndirsə, token olmadan izlə.
    const assetUrl = `${cfg.apiBase}/repos/${cfg.owner}/${cfg.repo}/releases/assets/${file.id}`;
    let upstream: Response;
    try {
      upstream = await fetch(assetUrl, {
        headers: {
          authorization: `Bearer ${cfg.token}`,
          accept: "application/octet-stream",
          "x-github-api-version": "2022-11-28",
          "user-agent": "apk-studio",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
      });
      if (upstream.status >= 300 && upstream.status < 400) {
        const location = upstream.headers.get("location");
        if (!location) throw new Error("redirect without location");
        await upstream.body?.cancel();
        upstream = await fetch(location, {
          headers: { "user-agent": "apk-studio" },
          signal: AbortSignal.timeout(60_000),
        });
      }
    } catch (error) {
      console.error("[apk] aktiv yüklənmədi:", (error as Error).message);
      throw new ServiceError(502, "Fayl build xidmətindən alına bilmədi. Yenidən cəhd edin.");
    }
    if (!upstream.ok || !upstream.body) {
      console.error(`[apk] aktiv cavabı: ${upstream.status}`);
      throw new ServiceError(502, "Fayl build xidmətindən alına bilmədi. Yenidən cəhd edin.");
    }

    const name = safeFileName(file.name, kind === "apk" ? "tetbiq.apk" : "tetbiq.aab");
    const headers: Record<string, string> = {
      "content-type": kind === "apk" ? "application/vnd.android.package-archive" : "application/octet-stream",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    };
    headers["content-length"] = String(file.size);
    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    return fail(error);
  }
}
