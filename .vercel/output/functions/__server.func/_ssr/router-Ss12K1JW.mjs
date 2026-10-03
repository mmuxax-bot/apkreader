import { i as __toESM } from "../_runtime.mjs";
import { _ as createFileRoute, b as useRouter, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, q as require_react, v as createRootRoute, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { createHash } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/router-Ss12K1JW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
function NotFoundPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "not-found",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "eyebrow",
				children: "404"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Səhifə tapılmadı" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Bu ünvan APK Studio-da yoxdur." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "Ana səhifəyə qayıt"
			}) })
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-dDq7Mqby.css";
var APP_NAME = "APK Studio";
var Route$8 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Sayt ünvanı və ya ZIP yükləyin, “APK düzəlt” düyməsinə basın — APK Studio tətbiqi yığır və yükləmə linkini verir."
			},
			{
				name: "theme-color",
				content: "#28353a"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Newsreader:ital,opsz,wght@0,6..72,500;1,6..72,500&family=Outfit:wght@400;500;600;700&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "az",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$3 = () => import("./routes-Deeud9yp.mjs");
var Route$7 = createFileRoute("/")({
	head: () => ({ meta: [{ title: "APK Studio — saytınızı Android tətbiqinə çevirin" }, {
		name: "description",
		content: "Sayt linkini və ya statik ZIP-i verin, “Layihəni APK-ya çevir” düyməsinə basın — APK Studio Android tətbiqini yığıb yükləmə linki versin."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./privacy-CdyltO6i.mjs");
var Route$6 = createFileRoute("/privacy")({
	head: () => ({ meta: [{ title: "Məxfilik siyasəti — APK Studio" }, {
		name: "description",
		content: "APK Studio hansı məlumatları göndərir, harada emal edir və nə vaxt silir — açıq və sadə izah."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./studio-KO2uRhuw.mjs");
var Route$5 = createFileRoute("/studio")({
	head: () => ({ meta: [{ title: "APK düzəlt — APK Studio" }, {
		name: "description",
		content: "Sayt ünvanı və ya ZIP yükləyin, “APK düzəlt” düyməsinə basın və hazır APK linkini alın."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./terms-RCagFCTp.mjs");
var Route$4 = createFileRoute("/terms")({
	head: () => ({ meta: [{ title: "İstifadə qaydaları və məsuliyyətdən imtina — APK Studio" }, {
		name: "description",
		content: "APK Studio-dan istifadə qaydaları: qadağan olunmuş istifadə, məsuliyyətdən imtina və xidmətin “olduğu kimi” təqdimatı."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
/** Bir hissənin ölçüsü (Vercel-in ~4.5 MB sorğu limitindən aşağı). */
var CHUNK_SIZE = 3145728;
var MAX_CHUNKS = Math.ceil(75497472 / CHUNK_SIZE);
var JOB_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
var SHA1_RE = /^[0-9a-f]{40}$/;
var SHA256_RE = /^[0-9a-f]{64}$/;
function isJobId(value) {
	return typeof value === "string" && JOB_ID_RE.test(value);
}
function isGitSha(value) {
	return typeof value === "string" && SHA1_RE.test(value);
}
function isSha256(value) {
	return typeof value === "string" && SHA256_RE.test(value);
}
function isApkFormat(value) {
	return value === "apk" || value === "aab" || value === "both";
}
function chunkCountFor(size) {
	return Math.max(1, Math.ceil(size / CHUNK_SIZE));
}
/**
* APK build xidməti: istifadəçi faylları GitHub-dakı şəxsi build repozitoriyasına
* göndərilir, GitHub Actions APK-nı yığır, nəticə isə bizim serverdən yüklənir.
* İstifadəçi GitHub-ı görmür; GITHUB_TOKEN heç vaxt brauzerə çıxmır.
*/
var WORKFLOW_FILE = "build-apk.yml";
var GITHUB_TIMEOUT_MS = 25e3;
var ServiceError = class extends Error {
	status;
	constructor(status, message) {
		super(message);
		this.status = status;
	}
};
function readConfig() {
	const token = process.env.GITHUB_TOKEN?.trim();
	const repoFull = process.env.GITHUB_REPO?.trim();
	if (!token || !repoFull) throw new ServiceError(503, "APK build xidməti hələ qurulmayıb: serverdə GITHUB_TOKEN və GITHUB_REPO mühit dəyişənləri təyin edilməlidir.");
	const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(repoFull);
	if (!match) throw new ServiceError(503, "GITHUB_REPO dəyəri 'sahib/repo' formatında olmalıdır.");
	const apiBase = (process.env.GITHUB_API_BASE?.trim() || "https://api.github.com").replace(/\/+$/, "");
	return {
		token,
		owner: match[1],
		repo: match[2],
		apiBase,
		branch: process.env.GITHUB_BRANCH?.trim() || "main"
	};
}
async function gh(cfg, method, path, body, options = {}) {
	const url = `${cfg.apiBase}/repos/${cfg.owner}/${cfg.repo}${path}`;
	let response;
	try {
		response = await fetch(url, {
			method,
			headers: {
				authorization: `Bearer ${cfg.token}`,
				accept: "application/vnd.github+json",
				"x-github-api-version": "2022-11-28",
				"user-agent": "apk-studio",
				...body !== void 0 ? { "content-type": "application/json" } : {}
			},
			body: body !== void 0 ? JSON.stringify(body) : void 0,
			signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS)
		});
	} catch (error) {
		console.error("[apk] GitHub-a qoşulmaq alınmadı:", error.message);
		throw new ServiceError(502, "Build xidməti ilə əlaqə qurulmadı. Bir azdan yenidən cəhd edin.");
	}
	let data = null;
	const text = await response.text();
	if (text) try {
		data = JSON.parse(text);
	} catch {
		data = { raw: text.slice(0, 300) };
	}
	if (!response.ok && !(options.allow ?? []).includes(response.status)) {
		console.error(`[apk] GitHub ${method} ${path} -> ${response.status}: ${data?.message ?? ""}`);
		throw mapGithubError(response.status, response.headers, data);
	}
	return {
		status: response.status,
		ok: response.ok,
		data
	};
}
function mapGithubError(status, headers, data) {
	if (status === 401) return new ServiceError(502, "Build xidmətinə giriş rədd edildi. GITHUB_TOKEN-in etibarlı olduğunu yoxlayın.");
	if (status === 403 || status === 429) return headers.get("x-ratelimit-remaining") === "0" || status === 429 || /rate limit|abuse/i.test(String(data?.message)) ? new ServiceError(503, "Build xidməti müvəqqəti məşğuldur. Bir neçə dəqiqədən sonra yenidən cəhd edin.") : new ServiceError(502, "Token build repozitoriyasında lazımi icazələrə malik deyil (Contents, Actions: Read and write).");
	if (status === 404) return new ServiceError(502, "Build repozitoriyası və ya workflow tapılmadı. GITHUB_REPO dəyərini və workflow faylını yoxlayın.");
	if (status === 409 || status === 422) return new ServiceError(502, "Build xidməti sorğunu qəbul etmədi. Yenidən cəhd edin.");
	return new ServiceError(502, "Build xidməti gözlənilməz cavab verdi. Bir azdan yenidən cəhd edin.");
}
var rateBuckets = /* @__PURE__ */ new Map();
function clientIp(request) {
	return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}
function rateLimit(request, bucket, max, windowMs) {
	const key = `${bucket}:${clientIp(request)}`;
	const now = Date.now();
	const hits = (rateBuckets.get(key) ?? []).filter((time) => now - time < windowMs);
	if (hits.length >= max) {
		rateBuckets.set(key, hits);
		throw new ServiceError(429, "Çox sayda sorğu göndərildi. Bir az gözləyib yenidən cəhd edin.");
	}
	hits.push(now);
	rateBuckets.set(key, hits);
	if (rateBuckets.size > 5e3) {
		for (const [name, list] of rateBuckets) if (!list.some((time) => now - time < windowMs)) rateBuckets.delete(name);
	}
}
function numberEnv(name, fallback) {
	const value = Number(process.env[name]);
	return Number.isFinite(value) && value > 0 ? value : fallback;
}
function json(data, status = 200, extra = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
			...extra
		}
	});
}
function fail(error) {
	if (error instanceof ServiceError) return json({
		ok: false,
		error: error.message
	}, error.status, error.status === 429 ? { "retry-after": "60" } : {});
	console.error("[apk] gözlənilməz xəta:", error);
	return json({
		ok: false,
		error: "Gözlənilməz xəta baş verdi. Yenidən cəhd edin."
	}, 500);
}
function pad(index) {
	return String(index).padStart(3, "0");
}
async function handleChunk(request) {
	try {
		if (request.method !== "POST") throw new ServiceError(405, "Yalnız POST qəbul edilir.");
		const cfg = readConfig();
		const url = new URL(request.url);
		const job = url.searchParams.get("job");
		const index = Number(url.searchParams.get("index"));
		const total = Number(url.searchParams.get("total"));
		if (!isJobId(job)) throw new ServiceError(400, "İş identifikatoru yanlışdır.");
		if (!Number.isInteger(total) || total < 1 || total > MAX_CHUNKS) throw new ServiceError(400, "Fayl çox böyükdür (maksimum təxminən 72 MB).");
		if (!Number.isInteger(index) || index < 0 || index >= total) throw new ServiceError(400, "Hissə nömrəsi yanlışdır.");
		rateLimit(request, "chunk", numberEnv("APK_MAX_CHUNKS_PER_10MIN", 120), 6e5);
		const declared = Number(request.headers.get("content-length"));
		if (Number.isFinite(declared) && declared > 3670016) throw new ServiceError(413, "Hissə çox böyükdür.");
		const buffer = Buffer.from(await request.arrayBuffer());
		if (buffer.length === 0) throw new ServiceError(400, "Hissə boşdur.");
		if (buffer.length > 3670016) throw new ServiceError(413, "Hissə çox böyükdür.");
		if (index < total - 1 && buffer.length !== 3145728) throw new ServiceError(400, "Hissə ölçüsü yanlışdır.");
		const localSha = createHash("sha1").update(`blob ${buffer.length}\0`).update(buffer).digest("hex");
		const { data } = await gh(cfg, "POST", "/git/blobs", {
			content: buffer.toString("base64"),
			encoding: "base64"
		});
		if (data?.sha !== localSha) throw new ServiceError(502, "Hissə düzgün saxlanmadı. Yenidən cəhd edin.");
		return json({
			ok: true,
			sha: localSha,
			size: buffer.length
		});
	} catch (error) {
		return fail(error);
	}
}
async function handleStart(request) {
	try {
		if (request.method !== "POST") throw new ServiceError(405, "Yalnız POST qəbul edilir.");
		const cfg = readConfig();
		rateLimit(request, "start", numberEnv("APK_MAX_BUILDS_PER_HOUR", 8), 36e5);
		const raw = await request.text();
		if (raw.length > 2e4) throw new ServiceError(413, "Sorğu çox böyükdür.");
		let body;
		try {
			body = JSON.parse(raw);
		} catch {
			throw new ServiceError(400, "Sorğu formatı yanlışdır.");
		}
		const { jobId, parts, size, sha256, format } = body ?? {};
		if (!isJobId(jobId)) throw new ServiceError(400, "İş identifikatoru yanlışdır.");
		if (!Array.isArray(parts) || parts.length < 1 || parts.length > MAX_CHUNKS || !parts.every(isGitSha)) throw new ServiceError(400, "Hissələrin siyahısı yanlışdır.");
		if (!Number.isInteger(size) || size < 22 || size > 75497472) throw new ServiceError(400, "Fayl ölçüsü yanlışdır (maksimum təxminən 72 MB).");
		if (chunkCountFor(size) !== parts.length) throw new ServiceError(400, "Hissələrin sayı fayl ölçüsünə uyğun gəlmir.");
		if (!isSha256(sha256)) throw new ServiceError(400, "Yoxlama cəmi yanlışdır.");
		if (!isApkFormat(format)) throw new ServiceError(400, "Çıxış formatı yanlışdır.");
		const tree = await gh(cfg, "POST", "/git/trees", { tree: parts.map((sha, index) => ({
			path: `jobs/${jobId}/part-${pad(index)}`,
			mode: "100644",
			type: "blob",
			sha
		})) });
		const commit = await gh(cfg, "POST", "/git/commits", {
			message: `job ${jobId}`,
			tree: tree.data.sha,
			parents: []
		});
		if ((await gh(cfg, "POST", "/git/refs", {
			ref: `refs/heads/jobs/${jobId}`,
			sha: commit.data.sha
		}, { allow: [422] })).status === 422) throw new ServiceError(409, "Bu iş artıq başladılıb.");
		try {
			await gh(cfg, "POST", `/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
				ref: cfg.branch,
				inputs: {
					job_id: jobId,
					parts: String(parts.length),
					sha256,
					format
				}
			});
		} catch (error) {
			await gh(cfg, "DELETE", `/git/refs/heads/jobs/${jobId}`, void 0, { allow: [404, 422] }).catch(() => {});
			throw error;
		}
		return json({
			ok: true,
			jobId
		}, 202);
	} catch (error) {
		return fail(error);
	}
}
var STEP_RANGES = {
	"Validate inputs": [
		6,
		10,
		"Fayllar hazırlanır…"
	],
	"Checkout job files": [
		10,
		16,
		"Fayllar hazırlanır…"
	],
	"Reassemble kit": [
		16,
		22,
		"Fayllar hazırlanır…"
	],
	"Set up Java": [
		22,
		28,
		"Android mühiti qurulur…"
	],
	"Set up Node": [
		28,
		34,
		"Android mühiti qurulur…"
	],
	"Set up Android SDK": [
		34,
		44,
		"Android mühiti qurulur…"
	],
	"Build Android app": [
		44,
		90,
		"Tətbiq yığılır — bu bir neçə dəqiqə çəkə bilər…"
	],
	"Upload build result": [
		90,
		94,
		"APK hazırlanır…"
	]
};
var FAILURE_REASONS = {
	"Validate inputs": "Göndərilən məlumatlar yoxlamadan keçmədi. Yenidən cəhd edin.",
	"Checkout job files": "Yüklənən fayllar build xidmətində tapılmadı. Yenidən cəhd edin.",
	"Reassemble kit": "Yüklənən fayl zədələnib. Yenidən cəhd edin.",
	"Set up Java": "Build mühiti qurula bilmədi. Bir azdan yenidən cəhd edin.",
	"Set up Node": "Build mühiti qurula bilmədi. Bir azdan yenidən cəhd edin.",
	"Set up Android SDK": "Android SDK qurula bilmədi. Bir azdan yenidən cəhd edin.",
	"Build Android app": "Android tətbiqi yığıla bilmədi. Sayt ünvanını/ZIP-i, package adını və ikonu yoxlayıb yenidən cəhd edin.",
	"Upload build result": "Hazır APK saxlanıla bilmədi. Yenidən cəhd edin."
};
var statusCache = /* @__PURE__ */ new Map();
function stepProgress(jobs) {
	let progress = 5;
	let message = "Növbədə gözləyir…";
	const build = jobs.find((job) => job.name === "Build");
	const publish = jobs.find((job) => job.name === "Publish");
	for (const step of build?.steps ?? []) {
		const range = STEP_RANGES[step.name];
		if (!range) continue;
		const [from, to, label] = range;
		if (step.status === "completed" && step.conclusion === "success") progress = Math.max(progress, to);
		else if (step.status === "in_progress") {
			let value = from;
			if (step.name === "Build Android app" && step.started_at) {
				const elapsed = (Date.now() - Date.parse(step.started_at)) / 1e3;
				if (Number.isFinite(elapsed) && elapsed > 0) value = from + (to - from) * (1 - Math.exp(-elapsed / 150));
			}
			progress = Math.max(progress, Math.round(value));
			message = label;
		}
	}
	if (publish && publish.status !== "queued") {
		progress = Math.max(progress, 96);
		message = "APK hazırlanır…";
	} else if (progress > 5 && message === "Növbədə gözləyir…") message = "Build davam edir…";
	return {
		progress: Math.min(progress, 97),
		message
	};
}
async function findRelease(cfg, jobId) {
	const { status, data } = await gh(cfg, "GET", `/releases/tags/job-${jobId}`, void 0, { allow: [404] });
	if (status === 404) return null;
	return data;
}
function releaseFiles(release) {
	const files = [];
	for (const asset of release.assets ?? []) {
		if (asset.state && asset.state !== "uploaded") continue;
		const lower = asset.name.toLowerCase();
		if (lower.endsWith(".apk")) files.push({
			kind: "apk",
			name: asset.name,
			size: asset.size,
			id: asset.id
		});
		else if (lower.endsWith(".aab")) files.push({
			kind: "aab",
			name: asset.name,
			size: asset.size,
			id: asset.id
		});
	}
	return files;
}
function readyStatus(jobId, files) {
	return {
		ok: true,
		jobId,
		state: "ready",
		progress: 100,
		message: "APK hazırdır!",
		files: files.map(({ kind, name, size }) => ({
			kind,
			name,
			size
		}))
	};
}
async function computeStatus(cfg, jobId) {
	const run = ((await gh(cfg, "GET", `/actions/workflows/${WORKFLOW_FILE}/runs?event=workflow_dispatch&per_page=60`)).data?.workflow_runs ?? []).find((item) => item.display_title === `APK build ${jobId}`);
	if (!run) {
		const release = await findRelease(cfg, jobId);
		const files = release ? releaseFiles(release) : [];
		if (files.length) return readyStatus(jobId, files);
		if ((await gh(cfg, "GET", `/git/ref/heads/jobs/${jobId}`, void 0, { allow: [404] })).status === 404) return {
			ok: true,
			jobId,
			state: "unknown",
			progress: 0,
			message: "Bu iş tapılmadı və ya müddəti bitib."
		};
		return {
			ok: true,
			jobId,
			state: "queued",
			progress: 3,
			message: "Build başladılır…"
		};
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
				reason: "Nəticə faylı tapılmadı. Yenidən cəhd edin."
			};
		}
		let reason = "Build uğursuz oldu. Yenidən cəhd edin.";
		if (run.conclusion === "cancelled") reason = "Build ləğv edildi.";
		else if (run.conclusion === "timed_out") reason = "Build çox uzun çəkdi və dayandırıldı.";
		else {
			const jobs = await gh(cfg, "GET", `/actions/runs/${run.id}/jobs?per_page=20`);
			for (const job of jobs.data?.jobs ?? []) {
				const failed = (job.steps ?? []).find((step) => step.conclusion === "failure");
				if (failed && job.name !== "Cleanup") {
					reason = FAILURE_REASONS[failed.name] ?? reason;
					break;
				}
			}
		}
		return {
			ok: true,
			jobId,
			state: "failed",
			progress: 100,
			message: "Hazırlamaq mümkün olmadı.",
			reason
		};
	}
	if (run.status !== "requested" && run.status !== "pending") {
		const list = (await gh(cfg, "GET", `/actions/runs/${run.id}/jobs?per_page=20`)).data?.jobs ?? [];
		const publish = list.find((job) => job.name === "Publish");
		if (publish?.status === "completed" && publish.conclusion === "success") {
			const release = await findRelease(cfg, jobId);
			const files = release ? releaseFiles(release) : [];
			if (files.length) return readyStatus(jobId, files);
		}
		if (list.some((job) => job.status === "in_progress" || job.status === "completed")) {
			const { progress, message } = stepProgress(list);
			return {
				ok: true,
				jobId,
				state: "building",
				progress,
				message
			};
		}
	}
	return {
		ok: true,
		jobId,
		state: "queued",
		progress: 4,
		message: "Növbədə gözləyir…"
	};
}
async function handleStatus(request, jobId) {
	try {
		if (request.method !== "GET") throw new ServiceError(405, "Yalnız GET qəbul edilir.");
		if (!isJobId(jobId)) throw new ServiceError(400, "İş identifikatoru yanlışdır.");
		const cfg = readConfig();
		rateLimit(request, "status", numberEnv("APK_MAX_STATUS_PER_MIN", 60), 6e4);
		const cached = statusCache.get(jobId);
		if (cached && Date.now() - cached.at < 3e3) return json(cached.value);
		const value = await computeStatus(cfg, jobId);
		statusCache.set(jobId, {
			at: Date.now(),
			value
		});
		if (statusCache.size > 500) {
			for (const [key, entry] of statusCache) if (Date.now() - entry.at > 1e4) statusCache.delete(key);
		}
		return json(value);
	} catch (error) {
		return fail(error);
	}
}
function safeFileName(name, fallback) {
	return name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || fallback;
}
async function handleDownload(request, jobId) {
	try {
		if (request.method !== "GET") throw new ServiceError(405, "Yalnız GET qəbul edilir.");
		if (!isJobId(jobId)) throw new ServiceError(400, "İş identifikatoru yanlışdır.");
		const cfg = readConfig();
		rateLimit(request, "download", numberEnv("APK_MAX_DOWNLOADS_PER_10MIN", 30), 6e5);
		const kind = new URL(request.url).searchParams.get("file") === "aab" ? "aab" : "apk";
		const release = await findRelease(cfg, jobId);
		const file = release ? releaseFiles(release).find((item) => item.kind === kind) : void 0;
		if (!file) throw new ServiceError(404, "Fayl tapılmadı. Müddəti bitmiş ola bilər — APK-nı yenidən hazırlayın.");
		const assetUrl = `${cfg.apiBase}/repos/${cfg.owner}/${cfg.repo}/releases/assets/${file.id}`;
		let upstream;
		try {
			upstream = await fetch(assetUrl, {
				headers: {
					authorization: `Bearer ${cfg.token}`,
					accept: "application/octet-stream",
					"x-github-api-version": "2022-11-28",
					"user-agent": "apk-studio"
				},
				redirect: "manual",
				signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS)
			});
			if (upstream.status >= 300 && upstream.status < 400) {
				const location = upstream.headers.get("location");
				if (!location) throw new Error("redirect without location");
				await upstream.body?.cancel();
				upstream = await fetch(location, {
					headers: { "user-agent": "apk-studio" },
					signal: AbortSignal.timeout(6e4)
				});
			}
		} catch (error) {
			console.error("[apk] aktiv yüklənmədi:", error.message);
			throw new ServiceError(502, "Fayl build xidmətindən alına bilmədi. Yenidən cəhd edin.");
		}
		if (!upstream.ok || !upstream.body) {
			console.error(`[apk] aktiv cavabı: ${upstream.status}`);
			throw new ServiceError(502, "Fayl build xidmətindən alına bilmədi. Yenidən cəhd edin.");
		}
		const name = safeFileName(file.name, kind === "apk" ? "tetbiq.apk" : "tetbiq.aab");
		const headers = {
			"content-type": kind === "apk" ? "application/vnd.android.package-archive" : "application/octet-stream",
			"content-disposition": `attachment; filename="${name}"`,
			"cache-control": "private, no-store",
			"x-content-type-options": "nosniff"
		};
		headers["content-length"] = String(file.size);
		return new Response(upstream.body, {
			status: 200,
			headers
		});
	} catch (error) {
		return fail(error);
	}
}
var Route$3 = createFileRoute("/api/apk/chunk")({ server: { handlers: { POST: ({ request }) => handleChunk(request) } } });
var Route$2 = createFileRoute("/api/apk/start")({ server: { handlers: { POST: ({ request }) => handleStart(request) } } });
var Route$1 = createFileRoute("/api/apk/$jobId/download")({ server: { handlers: { GET: ({ request, params }) => handleDownload(request, params.jobId) } } });
var Route = createFileRoute("/api/apk/$jobId/status")({ server: { handlers: { GET: ({ request, params }) => handleStatus(request, params.jobId) } } });
var rootRouteChildren = {
	IndexRoute: Route$7.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$8
	}),
	PrivacyRoute: Route$6.update({
		id: "/privacy",
		path: "/privacy",
		getParentRoute: () => Route$8
	}),
	StudioRoute: Route$5.update({
		id: "/studio",
		path: "/studio",
		getParentRoute: () => Route$8
	}),
	TermsRoute: Route$4.update({
		id: "/terms",
		path: "/terms",
		getParentRoute: () => Route$8
	}),
	ApiApkChunkRoute: Route$3.update({
		id: "/api/apk/chunk",
		path: "/api/apk/chunk",
		getParentRoute: () => Route$8
	}),
	ApiApkStartRoute: Route$2.update({
		id: "/api/apk/start",
		path: "/api/apk/start",
		getParentRoute: () => Route$8
	}),
	ApiApkJobIdDownloadRoute: Route$1.update({
		id: "/api/apk/$jobId/download",
		path: "/api/apk/$jobId/download",
		getParentRoute: () => Route$8
	}),
	ApiApkJobIdStatusRoute: Route.update({
		id: "/api/apk/$jobId/status",
		path: "/api/apk/$jobId/status",
		getParentRoute: () => Route$8
	})
};
var routeTree = Route$8._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent,
		defaultNotFoundComponent: NotFoundPage
	});
}
//#endregion
export { CHUNK_SIZE as n, router_exports as t };
