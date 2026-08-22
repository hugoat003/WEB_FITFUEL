// FITFUEL — generación de páginas estáticas para buscadores (plugin de Vite).
//
// La tienda es una SPA: un solo bundle que pinta todas las pantallas. Eso está bien para
// el visitante, pero un buscador que pide /producto/whey-vainilla necesita recibir un HTML
// que ya diga de qué va esa página. Este plugin, al terminar el build, escribe un archivo
// por ruta —dist/producto/whey-vainilla/index.html— con su <title>, su descripción, su
// canonical, sus etiquetas de redes y sus datos estructurados (JSON-LD). El cuerpo sigue
// siendo el mismo bundle de React, así que el visitante ve exactamente lo mismo que antes.
//
// No es renderizado en servidor: no ejecuta React. Es la parte que de verdad mueve la aguja
// (URL propia + metadatos propios + datos estructurados) sin montar infraestructura de SSR.
//
// ⚠️ Los datos salen del catálogo PUBLICADO en Supabase si está disponible, y si no del
// catálogo local de public/data.js. Es decir: cuando publiques un catálogo nuevo desde el
// panel, vuelve a desplegar para que las páginas de buscador reflejen los cambios.

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const SITE = (process.env.FF_SITE_URL || "https://fitfuelgt.com").replace(/\/+$/, "");

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// JSON-LD dentro de <script>: hay que neutralizar "</script>" y los separadores de línea.
// JSON-LD dentro de <script>: hay que neutralizar "</script>" y los separadores de línea
// U+2028/U+2029, que son válidos en JSON pero rompen un script en JavaScript.
const jsonLdSafe = (obj) =>
  JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

const clip = (s, n = 158) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n - 1).replace(/[\s,;.]+\S*$/, "") + "…";
};

/* ── Catálogo ───────────────────────────────────────────────────────────────
   public/data.js está escrito para el navegador (asigna sobre `window`). Se ejecuta en un
   contexto aislado donde el objeto global ES `window`, así que tanto `window.FF = …` como
   las referencias sueltas a `FF` funcionan igual que en el navegador. */
function loadLocalCatalog(root) {
  const code = fs.readFileSync(path.join(root, "public/data.js"), "utf8");
  const sandbox = {
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    console,
    setTimeout, clearTimeout,
    AbortController: globalThis.AbortController,
    fetch: () => Promise.reject(new Error("sin red")),
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { timeout: 5000 });
  return sandbox.FF || {};
}

// Catálogo publicado (el que ven los visitantes). Best-effort: si no hay red o el bucket
// aún no tiene data.json, se sigue con el catálogo local sin romper el build.
async function loadPublishedCatalog(FF) {
  const url = FF.PUBLIC_CATALOG_URL;
  if (!url || process.env.FF_SKIP_REMOTE === "1") return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ── Páginas de ayuda e institucionales ─────────────────────────────────────
   Viven en pages.jsx como objetos JSX; se leen sus títulos con una expresión regular para
   que no haya que mantener la lista en dos sitios. Si alguna no se encuentra, cae a un
   título genérico en vez de romper el build. */
function readContentPages(root) {
  const src = fs.readFileSync(path.join(root, "pages.jsx"), "utf8");
  const out = {};
  const re = /\n  ([a-zA-Z_]\w*):\s*\{\s*\n?\s*eyebrow:\s*"([^"]*)",\s*title:\s*"([^"]*)",\s*\n?\s*sub:\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(src))) out[m[1]] = { eyebrow: m[2], title: m[3], sub: m[4] };
  return out;
}

/* ── Inyección de metadatos en la plantilla ─────────────────────────────── */
function renderHtml(template, meta) {
  let html = template;
  const set = (re, replacement) => { html = html.replace(re, replacement); };

  set(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`);
  set(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(meta.description)}" />`);
  set(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(meta.title)}" />`);
  set(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(meta.description)}" />`);
  set(/<meta property="og:type" content="[^"]*" \/>/, `<meta property="og:type" content="${esc(meta.ogType || "website")}" />`);
  set(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${esc(meta.url)}" />`);
  set(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${esc(meta.url)}" />`);
  if (meta.image) {
    set(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${esc(meta.image)}" />`);
  }

  const extra = [];
  // /checkout y /cuenta no deben aparecer en buscadores, y el 404 tampoco.
  if (meta.noindex) extra.push('<meta name="robots" content="noindex,follow" />');
  if (meta.image) extra.push('<meta name="twitter:card" content="summary_large_image" />');
  if (meta.jsonLd) {
    extra.push(`<script type="application/ld+json">${jsonLdSafe(meta.jsonLd)}</script>`);
  }
  if (extra.length) html = html.replace("</head>", extra.join("\n") + "\n</head>");
  return html;
}

/* ── Datos estructurados ────────────────────────────────────────────────── */
const ORG = {
  "@type": "Organization",
  name: "FITFUEL",
  url: SITE + "/",
  logo: SITE + "/logo-full.png",
};

function productLd(p, FF, url) {
  const variants = typeof FF.variantsOf === "function" ? FF.variantsOf(p) : [];
  const prices = variants.length ? variants.map((v) => Number(v.price) || 0).filter(Boolean) : [Number(p.price) || 0];
  const low = Math.min(...prices), high = Math.max(...prices);
  const stock = p.stock;
  const availability = stock === 0
    ? "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: clip(p.blurb || `${p.name} ${p.flavor || ""}`.trim(), 300),
    sku: p.id,
    brand: { "@type": "Brand", name: "FITFUEL" },
    offers: prices.length > 1 && low !== high
      ? { "@type": "AggregateOffer", priceCurrency: "GTQ", lowPrice: low, highPrice: high,
          offerCount: prices.length, availability, url, seller: ORG }
      : { "@type": "Offer", priceCurrency: "GTQ", price: low, availability, url, seller: ORG },
  };
  if (p.image) ld.image = p.image.startsWith("http") ? p.image : SITE + p.image;
  // Google exige reviewCount > 0 para mostrar estrellas; sin reseñas, se omite.
  if (Number(p.reviews) > 0 && Number(p.rating) > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(p.rating), reviewCount: Number(p.reviews),
      bestRating: 5, worstRating: 1,
    };
  }
  return ld;
}

function articleLd(b, url) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: b.title,
    description: clip(b.excerpt, 300),
    articleSection: b.cat,
    author: ORG,
    publisher: ORG,
    mainEntityOfPage: url,
  };
}

/* ── El plugin ──────────────────────────────────────────────────────────── */
export function prerender() {
  let outDir = "dist";
  let root = process.cwd();

  return {
    name: "fitfuel-prerender",
    apply: "build",
    configResolved(cfg) {
      root = cfg.root;
      outDir = path.resolve(cfg.root, cfg.build.outDir);
    },
    async closeBundle() {
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const template = fs.readFileSync(indexPath, "utf8");

      const FF = loadLocalCatalog(root);
      const published = await loadPublishedCatalog(FF);
      if (published && typeof FF.applyData === "function") {
        FF.applyData(published);
        this.info?.("catálogo publicado descargado para los metadatos");
      } else {
        this.warn?.("usando el catálogo local de public/data.js (no se pudo leer el publicado)");
      }

      const content = readContentPages(root);
      const pages = [];   // { route, meta, priority, inSitemap }
      const add = (route, meta, opts = {}) =>
        pages.push({ route, meta: { ...meta, url: SITE + (route === "/" ? "/" : route) },
                     priority: opts.priority ?? 0.6, inSitemap: opts.inSitemap !== false });

      // ── Portada
      add("/", {
        title: "FITFUEL — Suplementos para rendir | Guatemala",
        description: "Suplementos deportivos testados en laboratorio y 100% originales. Proteína, creatina y pre-entreno con envío a toda Guatemala. Precios en quetzales.",
        image: SITE + "/logo-mark.png",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Store",
          name: "FITFUEL",
          description: "Tienda en línea de suplementos deportivos originales en Guatemala.",
          url: SITE + "/",
          logo: SITE + "/logo-full.png",
          image: SITE + "/logo-full.png",
          areaServed: { "@type": "Country", name: "Guatemala" },
          currenciesAccepted: "GTQ",
          paymentAccepted: "Contra entrega, Transferencia bancaria",
          email: (FF.CONTACT && FF.CONTACT.email) || "contacto@fitfuelgt.com",
        },
      }, { priority: 1.0 });

      // ── Secciones
      add("/catalogo", { title: "Catálogo de suplementos — FITFUEL",
        description: "Proteínas, creatina, pre-entreno, aminoácidos y vitaminas originales, con envío a toda Guatemala en 2 a 3 días hábiles." }, { priority: 0.9 });
      add("/ofertas", { title: "Ofertas — FITFUEL",
        description: "Suplementos originales con descuento. Precios en quetzales y envío gratis en pedidos mayores a Q400." }, { priority: 0.7 });
      add("/packs", { title: "Packs de suplementos — FITFUEL",
        description: "Combinaciones pensadas por objetivo, más baratas que comprar cada producto por separado." }, { priority: 0.8 });
      add("/objetivos", { title: "Encuentra tu suplemento por objetivo — FITFUEL",
        description: "Elige tu meta —ganar músculo, definir, energía o recuperación— y te decimos exactamente qué necesitas." }, { priority: 0.7 });
      add("/blog", { title: "Blog — FITFUEL",
        description: "Guías sin humo sobre creatina, proteína y pre-entreno, escritas con base en evidencia." }, { priority: 0.6 });
      add("/resenas", { title: "Reseñas de clientes — FITFUEL",
        description: "Opiniones reales de personas que ya compraron suplementos en FITFUEL." }, { priority: 0.5 });
      add("/contacto", { title: "Contacto — FITFUEL",
        description: "Escríbenos y te asesoramos sin compromiso sobre qué suplemento te conviene." }, { priority: 0.5 });

      // ── Ayuda e institucionales (títulos leídos de pages.jsx)
      const helpSlugs = ["envios", "devoluciones", "faq"];
      helpSlugs.forEach((slug) => {
        const c = content[slug];
        add("/ayuda/" + slug, {
          title: (c ? c.title : slug) + " — FITFUEL",
          description: c ? clip(c.sub) : "Información de ayuda de FITFUEL.",
        }, { priority: 0.4 });
      });
      ["nosotros", "calidad", "afiliados", "privacidad", "terminos", "cookies"].forEach((slug) => {
        const c = content[slug];
        add("/" + slug, {
          title: (c ? c.title : slug) + " — FITFUEL",
          description: c ? clip(c.sub) : "FITFUEL — suplementos originales en Guatemala.",
        }, { priority: 0.3 });
      });

      // ── Fichas de producto: lo que de verdad interesa posicionar
      (FF.PRODUCTS || []).forEach((p) => {
        const route = "/producto/" + p.id;
        const url = SITE + route;
        add(route, {
          title: `${p.name}${p.flavor ? " · " + p.flavor : ""} — FITFUEL`,
          description: clip(p.blurb || `${p.name} original, testado en laboratorio. Envío a toda Guatemala.`),
          ogType: "product",
          image: p.image ? (p.image.startsWith("http") ? p.image : SITE + p.image) : SITE + "/logo-mark.png",
          jsonLd: productLd(p, FF, url),
        }, { priority: 0.9 });
      });

      // ── Packs
      (FF.BUNDLES || []).forEach((b) => {
        const route = "/pack/" + b.id;
        add(route, {
          title: `${b.name} — FITFUEL`,
          description: clip(b.blurb || b.desc || `Pack ${b.name}: ${(b.items || []).join(", ")}.`),
          ogType: "product",
          image: b.image ? (b.image.startsWith("http") ? b.image : SITE + b.image) : SITE + "/logo-mark.png",
          jsonLd: {
            "@context": "https://schema.org", "@type": "Product",
            name: b.name, sku: b.id, brand: { "@type": "Brand", name: "FITFUEL" },
            description: clip(b.blurb || b.desc || b.name, 300),
            offers: { "@type": "Offer", priceCurrency: "GTQ", price: Number(b.price) || 0,
                      availability: "https://schema.org/InStock", url: SITE + route, seller: ORG },
          },
        }, { priority: 0.8 });
      });

      // ── Artículos del blog
      (FF.BLOG || []).forEach((b) => {
        const route = "/blog/" + b.id;
        add(route, {
          title: `${b.title} — FITFUEL`,
          description: clip(b.excerpt),
          ogType: "article",
          jsonLd: articleLd(b, SITE + route),
        }, { priority: 0.6 });
      });

      // ── Privadas: se generan para que tengan su <title>, pero fuera de buscadores
      add("/checkout", { title: "Finalizar compra — FITFUEL",
        description: "Confirma tu pedido de suplementos FITFUEL.", noindex: true }, { inSitemap: false });
      add("/cuenta", { title: "Mi cuenta — FITFUEL",
        description: "Tus pedidos, favoritos y direcciones.", noindex: true }, { inSitemap: false });

      // ── Escritura
      // Cada ruta se escribe en las DOS convenciones que usan los hosts estáticos:
      //   dist/catalogo/index.html  y  dist/catalogo.html
      // Cloudflare Pages resuelve la primera, pero escribir también la segunda hace que el
      // resultado sea idéntico en `npm run preview` y en cualquier otro host, así que se
      // puede comprobar en local exactamente lo que verá Google.
      let written = 0;
      for (const { route, meta } of pages) {
        const html = renderHtml(template, meta);
        if (route === "/") {
          fs.writeFileSync(indexPath, html);
        } else {
          const rel = route.replace(/^\//, "");
          const dir = path.join(outDir, rel, "index.html");
          fs.mkdirSync(path.dirname(dir), { recursive: true });
          fs.writeFileSync(dir, html);
          const flat = path.join(outDir, rel + ".html");
          fs.mkdirSync(path.dirname(flat), { recursive: true });
          fs.writeFileSync(flat, html);
        }
        written++;
      }

      // ── sitemap.xml
      const today = new Date().toISOString().slice(0, 10);
      const urls = pages.filter((p) => p.inSitemap).map((p) =>
        `  <url>\n    <loc>${esc(p.meta.url)}</loc>\n    <lastmod>${today}</lastmod>\n` +
        `    <priority>${p.priority.toFixed(1)}</priority>\n  </url>`).join("\n");
      fs.writeFileSync(path.join(outDir, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

      this.info?.(`prerender: ${written} páginas + sitemap.xml (${pages.filter((p) => p.inSitemap).length} URLs)`);
    },
  };
}
