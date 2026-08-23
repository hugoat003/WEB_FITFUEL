import React from "react";
/* FITFUEL — base: iconos, placeholders, helpers, router */

/* ---------- Moneda: Quetzal guatemalteco (GTQ) ---------- */
const money = (n) => "Q" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n) => Number(n).toLocaleString("en-US");

/* ---------- Router de rutas reales (History API) ----------
   Antes esto era un router por hash: /#/producto/whey-vainilla. Para Google todo lo que va
   detrás de `#` es la MISMA página, así que la tienda entera era una sola URL y ninguna
   ficha de producto podía posicionar por su cuenta. Ahora cada página tiene su URL real,
   /producto/whey-vainilla, que el servidor devuelve con su propio HTML y sus metadatos
   (ver prerender.js y public/_redirects).

   Los enlaces del sitio siguen siendo <a href="/ruta"> normales — un interceptor global de
   clics más abajo los convierte en navegación sin recarga. Así los buscadores y el
   "abrir en pestaña nueva" del navegador ven enlaces de verdad. */

const decodeSafe = (v) => { try { return decodeURIComponent(v); } catch { return v; } };

function parseLocation() {
  const pathPart = (window.location.pathname || "/").replace(/^\/+/, "").replace(/\/+$/, "");
  const parts = pathPart.split("/").map(decodeSafe).filter(Boolean);
  const query = {};
  try {
    new URLSearchParams(window.location.search).forEach((v, k) => { query[k] = v; });
  } catch {}
  return { path: "/" + parts.join("/"), parts, query };
}

// Compatibilidad: quedan enlaces antiguos compartidos por WhatsApp con /#/ruta. El shim del
// <head> los reescribe al cargar; esto cubre los que aparezcan ya en marcha.
function toPath(to) {
  const raw = String(to == null ? "" : to).replace(/^#/, "");
  return "/" + raw.replace(/^\/+/, "");
}

function navigate(to) {
  const target = toPath(to);
  const [targetPath] = target.split("?");
  if (window.location.pathname === targetPath && !target.includes("?")) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  window.history.pushState({}, "", target);
  window.dispatchEvent(new CustomEvent("ff:route"));
}

function useRoute() {
  const [route, setRoute] = React.useState(parseLocation);
  React.useEffect(() => {
    const on = () => setRoute(parseLocation());
    window.addEventListener("popstate", on);   // atrás/adelante del navegador
    window.addEventListener("ff:route", on);   // navigate() interno
    return () => {
      window.removeEventListener("popstate", on);
      window.removeEventListener("ff:route", on);
    };
  }, []);
  return route;
}

// Archivos que debe servir el servidor tal cual, sin pasar por el router.
const ASSET_RE = /\.(html?|js|mjs|css|png|jpe?g|gif|webp|avif|svg|ico|pdf|txt|xml|json|zip|mp4|webm|woff2?)$/i;

// Interceptor global de clics: convierte los <a href="/ruta"> internos en navegación sin
// recarga, respetando ctrl/cmd-clic, target="_blank", descargas y enlaces externos.
if (typeof document !== "undefined" && !window.__ffLinkHandler) {
  window.__ffLinkHandler = true;
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a || a.hasAttribute("download")) return;
    if (a.target && a.target !== "" && a.target !== "_self") return;
    const href = a.getAttribute("href");
    // Sin href, correo, teléfono o ancla en la misma página: comportamiento normal.
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) return;
    let url;
    try { url = new URL(a.href, window.location.href); } catch { return; }
    if (url.origin !== window.location.origin) return;   // externo: navegación normal
    if (ASSET_RE.test(url.pathname)) return;             // /admin.html, imágenes, etc.
    e.preventDefault();
    navigate(url.pathname + url.search);
  });
}

function Link({ to, children, className, style, onClick, ariaLabel }) {
  return (
    <a href={toPath(to)} className={className} style={style} aria-label={ariaLabel}
      onClick={(e) => { if (onClick) onClick(e); }}>
      {children}
    </a>
  );
}

const ICONS = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
  cart: "M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L22 8H6 M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  heart: "M12 21s-7.5-4.8-10-9.5C.4 8.2 2 5 5.2 5c2 0 3.3 1.1 4.1 2.3C10.1 6.1 11.4 5 13.4 5 16.6 5 18.2 8.2 16.6 11.5 14.1 16.2 12 21 12 21Z",
  check: "M5 12l4.5 4.5L19 7",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
  flame: "M12 2c1 5-4 6-4 11a4 4 0 0 0 8 0c0-2-1-3-1-5 2 1 3 3 3 5a6 6 0 1 1-12 0C3 6 9 5 12 2Z",
  muscle: "M6.5 6.5h11M6.5 17.5h11M5 6.5v11M19 6.5v11M9 9.5h6v5H9z",
  leaf: "M4 20c0-9 7-16 16-16 0 9-7 16-16 16Zm0 0c3-7 7-9 11-11",
  truck: "M3 6h11v9H3zM14 9h4l3 3v3h-7zM7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  shield: "M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  star: "M12 3l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.8 6.7 19.4l1.1-6L3.4 9.3l6-.8L12 3Z",
  filter: "M3 5h18M6 12h12M10 19h4",
  spark: "M12 2v6M12 16v6M2 12h6M16 12h6",
  menu: "M3 6h18M3 12h18M3 18h18",
  back: "M19 12H5M11 18l-6-6 6-6",
  chevron: "M9 6l6 6-6 6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l-1 4h-4A12 12 0 0 1 4 6V4Z",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  pin: "M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  chat: "M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9Z",
  ret: "M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
  package: "M12 2 3 7v10l9 5 9-5V7l-9-5ZM3 7l9 5 9-5M12 12v10",
  tag: "M3 3h8l10 10-8 8L3 11V3ZM7 7h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  lab: "M9 2h6M10 2v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V2",
};

function Icon({ name, size = 20, fill = false, stroke = 2, style }) {
  const d = ICONS[name] || "";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

function Ph({ label, hue, className = "", tub = false }) {
  const color = `oklch(0.72 0.17 ${hue})`;
  return (
    <div className={"ph " + (tub ? "ph-tub " : "") + className}
      data-label={label} style={{ "--ph-color": color }} />
  );
}

// Imagen real si existe (image = data URL o URL); si no, placeholder con tono.
function ProdImg({ image, label, hue, tub = false, className = "" }) {
  if (image) {
    return <img className={"ph-img " + className} src={image} alt={label || ""} loading="lazy" />;
  }
  return <Ph label={label} hue={hue} tub={tub} className={className} />;
}

function Stars({ rating, reviews }) {
  return (
    <div className="stars">
      <Icon name="star" size={14} fill={true} stroke={0} style={{ color: "var(--accent)" }} />
      <b>{rating.toFixed(1)}</b>
      {reviews != null && <span>({reviews.toLocaleString("en-US")})</span>}
    </div>
  );
}

function Avatar({ name, hue, image }) {
  if (image) {
    return <img className="avatar" src={image} alt={name || ""} loading="lazy" style={{ objectFit: "cover" }} />;
  }
  return (
    <div className="avatar" style={{
      display: "grid", placeItems: "center",
      background: `repeating-linear-gradient(135deg, oklch(0.72 0.17 ${hue} / .35) 0 8px, oklch(0.72 0.17 ${hue} / .15) 8px 16px), var(--surface-2)`,
      fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)",
      border: "1px solid var(--border)",
    }}>{name[0]}</div>
  );
}

// Marca de versión del catálogo. La app monta con el catálogo local y el publicado llega
// después (evento `ff:catalog`), así que cualquier cálculo memoizado sobre FF.PRODUCTS se
// quedaría congelado con los datos de arranque. Este contador sirve de dependencia para
// que se rehagan cuando llega el bueno. El listener de módulo se registra antes que los de
// los componentes, así que cuando estos leen FF_TICK ya está actualizado.
let FF_TICK = 0;
if (typeof window !== "undefined") {
  window.addEventListener("ff:catalog", () => { FF_TICK++; });
}
function useCatalogTick() {
  const [t, setT] = React.useState(FF_TICK);
  React.useEffect(() => {
    const on = () => setT(FF_TICK);
    window.addEventListener("ff:catalog", on);
    on();   // por si el catálogo llegó antes de que montara este componente
    return () => window.removeEventListener("ff:catalog", on);
  }, []);
  return t;
}

// Rate limiter cliente (ventana deslizante en localStorage). Mitiga spam de
// pedidos, fuerza bruta de códigos e intentos de login desde el mismo navegador.
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  let hits = [];
  try { hits = JSON.parse(localStorage.getItem(key) || "[]"); } catch { hits = []; }
  hits = hits.filter((t) => typeof t === "number" && now - t < windowMs);
  if (hits.length >= max) {
    return { ok: false, retryMs: windowMs - (now - hits[0]) };
  }
  hits.push(now);
  try { localStorage.setItem(key, JSON.stringify(hits)); } catch {}
  return { ok: true };
}

// Focus-trap accesible para modales/drawers: enfoca el primer elemento al abrir,
// mantiene el Tab dentro, cierra con Escape y restaura el foco previo al cerrar.
function useFocusTrap(active, onClose) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!active) return;
    const node = ref.current;
    const prev = document.activeElement;
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
    const focusables = () => Array.from(node ? node.querySelectorAll(sel) : []).filter((el) => el.offsetParent !== null);
    (focusables()[0] || node)?.focus?.();
    const onKey = (e) => {
      if (e.key === "Escape") { onClose && onClose(); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); if (prev && prev.focus) prev.focus(); };
  }, [active]);
  return ref;
}

Object.assign(window, { money, num, Icon, Ph, ProdImg, Stars, Avatar, parseLocation, parseHash: parseLocation, toPath, navigate, useRoute, Link, rateLimit, useFocusTrap, useCatalogTick });
