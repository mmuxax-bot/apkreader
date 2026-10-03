import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { startMockGithub } from "../../../scripts/mock-github.mjs";
import { CHUNK_SIZE } from "./shared.ts";
import { handleChunk, handleDownload, handleStart, handleStatus } from "./service.server.ts";

let mock: Awaited<ReturnType<typeof startMockGithub>>;

before(async () => {
  mock = await startMockGithub({ stepMs: 60 });
  process.env.GITHUB_API_BASE = mock.url;
  process.env.GITHUB_TOKEN = mock.token;
  process.env.GITHUB_REPO = mock.repo;
  process.env.APK_MAX_BUILDS_PER_HOUR = "1000";
  process.env.APK_MAX_CHUNKS_PER_10MIN = "10000";
  process.env.APK_MAX_STATUS_PER_MIN = "10000";
});
after(async () => {
  await mock.close();
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const post = (path: string, body: BodyInit | Buffer, headers: Record<string, string> = {}) =>
  new Request(`http://app.test${path}`, { method: "POST", body: body as BodyInit, headers });
const get = (path: string) => new Request(`http://app.test${path}`);

async function upload(kit: Buffer, jobId = randomUUID()) {
  const total = Math.max(1, Math.ceil(kit.length / CHUNK_SIZE));
  const parts: string[] = [];
  for (let i = 0; i < total; i += 1) {
    const slice = kit.subarray(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const res = await handleChunk(post(`/api/apk/chunk?job=${jobId}&index=${i}&total=${total}`, slice));
    assert.equal(res.status, 200);
    parts.push(((await res.json()) as any).sha);
  }
  return { jobId, parts, size: kit.length, sha256: createHash("sha256").update(kit).digest("hex") };
}

async function start(info: { jobId: string; parts: string[]; size: number; sha256: string }, format = "apk") {
  return handleStart(post("/api/apk/start", JSON.stringify({ ...info, format }), { "content-type": "application/json" }));
}

async function waitFor(jobId: string, state: string) {
  for (let i = 0; i < 100; i += 1) {
    const res = await handleStatus(get(`/api/apk/${jobId}/status`), jobId);
    const body = (await res.json()) as any;
    if (body.state === state) return body;
    await sleep(80);
  }
  throw new Error(`state ${state} not reached`);
}

test("missing env gives a clear Azerbaijani error", async () => {
  const saved = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;
  const res = await handleChunk(post(`/api/apk/chunk?job=${randomUUID()}&index=0&total=1`, Buffer.from("x")));
  process.env.GITHUB_TOKEN = saved;
  assert.equal(res.status, 503);
  assert.match(((await res.json()) as any).error, /GITHUB_TOKEN/);
});

test("full flow with multi-chunk kit: upload, start, status, download", async () => {
  const kit = Buffer.alloc(CHUNK_SIZE * 2 + 1234, 7);
  kit.write("PK-kit-start", 0);
  const info = await upload(kit);
  assert.equal(info.parts.length, 3);
  const res = await start(info);
  assert.equal(res.status, 202);

  const first = (await (await handleStatus(get(`/api/apk/${info.jobId}/status`), info.jobId)).json()) as any;
  assert.ok(["queued", "building"].includes(first.state));

  const ready = await waitFor(info.jobId, "ready");
  assert.equal(ready.progress, 100);
  assert.equal(ready.files[0].kind, "apk");
  assert.ok(!JSON.stringify(ready).includes("github"));

  const dl = await handleDownload(get(`/api/apk/${info.jobId}/download`), info.jobId);
  assert.equal(dl.status, 200);
  assert.equal(dl.headers.get("content-type"), "application/vnd.android.package-archive");
  assert.match(dl.headers.get("content-disposition") ?? "", /^attachment; filename="[\w.-]+\.apk"$/);
  const bytes = Buffer.from(await dl.arrayBuffer());
  assert.equal(bytes.length, ready.files[0].size);
  assert.ok(bytes.toString("latin1").startsWith("PK\x03\x04FAKE-APK:"));
  // job branch cleaned up
  assert.ok(![...mock.state.refs.keys()].some((k: string) => k.includes(info.jobId)));
});

test("single tiny chunk works", async () => {
  const info = await upload(Buffer.from("tiny kit contents, 22+ bytes long!!"));
  assert.equal((await start(info, "both")).status, 202);
  await waitFor(info.jobId, "ready");
});

test("corrupted checksum makes the build fail with a friendly reason", async () => {
  const info = await upload(Buffer.from("another kit with enough bytes in it"));
  assert.equal((await start({ ...info, sha256: "0".repeat(64) })).status, 202);
  const failed = await waitFor(info.jobId, "failed");
  assert.match(failed.reason, /zədələnib/);
  const dl = await handleDownload(get(`/api/apk/${info.jobId}/download`), info.jobId);
  assert.equal(dl.status, 404);
});

test("failing build reports the build step reason", async () => {
  mock.state.options.failBuilds = true;
  try {
    const info = await upload(Buffer.from("kit that will fail while building!!"));
    assert.equal((await start(info)).status, 202);
    const failed = await waitFor(info.jobId, "failed");
    assert.match(failed.reason, /yığıla bilmədi/);
  } finally {
    mock.state.options.failBuilds = false;
  }
});

test("validation: bad job id, index, size, duplicate start, unknown job", async () => {
  assert.equal((await handleChunk(post("/api/apk/chunk?job=nope&index=0&total=1", Buffer.from("x")))).status, 400);
  const id = randomUUID();
  assert.equal((await handleChunk(post(`/api/apk/chunk?job=${id}&index=2&total=1`, Buffer.from("x")))).status, 400);
  assert.equal((await handleChunk(post(`/api/apk/chunk?job=${id}&index=0&total=1`, Buffer.alloc(0)))).status, 400);
  assert.equal((await handleChunk(post(`/api/apk/chunk?job=${id}&index=0&total=1`, Buffer.alloc(4 * 1024 * 1024)))).status, 413);
  assert.equal((await handleChunk(post(`/api/apk/chunk?job=${id}&index=0&total=3`, Buffer.alloc(100)))).status, 400, "non-final chunk must be full size");
  assert.equal((await handleChunk(post(`/api/apk/chunk?job=${id}&index=0&total=999`, Buffer.alloc(100)))).status, 400);
  assert.equal((await handleStart(post("/api/apk/start", "{bad", {}))).status, 400);
  assert.equal((await start({ jobId: id, parts: ["a".repeat(40)], size: 999999999, sha256: "a".repeat(64) })).status, 400);
  assert.equal((await start({ jobId: id, parts: ["a".repeat(40), "b".repeat(40)], size: 100, sha256: "a".repeat(64) })).status, 400);
  assert.equal((await handleStart(post("/api/apk/start", JSON.stringify({ jobId: id, parts: ["a".repeat(40)], size: 100, sha256: "a".repeat(64), format: "exe" })))).status, 400);

  const info = await upload(Buffer.from("duplicate start check kit bytes!!!"));
  assert.equal((await start(info)).status, 202);
  assert.equal((await start(info)).status, 409);
  await waitFor(info.jobId, "ready");

  const unknown = randomUUID();
  const res = await handleStatus(get(`/api/apk/${unknown}/status`), unknown);
  assert.equal(((await res.json()) as any).state, "unknown");
  assert.equal((await handleStatus(get("/api/apk/xyz/status"), "xyz")).status, 400);
  assert.equal((await handleDownload(get(`/api/apk/${unknown}/download`), unknown)).status, 404);
});

test("start with a blob that was never uploaded is rejected without dispatching", async () => {
  const before = mock.state.runs.length;
  const res = await start({ jobId: randomUUID(), parts: ["c".repeat(40)], size: 100, sha256: "a".repeat(64) });
  assert.equal(res.status, 502);
  assert.equal(mock.state.runs.length, before);
});

test("wrong token gives a token-specific message", async () => {
  const saved = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = "wrong";
  const res = await handleChunk(post(`/api/apk/chunk?job=${randomUUID()}&index=0&total=1`, Buffer.from("x")));
  process.env.GITHUB_TOKEN = saved;
  assert.equal(res.status, 502);
  assert.match(((await res.json()) as any).error, /GITHUB_TOKEN/);
});
