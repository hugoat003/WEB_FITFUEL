# FITFUEL — Tienda de suplementos (Guatemala)

E-commerce de suplementos deportivos para Guatemala. **SPA de React + Vite** con backend
**Supabase** (auth, base de datos con RLS, storage) y **Cloudflare Pages Functions** para el correo
transaccional. Precios en Quetzales (GTQ). La mayoría del tráfico es móvil.

## Stack

- **React 18 + Vite 5** (sin TypeScript, sin framework CSS). Build a `dist/`.
- **Router por hash** (`#/catalogo`, `#/producto/:id`, `#/pack/:id`, `#/checkout`, `#/cuenta`, …).
- Componentes compartidos vía `window.*` (patrón del proyecto); `public/data.js` se carga como
  script clásico y provee `window.FF` (catálogo, contenido, helpers) antes del bundle.
- **Supabase**: Auth (correo/contraseña + Google, recuperación de contraseña), Postgres con **RLS**,
  RPCs (`place_order`, `top_products`, `last_order_for_email`, `restock_order`) y Storage (bucket
  público `catalog` para el catálogo publicado e imágenes).
- **Cloudflare Pages Functions** (`functions/api/`): `order-confirmation` envía el correo al cliente
  vía **Resend** desde el dominio propio (la API key es un secreto de Pages, nunca llega al navegador).
- Estado del carrito/favoritos con `useState` + Supabase (cuenta) y `localStorage` como caché.

## Estructura

| Archivo | Contenido |
|---|---|
| `FITFUEL.html` | Entrada de la tienda (Vite) |
| `main.jsx` | Punto de entrada del bundle (CSS + módulos + carga remota del catálogo) |
| `public/data.js` | Catálogo, packs, blog, testimonios, FAQ, contacto, helpers (`window.FF`) |
| `public/admin.html` | Panel de administración (página independiente, no se bundlea) |
| `components-base.jsx` | Iconos, helpers, router, moneda, rate-limit, focus-trap |
| `components-shop.jsx` | Header, hero, quiz, catálogo, ficha rápida |
| `components-extra.jsx` | Packs, reseñas/testimonios, blog, carrito, footer |
| `components-auth.jsx` | Modales de login/registro/recuperación de contraseña |
| `pages.jsx` | Páginas (producto, pack, blog, checkout, cuenta, reseñas, contacto, legales, 404) |
| `app.jsx` | Shell del router, estado global, favoritos, ErrorBoundary |
| `supabase.js` | Cliente Supabase (`window.sb`) |
| `functions/api/order-confirmation.js` | Cloudflare Function: correo al cliente (Resend) |
| `public/_headers` | Cabeceras de seguridad (CSP, HSTS, etc.) para Cloudflare Pages |
| `styles*.css`, `pdp.css` | Sistema de diseño y estilos |

## Base de datos (Supabase)

Tablas con RLS: `profiles` (`is_admin`), `orders`, `stock`, `costs` (privada), `addresses`,
`promo_codes`, `favorites`, `reviews`. La configuración vive en los `SUPABASE-*.md` y
`SECURITY-HEADERS-SETUP.md` — **corre esos bloques SQL en Supabase → SQL Editor**:

- `SUPABASE-ADMIN-SETUP.md` — RLS de `profiles`/`orders`, helper `is_admin()`, storage `catalog`.
- `SUPABASE-INVENTORY-SETUP.md` — tabla `stock` + `place_order` (atómico, anti-sobreventa).
- `SUPABASE-COSTS-SETUP.md` — tabla privada `costs` (margen del dashboard).
- `SUPABASE-ADMIN-FIXES.md` — borrar/cancelar pedidos + `restock_order`.
- `SUPABASE-SECURITY-SETUP.md` — RLS de `addresses`/`promo_codes`, cierre de inserción a `orders`.
- `SUPABASE-FASE1-PLACE-ORDER.md` — `place_order` con montos autoritativos (recalcula totales).
- `SUPABASE-FASE1-RPCS.md` — `top_products`, `last_order_for_email`.
- `SUPABASE-FASE2-FAVORITES.md` — tabla `favorites`.
- `SUPABASE-FASE2-REVIEWS.md` — tabla `reviews` (moderadas).

## Panel de administración (`admin.html`)

Requiere iniciar sesión con Supabase Auth y ser admin (`profiles.is_admin = true`). Dashboard con
Chart.js y P&L (COGS/margen), gestión de pedidos (estado + correo al cliente), inventario, CRUD de
productos/packs/blog/testimonios, **moderación de reseñas**, y **publicación del catálogo** al bucket
`catalog` (para que todos los visitantes vean el mismo catálogo e imágenes).

## Cómo ejecutar

```bash
npm install
npm run dev      # http://localhost:5173/FITFUEL.html  (panel: /admin.html)
npm run build    # build de producción -> dist/
npm run preview  # sirve el build de dist/
```

Deploy: **Cloudflare Pages** (build `npm run build`, output `dist/`). Configura los secretos de la
Function (`RESEND_API_KEY`) en el panel de Pages.

## Notas de producción

- **Pagos**: no hay pasarela de tarjeta todavía. El checkout registra el pedido (contra entrega /
  transferencia) y el admin lo confirma. Antes de activar tarjeta: recomputar precios por variante en
  `place_order` y sumar pasarela + facturación electrónica (FEL/SAT).
- **SEO**: hoy el router es por hash (no indexable por producto). Migrar a rutas reales + prerender
  para posicionamiento orgánico.
- **Analítica**: pendiente integrar GA4 / Meta Pixel para medir conversión y embudo.
