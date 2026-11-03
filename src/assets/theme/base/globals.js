import colors from "assets/theme/base/colors";
import themeConfig from "themeConfig";

const { info, dark } = colors;

const sb = themeConfig.scrollbar || {};
const sbCor = sb.color || themeConfig.primary || "#e3242b";
const sbHover = sb.hoverColor || themeConfig.accent || sbCor;
const sbLargura = sb.width || 6;

export default {
  html: {
    scrollBehavior: "smooth",
    background: dark.body,
  },
  body: {
    background: themeConfig.background.customImageUrl
      ? `url("${themeConfig.background.customImageUrl}")`
      : themeConfig.background.gradient,
    backgroundSize: "cover",
    backgroundAttachment: "fixed",
    backgroundPosition: "center",
    color: themeConfig.fonts.primary,
  },
  "*, *::before, *::after": {
    margin: 0,
    padding: 0,
  },
  "*": { scrollbarWidth: "thin", scrollbarColor: `${sbCor} transparent` },
  "*::-webkit-scrollbar": { width: `${sbLargura}px`, height: `${sbLargura}px` },
  "*::-webkit-scrollbar-track": { background: "transparent" },
  "*::-webkit-scrollbar-thumb": { background: sbCor, borderRadius: `${sbLargura}px` },
  "*::-webkit-scrollbar-thumb:hover": { background: sbHover },
  "*::-webkit-scrollbar-corner": { background: "transparent" },
  "html.tema-claro": { filter: "invert(1) hue-rotate(180deg)" },
  "html.tema-claro img, html.tema-claro video, html.tema-claro input[type=color]": {
    filter: "invert(1) hue-rotate(180deg)",
  },
  "@media print": {
    "html, html.tema-claro": { filter: "none", background: "#ffffff !important" },
    body: { background: "#ffffff !important", color: "#111111 !important" },
    "*": {
      color: "#111111 !important",
      background: "transparent !important",
      boxShadow: "none !important",
      backdropFilter: "none !important",
      WebkitBackdropFilter: "none !important",
      borderColor: "#cccccc !important",
    },
    "svg text": { fill: "#111111 !important" },
    ".no-print, .MuiDrawer-root, .MuiDialog-root": { display: "none !important" },
    ".MuiCard-root": { breakInside: "avoid", border: "1px solid #cccccc !important", marginBottom: "12px" },
    "[class*='MuiBox-root'][style*='margin-left']": { marginLeft: "0 !important" },
  },
  "a, a:link, a:visited": {
    textDecoration: "none !important",
  },
  "a.link, .link, a.link:link, .link:link, a.link:visited, .link:visited": {
    color: `${dark.main} !important`,
    transition: "color 150ms ease-in !important",
  },
  "a.link:hover, .link:hover, a.link:focus, .link:focus": {
    color: `${info.main} !important`,
  },
};
