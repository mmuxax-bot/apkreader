/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// APK Studio üçün GitHub API-nin yerli saxta (mock) serveri.
// İstifadə: node scripts/mock-github.mjs [port]
// Sonra:   GITHUB_API_BASE=http://127.0.0.1:<port> GITHUB_TOKEN=test GITHUB_REPO=owner/repo npm run dev
import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

export function startMockGithub({ port = 0, token = "test-token", repo = "owner/repo", stepMs = 400 } = {}) {
  const blobs = new Map(); // sha -> Buffer
  const trees = new Map(); // sha -> entries
  const commits = new Map(); // sha -> { tree }
  const refs = new Map(); // "heads/jobs/ID" -> sha
  const runs = []; // { id, title, createdAt, inputs, fail }
  const releases = new Map(); // tag -> { assets: [{id,name,size,state,data}] }
  const calls = [];
  const sha1 = (buf) => createHash("sha1").update(buf).digest("hex");
  const options = { failBuilds: false, assetRedirect: true };

  const STEPS = [
    ["Set up job", 1],
    ["Validate inputs", 1],
    ["Checkout job files", 1],
    ["Reassemble kit", 1],
    ["Set up Java", 1],
    ["Set up Node", 1],
    ["Set up Android SDK", 1],
    ["Build Android app", 3],
    ["Upload build result", 1],
  ];

  function runState(run) {
    const elapsed = Date.now() - run.createdAt;
    const queueMs = stepMs;
    if (elapsed < queueMs) return { status: "queued", conclusion: null, stepIndex: -1 };
    const total = STEPS.reduce((a, [, w]) => a + w, 0) * stepMs;
    const since = elapsed - queueMs;
    if (since >= total) {
      finish(run);
      return { status: "completed", conclusion: run.result, stepIndex: STEPS.length, failedStep: run.failedStep };
    }
    let acc = 0;
    for (let i = 0; i < STEPS.length; i += 1) {
      acc += STEPS[i][1] * stepMs;
      if (since < acc) return { status: "in_progress", conclusion: null, stepIndex: i };
    }
    return { status: "in_progress", conclusion: null, stepIndex: STEPS.length - 1 };
  }

  function finish(run) {
    if (run.result) return;
    const { job_id, parts, sha256 } = run.inputs;
    const prefix = `heads/jobs/${job_id}`;
    const commit = refs.get(prefix);
    let ok = !options.failBuilds;
    run.failedStep = ok ? null : "Build Android app";
    if (ok) {
      const entries = trees.get(commits.get(commit)?.tree) ?? [];
      const sorted = entries.filter((e) => e.path.startsWith(`jobs/${job_id}/part-`)).sort((a, b) => a.path.localeCompare(b.path));
      const kit = Buffer.concat(sorted.map((e) => blobs.get(e.sha) ?? Buffer.alloc(0)));
      if (sorted.length !== Number(parts) || createHash("sha256").update(kit).digest("hex") !== sha256) {
        ok = false;
        run.failedStep = "Reassemble kit";
      } else {
        const data = Buffer.concat([Buffer.from("PK\x03\x04FAKE-APK:"), kit.subarray(0, 64)]);
        releases.set(`job-${job_id}`, {
          assets: [{ id: Math.floor(Math.random() * 1e6) + 1, name: "test-app.apk", size: data.length, state: "uploaded", data }],
        });
      }
    }
    refs.delete(prefix);
    run.result = ok ? "success" : "failure";
  }

  const send = (res, status, body, headers = {}) => {
    const text = body === undefined ? "" : JSON.stringify(body);
    res.writeHead(status, { "content-type": "application/json", ...headers });
    res.end(text);
  };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    calls.push(`${req.method} ${url.pathname}`);

    if (url.pathname.startsWith("/blob/")) {
      const asset = [...releases.values()].flatMap((r) => r.assets).find((a) => `/blob/${a.id}` === url.pathname);
      if (req.headers.authorization) return send(res, 400, { message: "token leaked to redirect target" });
      if (!asset) return send(res, 404, { message: "Not Found" });
      res.writeHead(200, { "content-type": "application/octet-stream", "content-length": asset.data.length });
      return res.end(asset.data);
    }

    if (req.headers.authorization !== `Bearer ${token}`) return send(res, 401, { message: "Bad credentials" });
    const prefix = `/repos/${repo}`;
    if (!url.pathname.startsWith(prefix)) return send(res, 404, { message: "Not Found" });
    const path = url.pathname.slice(prefix.length);
    const body = raw.length && (req.headers["content-type"] ?? "").includes("json") ? JSON.parse(raw.toString("utf8")) : null;

    if (req.method === "POST" && path === "/git/blobs") {
      const buf = Buffer.from(body.content, body.encoding === "base64" ? "base64" : "utf8");
      const sha = sha1(Buffer.concat([Buffer.from(`blob ${buf.length}\0`), buf]));
      blobs.set(sha, buf);
      return send(res, 201, { sha });
    }
    if (req.method === "POST" && path === "/git/trees") {
      for (const entry of body.tree) if (!blobs.has(entry.sha)) return send(res, 422, { message: "GitRPC::BadObjectState" });
      const sha = sha1(Buffer.from(JSON.stringify(body.tree)));
      trees.set(sha, body.tree);
      return send(res, 201, { sha });
    }
    if (req.method === "POST" && path === "/git/commits") {
      const sha = sha1(Buffer.from(JSON.stringify(body) + randomUUID()));
      commits.set(sha, { tree: body.tree });
      return send(res, 201, { sha });
    }
    if (req.method === "POST" && path === "/git/refs") {
      const key = body.ref.replace(/^refs\//, "");
      if (refs.has(key)) return send(res, 422, { message: "Reference already exists" });
      refs.set(key, body.sha);
      return send(res, 201, { ref: body.ref });
    }
    let m = /^\/git\/ref\/(heads\/jobs\/[\w-]+)$/.exec(path);
    if (req.method === "GET" && m) return refs.has(m[1]) ? send(res, 200, { ref: `refs/${m[1]}` }) : send(res, 404, { message: "Not Found" });
    m = /^\/git\/refs\/(heads\/jobs\/[\w-]+)$/.exec(path);
    if (req.method === "DELETE" && m) return refs.delete(m[1]) ? send(res, 204) : send(res, 422, { message: "Reference does not exist" });
    if (req.method === "POST" && path === "/actions/workflows/build-apk.yml/dispatches") {
      if (body.ref !== "main") return send(res, 422, { message: "No ref found" });
      runs.unshift({ id: runs.length + 1000, title: `APK build ${body.inputs.job_id}`, createdAt: Date.now(), inputs: body.inputs });
      return send(res, 204);
    }
    if (req.method === "GET" && path === "/actions/workflows/build-apk.yml/runs") {
      return send(res, 200, {
        workflow_runs: runs.map((run) => {
          const s = runState(run);
          return { id: run.id, display_title: run.title, status: s.status, conclusion: s.conclusion, event: "workflow_dispatch" };
        }),
      });
    }
    m = /^\/actions\/runs\/(\d+)\/jobs$/.exec(path);
    if (req.method === "GET" && m) {
      const run = runs.find((r) => String(r.id) === m[1]);
      if (!run) return send(res, 404, { message: "Not Found" });
      const s = runState(run);
      const steps = STEPS.map(([name], i) => {
        const failed = s.failedStep === name;
        const done = s.status === "completed" ? !s.failedStep || i <= STEPS.findIndex(([n]) => n === s.failedStep) : i < s.stepIndex;
        return {
          name,
          status: done ? "completed" : i === s.stepIndex ? "in_progress" : "queued",
          conclusion: done ? (failed ? "failure" : "success") : null,
          started_at: i <= s.stepIndex ? new Date(run.createdAt + stepMs).toISOString() : null,
        };
      });
      const jobs = [{ name: "Build", status: s.status === "completed" ? "completed" : s.status, conclusion: s.conclusion, steps }];
      if (s.status === "completed") jobs.push({ name: "Publish", status: "completed", conclusion: s.conclusion === "success" ? "success" : "skipped", steps: [] });
      return send(res, 200, { jobs });
    }
    m = /^\/releases\/tags\/(job-[\w-]+)$/.exec(path);
    if (req.method === "GET" && m) {
      const rel = releases.get(m[1]);
      return rel ? send(res, 200, { assets: rel.assets.map(({ data: _d, ...a }) => a) }) : send(res, 404, { message: "Not Found" });
    }
    m = /^\/releases\/assets\/(\d+)$/.exec(path);
    if (req.method === "GET" && m) {
      const asset = [...releases.values()].flatMap((r) => r.assets).find((a) => String(a.id) === m[1]);
      if (!asset) return send(res, 404, { message: "Not Found" });
      if (options.assetRedirect) {
        res.writeHead(302, { location: `http://127.0.0.1:${server.address().port}/blob/${asset.id}` });
        return res.end();
      }
      res.writeHead(200, { "content-type": "application/octet-stream" });
      return res.end(asset.data);
    }
    return send(res, 404, { message: `Mock: ${req.method} ${path}` });
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      resolve({
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((r) => server.close(r)),
        state: { blobs, refs, runs, releases, calls, options },
        token,
        repo,
      });
    });
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const port = Number(process.argv[2] ?? 4010);
  const mock = await startMockGithub({ port, token: process.env.MOCK_TOKEN ?? "test-token", repo: process.env.MOCK_REPO ?? "owner/repo", stepMs: Number(process.env.MOCK_STEP_MS ?? 1200) });
  console.log(`Mock GitHub API: ${mock.url} (repo ${mock.repo})`);
}
