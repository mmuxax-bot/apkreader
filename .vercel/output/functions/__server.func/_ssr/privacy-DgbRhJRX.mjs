import { x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as OWNER_SITE, t as LegalLayout } from "./site-chrome-B9VOjEUU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/privacy-DgbRhJRX.js
var import_jsx_runtime = require_jsx_runtime();
function PrivacyPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LegalLayout, {
		title: "Məxfilik siyasəti",
		updated: "3 oktyabr 2026",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Bu səhifə APK Studio-nun (“xidmət”) məlumatlarla necə işlədiyini izah edir. Xidmət sayt ünvanını və ya statik sayt ZIP-ini Android tətbiqinə (APK / AAB) çevirir." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "1. Hansı məlumatlar göndərilir" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "“APK düzəlt” düyməsinə basdıqda aşağıdakılar build xidmətimizə göndərilir:" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "sayt ünvanı (URL) və ya yüklədiyiniz statik sayt ZIP faylı;" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "tətbiqin ikonu (əgər seçmisinizsə);" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "tətbiqin adı, paket adı, versiya, ekran istiqaməti, dil, məxfilik siyasəti URL-i və digər tətbiq parametrləri." })
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "“Build kit ZIP-i endir” düyməsi isə paketi yalnız brauzerinizdə yaradır və heç bir yerə göndərmir." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "2. Harada emal olunur" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Fayllar əvvəlcə saytımızın serverinə (Vercel üzərində), oradan isə APK-nın yığılması üçün",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "şəxsi (private) GitHub build repozitoriyasına" }),
				" ötürülür və GitHub Actions mühitində emal edilir. Hazır APK/AAB faylı həmin repozitoriyada müvəqqəti saxlanılır və yükləmə linki saytımız vasitəsilə verilir. İstifadəçi tərəfə GitHub ünvanı göstərilmir. Yükləmə linki təxmin edilməsi mümkün olmayan təsadüfi identifikatordan ibarətdir; linki bilən hər kəs faylı yükləyə bilər, buna görə linki paylaşarkən ehtiyatlı olun."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "3. Məlumatlar nə qədər saxlanılır" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Yüklənmiş fayllar build üçün müvəqqəti iş branch-ində saxlanılır və build bitdikdən dərhal sonra (uğurlu və ya uğursuz) silinir. Yarımçıq qalan iş branch-ləri gündəlik təmizləmə ilə təxminən 6 saatdan sonra silinir." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					"Hazır APK/AAB faylı ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "7 gündən sonra" }),
					" avtomatik silinir (təmizləmə gündə bir dəfə işlədiyi üçün real müddət bir neçə saat uzun ola bilər). Build artefaktı isə GitHub-da cəmi 1 gün saxlanılır."
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "GitHub Actions iş jurnalları (texniki build çıxışı: fayl yolları, tətbiq və paket adı kimi) GitHub-ın standart saxlama müddəti qədər qala bilər. Silinmiş fayllar GitHub-ın daxili təmizləməsinə qədər sistemdə texniki qalıqlar kimi mövcud ola bilər." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Brauzerinizdə yalnız davam edən build-in identifikatoru (səhifə yenilənəndə işi davam etdirmək üçün, ən çox 2 saat) yerli yaddaşda saxlanılır." })
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "4. Hesab, reklam, satış" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Xidmətdən istifadə üçün hesab və ya qeydiyyat tələb olunmur." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Reklam göstərmirik və öz analitika / izləmə alətlərimiz yoxdur." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Məlumatlarınızı satmırıq və reklam məqsədilə üçüncü tərəflərə vermirik." })
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "5. Server jurnalları və IP ünvanı" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Təhlükəsizlik və sui-istifadənin qarşısını almaq üçün sorğuların sürətini məhdudlaşdırırıq; bunun üçün IP ünvanınız qısa müddətə serverin yaddaşında istifadə olunur. Hosting provayderi (Vercel) və GitHub öz texniki jurnallarını öz siyasətlərinə uyğun tuta bilər. Səhifələr şrift yükləmək üçün Google Fonts-a müraciət edir; yerləşdirmə platformasının öz interfeys elementləri də üçüncü tərəf resursları yükləyə bilər." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "6. Sizin məsuliyyətiniz" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Yüklədiyiniz məzmunun qanuni olmasına və üçüncü tərəfin hüquqlarını pozmamasına siz cavabdehsiniz. Tətbiqinizin öz məxfilik siyasətini hazırlamaq və mağaza tələblərinə uyğunluq da sizin öhdəliyinizdir. Əlavə şərtlər üçün",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/terms",
					children: "istifadə qaydalarına"
				}),
				" baxın."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "7. Əlaqə" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Suallar və silmə sorğuları üçün",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: OWNER_SITE,
					target: "_blank",
					rel: "noopener noreferrer",
					children: "nibrascode.com"
				}),
				" ",
				"ünvanı vasitəsilə əlaqə saxlayın."
			] })
		]
	});
}
//#endregion
export { PrivacyPage as component };
