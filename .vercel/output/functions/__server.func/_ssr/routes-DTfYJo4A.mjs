import { i as __toESM } from "../_runtime.mjs";
import { q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as ArrowDownToLine, a as PackageCheck, c as Hammer, d as Download, f as CodeXml, g as ArrowUpFromLine, h as Check, i as RotateCw, l as FileArchive, m as CircleAlert, n as Smartphone, o as LockKeyhole, p as CircleCheck, r as ShieldCheck, s as LoaderCircle, u as Earth } from "../_libs/lucide-react.mjs";
import { n as CHUNK_SIZE } from "./router-Bue5Za0s.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DTfYJo4A.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var encoder = new TextEncoder();
var maxUploadBytes = 62914560;
var maxExpandedBytes = 167772160;
var maxEntryBytes = 41943040;
var maxEntries = 3e3;
var fileLimit = 4294967295;
var archiveInspectionCache = /* @__PURE__ */ new WeakMap();
var crcTable = /* @__PURE__ */ new Uint32Array(256);
for (let n = 0; n < crcTable.length; n += 1) {
	let value = n;
	for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 3988292384 ^ value >>> 1 : value >>> 1;
	crcTable[n] = value >>> 0;
}
function crc32(bytes) {
	let value = 4294967295;
	for (const byte of bytes) value = crcTable[(value ^ byte) & 255] ^ value >>> 8;
	return (value ^ 4294967295) >>> 0;
}
function safeUrl(value) {
	if (!value.trim() || value.trim().length > 2048) return false;
	try {
		const url = new URL(value.trim());
		return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname) && !url.username && !url.password;
	} catch {
		return false;
	}
}
function safeDomain(value) {
	if (!value || value.length > 253 || value.includes("://") || !value.includes(".")) return false;
	return value.split(".").every((label) => label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label));
}
var javaReservedWords = /* @__PURE__ */ new Set([
	"abstract",
	"assert",
	"boolean",
	"break",
	"byte",
	"case",
	"catch",
	"char",
	"class",
	"const",
	"continue",
	"default",
	"do",
	"double",
	"else",
	"enum",
	"extends",
	"final",
	"finally",
	"float",
	"for",
	"goto",
	"if",
	"implements",
	"import",
	"instanceof",
	"int",
	"interface",
	"long",
	"native",
	"new",
	"package",
	"private",
	"protected",
	"public",
	"return",
	"short",
	"static",
	"strictfp",
	"super",
	"switch",
	"synchronized",
	"this",
	"throw",
	"throws",
	"transient",
	"try",
	"void",
	"volatile",
	"while",
	"true",
	"false",
	"null"
]);
function safePackageName(value) {
	return value.length <= 255 && /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(value) && !value.split(".").some((part) => javaReservedWords.has(part));
}
function normalizeZipPath(value) {
	if (value.includes("\0")) return null;
	const path = value.replaceAll("\\", "/");
	if (!path || path.startsWith("/") || /^[a-zA-Z]:/.test(path)) return null;
	const segments = path.split("/");
	if (segments.some((part) => part === ".." || part === ".")) return null;
	if (segments.some((part) => part.length === 0 && part !== segments.at(-1))) return null;
	return path;
}
function inspectZipBytes(bytes) {
	if (bytes.length < 22) return { error: "ZIP arxivi boş və ya zədəlidir." };
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const firstEocd = Math.max(0, bytes.length - 65557);
	let eocdOffset = -1;
	for (let offset = bytes.length - 22; offset >= firstEocd; offset -= 1) if (view.getUint32(offset, true) === 101010256 && offset + 22 + view.getUint16(offset + 20, true) <= bytes.length) {
		eocdOffset = offset;
		break;
	}
	if (eocdOffset < 0) return { error: "ZIP arxivinin mərkəzi indeksi tapılmadı." };
	const diskNumber = view.getUint16(eocdOffset + 4, true);
	const centralDisk = view.getUint16(eocdOffset + 6, true);
	const diskEntries = view.getUint16(eocdOffset + 8, true);
	const entryCount = view.getUint16(eocdOffset + 10, true);
	const centralSize = view.getUint32(eocdOffset + 12, true);
	const centralOffset = view.getUint32(eocdOffset + 16, true);
	if (diskNumber !== 0 || centralDisk !== 0 || diskEntries !== entryCount || entryCount === 65535 || centralOffset === fileLimit || centralSize === fileLimit) return { error: "Çoxhissəli və ZIP64 arxivləri dəstəklənmir." };
	if (entryCount > maxEntries || centralOffset + centralSize > eocdOffset) return { error: "ZIP arxivi limitləri aşır və ya zədəlidir." };
	const names = /* @__PURE__ */ new Set();
	const indexFiles = [];
	let expandedBytes = 0;
	let cursor = centralOffset;
	for (let index = 0; index < entryCount; index += 1) {
		if (cursor + 46 > centralOffset + centralSize) return { error: "ZIP arxivinin fayl siyahısı yarımçıqdır." };
		if (view.getUint32(cursor, true) !== 33639248) return { error: "ZIP arxivinin fayl siyahısı zədəlidir." };
		const madeBy = view.getUint16(cursor + 4, true) >>> 8;
		const flags = view.getUint16(cursor + 8, true);
		const method = view.getUint16(cursor + 10, true);
		const compressedBytes = view.getUint32(cursor + 20, true);
		const uncompressedBytes = view.getUint32(cursor + 24, true);
		const nameLength = view.getUint16(cursor + 28, true);
		const extraLength = view.getUint16(cursor + 30, true);
		const commentLength = view.getUint16(cursor + 32, true);
		const diskStart = view.getUint16(cursor + 34, true);
		const externalAttributes = view.getUint32(cursor + 38, true);
		const recordEnd = cursor + 46 + nameLength + extraLength + commentLength;
		if (recordEnd > centralOffset + centralSize || diskStart !== 0) return { error: "ZIP arxivində dəstəklənməyən bölmə var." };
		if ((flags & 1) !== 0 || method !== 0 && method !== 8) return { error: "Şifrələnmiş və ya dəstəklənməyən ZIP faylı var." };
		if (compressedBytes === fileLimit || uncompressedBytes === fileLimit) return { error: "ZIP64 arxivləri dəstəklənmir." };
		const rawName = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
		const isDirectory = rawName.endsWith("/");
		const normalized = normalizeZipPath(rawName);
		if (!normalized) return { error: "ZIP-də təhlükəli və ya etibarsız fayl yolu var." };
		if (names.has(normalized)) return { error: "ZIP-də eyni ada malik fayllar var." };
		names.add(normalized);
		const fileType = externalAttributes >>> 16 & 61440;
		if (madeBy === 3 && !isDirectory && fileType !== 0 && fileType !== 32768) return { error: "ZIP-də adi fayl olmayan girişlər var." };
		if (!isDirectory) {
			if (uncompressedBytes > maxEntryBytes) return { error: "ZIP-də icazə verilən ölçüdən böyük fayl var." };
			expandedBytes += uncompressedBytes;
			if (expandedBytes > maxExpandedBytes) return { error: "ZIP-in açılmış ölçüsü 160 MB limitini keçir." };
			if (normalized.split("/").at(-1) === "index.html") indexFiles.push(normalized);
		}
		cursor = recordEnd;
	}
	if (cursor !== centralOffset + centralSize) return { error: "ZIP arxivinin mərkəzi indeksi düzgün deyil." };
	if (indexFiles.find((path) => path === "index.html")) return { webRoot: "" };
	if (indexFiles.length === 1) return { webRoot: indexFiles[0].slice(0, -10) };
	if (indexFiles.length === 0) return { error: "ZIP-də hazır saytın index.html faylı tapılmadı." };
	return { error: "ZIP-də birdən çox index.html var. Sayt qovluğunu ayrıca arxivləyin." };
}
async function inspectWebsiteZip(file) {
	if (!file) return { error: "Hazır saytın ZIP faylını yükləyin." };
	const cached = archiveInspectionCache.get(file);
	if (cached) return cached;
	if (!file.name.toLowerCase().endsWith(".zip")) return { error: "Yalnız .zip arxivləri qəbul edilir." };
	if (file.size === 0 || file.size > maxUploadBytes) return { error: "ZIP faylı boşdur və ya 60 MB limitini keçir." };
	try {
		const result = inspectZipBytes(new Uint8Array(await file.arrayBuffer()));
		archiveInspectionCache.set(file, result);
		return result;
	} catch {
		return { error: "ZIP faylı oxuna bilmədi." };
	}
}
async function validateWebsiteZip(file) {
	return (await inspectWebsiteZip(file)).error ?? null;
}
async function validateBuildConfig(config, websiteZipFile) {
	const issues = [];
	if (!config.appName.trim() || config.appName.length > 80) issues.push("Tətbiq adı 1–80 simvol olmalıdır.");
	if (!safePackageName(config.packageName.trim())) issues.push("Package name com.sirket.tetbiq formatında olmalıdır (Java açar sözləri — məsələn new, class — olmaz).");
	if (!/^[0-9A-Za-z][0-9A-Za-z._+-]{0,63}$/.test(config.versionName.trim())) issues.push("Version name yalnız rəqəm, hərf, nöqtə, tire və + simvollarından ibarət olmalıdır.");
	if (!Number.isInteger(config.versionCode) || config.versionCode < 1 || config.versionCode > 21e8) issues.push("Version code 1–2,100,000,000 aralığında tam ədəd olmalıdır.");
	if (config.sourceMode === "url" && !safeUrl(config.websiteUrl)) issues.push("Sayt ünvanı http:// və ya https:// ilə başlamalıdır.");
	if (config.sourceMode === "zip") {
		const archive = await inspectWebsiteZip(websiteZipFile);
		if (archive.error) issues.push(archive.error);
	}
	if (config.privacyUrl.trim() && !safeUrl(config.privacyUrl)) issues.push("Məxfilik siyasəti URL-si http:// və ya https:// olmalıdır.");
	if (config.domain.trim() && !safeDomain(config.domain.trim())) issues.push("Domen adı yalnız etibarlı host adı ola bilər.");
	if (config.enableSsl && config.enableNginx) {
		if (!safeDomain(config.domain.trim())) issues.push("SSL üçün düzgün domain daxil edin.");
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.sslEmail.trim())) issues.push("Let’s Encrypt üçün düzgün e-poçt daxil edin.");
	} else if (config.enableSsl) issues.push("SSL konfiqurasiyası üçün əvvəlcə Nginx-i aktiv edin.");
	return issues;
}
function slugify(value) {
	return value.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "android-tetbiqi";
}
function shellQuote(value) {
	return `'${value.replaceAll("'", "'\\''")}'`;
}
function xmlEscape(value) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&apos;");
}
function iconBytes(dataUrl) {
	const match = /^data:image\/png;base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
	if (!match) throw new Error("İkon PNG formatında olmalıdır.");
	const binary = atob(match[1].replace(/\s/g, ""));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
function buildReadme(config, slug) {
	const source = config.sourceMode === "url" ? `Sayt ünvanı: ${config.websiteUrl}` : "Sayt faylları app/site-source.zip arxivindədir.";
	const output = config.format === "both" ? "Debug APK və Release AAB" : config.format.toUpperCase();
	return `# ${config.appName} — Android build paketi

Bu paket Android Studio tələb etmədən Ubuntu serverində Capacitor tətbiqi yaradır.

## Tətbiq məlumatları

- Package name: \`${config.packageName}\`
- Versiya: \`${config.versionName}\` (${config.versionCode})
- Mənbə: ${source}
- Çıxış: ${output}
- Ubuntu: ${config.ubuntu}

## Quraşdırma

1. Bu qovluğu Ubuntu ${config.ubuntu} serverinə köçürün.
2. Serverdə aşağıdakı əmri icra edin: \`sudo bash server/install-ubuntu.sh\`
   Skript quraşdırır: Java 17, Node.js 20, Android SDK, Gradle, UFW firewall${config.enableDocker ? ", Docker" : ""}${config.enableNginx ? ", Nginx" : ""}${config.enableSsl && config.enableNginx ? ", Certbot SSL" : ""}.
3. Android SDK lisenziyalarını oxuyub qəbul edin.
4. Capacitor tətbiqini yığın: \`bash app/scripts/build-android.sh\`
5. Nəticə: \`output/\` qovluğunda ${output}.

## Sizin hissəniz

Bu ZIP tam hazır build kitidir — APK faylının özü deyil. Serverdə skriptləri işə salın; qalanını siz edirsiniz.

## Sayt ZIP-i

ZIP rejimində yalnız hazır, statik sayt qəbul edilir. Arxivdə \`index.html\` və ona aid fayllar olmalıdır. Build skripti arxivi təhlükəsiz yoxlayır; sayt kodu build zamanı icra edilmir. React/Vue kimi mənbə layihələrinin əvvəlcədən build olunmuş \`dist\` qovluğunu arxivləyin.

## APK və AAB

APK test üçün debug imzalı paketdir. AAB Play Store-a yükləmək üçün nəzərdə tutulub; Play Console üçün öz release imzanız tələb oluna bilər. İmza açarını bu arxivə qoymayın.

## Qeydlər

- URL rejimində tətbiq internet bağlantısı ilə göstərilən saytı açır.
- Bildiriş icazəsi Android 13+ üçün manifestə əlavə edilir. Push bildirişləri ayrıca Firebase konfiqurasiyası tələb edir.
- SSL seçilibsə, \`server/enable-https.sh\` skriptini domain DNS-i serverə yönəldikdən sonra işə salın.
- Məxfilik siyasəti URL-i tətbiq konfiqurasiyasına daxil edilir; siyasətin məzmununa görə siz cavabdehsiniz.
- Tətbiq identikatoru: \`${slug}\`
`;
}
function configJson(config) {
	const { iconDataUrl: _icon, ...safeConfig } = config;
	return JSON.stringify({
		...safeConfig,
		generatedAt: (/* @__PURE__ */ new Date()).toISOString()
	}, null, 2);
}
function capacitorConfig(config) {
	const nativeConfig = {
		appId: config.packageName,
		appName: config.appName,
		webDir: "www",
		android: { allowMixedContent: false },
		plugins: { StatusBar: { overlaysWebView: false } }
	};
	if (config.sourceMode === "url") {
		const cleartext = new URL(config.websiteUrl.trim()).protocol === "http:";
		nativeConfig.server = {
			url: config.websiteUrl.trim(),
			androidScheme: cleartext ? "http" : "https",
			cleartext
		};
	}
	return JSON.stringify(nativeConfig, null, 2);
}
function packageJson(config) {
	const dependencies = {
		"@capacitor/android": "^6.2.0",
		"@capacitor/core": "^6.2.0",
		"@capacitor/status-bar": "^6.0.2"
	};
	if (config.notifications) dependencies["@capacitor/local-notifications"] = "^6.1.0";
	return JSON.stringify({
		name: slugify(config.appName),
		private: true,
		version: config.versionName,
		type: "module",
		scripts: {
			build: "npx cap sync android",
			android: "bash scripts/build-android.sh"
		},
		dependencies,
		devDependencies: {
			...config.iconDataUrl ? { "@capacitor/assets": "^3.0.5" } : {},
			"@capacitor/cli": "^6.2.0"
		}
	}, null, 2);
}
function placeholderPage(config) {
	const destination = config.privacyUrl.trim() || "privacy.html";
	const redirect = config.sourceMode === "url" ? `setTimeout(function(){ location.replace(${JSON.stringify(config.websiteUrl)}); }, 350);` : "";
	return `<!doctype html>
<html lang="${config.language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#14171f">
  <title>${xmlEscape(config.appName)}</title>
  <style>
    :root{color-scheme:dark;font-family:system-ui,sans-serif;background:#14171f;color:#eef1f6}
    body{min-height:100vh;margin:0;display:grid;place-items:center;text-align:center}
    main{padding:2rem;max-width:28rem}p{color:#a8afbd;line-height:1.6}
    a{color:#a9c7ff}
  </style>
</head>
<body>
  <main>
    <h1>${xmlEscape(config.appName)}</h1>
    <p>Sayt yüklənir…</p>
    <a href="${xmlEscape(destination)}">Məxfilik siyasəti</a>
  </main>
  <script>${redirect}<\/script>
</body>
</html>
`;
}
function privacyPage(config) {
	const privacyCopy = config.privacyUrl ? `<p><a href="${xmlEscape(config.privacyUrl)}">Məxfilik siyasətinə keçin</a></p>` : `<p>Bu nümunə siyasəti hüquqşünasla yoxlayın və öz məlumat emal qaydalarınıza uyğunlaşdırın.</p>
<p>Tətbiqdə göstərilən sayt: ${xmlEscape(config.websiteUrl || "yüklənmiş statik sayt")}</p>
<p>Əlaqə: ${xmlEscape(config.sslEmail || "server sahibinin əlaqə ünvanı")}</p>`;
	return `<!doctype html>
<html lang="${config.language}">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Məxfilik siyasəti — ${xmlEscape(config.appName)}</title>
<body style="font:16px/1.6 system-ui;max-width:720px;margin:40px auto;padding:0 20px;color:#172033">
<h1>Məxfilik siyasəti</h1>
<p>${xmlEscape(config.appName)} üçün məxfilik məlumatı.</p>
${privacyCopy}
</body>
</html>`;
}
function androidConfigScript() {
	return `#!/usr/bin/env python3
import json
import re
from pathlib import Path

app_dir = Path(__file__).resolve().parent.parent
root_dir = app_dir.parent
config = json.loads((root_dir / "config.json").read_text(encoding="utf-8"))
manifest = app_dir / "android/app/src/main/AndroidManifest.xml"
gradle = app_dir / "android/app/build.gradle"

if not manifest.is_file() or not gradle.is_file():
    raise SystemExit("Capacitor Android layihəsi tapılmadı.")

text = manifest.read_text(encoding="utf-8")
orientation = config.get("orientation", "portrait")
if orientation not in {"portrait", "landscape", "unspecified"}:
    raise SystemExit("Orientasiya dəyəri yanlışdır.")
text = re.sub(
    r'android:screenOrientation="[^"]*"',
    "",
    text,
)
activity = re.search(r'<activity\\b[^>]*android:name="\\.MainActivity"[^>]*>', text)
if activity:
    tag = activity.group(0)
    tag = tag.replace(">", f' android:screenOrientation="{orientation}">')
    text = text[:activity.start()] + tag + text[activity.end():]

if config.get("notifications"):
    permission = '  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\\n'
    if "android.permission.POST_NOTIFICATIONS" not in text:
        text = re.sub(r"(<manifest\\b[^>]*>\\s*)", r"\\1" + permission, text, count=1)
manifest.write_text(text, encoding="utf-8")

version_code = int(config["versionCode"])
version_name = str(config["versionName"])
if not re.fullmatch(r"[0-9A-Za-z][0-9A-Za-z._+-]{0,63}", version_name):
    raise SystemExit("Version name yanlışdır.")
gradle_text = gradle.read_text(encoding="utf-8")
gradle_text, code_count = re.subn(r"versionCode\\s+\\d+", f"versionCode {version_code}", gradle_text, count=1)
gradle_text, name_count = re.subn(r"versionName\\s+(['\\"]).*?\\1", "versionName '" + version_name.replace("'", "\\\\'") + "'", gradle_text, count=1)
if code_count != 1 or name_count != 1:
    raise SystemExit("Android versiya məlumatları build.gradle faylında tapılmadı.")
gradle.write_text(gradle_text, encoding="utf-8")
print("Android manifest və versiya parametrləri yeniləndi.")
`;
}
function prepareWebsiteScript() {
	return `#!/usr/bin/env python3
import shutil
import stat
import sys
import zipfile
from pathlib import Path, PurePosixPath

archive = Path(__file__).resolve().parent.parent / "site-source.zip"
destination = Path(__file__).resolve().parent.parent / "www"
max_files = 3000
max_total = 160 * 1024 * 1024
max_file = 40 * 1024 * 1024

def safe_name(raw):
    normalized = raw.replace("\\\\", "/")
    if normalized.endswith("/"):
        normalized = normalized[:-1]
    parts = normalized.split("/")
    if not normalized or "\\0" in normalized or normalized.startswith("/") or any(part in {"", ".", ".."} for part in parts):
        raise ValueError(f"ZIP-də etibarsız yol var: {raw}")
    if ":" in parts[0]:
        raise ValueError(f"ZIP-də etibarsız yol var: {raw}")
    return PurePosixPath(*parts)

try:
    with zipfile.ZipFile(archive) as bundle:
        infos = bundle.infolist()
        if not infos or len(infos) > max_files:
            raise ValueError("ZIP-də fayl sayı 1–3000 aralığında olmalıdır.")
        expanded = 0
        entries = []
        indexes = []
        seen = set()
        for info in infos:
            name = safe_name(info.filename)
            if info.flag_bits & 1:
                raise ValueError("Şifrələnmiş ZIP faylları dəstəklənmir.")
            mode = info.external_attr >> 16
            is_directory = info.is_dir()
            file_type = stat.S_IFMT(mode)
            allowed_type = file_type == 0 or stat.S_ISREG(mode) or (is_directory and stat.S_ISDIR(mode))
            if stat.S_ISLNK(mode) or not allowed_type:
                raise ValueError("ZIP-də adi fayl olmayan giriş var.")
            if is_directory:
                continue
            if info.file_size > max_file:
                raise ValueError("ZIP-də 40 MB-dan böyük fayl var.")
            expanded += info.file_size
            if expanded > max_total:
                raise ValueError("ZIP-in açılmış ölçüsü 160 MB limitini keçir.")
            normalized = name.as_posix()
            if normalized in seen:
                raise ValueError("ZIP-də eyni ada malik fayllar var.")
            seen.add(normalized)
            entries.append((info, name))
            if name.name == "index.html":
                indexes.append(name)

        root_index = next((path for path in indexes if path.as_posix() == "index.html"), None)
        if root_index:
            prefix = PurePosixPath(".")
        elif len(indexes) == 1:
            prefix = indexes[0].parent
        elif not indexes:
            raise ValueError("ZIP-də index.html tapılmadı.")
        else:
            raise ValueError("Birdən çox index.html var; sayt qovluğunu ayrıca arxivləyin.")

        temp = destination.with_name("www.tmp")
        if temp.exists():
            shutil.rmtree(temp)
        temp.mkdir(parents=True)
        copied = 0
        for info, path in entries:
            try:
                relative = path.relative_to(prefix) if prefix != PurePosixPath(".") else path
            except ValueError:
                continue
            if not relative.parts:
                continue
            output = temp.joinpath(*relative.parts)
            output.parent.mkdir(parents=True, exist_ok=True)
            with bundle.open(info) as source, output.open("xb") as target:
                shutil.copyfileobj(source, target, length=1024 * 1024)
            copied += 1
        if not (temp / "index.html").is_file() or copied == 0:
            raise ValueError("index.html və ya sayt faylları çıxarıla bilmədi.")
        if destination.exists():
            shutil.rmtree(destination)
        temp.rename(destination)
        print(f"Statik sayt hazırdır: {copied} fayl.")
except (OSError, zipfile.BadZipFile, RuntimeError, ValueError) as error:
    raise SystemExit(f"Sayt ZIP-i qəbul edilmədi: {error}")
`;
}
function prepareIconsScript() {
	return `import sharp from 'sharp';

// Adaptiv Android ikonu: ikon mərkəzdə 66% ölçüdə, arxa fon ağ.
await sharp('assets/icon-only.png')
  .resize(676, 676, { fit: 'cover' })
  .extend({ top: 174, bottom: 174, left: 174, right: 174, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile('assets/icon-foreground.png');
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#ffffff' } })
  .png()
  .toFile('assets/icon-background.png');
console.log('Adaptiv ikon qatları hazırdır.');
`;
}
function buildAndroidScript() {
	return `#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$APP_DIR/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/output"
CONFIG="$ROOT_DIR/config.json"

# Qeyri-interaktiv rejim: CI və serverlərdə heç bir sual verilməməlidir.
export CI="\${CI:-true}"
export NPM_CONFIG_YES=true
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_FUND=false
export NPM_CONFIG_UPDATE_NOTIFIER=false
export GRADLE_OPTS="\${GRADLE_OPTS:--Dorg.gradle.daemon=false -Dorg.gradle.jvmargs=-Xmx3g}"

command -v node >/dev/null || { echo "Node.js quraşdırılmayıb. Əvvəlcə bash server/install-ubuntu.sh işlədin." >&2; exit 1; }
command -v npm >/dev/null || { echo "npm tapılmadı." >&2; exit 1; }
command -v java >/dev/null || { echo "Java 17 quraşdırılmayıb." >&2; exit 1; }
command -v python3 >/dev/null || { echo "Python 3 tapılmadı." >&2; exit 1; }

JAVA_VERSION="$(java -version 2>&1 | head -n 1)"
echo "$JAVA_VERSION" | grep -q '17\\.' || { echo "Java 17 tələb olunur; tapıldı: $JAVA_VERSION" >&2; exit 1; }

if [ -z "\${ANDROID_HOME:-}" ] && [ -n "\${ANDROID_SDK_ROOT:-}" ]; then export ANDROID_HOME="$ANDROID_SDK_ROOT"; fi
if [ -z "\${ANDROID_HOME:-}" ]; then
  for candidate in /opt/android-sdk /usr/local/lib/android/sdk "$HOME/Android/Sdk"; do
    if [ -d "$candidate" ]; then export ANDROID_HOME="$candidate"; break; fi
  done
fi
if [ -z "\${ANDROID_HOME:-}" ]; then echo "Android SDK tapılmadı (ANDROID_HOME təyin edilməyib)." >&2; exit 1; fi
export ANDROID_SDK_ROOT="$ANDROID_HOME"

mkdir -p "$OUTPUT_DIR"
cd "$APP_DIR"
echo "::group::npm install"
npm install --no-audit --no-fund --loglevel=error
echo "::endgroup::"

SOURCE_MODE="$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).sourceMode)' "$CONFIG")"
if [ "$SOURCE_MODE" = "zip" ]; then
  python3 scripts/prepare-site.py
fi

npx --no-install cap telemetry off >/dev/null 2>&1 || true
if [ ! -d android ]; then
  npx --no-install cap add android
fi
npx --no-install cap sync android
python3 scripts/configure-android.py

# Android SDK yolunu Gradle üçün yaz (ANDROID_HOME əlavə təminatı).
printf 'sdk.dir=%s\\n' "$ANDROID_HOME" > android/local.properties

if [ -f "$APP_DIR/assets/icon-only.png" ]; then
  # İkon yaradılması uğursuz olsa belə tətbiq standart ikonla yığılsın.
  if ! { node scripts/prepare-icons.mjs && npx --no-install capacitor-assets generate --android; }; then
    echo "XƏBƏRDARLIQ: ikon yaradıla bilmədi, standart ikon istifadə olunur." >&2
  fi
fi

FORMAT="$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).format)' "$CONFIG")"
cd "$APP_DIR/android"
chmod +x ./gradlew
if [ "$FORMAT" = "apk" ] || [ "$FORMAT" = "both" ]; then
  ./gradlew --no-daemon --console=plain assembleDebug
  cp app/build/outputs/apk/debug/app-debug.apk "$OUTPUT_DIR/__SLUG__.apk"
fi
if [ "$FORMAT" = "aab" ] || [ "$FORMAT" = "both" ]; then
  ./gradlew --no-daemon --console=plain bundleRelease
  cp app/build/outputs/bundle/release/app-release.aab "$OUTPUT_DIR/__SLUG__.aab"
fi
echo "Build tamamlandı. Fayllar: $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"
`;
}
function ubuntuInstallScript(config) {
	const optionalPackages = [];
	if (config.enableDocker) optionalPackages.push("docker.io", "docker-compose-v2");
	if (config.enableNginx) optionalPackages.push("nginx");
	if (config.enableSsl && config.enableNginx) optionalPackages.push("certbot", "python3-certbot-nginx");
	return `#!/usr/bin/env bash
set -euo pipefail
if [ "$EUID" -ne 0 ]; then
  echo "Root hüququ tələb olunur. Bu əmri sudo ilə başladın." >&2
  exit 1
fi

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl wget unzip zip git python3 python3-venv openjdk-17-jdk ufw

if ! command -v node >/dev/null || ! node --version | grep -q '^v20\\.'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh
  bash /tmp/nodesource_setup.sh
  apt-get install -y nodejs
  rm -f /tmp/nodesource_setup.sh
fi
npm install --global npm@10

GRADLE_VERSION=8.11.1
if ! command -v gradle >/dev/null; then
  wget -q "https://services.gradle.org/distributions/gradle-$GRADLE_VERSION-bin.zip" -O /tmp/gradle.zip
  unzip -qo /tmp/gradle.zip -d /opt
  ln -s "/opt/gradle-$GRADLE_VERSION/bin/gradle" /usr/local/bin/gradle
  rm -f /tmp/gradle.zip
fi

ANDROID_SDK_ROOT=/opt/android-sdk
mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"
if [ ! -x "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]; then
  wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/android-commandline-tools.zip
  mkdir -p /tmp/android-cmdline
  unzip -qo /tmp/android-commandline-tools.zip -d /tmp/android-cmdline
  mv /tmp/android-cmdline/cmdline-tools "$ANDROID_SDK_ROOT/cmdline-tools/latest"
  rm -rf /tmp/android-cmdline /tmp/android-commandline-tools.zip
fi
export ANDROID_SDK_ROOT ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"
printf 'export ANDROID_SDK_ROOT=%s\\nexport ANDROID_HOME=%s\\nexport PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"\\n' "$ANDROID_SDK_ROOT" "$ANDROID_SDK_ROOT" >/etc/profile.d/android-sdk.sh
chmod 644 /etc/profile.d/android-sdk.sh
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

${optionalPackages.length ? `apt-get install -y ${optionalPackages.join(" ")}` : ": # Docker, Nginx və SSL seçilməyib"}
${config.enableDocker ? `systemctl enable --now docker
echo "Docker aktivdir. İstifadəçi qrupuna əlavə etmək üçün: usermod -aG docker USER_ADI"` : ""}
ufw allow OpenSSH
ufw allow 22/tcp
${config.enableNginx ? `systemctl enable --now nginx
ufw allow 'Nginx Full'` : ""}
ufw --force enable
echo "Java 17, Node.js, Gradle və Android SDK quraşdırıldı."
echo "Android SDK lisenziyaları interaktiv qaydada qəbul edildi."
`;
}
function nginxConfig(config) {
	return `server {
    listen 80;
    listen [::]:80;
    server_name ${config.domain || "_"};
    root /var/www/${slugify(config.appName)};
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
`;
}
function dockerfile(config) {
	return `FROM ubuntu:${config.ubuntu}
ENV DEBIAN_FRONTEND=noninteractive
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools:$PATH
RUN apt-get update && apt-get install -y ca-certificates curl wget unzip zip git python3 openjdk-17-jdk && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://deb.nodesource.com/setup_20.x -o /tmp/node_setup.sh && bash /tmp/node_setup.sh && apt-get update && apt-get install -y nodejs && npm install -g npm@10 && rm -rf /var/lib/apt/lists/*
RUN mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools" && wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/android-tools.zip && mkdir -p /tmp/android-tools && unzip -q /tmp/android-tools.zip -d /tmp/android-tools && mv /tmp/android-tools/cmdline-tools "$ANDROID_SDK_ROOT/cmdline-tools/latest" && yes | sdkmanager --licenses >/dev/null && sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" && rm -rf /tmp/android-tools /tmp/android-tools.zip
WORKDIR /build
COPY . /build
RUN npm install --prefix app
CMD ["bash", "app/scripts/build-android.sh"]
`;
}
function dockerCompose(_config) {
	return `services:
  android-build:
    build:
      context: ..
      dockerfile: Dockerfile
    volumes:
      - ../output:/build/output
    environment:
      ANDROID_SDK_ROOT: /opt/android-sdk
      ANDROID_HOME: /opt/android-sdk
`;
}
function securityNotes(config) {
	return `# Build təhlükəsizliyi

- ZIP mənbəsi əvvəlcədən hazırlanmış statik saytdır; server yalnız təhlükəsiz fayl yollarını çıxarır.
- Sayt ZIP-i içindəki skriptlər və package manager hook-ları icra edilmir.
- Arxiv ölçü limiti 60 MB, açılmış fayllar 160 MB-dır; simvolik linklər, şifrələnmiş və ZIP64 arxivlər rədd edilir.
- Build-i etibar etdiyiniz mənbələrdən yaradılmış saytlarla işlədin.
- Release signing açarlarını ZIP-ə əlavə etməyin. Onları yalnız öz Ubuntu serverinizdə saxlayın.
${config.enableSsl ? `- SSL host adı: ${config.domain || "domaininizi daxil edin"}; Certbot üçün e-poçt: ${config.sslEmail || "e-poçtunuzu daxil edin"}.` : ""}
`;
}
function getBundleFileList(config, websiteZipFile) {
	const files = [
		"README.md",
		"config.json",
		"SECURITY.md",
		"server/install-ubuntu.sh",
		"app/package.json",
		"app/capacitor.config.json",
		"app/www/index.html",
		"app/www/privacy.html",
		"app/scripts/build-android.sh",
		"app/scripts/configure-android.py"
	];
	if (config.enableDocker) files.push("Dockerfile", "server/docker-compose.yml");
	if (config.enableNginx) files.push("server/nginx.conf.example");
	if (config.sourceMode === "zip") files.push("app/site-source.zip", "app/scripts/prepare-site.py");
	if (config.enableSsl && config.enableNginx) files.push("server/enable-https.sh");
	if (config.iconDataUrl) files.push("app/assets/icon-only.png", "app/scripts/prepare-icons.mjs");
	if (config.sourceMode === "zip" && !websiteZipFile) files.push("Sayt ZIP-i gözlənilir");
	return files;
}
function write16(view, offset, value) {
	view.setUint16(offset, value, true);
}
function write32(view, offset, value) {
	view.setUint32(offset, value >>> 0, true);
}
function blobBuffer(bytes) {
	return Uint8Array.from(bytes).buffer;
}
function createStoredZip(entries) {
	if (entries.length > 65534) throw new Error("Build paketi çox sayda fayldan ibarətdir.");
	const localParts = [];
	const centralParts = [];
	let localOffset = 0;
	let centralSize = 0;
	for (const entry of entries) {
		const nameBytes = encoder.encode(entry.path);
		const content = entry.bytes;
		if (nameBytes.length > 65535 || content.length > fileLimit) throw new Error("Build paketində dəstəklənməyən böyük fayl var.");
		const checksum = crc32(content);
		const localHeader = /* @__PURE__ */ new Uint8Array(30);
		const localView = new DataView(localHeader.buffer);
		write32(localView, 0, 67324752);
		write16(localView, 4, 20);
		write16(localView, 6, 2048);
		write16(localView, 8, 0);
		write16(localView, 10, 0);
		write16(localView, 12, 22561);
		write32(localView, 14, checksum);
		write32(localView, 18, content.length);
		write32(localView, 22, content.length);
		write16(localView, 26, nameBytes.length);
		write16(localView, 28, 0);
		localParts.push(blobBuffer(localHeader), blobBuffer(nameBytes), blobBuffer(content));
		const centralHeader = /* @__PURE__ */ new Uint8Array(46);
		const centralView = new DataView(centralHeader.buffer);
		write32(centralView, 0, 33639248);
		write16(centralView, 4, 20);
		write16(centralView, 6, 20);
		write16(centralView, 8, 2048);
		write16(centralView, 10, 0);
		write16(centralView, 12, 0);
		write16(centralView, 14, 22561);
		write32(centralView, 16, checksum);
		write32(centralView, 20, content.length);
		write32(centralView, 24, content.length);
		write16(centralView, 28, nameBytes.length);
		write16(centralView, 30, 0);
		write16(centralView, 32, 0);
		write16(centralView, 34, 0);
		write32(centralView, 36, 0);
		write32(centralView, 38, 0);
		write32(centralView, 42, localOffset);
		centralParts.push(blobBuffer(centralHeader), blobBuffer(nameBytes));
		const recordLength = localHeader.length + nameBytes.length + content.length;
		localOffset += recordLength;
		centralSize += centralHeader.length + nameBytes.length;
	}
	if (localOffset + centralSize + 22 > fileLimit) throw new Error("Yaradılan build paketi ZIP limitini keçir.");
	const end = /* @__PURE__ */ new Uint8Array(22);
	const endView = new DataView(end.buffer);
	write32(endView, 0, 101010256);
	write16(endView, 4, 0);
	write16(endView, 6, 0);
	write16(endView, 8, entries.length);
	write16(endView, 10, entries.length);
	write32(endView, 12, centralSize);
	write32(endView, 16, localOffset);
	write16(endView, 20, 0);
	return new Blob([
		...localParts,
		...centralParts,
		blobBuffer(end)
	], { type: "application/zip" });
}
function textFile(path, content) {
	return {
		path,
		bytes: encoder.encode(content)
	};
}
async function buildProjectBundle(config, websiteZipFile) {
	const issues = await validateBuildConfig(config, websiteZipFile);
	if (issues.length) throw new Error(issues[0]);
	const slug = slugify(config.appName);
	const root = `${slug}-paket`;
	const entries = [];
	const addText = (path, content) => {
		entries.push(textFile(`${root}/${path}`, content));
	};
	addText("README.md", buildReadme(config, slug));
	addText("config.json", configJson(config));
	addText("SECURITY.md", securityNotes(config));
	addText("server/install-ubuntu.sh", ubuntuInstallScript(config));
	if (config.enableDocker) {
		addText("Dockerfile", dockerfile(config));
		addText("server/docker-compose.yml", dockerCompose(config));
	}
	if (config.enableNginx) addText("server/nginx.conf.example", nginxConfig(config));
	addText("app/package.json", packageJson(config));
	addText("app/capacitor.config.json", capacitorConfig(config));
	addText("app/www/index.html", placeholderPage(config));
	addText("app/www/privacy.html", privacyPage(config));
	addText("app/scripts/build-android.sh", buildAndroidScript().replaceAll("__SLUG__", slug));
	addText("app/scripts/configure-android.py", androidConfigScript());
	if (config.sourceMode === "zip" && websiteZipFile) {
		entries.push({
			path: `${root}/app/site-source.zip`,
			bytes: new Uint8Array(await websiteZipFile.arrayBuffer())
		});
		addText("app/scripts/prepare-site.py", prepareWebsiteScript());
	}
	if (config.enableSsl && config.enableNginx) addText("server/enable-https.sh", `#!/usr/bin/env bash
set -euo pipefail
if [ "$EUID" -ne 0 ]; then
  echo "Root hüququ tələb olunur. Bu əmri sudo ilə başladın." >&2
  exit 1
fi
certbot --nginx --domain ${shellQuote(config.domain.trim())} --email ${shellQuote(config.sslEmail.trim())} --redirect
`);
	if (config.iconDataUrl) {
		entries.push({
			path: `${root}/app/assets/icon-only.png`,
			bytes: iconBytes(config.iconDataUrl)
		});
		addText("app/scripts/prepare-icons.mjs", prepareIconsScript());
	}
	return createStoredZip(entries);
}
function getBundleFilename(config) {
	return `${slugify(config.appName)}-android-build-kit.zip`;
}
var ApkClientError = class extends Error {
	retryable;
	constructor(message, retryable = true) {
		super(message);
		this.retryable = retryable;
	}
};
function newJobId() {
	const bytes = /* @__PURE__ */ new Uint8Array(16);
	crypto.getRandomValues(bytes);
	bytes[6] = bytes[6] & 15 | 64;
	bytes[8] = bytes[8] & 63 | 128;
	const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
async function sha256Hex(blob) {
	const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
var sleep = (ms, signal) => new Promise((resolve, reject) => {
	const timer = setTimeout(resolve, ms);
	signal?.addEventListener("abort", () => {
		clearTimeout(timer);
		reject(new DOMException("Dayandırıldı", "AbortError"));
	}, { once: true });
});
async function readError(response) {
	try {
		const body = await response.json();
		if (body?.error) return body.error;
	} catch {}
	if (response.status === 413) return "Fayl serverin qəbul etdiyi ölçüdən böyükdür.";
	return "Server gözlənilməz cavab verdi. Yenidən cəhd edin.";
}
async function request(input, init, attempts = 3) {
	let lastError = null;
	for (let attempt = 0; attempt < attempts; attempt += 1) {
		try {
			const response = await fetch(input, init);
			if (response.ok) return response;
			const message = await readError(response);
			if (response.status < 500 && response.status !== 429) throw new ApkClientError(message, false);
			lastError = new ApkClientError(message);
		} catch (error) {
			if (error instanceof ApkClientError && !error.retryable) throw error;
			if (error instanceof DOMException && error.name === "AbortError") throw error;
			lastError ??= new ApkClientError("İnternet bağlantısı kəsildi. Bağlantını yoxlayıb yenidən cəhd edin.");
		}
		if (attempt < attempts - 1) await sleep(900 * 2 ** attempt, init.signal ?? void 0);
	}
	throw lastError ?? new ApkClientError("Sorğu uğursuz oldu.");
}
/** Kit ZIP-ini ~3 MB-lıq hissələrlə (3 paralel) serverə yükləyir və hissələrin SHA-larını qaytarır. */
async function uploadKit(kit, jobId, onProgress, signal) {
	if (kit.size > 75497472) throw new ApkClientError("Build paketi çox böyükdür (maksimum təxminən 72 MB).", false);
	const total = Math.max(1, Math.ceil(kit.size / CHUNK_SIZE));
	const shas = new Array(total);
	const sent = new Array(total).fill(0);
	let next = 0;
	const report = () => onProgress(Math.min(1, sent.reduce((a, b) => a + b, 0) / Math.max(1, kit.size)));
	const worker = async () => {
		while (true) {
			const index = next++;
			if (index >= total) return;
			const slice = kit.slice(index * CHUNK_SIZE, Math.min(kit.size, (index + 1) * CHUNK_SIZE));
			const body = await (await request(`/api/apk/chunk?job=${jobId}&index=${index}&total=${total}`, {
				method: "POST",
				body: slice,
				headers: { "content-type": "application/octet-stream" },
				signal
			}, 4)).json();
			if (!body.sha) throw new ApkClientError("Server hissəni təsdiqləmədi. Yenidən cəhd edin.");
			shas[index] = body.sha;
			sent[index] = slice.size;
			report();
		}
	};
	await Promise.all(Array.from({ length: Math.min(3, total) }, worker));
	return shas;
}
async function startBuild(input, signal) {
	await request("/api/apk/start", {
		method: "POST",
		body: JSON.stringify(input),
		headers: { "content-type": "application/json" },
		signal
	}, 2);
}
async function fetchStatus(jobId, signal) {
	return await (await request(`/api/apk/${jobId}/status`, {
		signal,
		cache: "no-store"
	}, 1)).json();
}
function downloadUrl(jobId, file = "apk") {
	return `/api/apk/${jobId}/download${file === "aab" ? "?file=aab" : ""}`;
}
var FatalJobError = class extends Error {};
var JOB_STORAGE_KEY = "apk-studio:job";
var JOB_MAX_AGE_MS = 72e5;
var POLL_TIMEOUT_MS = 3e6;
var initial = {
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
	letsEncryptEmail: ""
};
var STACK = [
	"Ubuntu",
	"Java 17",
	"Node.js",
	"Android SDK",
	"Gradle",
	"Capacitor",
	"Docker",
	"Firewall",
	"Nginx",
	"SSL / HTTPS"
];
function prettySize(bytes) {
	return bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function isHttpUrl(value) {
	try {
		const url = new URL(value.trim());
		return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
	} catch {
		return false;
	}
}
async function imageToPngDataUrl(file) {
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
	const blob = await new Promise((resolve, reject) => {
		canvas.toBlob((result) => {
			if (result) resolve(result);
			else reject(/* @__PURE__ */ new Error("İkon PNG formatına çevrilə bilmədi."));
		}, "image/png");
	});
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(/* @__PURE__ */ new Error("İkon faylı oxuna bilmədi."));
		reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(/* @__PURE__ */ new Error("İkon faylı oxuna bilmədi."));
		reader.readAsDataURL(blob);
	});
}
function makePackageSuggestion(name) {
	return `az.studio.${name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").replace(/\.{2,}/g, ".") || "tetbiq"}`;
}
function ApkStudio() {
	const [form, setForm] = (0, import_react.useState)(initial);
	const [source, setSource] = (0, import_react.useState)("url");
	const [zipFile, setZipFile] = (0, import_react.useState)(null);
	const [zipError, setZipError] = (0, import_react.useState)("");
	const [iconFile, setIconFile] = (0, import_react.useState)(null);
	const [iconPreview, setIconPreview] = (0, import_react.useState)("");
	const [packageEdited, setPackageEdited] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)({ kind: "idle" });
	const [bundleFiles, setBundleFiles] = (0, import_react.useState)([]);
	const zipCheckId = (0, import_react.useRef)(0);
	const [apk, setApk] = (0, import_react.useState)({
		phase: "idle",
		progress: 0,
		message: ""
	});
	const runId = (0, import_react.useRef)(0);
	const abortRef = (0, import_react.useRef)(null);
	const update = (key, value) => setForm((old) => ({
		...old,
		[key]: value
	}));
	(0, import_react.useEffect)(() => {
		if (!iconFile) {
			setIconPreview("");
			return;
		}
		const url = URL.createObjectURL(iconFile);
		setIconPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [iconFile]);
	const config = (0, import_react.useMemo)(() => ({
		sourceMode: source,
		websiteUrl: form.websiteUrl.trim(),
		appName: form.appName.trim(),
		packageName: form.packageName.trim(),
		language: form.language,
		versionName: form.versionName.trim(),
		versionCode: Number(form.versionCode),
		orientation: form.orientation === "auto" ? "unspecified" : form.orientation,
		notifications: form.notifications,
		privacyUrl: form.privacyPolicyUrl.trim(),
		format: form.outputFormat,
		ubuntu: form.ubuntuVersion,
		enableDocker: form.docker,
		enableNginx: form.nginx,
		enableSsl: form.ssl,
		domain: form.domain.trim(),
		sslEmail: form.letsEncryptEmail.trim(),
		iconDataUrl: null
	}), [form, source]);
	const basicErrors = (0, import_react.useMemo)(() => {
		const errors = [];
		if (!form.appName.trim()) errors.push("Tətbiq adını daxil edin.");
		if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*){2,}$/.test(form.packageName.trim())) errors.push("Android package adı az.studio.sayt formatında olmalıdır.");
		if (!/^\d+$/.test(form.versionCode) || Number(form.versionCode) < 1) errors.push("Versiya kodu 1 və ya daha böyük tam ədəd olmalıdır.");
		if (!form.versionName.trim()) errors.push("Versiya adını daxil edin.");
		if (source === "url" && !isHttpUrl(form.websiteUrl)) errors.push("Etibarlı sayt ünvanı daxil edin (https://...).");
		if (source === "zip" && !zipFile) errors.push(zipError || "index.html olan sayt ZIP faylını seçin.");
		if (form.privacyPolicyUrl && !isHttpUrl(form.privacyPolicyUrl)) errors.push("Məxfilik siyasəti üçün etibarlı URL daxil edin.");
		return errors;
	}, [
		form,
		source,
		zipFile,
		zipError
	]);
	const kitErrors = (0, import_react.useMemo)(() => {
		const errors = [];
		if (form.ssl && !form.nginx) errors.push("SSL konfiqurasiyası üçün əvvəlcə Nginx-i aktiv edin.");
		if (form.ssl && form.nginx && !form.domain) errors.push("SSL üçün domen adını daxil edin.");
		if (form.ssl && form.nginx && !form.letsEncryptEmail) errors.push("Let’s Encrypt üçün e-poçt ünvanını daxil edin.");
		return errors;
	}, [
		form.ssl,
		form.nginx,
		form.domain,
		form.letsEncryptEmail
	]);
	const setName = (value) => {
		setForm((old) => ({
			...old,
			appName: value,
			...!packageEdited ? { packageName: makePackageSuggestion(value) } : {}
		}));
	};
	const handleZip = async (event) => {
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
	const handleIcon = (event) => {
		const input = event.currentTarget;
		const file = event.target.files?.[0];
		input.value = "";
		if (!file) return;
		if (![
			"image/png",
			"image/jpeg",
			"image/webp"
		].includes(file.type)) {
			setStatus({
				kind: "error",
				message: "İkon PNG, JPEG və ya WebP formatında olmalıdır."
			});
			return;
		}
		if (file.size > 10485760) {
			setStatus({
				kind: "error",
				message: "İkon faylı 10 MB-dan kiçik olmalıdır."
			});
			return;
		}
		setIconFile(file);
		setStatus({ kind: "idle" });
	};
	const createBundle = async () => {
		const allErrors = [...basicErrors, ...kitErrors];
		if (allErrors.length) {
			setStatus({
				kind: "error",
				message: "Davam etmək üçün qeyd olunan sahələri düzəldin.",
				errors: allErrors
			});
			document.getElementById("validation-summary")?.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
			return;
		}
		setStatus({
			kind: "pending",
			message: "Build kit hazırlanır…"
		});
		try {
			const buildConfig = {
				...config,
				iconDataUrl: iconFile ? await imageToPngDataUrl(iconFile) : null
			};
			const issues = await validateBuildConfig(buildConfig, source === "zip" ? zipFile : null);
			if (issues.length) {
				setStatus({
					kind: "error",
					message: "Davam etmək üçün qeyd olunan sahələri düzəldin.",
					errors: issues
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
			window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
			setStatus({
				kind: "success",
				message: "Tam hazır ZIP endirildi. Ubuntu serverində açın — qalanını siz edəcəksiniz."
			});
		} catch (error) {
			setStatus({
				kind: "error",
				message: error instanceof Error ? error.message : "Build kit yaradılarkən xəta baş verdi."
			});
		}
	};
	const cancelRun = () => {
		runId.current += 1;
		abortRef.current?.abort();
		abortRef.current = null;
	};
	(0, import_react.useEffect)(() => () => cancelRun(), []);
	const pollJob = async (jobId, id, signal) => {
		const startedAt = Date.now();
		let failures = 0;
		let unknownSince = 0;
		while (id === runId.current) {
			if (Date.now() - startedAt > POLL_TIMEOUT_MS) throw new FatalJobError("Build çox uzun çəkdi. Yenidən cəhd edin.");
			try {
				const job = await fetchStatus(jobId, signal);
				failures = 0;
				if (id !== runId.current) return;
				if (job.state === "unknown") {
					unknownSince ||= Date.now();
					if (Date.now() - unknownSince > 6e4) throw new FatalJobError(job.message);
				} else unknownSince = 0;
				if (job.state === "ready") {
					localStorage.removeItem(JOB_STORAGE_KEY);
					setApk({
						phase: "ready",
						progress: 100,
						message: job.message,
						jobId,
						files: job.files ?? []
					});
					return;
				}
				if (job.state === "failed") throw new FatalJobError(job.reason ?? job.message);
				setApk({
					phase: job.state === "building" ? "building" : "queued",
					progress: Math.max(job.progress, 3),
					message: job.message,
					jobId
				});
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") return;
				if (error instanceof FatalJobError) throw error;
				failures += 1;
				if (failures > 6) throw error;
			}
			await sleep(4e3, signal);
		}
	};
	const failApk = (error) => {
		if (error instanceof DOMException && error.name === "AbortError") return;
		localStorage.removeItem(JOB_STORAGE_KEY);
		setApk({
			phase: "error",
			progress: 0,
			message: "",
			error: error instanceof Error ? error.message : "APK hazırlanarkən xəta baş verdi."
		});
	};
	const createApk = async () => {
		if (apk.phase === "preparing" || apk.phase === "uploading") return;
		if (basicErrors.length) {
			setStatus({
				kind: "error",
				message: "Davam etmək üçün qeyd olunan sahələri düzəldin.",
				errors: basicErrors
			});
			document.getElementById("validation-summary")?.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
			return;
		}
		setStatus({ kind: "idle" });
		cancelRun();
		const id = runId.current;
		const controller = new AbortController();
		abortRef.current = controller;
		setApk({
			phase: "preparing",
			progress: 0,
			message: "Fayllar hazırlanır…"
		});
		try {
			const buildConfig = {
				...config,
				enableDocker: false,
				enableNginx: false,
				enableSsl: false,
				domain: "",
				sslEmail: "",
				iconDataUrl: iconFile ? await imageToPngDataUrl(iconFile) : null
			};
			const activeZip = source === "zip" ? zipFile : null;
			const issues = await validateBuildConfig(buildConfig, activeZip);
			if (issues.length) throw new ApkClientError(issues[0], false);
			const kit = await buildProjectBundle(buildConfig, activeZip);
			const sha256 = await sha256Hex(kit);
			const jobId = newJobId();
			if (id !== runId.current) return;
			setApk({
				phase: "uploading",
				progress: 0,
				message: "Fayllar göndərilir…",
				jobId
			});
			const parts = await uploadKit(kit, jobId, (fraction) => {
				if (id === runId.current) setApk({
					phase: "uploading",
					progress: Math.round(fraction * 100),
					message: `Fayllar göndərilir… ${Math.round(fraction * 100)}%`,
					jobId
				});
			}, controller.signal);
			if (id !== runId.current) return;
			await startBuild({
				jobId,
				parts,
				size: kit.size,
				sha256,
				format: buildConfig.format
			}, controller.signal);
			localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify({
				jobId,
				at: Date.now()
			}));
			setApk({
				phase: "queued",
				progress: 3,
				message: "Build başladılır…",
				jobId
			});
			await pollJob(jobId, id, controller.signal);
		} catch (error) {
			if (id === runId.current) failApk(error);
		}
	};
	(0, import_react.useEffect)(() => {
		let saved = null;
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
		setApk({
			phase: "queued",
			progress: 3,
			message: "Əvvəlki build yoxlanılır…",
			jobId
		});
		pollJob(jobId, id, controller.signal).catch((error) => {
			if (id === runId.current) failApk(error);
		});
		return () => controller.abort();
	}, []);
	const apkBusy = apk.phase === "preparing" || apk.phase === "uploading" || apk.phase === "queued" || apk.phase === "building";
	const field = (key, label, options = {}) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: `field${options.full ? " full" : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "field-label",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "control",
				type: options.type || "text",
				value: String(form[key]),
				placeholder: options.placeholder,
				onChange: (event) => update(key, event.target.value),
				"data-testid": options.testId || `input-${key}`
			}),
			options.hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "field-hint",
				children: options.hint
			}) : null
		]
	}, key);
	const segment = (key, choices, testId) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "segmented",
		role: "group",
		"aria-label": key,
		children: choices.map((choice) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: `segment ${form[key] === choice.value ? "active" : ""}`,
			"aria-pressed": form[key] === choice.value,
			onClick: () => update(key, choice.value),
			"data-testid": `${testId}-${choice.value}`,
			children: choice.label
		}, choice.value))
	});
	const orientationLabel = {
		portrait: "Şaquli",
		landscape: "Üfüqi",
		auto: "Avtomatik"
	}[form.orientation];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "page-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "topbar",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					className: "brand",
					href: "/",
					"data-testid": "link-home",
					"aria-label": "APK Studio ana səhifə",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "brand-mark",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeXml, {
							size: 19,
							strokeWidth: 2.5
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["apk", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "brand-light",
						children: "studio"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "top-note",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { "aria-hidden": "true" }),
						" Bulud build ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							children: "·"
						}),
						" Fayllar yalnız APK yığmaq üçün göndərilir"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "hero",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow",
						children: "Saytdan Android layihəsinə"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: [
						"Saytınızı tətbiqə",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "çevirin." })
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Sayt linkini yazın və ya hazır statik ZIP yükləyin, “APK düzəlt” düyməsinə basın. APK Studio tətbiqi bizim build xidmətində yığır və yükləmə linkini verir. İstəsəniz, öz serverinizdə yığmaq üçün build kiti də endirə bilərsiniz." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "stack-strip",
						"aria-label": "Build kitə daxil olanlar",
						children: STACK.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "stack-chip",
							children: item
						}, item))
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hero-stamp",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "NO. 01 / APK BUILD" }), "Düyməyə bas — hazır APK linki al"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "workspace",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "form-panel",
					onSubmit: (event) => {
						event.preventDefault();
						createApk();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "section",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "section-head",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "section-num",
										children: "01"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Mənbə sayt" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "İki üsuldan birini seçin: canlı URL və ya index.html olan ZIP." })] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "source-tabs",
									role: "group",
									"aria-label": "Mənbə növü",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: `source-card ${source === "url" ? "selected" : ""}`,
										onClick: () => {
											setSource("url");
											setStatus({ kind: "idle" });
										},
										"aria-pressed": source === "url",
										"data-testid": "button-source-url",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "source-icon",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Earth, { size: 17 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Sayt ünvanı" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "İnternetdə yayımlanmış sayt" })] })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: `source-card ${source === "zip" ? "selected" : ""}`,
										onClick: () => {
											setSource("zip");
											setStatus({ kind: "idle" });
										},
										"aria-pressed": source === "zip",
										"data-testid": "button-source-zip",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "source-icon",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileArchive, { size: 17 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Hazır statik ZIP" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "index.html olan sayt faylları" })] })]
									})]
								}),
								source === "url" ? field("websiteUrl", "Sayt URL-i", {
									placeholder: "https://saytiniz.az",
									type: "url",
									full: true,
									hint: "Tətbiq açıldıqda bu ünvana qoşulacaq."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "drop-zone",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "drop-icon",
												children: zipFile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpFromLine, { size: 18 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "drop-copy",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: zipFile ? zipFile.name : "Sayt ZIP faylını seçin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: zipFile ? `${prettySize(zipFile.size)} · index.html tapıldı` : "ZIP · maksimum 60 MB · index.html olan statik sayt" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "subtle-button",
												htmlFor: "zip-upload",
												children: zipFile ? "Başqa fayl" : "Fayl seçin"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												id: "zip-upload",
												type: "file",
												accept: ".zip,application/zip",
												onChange: (event) => void handleZip(event),
												"data-testid": "input-website-zip",
												className: "hidden-file"
											})
										]
									}),
									zipError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "inline-alert upload-invalid",
										role: "alert",
										"data-testid": "status-zip-error",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 14 }), zipError]
									}) : null,
									zipFile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "remove-zip",
										onClick: () => {
											zipCheckId.current += 1;
											setZipFile(null);
											setZipError("");
										},
										"data-testid": "button-remove-zip",
										children: "ZIP faylını sil"
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "inline-alert",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 14 }), "ZIP-in içindəki fayllar tətbiqə daxil edilir və yığılmaq üçün build xidmətinə göndərilir. Sayt skriptləri build zamanı icra edilmir."]
									})
								] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "section",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "section-head",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "section-num",
									children: "02"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Tətbiq məlumatları" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "APK yaratmazdan əvvəl ad, paket, ikon, dil və versiya." })] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "field-grid",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "field full",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "field-label",
											children: ["Tətbiqin adı ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Android launcher-də görünür" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "control",
											value: form.appName,
											onChange: (event) => setName(event.target.value),
											placeholder: "Məsələn, Şəhər Bələdçisi",
											"data-testid": "input-app-name"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "field full",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "field-label",
												children: ["Android package adı ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "unikal identifikator" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												className: "control mono",
												value: form.packageName,
												onChange: (event) => {
													setPackageEdited(true);
													update("packageName", event.target.value);
												},
												placeholder: "az.studio.mysite",
												"data-testid": "input-package-name"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "field-hint",
												children: ["Hər hissə hərflə başlamalıdır; nümunə: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mono",
													children: "az.studio.saytiniz"
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "field full",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "field-label",
											children: ["Tətbiq ikonu ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "PNG və ya JPEG · 10 MB-a qədər" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "icon-upload",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "icon-preview",
													children: iconPreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														src: iconPreview,
														alt: "Tətbiq ikonunun önizləməsi",
														"data-testid": "img-icon-preview"
													}) : form.appName.trim().slice(0, 2).toUpperCase() || /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { size: 22 })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "icon-details",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: iconFile ? iconFile.name : "Öz ikonunuzu əlavə edin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: iconFile ? prettySize(iconFile.size) : "İstəyə bağlıdır. Sonradan dəyişə bilərsiniz." })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													htmlFor: "icon-upload",
													className: "subtle-button",
													children: "Yüklə"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													id: "icon-upload",
													type: "file",
													accept: "image/png,image/jpeg,image/webp",
													onChange: handleIcon,
													"data-testid": "input-app-icon",
													className: "hidden-file"
												}),
												iconFile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													className: "subtle-button",
													onClick: () => setIconFile(null),
													"data-testid": "button-remove-icon",
													children: "Sil"
												}) : null
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "field",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "field-label",
											children: "Tətbiq dili"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											className: "control",
											value: form.language,
											onChange: (event) => update("language", event.target.value),
											"data-testid": "select-language",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "az",
													children: "Azərbaycan dili"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "en",
													children: "English"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "ru",
													children: "Русский"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "tr",
													children: "Türkçe"
												})
											]
										})]
									}),
									field("versionName", "Versiya adı", { placeholder: "1.0.0" }),
									field("versionCode", "Versiya kodu", {
										type: "number",
										placeholder: "1",
										hint: "Hər buraxılışda artırılmalıdır."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "field",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "field-label",
											children: "Ekran istiqaməti"
										}), segment("orientation", [
											{
												value: "portrait",
												label: "Şaquli"
											},
											{
												value: "landscape",
												label: "Üfüqi"
											},
											{
												value: "auto",
												label: "Avtomatik"
											}
										], "orientation")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "field full",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "toggle-row",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Bildiriş icazəsi" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Android 13+ üçün icazə əlavə edilir; push xidməti ayrıca qurulmalıdır." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: `switch ${form.notifications ? "on" : ""}`,
												role: "switch",
												"aria-checked": form.notifications,
												"aria-label": "Bildiriş icazəsini aktiv et",
												onClick: () => update("notifications", !form.notifications),
												"data-testid": "switch-notifications"
											})]
										})
									}),
									field("privacyPolicyUrl", "Məxfilik siyasəti URL-i", {
										placeholder: "https://saytiniz.az/privacy",
										type: "url",
										full: true,
										hint: "İstəyə bağlıdır. Tətbiq parametrlərində istifadə olunur."
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "section",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "section-head",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "section-num",
										children: "03"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Build sazlamaları" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "APK / AAB formatı. Öz serverinizdə yığmaq istəyirsinizsə, əlavə server seçimləri aşağıdadır." })] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "field-grid",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "field full",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "field-label",
												children: "Android çıxış formatı"
											}),
											segment("outputFormat", [
												{
													value: "apk",
													label: "APK"
												},
												{
													value: "aab",
													label: "AAB"
												},
												{
													value: "both",
													label: "Hər ikisi"
												}
											], "output-format"),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "field-hint",
												children: "“APK düzəlt” seçdiyiniz formatı bizim build xidmətində hazırlayır. AAB imzasızdır (Play Console üçün sonradan imzalanmalıdır)."
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
									className: "kit-details",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { children: "Öz serverim üçün build kit seçimləri (əlavə)" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "field-hint",
											children: "Bu seçimlər yalnız endirilən ZIP-ə təsir edir; “APK düzəlt” onları nəzərə almır."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "field-grid",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "field full",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "field-label",
														children: "Ubuntu versiyası"
													}), segment("ubuntuVersion", [{
														value: "22.04",
														label: "Ubuntu 22.04 LTS"
													}, {
														value: "24.04",
														label: "Ubuntu 24.04 LTS"
													}], "ubuntu-version")]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "field full",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "config-note",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																className: "note-strong",
																children: "Serverə daxil olanlar"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
															"Endirilən ZIP-də quraşdırma skriptləri var. Siz serverdə işə salırsınız.",
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
																className: "kit-list",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Java 17" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Node.js 20" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Android SDK" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Gradle" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Capacitor" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Firewall (UFW)" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Docker (seçimlə)" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Nginx + SSL (seçimlə)" })
																]
															})
														]
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "field full",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "toggle-row",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Docker" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Konteyner əsaslı qurulum üçün" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															className: `switch ${form.docker ? "on" : ""}`,
															role: "switch",
															"aria-checked": form.docker,
															"aria-label": "Docker-i aktiv et",
															onClick: () => update("docker", !form.docker),
															"data-testid": "switch-docker"
														})]
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "field full",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "toggle-row",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Nginx" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Veb server və reverse proxy" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															className: `switch ${form.nginx ? "on" : ""}`,
															role: "switch",
															"aria-checked": form.nginx,
															"aria-label": "Nginx-i aktiv et",
															onClick: () => update("nginx", !form.nginx),
															"data-testid": "switch-nginx"
														})]
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "field full",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "toggle-row",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "SSL / HTTPS" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Let’s Encrypt sertifikatının avtomatik alınması" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															className: `switch ${form.ssl ? "on" : ""}`,
															role: "switch",
															"aria-checked": form.ssl,
															"aria-label": "SSL-i aktiv et",
															onClick: () => update("ssl", !form.ssl),
															"data-testid": "switch-ssl"
														})]
													})
												}),
												form.ssl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [field("domain", "Domen adı", { placeholder: "saytiniz.az" }), field("letsEncryptEmail", "Let’s Encrypt e-poçtu", {
													placeholder: "admin@saytiniz.az",
													type: "email"
												})] }) : null
											]
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
							className: "section action-section",
							"aria-label": "APK düzəlt",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "action-grid",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "action-status",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										id: "validation-summary",
										children: [
											basicErrors.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "status-card error",
												role: "status",
												"data-testid": "status-validation",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "status-head",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 15 }),
														basicErrors.length,
														" məsələ yoxlanmalıdır"
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
													className: "error-list",
													children: basicErrors.slice(0, 4).map((error) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: error }, error))
												})]
											}) : null,
											apkBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "status-card pending",
												role: "status",
												"data-testid": "status-apk-progress",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "status-head",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
															size: 15,
															className: "spinner"
														}), apk.phase === "preparing" ? "Fayllar hazırlanır" : apk.phase === "uploading" ? "Fayllar göndərilir" : apk.phase === "queued" ? "Növbədə" : "APK yığılır"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: apk.message }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "progress-track",
														role: "progressbar",
														"aria-valuemin": 0,
														"aria-valuemax": 100,
														"aria-valuenow": apk.progress,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { style: { width: `${Math.min(100, Math.max(2, apk.progress))}%` } })
													}),
													apk.phase === "building" || apk.phase === "queued" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "status-extra",
														children: "Adətən 3–8 dəqiqə çəkir. Bu səhifəni açıq saxlayın."
													}) : null
												]
											}) : null,
											apk.phase === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "status-card error",
												role: "alert",
												"data-testid": "status-apk-error",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "status-head",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 15 }), "APK hazırlamaq mümkün olmadı"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: apk.error }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														className: "retry-button",
														onClick: () => void createApk(),
														"data-testid": "button-retry-apk",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, { size: 13 }), " Yenidən cəhd et"]
													})
												]
											}) : null,
											apk.phase === "ready" && apk.jobId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "status-card success apk-ready",
												role: "status",
												"data-testid": "status-apk-ready",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "status-head",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 15 }), "APK hazırdır!"]
													}),
													(apk.files?.length ? apk.files : [{
														kind: "apk",
														name: "APK",
														size: 0
													}]).map((file) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
														className: "download-link",
														href: downloadUrl(apk.jobId, file.kind),
														download: true,
														"data-testid": `link-download-${file.kind}`,
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 16 }),
															file.kind === "apk" ? "APK-nı yüklə" : "AAB-ni yüklə",
															file.size ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: prettySize(file.size) }) : null
														]
													}, file.kind)),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "status-extra",
														children: "Link qısa müddət (bir neçə gün) işləyir. APK debug imzalıdır — telefonda “naməlum mənbələrdən quraşdırma” icazəsi lazım ola bilər."
													})
												]
											}) : null,
											status.kind === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "status-card pending",
												role: "status",
												"data-testid": "status-building",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "status-head",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
														size: 15,
														className: "spinner"
													}), "Build kit hazırlanır"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: status.message })]
											}) : null,
											status.kind === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "status-card error",
												role: "alert",
												"data-testid": "status-error",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "status-head",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 15 }), "Hazırlamaq mümkün olmadı"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: status.message }),
													status.errors ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
														className: "error-list",
														children: status.errors.slice(0, 4).map((error) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: error }, error))
													}) : null
												]
											}) : null,
											status.kind === "success" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "status-card success",
												role: "status",
												"data-testid": "status-success",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "status-head",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 15 }), "Fayl endirildi"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: status.message }),
													bundleFiles.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "status-extra",
														children: [bundleFiles.length, " fayl build kitə əlavə edildi."]
													}) : null
												]
											}) : null
										]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "action-buttons",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "build-button",
											disabled: apkBusy,
											onClick: () => void createApk(),
											"data-testid": "button-create-apk",
											children: apkBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
												size: 16,
												className: "spinner"
											}), apk.phase === "uploading" ? `Göndərilir… ${apk.progress}%` : "Hazırlanır…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hammer, { size: 17 }), "APK düzəlt"] })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "kit-button",
											disabled: status.kind === "pending",
											onClick: () => void createBundle(),
											"data-testid": "button-create-build-kit",
											children: status.kind === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
												size: 14,
												className: "spinner"
											}), "Hazırlanır…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackageCheck, { size: 15 }),
												"Build kit ZIP-i endir ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownToLine, { size: 14 })
											] })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "build-help",
											children: "“APK düzəlt” tətbiqi bizim build xidmətində yığır və yükləmə linki verir. Əlavə seçim kimi serverdə özünüz yığmaq üçün build kit ZIP-i də endirə bilərsiniz."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "secure-note",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, { size: 15 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "APK düzəldəndə sayt ünvanı/ZIP-i, ikon və tətbiq parametrləri yığma üçün build xidmətimizə göndərilir və iş bitdikdən sonra silinir. Hazır APK qısa müddət saxlanılır; yükləmə linki yalnız sizdə olur." })]
										})
									]
								})]
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: "side-column",
					"aria-label": "Build xülasəsi",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "summary-card",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "summary-top",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "summary-label",
									children: "Layihə xülasəsi"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "summary-title",
									children: form.appName.trim() || "Yeni Android tətbiqi"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "summary-package",
									children: form.packageName || "az.studio.tetbiq"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "summary-list",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "summary-item",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mənbə" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: source === "url" ? "Veb URL" : "Statik ZIP" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "summary-item",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Çıxış" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: form.outputFormat.toUpperCase() })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "summary-item",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Orientasiya" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: orientationLabel })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "summary-divider" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "summary-item",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Server" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["Ubuntu ", form.ubuntuVersion] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "summary-item",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "HTTPS" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: form.ssl ? "Let’s Encrypt" : "Sazlanmayıb" })]
								})
							]
						})]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "footer-note",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "APK Studio" }), " · Android build üçün açıq və sadə iş axını."] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Ubuntu · Docker · Nginx · SSL" })]
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApkStudio, {});
}
//#endregion
export { Home as component };
