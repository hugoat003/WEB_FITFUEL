# FITFUEL — Fase 2.5: cabeceras de seguridad (CSP + headers)

Archivo nuevo: [public/_headers](public/_headers) (Cloudflare Pages lo sirve desde la raíz del
deploy). No requiere SQL ni cambios de código.

## Qué activa (ya enforzado — es inofensivo para el render)
- **X-Content-Type-Options: nosniff** — evita que el navegador "adivine" tipos MIME.
- **X-Frame-Options: DENY** + `frame-ancestors 'none'` — anti-clickjacking (nadie puede meter tu
  tienda en un iframe).
- **Strict-Transport-Security** — fuerza HTTPS.
- **Referrer-Policy** y **Permissions-Policy** — menos fuga de datos; cámara/micrófono/geo/pago off.

## La CSP va en Report-Only (a propósito)
La `Content-Security-Policy` está como **`-Report-Only`**: **no bloquea nada**, solo reporta en la
consola. Así puedes verificar que no rompe nada de tu tienda **en vivo** antes de forzarla.

Está calibrada para permitir exactamente lo que usas: Supabase (REST + realtime `wss`), Web3Forms,
EmailJS, Google Fonts, y en el panel Chart.js + Supabase UMD desde `cdn.jsdelivr.net`. Bloquea
destinos de red desconocidos (mitiga exfiltración si algún día hay un XSS) y el embebido en iframes.

### Cómo forzarla (cuando confirmes que no rompe)
1. Despliega con este `_headers` (idealmente primero a un **preview**).
2. Abre la tienda y el panel con la consola (F12). Prueba: login, carrito, checkout; en el panel:
   login, **publicar catálogo**, **moderar una reseña**, ver dashboard (Chart.js).
3. Si **no** ves errores de *"Content Security Policy"* en rojo → en `public/_headers` cambia
   `Content-Security-Policy-Report-Only:` por `Content-Security-Policy:` y vuelve a desplegar.
4. Si aparece algún origen bloqueado que sí necesitas, súmalo a la directiva correspondiente
   (`connect-src`, `img-src`, etc.) y repite.

> Nota: la CSP usa `'unsafe-inline'` en `script-src` porque el panel (`admin.html`) tiene manejadores
> `onclick` inline y CDNs. Endurecerla con *nonces* es una mejora futura (requiere reescribir esos
> manejadores). Aun así, restringir `connect-src`/`img-src`/`frame-ancestors` ya aporta protección real.
