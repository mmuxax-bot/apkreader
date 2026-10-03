import { x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as Hammer, d as Download, p as CloudUpload, v as ArrowRight } from "../_libs/lucide-react.mjs";
import { i as SiteFooter, r as SiteBrand } from "./site-chrome-B9VOjEUU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CnygDUAl.js
var import_jsx_runtime = require_jsx_runtime();
var version = "1.0.0";
var STEPS = [
	{
		icon: CloudUpload,
		title: "Saytı verin",
		text: "Sayt linkini yazın və ya index.html olan hazır statik ZIP yükləyin. Ad, ikon və paket adını seçin."
	},
	{
		icon: Hammer,
		title: "“APK düzəlt” basın",
		text: "Tətbiq bizim build xidmətində yığılır. Adətən 3–8 dəqiqə çəkir."
	},
	{
		icon: Download,
		title: "APK-nı yükləyin",
		text: "Hazır olanda saytımızdan birbaşa yükləmə linki alırsınız — telefona quraşdırın."
	}
];
function Landing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "page-shell landing",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "topbar",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteBrand, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "top-note",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { "aria-hidden": "true" }), " Android APK · Capacitor"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "hero landing-hero",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow",
						children: "Saytdan Android tətbiqinə"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: [
						"Saytınızı tətbiqə",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "bir kliklə çevirin." })
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Sayt linkini və ya hazır statik ZIP-i verin — APK Studio Android tətbiqini yığıb sizə yükləmə linki versin. Android Studio, server və ya kod bilgisi tələb olunmur." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "landing-actions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/studio",
							className: "start-button",
							"data-testid": "button-start",
							children: ["Başla ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 18 })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "landing-hint",
							children: "Qeydiyyat tələb olunmur"
						})]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "version-badge",
					"data-testid": "app-version",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Versiya" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["v", version] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "steps-grid",
				"aria-label": "Necə işləyir",
				children: STEPS.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "step-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "step-num",
							children: ["0", index + 1]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "source-icon",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(step.icon, { size: 17 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: step.title }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: step.text })
					]
				}, step.title))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "landing-note",
				children: [
					"Diqqət: APK debug imzalıdır (test və birbaşa quraşdırma üçün). Zərərli tətbiqlər hazırlamaq qadağandır — ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/terms",
						children: "istifadə qaydalarına"
					}),
					" baxın."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
var SplitComponent = Landing;
//#endregion
export { SplitComponent as component };
