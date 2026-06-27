# FITFUEL — Tienda de suplementos (Guatemala)

Tienda demo de suplementos deportivos hecha como **SPA de React** sin paso de build:
React + Babel se cargan por CDN y los componentes se transpilan en el navegador.

## Características

- **Routing por hash** (`#/catalogo`, `#/producto/:id`, `#/pack/:id`, `#/blog/:id`, `#/checkout`, etc.) — funciona con `file://` o cualquier servidor estático.
- **Página propia** por sección, producto, pack y artículo de blog.
- Catálogo con filtros por categoría, objetivo y búsqueda; carrito persistente (localStorage).
- **Packs**: el ahorro se calcula solo (suma de precios reales de los productos incluidos).
- **Checkout funcional**: arma el pedido y lo envía por **WhatsApp** a la tienda (apto para venta real sin backend).
- **Reseñas sin cuenta**: los visitantes envían su reseña (moderada vía WhatsApp/correo); no hay login.
- Páginas de ayuda: Envíos, Política de devoluciones, Contacto (formulario), FAQ.
- **Localizado para Guatemala**: precios en Quetzales (GTQ), envío nacional, contacto +502.
- **Responsive** con menú móvil (la mayoría del tráfico es desde celular).
- 3 temas conmutables en vivo (voltage / inferno / clinic) vía panel de tweaks.

## Panel de administración (`admin.html`)

Edita el contenido sin tocar código; guarda en `localStorage` (`ff_data`) y la tienda lo refleja:

- **Productos / Packs / Blog / Testimonios**: crear, editar, eliminar.
- **Subida de imágenes** (producto, portada de blog, foto de testimonio) — se optimizan en el navegador y se reflejan en la web. Sin imagen, se usa un degradado con el tono elegido.
- **Packs**: se arman seleccionando productos reales; el descuento se calcula automáticamente.
- **Contacto y tienda**: teléfono, WhatsApp (recibe los pedidos), correo, dirección, horario y umbral de envío gratis.
- **FAQ** y **marquee** editables.

> Nota de producción: el contenido se guarda en el navegador (localStorage), por dispositivo. Para un catálogo compartido entre todos los visitantes hace falta un backend/CMS (ver más abajo).

## Cómo ejecutar

El proyecto usa **Vite** (precompila el JSX, React de producción).

```bash
npm install      # primera vez
npm run dev      # desarrollo en http://localhost:5173/FITFUEL.html
npm run build    # build de producción -> dist/
npm run preview  # sirve el build de dist/
```

- Tienda: <http://localhost:5173/FITFUEL.html>
- Panel: <http://localhost:5173/admin.html>

El `build` genera `dist/` listo para subir a Vercel/Netlify/cualquier hosting estático.

## Estructura

| Archivo | Contenido |
|---|---|
| `FITFUEL.html` | Entrada de la tienda (HTML de Vite) |
| `main.jsx` | Punto de entrada del bundle (importa CSS y módulos) |
| `public/data.js` | Catálogo, packs, blog, testimonios, FAQ, contacto (script global `window.FF`) |
| `public/admin.html` | Panel de administración (página independiente, sin bundle) |
| `components-base.jsx` | Iconos, helpers, imágenes, router (hash) y moneda |
| `components-shop.jsx` | Header, hero, quiz, catálogo, ficha rápida |
| `components-extra.jsx` | Packs, reseñas, blog, carrito, footer |
| `pages.jsx` | Páginas (producto, pack, blog, checkout, contacto, ayuda, 404) |
| `app.jsx` | Shell del router, estado global y ErrorBoundary |
| `styles*.css` | Sistema de diseño y estilos |

> Los componentes se comparten vía `window.*` (patrón del proyecto); `data.js` se carga como script clásico antes del bundle para proveer `window.FF`.

## Notas para producción

- **Pedidos por WhatsApp**: el checkout no procesa pagos; genera el pedido y abre WhatsApp hacia el número configurado en el panel. Es el flujo típico de una tienda pequeña en Guatemala. Para cobro en línea (tarjeta automática) se necesita una pasarela + backend.
- **Contenido por dispositivo**: lo editado en el panel vive en el navegador donde se editó. Para que todos los visitantes vean el mismo catálogo, migrar `ff_data` a un backend (Firebase, Supabase, etc.) o a un JSON servido.
- **Rendimiento**: hoy el JSX se transpila en el navegador con Babel (sin paso de build). Para máxima velocidad en celular conviene precompilar el JSX a JS y usar los builds de producción de React.

> Demo de diseño base — checkout vía WhatsApp, sin pasarela de pago en línea.
