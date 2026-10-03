// Brauzer və server üçün ortaq qaydalar (heç bir Node/DOM API-si istifadə etmir).

/** Bir hissənin ölçüsü (Vercel-in ~4.5 MB sorğu limitindən aşağı). */
export const CHUNK_SIZE = 3 * 1024 * 1024;
/** Serverin qəbul etdiyi maksimum hissə ölçüsü. */
export const MAX_CHUNK_BYTES = 3.5 * 1024 * 1024;
/** Kit ZIP-i üçün maksimum ölçü (60 MB sayt ZIP-i + ikon + skriptlər). */
export const MAX_KIT_BYTES = 72 * 1024 * 1024;
export const MAX_CHUNKS = Math.ceil(MAX_KIT_BYTES / CHUNK_SIZE);

export type ApkFormat = "apk" | "aab" | "both";

const JOB_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA1_RE = /^[0-9a-f]{40}$/;
const SHA256_RE = /^[0-9a-f]{64}$/;

export function isJobId(value: unknown): value is string {
  return typeof value === "string" && JOB_ID_RE.test(value);
}

export function isGitSha(value: unknown): value is string {
  return typeof value === "string" && SHA1_RE.test(value);
}

export function isSha256(value: unknown): value is string {
  return typeof value === "string" && SHA256_RE.test(value);
}

export function isApkFormat(value: unknown): value is ApkFormat {
  return value === "apk" || value === "aab" || value === "both";
}

export function chunkCountFor(size: number) {
  return Math.max(1, Math.ceil(size / CHUNK_SIZE));
}

export type JobState = "queued" | "building" | "ready" | "failed" | "unknown";

export type JobFile = { kind: "apk" | "aab"; name: string; size: number };

export type JobStatus = {
  ok: true;
  jobId: string;
  state: JobState;
  /** 0–100 təxmini irəliləyiş */
  progress: number;
  message: string;
  files?: JobFile[];
  /** Server yalnız qısa, istifadəçi üçün anlaşılan səbəbi qaytarır. */
  reason?: string;
};

export type ApiError = { ok: false; error: string };
