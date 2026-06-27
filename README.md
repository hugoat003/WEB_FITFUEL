# FITFUEL — Tienda de suplementos (Guatemala)

Tienda demo de suplementos deportivos hecha como **SPA de React** sin paso de build:
React + Babel se cargan por CDN y los componentes se transpilan en el navegador.

## Características

- **Routing por hash** (`#/catalogo`, `#/producto/:id`, `#/blog/:id`, etc.) — funciona con `file://` o cualquier servidor estático.
- **Página propia** por sección, producto y artículo de blog.
- Catálogo con filtros por categoría, objetivo y búsqueda; carrito persistente (localStorage).
- Páginas de ayuda funcionales: Envíos, Devoluciones, Contacto (con formulario), FAQ.
- **Localizado para Guatemala**: precios en Quetzales (GTQ), envío nacional, contacto +502.
- **Responsive** con menú móvil (la mayoría del tráfico es desde celular).
- 3 temas conmutables en vivo (voltage / inferno / clinic) vía panel de tweaks.
- `admin.html`: panel para editar el catálogo (guarda en localStorage).

## Cómo ejecutar

Necesita un servidor estático (por CORS al cargar los `.jsx` locales):

```bash
python -m http.server 8000
```

Luego abre <http://localhost:8000/FITFUEL.html>.

## Estructura

| Archivo | Contenido |
|---|---|
| `FITFUEL.html` | Punto de entrada de la tienda |
| `admin.html` | Panel de administración |
| `data.js` | Catálogo, packs, blog, testimonios, FAQ, contacto |
| `components-base.jsx` | Iconos, helpers, router (hash) y formato de moneda |
| `components-shop.jsx` | Header, hero, quiz, catálogo, ficha rápida |
| `components-extra.jsx` | Packs, reseñas, blog, carrito, footer |
| `pages.jsx` | Páginas (producto, blog, contacto, ayuda, info, 404) |
| `app.jsx` | Shell del router y estado global |
| `styles*.css` | Sistema de diseño y estilos |

> Demo de diseño — no es una tienda real.
