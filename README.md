# APK Studio

Sayt ünvanını və ya hazır statik ZIP-i Android tətbiqinə (APK / AAB) çevirən veb tətbiq
(TanStack Start + Vite + React, Vercel-də işləyir).

**“APK düzəlt”** düyməsinə basanda:

1. Brauzer build paketini (Capacitor layihəsi) yaradır və ~3 MB-lıq hissələrlə serverə göndərir;
2. server hissələri **private** build repozitoriyasına yazır və GitHub Actions workflow-unu işə salır;
3. GitHub Actions APK-nı yığır (Java 17, Node 20, Android SDK 34);
4. hazır olanda istifadəçi **bizim saytın** linkindən (`/api/apk/<jobId>/download`) yükləyir.

İstifadəçi GitHub-ı görmür; token yalnız serverdə qalır. “Build kit ZIP-i endir” düyməsi köhnə
davranışı saxlayır (öz Ubuntu serverinizdə yığmaq üçün).

## Quraşdırma (bir dəfəlik)

### 1. Private build repozitoriyası

1. GitHub-da **private** repozitoriya yaradın, məsələn `mmuxax-bot/apk-builds`
   (public olmamalıdır — hazır APK-lar və yüklənən fayllar orada saxlanılır).
2. Bu layihədəki `build-repo/` qovluğunun məzmununu həmin repozitoriyanın `main` branch-inə köçürün:
   - `.github/workflows/build-apk.yml`
   - `.github/workflows/cleanup.yml`
   - `README.md`

   > Workflow fayllarını push edən tokenin **`workflow`** icazəsi olmalıdır (klassik PAT-da `workflow`
   > scope-u). Ən asan yol: GitHub veb interfeysində *Add file → Create new file* ilə eyni yollarla
   > yaratmaq.
3. Repozitoriyada **Settings → Actions → General → Workflow permissions** bölməsində Actions-ın
   aktiv olduğundan əmin olun (default belədir).

### 2. GitHub tokeni (`GITHUB_TOKEN`)

[Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token](https://github.com/settings/personal-access-tokens/new):

- **Resource owner:** repozitoriyanın sahibi (məs. `mmuxax-bot`)
- **Repository access:** *Only select repositories* → yalnız build repozitoriyası (`apk-builds`)
- **Repository permissions:**
  - **Contents:** Read and write
  - **Actions:** Read and write
  - **Metadata:** Read-only (avtomatik)
- Müddət: istədiyiniz qədər (bitəndə yeniləməyi unutmayın).

(Klassik token istifadə etsəniz `repo` scope-u kifayətdir.)

### 3. Mühit dəyişənləri

| Dəyişən        | Məcburi | Nümunə                    | Təsvir                                      |
| -------------- | ------- | ------------------------- | ------------------------------------------- |
| `GITHUB_TOKEN` | bəli    | `github_pat_…`            | Yuxarıdakı token. **Heç vaxt commit etməyin.** |
| `GITHUB_REPO`  | bəli    | `mmuxax-bot/apk-builds`   | Private build repozitoriyası (`sahib/repo`)  |
| `GITHUB_BRANCH`| xeyr    | `main`                    | Workflow-un olduğu branch                    |

Vercel-də: *Project → Settings → Environment Variables* → əlavə edib yenidən deploy edin.
Dəyişənlər təyin edilməyibsə, API aydın Azərbaycanca xəta qaytarır. Nümunə: `.env.example`.

## Məhdudiyyətlər

- Hazırlanan build paketi (sayt ZIP-i + ikon + skriptlər) ≤ ~72 MB; sayt ZIP-i ≤ 60 MB.
- APK **debug imzalıdır** (test və birbaşa quraşdırma üçün). AAB imzasızdır — Play Store üçün öz
  imzanızla imzalanmalıdır.
- Hazır fayllar release kimi saxlanılır və **7 gündən sonra** avtomatik silinir
  (`cleanup.yml`); yarımçıq iş branch-ləri ~6 saatdan sonra silinir.
- Vercel-in sorğu limiti ~4.5 MB olduğu üçün fayl hissələrlə göndərilir (3 MB/hissə).
- Sürət limiti serverless-də hər instansiya üçün ayrıdır (best-effort). Açıq saytda sui-istifadənin
  qarşısını almaq üçün Vercel Firewall / giriş məhdudiyyəti əlavə etmək məsləhətdir —
  hər build GitHub Actions dəqiqələrini işlədir.
- Yüklənən kit istifadəçi tərəfindən yaradıldığı üçün workflow onu yalnız-oxuma (`contents: read`)
  icazəsi ilə, ayrı job-da işlədir; nəticəni yayımlayan job istifadəçi kodunu icra etmir.

## Yerli inkişaf və test

```bash
npm install
npm run dev            # http://localhost:8080

# GitHub olmadan yoxlamaq üçün saxta API:
node scripts/mock-github.mjs 4010 &
GITHUB_TOKEN=test-token GITHUB_REPO=owner/repo GITHUB_API_BASE=http://127.0.0.1:4010 npm run dev

npm run typecheck && npm run lint && npm test && npm run build
```

Node 22 tövsiyə olunur (`npm test` `--experimental-strip-types` istifadə edir).

## API

| Metod və yol                       | Təsvir                                                       |
| ---------------------------------- | ------------------------------------------------------------ |
| `POST /api/apk/chunk?job&index&total` | Kit hissəsini (raw bayt, ≤3.5 MB) yükləyir, `sha` qaytarır |
| `POST /api/apk/start`              | Hissələri birləşdirir və build-i başladır                    |
| `GET /api/apk/<jobId>/status`      | `queued / building / ready / failed` + irəliləyiş            |
| `GET /api/apk/<jobId>/download`    | APK-nı axın kimi ötürür (`?file=aab` — AAB)                  |
