import { CHUNK_SIZE, MAX_KIT_BYTES, type ApkFormat, type JobStatus } from "./shared";

export class ApkClientError extends Error {
  retryable: boolean;
  constructor(message: string, retryable = true) {
    super(message);
    this.retryable = retryable;
  }
}

export function newJobId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function sha256Hex(blob: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Dayandırıldı", "AbortError"));
      },
      { once: true },
    );
  });

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {
    /* gövdə JSON deyil */
  }
  if (response.status === 413) return "Fayl serverin qəbul etdiyi ölçüdən böyükdür.";
  return "Server gözlənilməz cavab verdi. Yenidən cəhd edin.";
}

async function request(input: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastError: ApkClientError | null = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (response.ok) return response;
      const message = await readError(response);
      // 4xx (429 istisna) təkrarla düzəlmir
      if (response.status < 500 && response.status !== 429) throw new ApkClientError(message, false);
      lastError = new ApkClientError(message);
    } catch (error) {
      if (error instanceof ApkClientError && !error.retryable) throw error;
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      lastError ??= new ApkClientError("İnternet bağlantısı kəsildi. Bağlantını yoxlayıb yenidən cəhd edin.");
    }
    if (attempt < attempts - 1) await sleep(900 * 2 ** attempt, init.signal ?? undefined);
  }
  throw lastError ?? new ApkClientError("Sorğu uğursuz oldu.");
}

export type UploadProgress = (fraction: number) => void;

/** Kit ZIP-ini ~3 MB-lıq hissələrlə (3 paralel) serverə yükləyir və hissələrin SHA-larını qaytarır. */
export async function uploadKit(
  kit: Blob,
  jobId: string,
  onProgress: UploadProgress,
  signal?: AbortSignal,
) {
  if (kit.size > MAX_KIT_BYTES) {
    throw new ApkClientError("Build paketi çox böyükdür (maksimum təxminən 72 MB).", false);
  }
  const total = Math.max(1, Math.ceil(kit.size / CHUNK_SIZE));
  const shas: string[] = new Array(total);
  const sent = new Array<number>(total).fill(0);
  let next = 0;
  const report = () => onProgress(Math.min(1, sent.reduce((a, b) => a + b, 0) / Math.max(1, kit.size)));

  const worker = async () => {
    while (true) {
      const index = next++;
      if (index >= total) return;
      const slice = kit.slice(index * CHUNK_SIZE, Math.min(kit.size, (index + 1) * CHUNK_SIZE));
      const response = await request(
        `/api/apk/chunk?job=${jobId}&index=${index}&total=${total}`,
        { method: "POST", body: slice, headers: { "content-type": "application/octet-stream" }, signal },
        4,
      );
      const body = (await response.json()) as { sha?: string };
      if (!body.sha) throw new ApkClientError("Server hissəni təsdiqləmədi. Yenidən cəhd edin.");
      shas[index] = body.sha;
      sent[index] = slice.size;
      report();
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, total) }, worker));
  return shas;
}

export async function startBuild(
  input: { jobId: string; parts: string[]; size: number; sha256: string; format: ApkFormat },
  signal?: AbortSignal,
) {
  await request(
    "/api/apk/start",
    { method: "POST", body: JSON.stringify(input), headers: { "content-type": "application/json" }, signal },
    2,
  );
}

export async function fetchStatus(jobId: string, signal?: AbortSignal): Promise<JobStatus> {
  const response = await request(`/api/apk/${jobId}/status`, { signal, cache: "no-store" }, 1);
  return (await response.json()) as JobStatus;
}

export function downloadUrl(jobId: string, file: "apk" | "aab" = "apk") {
  return `/api/apk/${jobId}/download${file === "aab" ? "?file=aab" : ""}`;
}

export { sleep };
