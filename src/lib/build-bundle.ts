export type SourceMode = 'url' | 'zip';
export type OutputFormat = 'apk' | 'aab' | 'both';
export type Orientation = 'portrait' | 'landscape' | 'unspecified';
export type AppLanguage = 'az' | 'en' | 'ru' | 'tr';

export type BuildConfig = {
  sourceMode: SourceMode;
  websiteUrl: string;
  appName: string;
  packageName: string;
  language: AppLanguage;
  versionName: string;
  versionCode: number;
  orientation: Orientation;
  notifications: boolean;
  privacyUrl: string;
  format: OutputFormat;
  ubuntu: '22.04' | '24.04';
  domain: string;
  sslEmail: string;
  enableDocker: boolean;
  enableNginx: boolean;
  enableSsl: boolean;
  iconDataUrl: string | null;
};

type ZipEntry = {
  path: string;
  bytes: Uint8Array;
};

type ArchiveInspection = {
  error?: string;
  webRoot?: string;
};

const encoder = new TextEncoder();
const maxUploadBytes = 60 * 1024 * 1024;
const maxExpandedBytes = 160 * 1024 * 1024;
const maxEntryBytes = 40 * 1024 * 1024;
const maxEntries = 3000;
const fileLimit = 0xffffffff;
const archiveInspectionCache = new WeakMap<File, ArchiveInspection>();

const crcTable = new Uint32Array(256);
for (let n = 0; n < crcTable.length; n += 1) {
  let value = n;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[n] = value >>> 0;
}

function crc32(bytes: Uint8Array) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function safeUrl(value: string) {
  if (!value.trim() || value.trim().length > 2048) return false;
  try {
    const url = new URL(value.trim());
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function safeDomain(value: string) {
  if (!value || value.length > 253 || value.includes('://') || !value.includes('.')) return false;
  return value
    .split('.')
    .every(
      (label) =>
        label.length > 0 &&
        label.length <= 63 &&
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
    );
}

function safePackageName(value: string) {
  return (
    value.length <= 255 &&
    /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(value)
  );
}

function normalizeZipPath(value: string) {
  if (value.includes('\0')) return null;
  const path = value.replaceAll('\\', '/');
  if (!path || path.startsWith('/') || /^[a-zA-Z]:/.test(path)) return null;
  const segments = path.split('/');
  if (segments.some((part) => part === '..' || part === '.')) return null;
  if (segments.some((part) => part.length === 0 && part !== segments.at(-1))) {
    return null;
  }
  return path;
}

function inspectZipBytes(bytes: Uint8Array): ArchiveInspection {
  if (bytes.length < 22) return { error: 'ZIP arxivi boş və ya zədəlidir.' };

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const firstEocd = Math.max(0, bytes.length - 65_557);
  let eocdOffset = -1;

  for (let offset = bytes.length - 22; offset >= firstEocd; offset -= 1) {
    if (
      view.getUint32(offset, true) === 0x06054b50 &&
      offset + 22 + view.getUint16(offset + 20, true) <= bytes.length
    ) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0) return { error: 'ZIP arxivinin mərkəzi indeksi tapılmadı.' };

  const diskNumber = view.getUint16(eocdOffset + 4, true);
  const centralDisk = view.getUint16(eocdOffset + 6, true);
  const diskEntries = view.getUint16(eocdOffset + 8, true);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralSize = view.getUint32(eocdOffset + 12, true);
  const centralOffset = view.getUint32(eocdOffset + 16, true);

  if (
    diskNumber !== 0 ||
    centralDisk !== 0 ||
    diskEntries !== entryCount ||
    entryCount === 0xffff ||
    centralOffset === fileLimit ||
    centralSize === fileLimit
  ) {
    return { error: 'Çoxhissəli və ZIP64 arxivləri dəstəklənmir.' };
  }
  if (entryCount > maxEntries || centralOffset + centralSize > eocdOffset) {
    return { error: 'ZIP arxivi limitləri aşır və ya zədəlidir.' };
  }

  const names = new Set<string>();
  const indexFiles: string[] = [];
  let expandedBytes = 0;
  let cursor = centralOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > centralOffset + centralSize) {
      return { error: 'ZIP arxivinin fayl siyahısı yarımçıqdır.' };
    }
    if (view.getUint32(cursor, true) !== 0x02014b50) {
      return { error: 'ZIP arxivinin fayl siyahısı zədəlidir.' };
    }

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

    if (recordEnd > centralOffset + centralSize || diskStart !== 0) {
      return { error: 'ZIP arxivində dəstəklənməyən bölmə var.' };
    }
    if ((flags & 1) !== 0 || (method !== 0 && method !== 8)) {
      return { error: 'Şifrələnmiş və ya dəstəklənməyən ZIP faylı var.' };
    }
    if (compressedBytes === fileLimit || uncompressedBytes === fileLimit) {
      return { error: 'ZIP64 arxivləri dəstəklənmir.' };
    }
    const rawName = new TextDecoder('utf-8', { fatal: false }).decode(
      bytes.subarray(cursor + 46, cursor + 46 + nameLength),
    );
    const isDirectory = rawName.endsWith('/');
    const normalized = normalizeZipPath(rawName);
    if (!normalized) {
      return { error: 'ZIP-də təhlükəli və ya etibarsız fayl yolu var.' };
    }
    if (names.has(normalized)) {
      return { error: 'ZIP-də eyni ada malik fayllar var.' };
    }
    names.add(normalized);

    const unixMode = externalAttributes >>> 16;
    const fileType = unixMode & 0o170000;
    if (
      madeBy === 3 &&
      !isDirectory &&
      fileType !== 0 &&
      fileType !== 0o100000
    ) {
      return { error: 'ZIP-də adi fayl olmayan girişlər var.' };
    }
    if (!isDirectory) {
      if (uncompressedBytes > maxEntryBytes) {
        return { error: 'ZIP-də icazə verilən ölçüdən böyük fayl var.' };
      }
      expandedBytes += uncompressedBytes;
      if (expandedBytes > maxExpandedBytes) {
        return { error: 'ZIP-in açılmış ölçüsü 160 MB limitini keçir.' };
      }
      if (normalized.split('/').at(-1) === 'index.html') {
        indexFiles.push(normalized);
      }
    }
    cursor = recordEnd;
  }

  if (cursor !== centralOffset + centralSize) {
    return { error: 'ZIP arxivinin mərkəzi indeksi düzgün deyil.' };
  }

  const rootIndex = indexFiles.find((path) => path === 'index.html');
  if (rootIndex) return { webRoot: '' };
  if (indexFiles.length === 1) {
    return { webRoot: indexFiles[0].slice(0, -'index.html'.length) };
  }
  if (indexFiles.length === 0) {
    return { error: 'ZIP-də hazır saytın index.html faylı tapılmadı.' };
  }
  return {
    error:
      'ZIP-də birdən çox index.html var. Sayt qovluğunu ayrıca arxivləyin.',
  };
}

async function inspectWebsiteZip(file: File | null) {
  if (!file) return { error: 'Hazır saytın ZIP faylını yükləyin.' };
  const cached = archiveInspectionCache.get(file);
  if (cached) return cached;
  if (!file.name.toLowerCase().endsWith('.zip')) {
    return { error: 'Yalnız .zip arxivləri qəbul edilir.' };
  }
  if (file.size === 0 || file.size > maxUploadBytes) {
    return { error: 'ZIP faylı boşdur və ya 60 MB limitini keçir.' };
  }
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = inspectZipBytes(bytes);
    archiveInspectionCache.set(file, result);
    return result;
  } catch {
    return { error: 'ZIP faylı oxuna bilmədi.' };
  }
}

export async function validateWebsiteZip(file: File | null) {
  const result = await inspectWebsiteZip(file);
  return result.error ?? null;
}

export async function validateBuildConfig(
  config: BuildConfig,
  websiteZipFile: File | null,
): Promise<string[]> {
  const issues: string[] = [];
  if (!config.appName.trim() || config.appName.length > 80) {
    issues.push('Tətbiq adı 1–80 simvol olmalıdır.');
  }
  if (!safePackageName(config.packageName.trim())) {
    issues.push('Package name com.sirket.tetbiq formatında olmalıdır.');
  }
  if (!/^[0-9A-Za-z][0-9A-Za-z._+-]{0,63}$/.test(config.versionName.trim())) {
    issues.push('Version name yalnız rəqəm, hərf, nöqtə, tire və + simvollarından ibarət olmalıdır.');
  }
  if (
    !Number.isInteger(config.versionCode) ||
    config.versionCode < 1 ||
    config.versionCode > 2_100_000_000
  ) {
    issues.push('Version code 1–2,100,000,000 aralığında tam ədəd olmalıdır.');
  }
  if (config.sourceMode === 'url' && !safeUrl(config.websiteUrl)) {
    issues.push('Sayt ünvanı http:// və ya https:// ilə başlamalıdır.');
  }
  if (config.sourceMode === 'zip') {
    const archive = await inspectWebsiteZip(websiteZipFile);
    if (archive.error) issues.push(archive.error);
  }
  if (config.privacyUrl.trim() && !safeUrl(config.privacyUrl)) {
    issues.push('Məxfilik siyasəti URL-si http:// və ya https:// olmalıdır.');
  }
  if (config.domain.trim() && !safeDomain(config.domain.trim())) {
    issues.push('Domen adı yalnız etibarlı host adı ola bilər.');
  }
  if (config.enableSsl && config.enableNginx) {
    if (!safeDomain(config.domain.trim())) {
      issues.push('SSL üçün düzgün domain daxil edin.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.sslEmail.trim())) {
      issues.push('Let’s Encrypt üçün düzgün e-poçt daxil edin.');
    }
  } else if (config.enableSsl) {
    issues.push('SSL konfiqurasiyası üçün əvvəlcə Nginx-i aktiv edin.');
  }
  return issues;
}

function slugify(value: string) {
  const slug = value
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'android-tetbiqi';
}

function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function iconBytes(dataUrl: string) {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!match) throw new Error('İkon PNG formatında olmalıdır.');
  const binary = atob(match[1].replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function buildReadme(config: BuildConfig, slug: string) {
  const source =
    config.sourceMode === 'url'
      ? `Sayt ünvanı: ${config.websiteUrl}`
      : 'Sayt faylları app/site-source.zip arxivindədir.';
  const output =
    config.format === 'both'
      ? 'Debug APK və Release AAB'
      : config.format.toUpperCase();
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
   Skript quraşdırır: Java 17, Node.js 20, Android SDK, Gradle, UFW firewall${config.enableDocker ? ', Docker' : ''}${config.enableNginx ? ', Nginx' : ''}${config.enableSsl && config.enableNginx ? ', Certbot SSL' : ''}.
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

function configJson(config: BuildConfig) {
  const { iconDataUrl: _icon, ...safeConfig } = config;
  return JSON.stringify(
    {
      ...safeConfig,
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  );
}

function capacitorConfig(config: BuildConfig) {
  const nativeConfig: Record<string, unknown> = {
    appId: config.packageName,
    appName: config.appName,
    webDir: 'www',
    android: {
      allowMixedContent: false,
    },
    plugins: {
      StatusBar: {
        overlaysWebView: false,
      },
    },
  };
  if (config.sourceMode === 'url') {
    const cleartext = new URL(config.websiteUrl.trim()).protocol === 'http:';
    nativeConfig.server = {
      url: config.websiteUrl.trim(),
      androidScheme: cleartext ? 'http' : 'https',
      cleartext,
    };
  }
  return JSON.stringify(nativeConfig, null, 2);
}

function packageJson(config: BuildConfig) {
  const dependencies: Record<string, string> = {
    '@capacitor/android': '^6.2.0',
    '@capacitor/core': '^6.2.0',
    '@capacitor/status-bar': '^6.0.2',
  };
  if (config.notifications) {
    dependencies['@capacitor/local-notifications'] = '^6.1.0';
  }
  return JSON.stringify(
    {
      name: slugify(config.appName),
      private: true,
      version: config.versionName,
      type: 'module',
      scripts: {
        build: 'npx cap sync android',
        android: 'bash scripts/build-android.sh',
      },
      dependencies,
      devDependencies: {
        '@capacitor/assets': '^3.0.5',
        '@capacitor/cli': '^6.2.0',
      },
    },
    null,
    2,
  );
}

function placeholderPage(config: BuildConfig) {
  const destination = config.privacyUrl.trim() || 'privacy.html';
  const redirect =
    config.sourceMode === 'url'
      ? `setTimeout(function(){ location.replace(${JSON.stringify(config.websiteUrl)}); }, 350);`
      : '';
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
  <script>${redirect}</script>
</body>
</html>
`;
}

function privacyPage(config: BuildConfig) {
  const privacyCopy = config.privacyUrl
    ? `<p><a href="${xmlEscape(config.privacyUrl)}">Məxfilik siyasətinə keçin</a></p>`
    : `<p>Bu nümunə siyasəti hüquqşünasla yoxlayın və öz məlumat emal qaydalarınıza uyğunlaşdırın.</p>
<p>Tətbiqdə göstərilən sayt: ${xmlEscape(config.websiteUrl || 'yüklənmiş statik sayt')}</p>
<p>Əlaqə: ${xmlEscape(config.sslEmail || 'server sahibinin əlaqə ünvanı')}</p>`;
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

function buildAndroidScript() {
  return `#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$APP_DIR/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/output"
CONFIG="$ROOT_DIR/config.json"

command -v node >/dev/null || { echo "Node.js quraşdırılmayıb. Əvvəlcə bash server/install-ubuntu.sh işlədin." >&2; exit 1; }
command -v npm >/dev/null || { echo "npm tapılmadı." >&2; exit 1; }
command -v java >/dev/null || { echo "Java 17 quraşdırılmayıb." >&2; exit 1; }
command -v python3 >/dev/null || { echo "Python 3 tapılmadı." >&2; exit 1; }

JAVA_VERSION="$(java -version 2>&1 | head -n 1)"
echo "$JAVA_VERSION" | grep -q '17\\.' || { echo "Java 17 tələb olunur; tapıldı: $JAVA_VERSION" >&2; exit 1; }

mkdir -p "$OUTPUT_DIR"
cd "$APP_DIR"
npm install

SOURCE_MODE="$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).sourceMode)' "$CONFIG")"
if [ "$SOURCE_MODE" = "zip" ]; then
  python3 scripts/prepare-site.py
fi

if [ ! -d android ]; then
  npx cap add android
fi
npx cap sync android
python3 scripts/configure-android.py

FORMAT="$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).format)' "$CONFIG")"
cd android
if [ -f "$APP_DIR/assets/icon.png" ]; then
  cd "$APP_DIR"
  npx capacitor-assets generate --android
  cd android
fi
if [ "$FORMAT" = "apk" ] || [ "$FORMAT" = "both" ]; then
  ./gradlew --no-daemon assembleDebug
  cp app/build/outputs/apk/debug/app-debug.apk "$OUTPUT_DIR/__SLUG__.apk"
fi
if [ "$FORMAT" = "aab" ] || [ "$FORMAT" = "both" ]; then
  ./gradlew --no-daemon bundleRelease
  cp app/build/outputs/bundle/release/app-release.aab "$OUTPUT_DIR/__SLUG__.aab"
fi
echo "Build tamamlandı. Fayllar: $OUTPUT_DIR"
`;
}

function ubuntuInstallScript(config: BuildConfig) {
  const optionalPackages: string[] = [];
  if (config.enableDocker) optionalPackages.push('docker.io', 'docker-compose-v2');
  if (config.enableNginx) optionalPackages.push('nginx');
  if (config.enableSsl && config.enableNginx) {
    optionalPackages.push('certbot', 'python3-certbot-nginx');
  }
  const aptOptional = optionalPackages.length
    ? `apt-get install -y ${optionalPackages.join(' ')}`
    : ': # Docker, Nginx və SSL seçilməyib';
  const dockerSetup = config.enableDocker
    ? `systemctl enable --now docker
echo "Docker aktivdir. İstifadəçi qrupuna əlavə etmək üçün: usermod -aG docker USER_ADI"`
    : '';
  const nginxSetup = config.enableNginx
    ? `systemctl enable --now nginx
ufw allow 'Nginx Full'`
    : '';

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

${aptOptional}
${dockerSetup}
ufw allow OpenSSH
ufw allow 22/tcp
${nginxSetup}
ufw --force enable
echo "Java 17, Node.js, Gradle və Android SDK quraşdırıldı."
echo "Android SDK lisenziyaları interaktiv qaydada qəbul edildi."
`;
}

function nginxConfig(config: BuildConfig) {
  const serverName = config.domain || '_';
  return `server {
    listen 80;
    listen [::]:80;
    server_name ${serverName};
    root /var/www/${slugify(config.appName)};
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
`;
}

function dockerfile(config: BuildConfig) {
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

function dockerCompose(config: BuildConfig) {
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

function securityNotes(config: BuildConfig) {
  return `# Build təhlükəsizliyi

- ZIP mənbəsi əvvəlcədən hazırlanmış statik saytdır; server yalnız təhlükəsiz fayl yollarını çıxarır.
- Sayt ZIP-i içindəki skriptlər və package manager hook-ları icra edilmir.
- Arxiv ölçü limiti 60 MB, açılmış fayllar 160 MB-dır; simvolik linklər, şifrələnmiş və ZIP64 arxivlər rədd edilir.
- Build-i etibar etdiyiniz mənbələrdən yaradılmış saytlarla işlədin.
- Release signing açarlarını ZIP-ə əlavə etməyin. Onları yalnız öz Ubuntu serverinizdə saxlayın.
${config.enableSsl ? `- SSL host adı: ${config.domain || 'domaininizi daxil edin'}; Certbot üçün e-poçt: ${config.sslEmail || 'e-poçtunuzu daxil edin'}.` : ''}
`;
}

export function getBundleFileList(
  config: BuildConfig,
  websiteZipFile: File | null,
) {
  const files = [
    'README.md',
    'config.json',
    'SECURITY.md',
    'server/install-ubuntu.sh',
    'app/package.json',
    'app/capacitor.config.json',
    'app/www/index.html',
    'app/www/privacy.html',
    'app/scripts/build-android.sh',
    'app/scripts/configure-android.py',
  ];
  if (config.enableDocker) {
    files.push('Dockerfile', 'server/docker-compose.yml');
  }
  if (config.enableNginx) files.push('server/nginx.conf.example');
  if (config.sourceMode === 'zip') {
    files.push('app/site-source.zip', 'app/scripts/prepare-site.py');
  }
  if (config.enableSsl && config.enableNginx) {
    files.push('server/enable-https.sh');
  }
  if (config.iconDataUrl) files.push('app/assets/icon.png');
  if (config.sourceMode === 'zip' && !websiteZipFile) {
    files.push('Sayt ZIP-i gözlənilir');
  }
  return files;
}

function write16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function write32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true);
}

function blobBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer as ArrayBuffer;
}

function createStoredZip(entries: ZipEntry[]) {
  if (entries.length > 65_534) {
    throw new Error('Build paketi çox sayda fayldan ibarətdir.');
  }
  const localParts: ArrayBuffer[] = [];
  const centralParts: ArrayBuffer[] = [];
  let localOffset = 0;
  let centralSize = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const content = entry.bytes;
    if (nameBytes.length > 65_535 || content.length > fileLimit) {
      throw new Error('Build paketində dəstəklənməyən böyük fayl var.');
    }
    const checksum = crc32(content);
    const localHeader = new Uint8Array(30);
    const localView = new DataView(localHeader.buffer);
    write32(localView, 0, 0x04034b50);
    write16(localView, 4, 20);
    write16(localView, 6, 0x0800);
    write16(localView, 8, 0);
    write16(localView, 10, 0);
    write16(localView, 12, 0x5821);
    write32(localView, 14, checksum);
    write32(localView, 18, content.length);
    write32(localView, 22, content.length);
    write16(localView, 26, nameBytes.length);
    write16(localView, 28, 0);
    localParts.push(blobBuffer(localHeader), blobBuffer(nameBytes), blobBuffer(content));

    const centralHeader = new Uint8Array(46);
    const centralView = new DataView(centralHeader.buffer);
    write32(centralView, 0, 0x02014b50);
    write16(centralView, 4, 20);
    write16(centralView, 6, 20);
    write16(centralView, 8, 0x0800);
    write16(centralView, 10, 0);
    write16(centralView, 12, 0);
    write16(centralView, 14, 0x5821);
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

  if (localOffset + centralSize + 22 > fileLimit) {
    throw new Error('Yaradılan build paketi ZIP limitini keçir.');
  }
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  write32(endView, 0, 0x06054b50);
  write16(endView, 4, 0);
  write16(endView, 6, 0);
  write16(endView, 8, entries.length);
  write16(endView, 10, entries.length);
  write32(endView, 12, centralSize);
  write32(endView, 16, localOffset);
  write16(endView, 20, 0);
  return new Blob([...localParts, ...centralParts, blobBuffer(end)], {
    type: 'application/zip',
  });
}

function textFile(path: string, content: string): ZipEntry {
  return { path, bytes: encoder.encode(content) };
}

export async function buildProjectBundle(
  config: BuildConfig,
  websiteZipFile: File | null,
) {
  const issues = await validateBuildConfig(config, websiteZipFile);
  if (issues.length) throw new Error(issues[0]);
  const slug = slugify(config.appName);
  const root = `${slug}-paket`;
  const entries: ZipEntry[] = [];
  const addText = (path: string, content: string) => {
    entries.push(textFile(`${root}/${path}`, content));
  };

  addText('README.md', buildReadme(config, slug));
  addText('config.json', configJson(config));
  addText('SECURITY.md', securityNotes(config));
  addText('server/install-ubuntu.sh', ubuntuInstallScript(config));
  if (config.enableDocker) {
    addText('Dockerfile', dockerfile(config));
    addText('server/docker-compose.yml', dockerCompose(config));
  }
  if (config.enableNginx) {
    addText('server/nginx.conf.example', nginxConfig(config));
  }
  addText('app/package.json', packageJson(config));
  addText('app/capacitor.config.json', capacitorConfig(config));
  addText('app/www/index.html', placeholderPage(config));
  addText('app/www/privacy.html', privacyPage(config));
  addText('app/scripts/build-android.sh', buildAndroidScript().replaceAll('__SLUG__', slug));
  addText('app/scripts/configure-android.py', androidConfigScript());

  if (config.sourceMode === 'zip' && websiteZipFile) {
    entries.push({
      path: `${root}/app/site-source.zip`,
      bytes: new Uint8Array(await websiteZipFile.arrayBuffer()),
    });
    addText('app/scripts/prepare-site.py', prepareWebsiteScript());
  }
  if (config.enableSsl && config.enableNginx) {
    const domain = shellQuote(config.domain.trim());
    const email = shellQuote(config.sslEmail.trim());
    addText(
      'server/enable-https.sh',
      `#!/usr/bin/env bash
set -euo pipefail
if [ "$EUID" -ne 0 ]; then
  echo "Root hüququ tələb olunur. Bu əmri sudo ilə başladın." >&2
  exit 1
fi
certbot --nginx --domain ${domain} --email ${email} --redirect
`,
    );
  }
  if (config.iconDataUrl) {
    entries.push({
      path: `${root}/app/assets/icon.png`,
      bytes: iconBytes(config.iconDataUrl),
    });
  }

  return createStoredZip(entries);
}

export function getBundleFilename(config: BuildConfig) {
  return `${slugify(config.appName)}-android-build-kit.zip`;
}