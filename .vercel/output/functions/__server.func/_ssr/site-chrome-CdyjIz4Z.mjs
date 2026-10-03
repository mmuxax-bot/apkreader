import { x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as CodeXml } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/site-chrome-CdyjIz4Z.js
var import_jsx_runtime = require_jsx_runtime();
var OWNER_SITE = "https://nibrascode.com";
function SiteBrand() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		className: "brand",
		to: "/",
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
	});
}
function SiteFooter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "footer-note site-footer",
		"data-testid": "site-footer",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "APK Studio" }),
			" · Saytı Android tətbiqinə çevirən build xidməti.",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
			"© 2026 NibrasCode · Bu layihə NibrasCode-a məxsusdur"
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			className: "footer-links",
			"aria-label": "Hüquqi səhifələr",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/privacy",
					"data-testid": "link-privacy",
					children: "Məxfilik siyasəti"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/terms",
					"data-testid": "link-terms",
					children: "İstifadə qaydaları"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: OWNER_SITE,
					target: "_blank",
					rel: "noopener noreferrer",
					"data-testid": "link-owner",
					children: "nibrascode.com"
				})
			]
		})]
	});
}
function LegalLayout({ title, updated, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "page-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "topbar",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteBrand, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "top-link",
					to: "/studio",
					children: "APK düzəlt →"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "legal-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow",
						children: "Hüquqi məlumat"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: title }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "legal-updated",
						children: ["Son yenilənmə: ", updated]
					}),
					children
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
//#endregion
export { SiteFooter as i, OWNER_SITE as n, SiteBrand as r, LegalLayout as t };
