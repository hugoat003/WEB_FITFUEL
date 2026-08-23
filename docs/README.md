# Documentación de FITFUEL

## Marca y contenido

| Documento | Qué contiene |
|---|---|
| [PRODUCT.md](PRODUCT.md) | Brand book: a quién vendes, tono de voz, principios de diseño, anti-referencias y objetivos de accesibilidad. Es la guía para cualquier decisión de diseño o texto. |
| [FITFUEL-Fichas-Producto.md](FITFUEL-Fichas-Producto.md) | Ficha legible de cada producto del catálogo: datos nutricionales verificados, textos y qué queda por confirmar en la etiqueta física. |

## Base de datos (Supabase)

Cada archivo trae un bloque SQL para pegar en **Supabase → SQL Editor**. Están en el orden en
que se construyó la base; si montas el proyecto desde cero, córrelos de arriba abajo.

| Documento | Qué crea | Estado |
|---|---|---|
| [SUPABASE-ADMIN-SETUP.md](SUPABASE-ADMIN-SETUP.md) | RLS de `profiles` y `orders`, helper `is_admin()`, bucket `catalog` | vigente |
| [SUPABASE-INVENTORY-SETUP.md](SUPABASE-INVENTORY-SETUP.md) | Tabla `stock` | vigente (su `place_order` está superado) |
| [SUPABASE-COSTS-SETUP.md](SUPABASE-COSTS-SETUP.md) | Tabla privada `costs`, para el margen del panel | vigente |
| [SUPABASE-ADMIN-FIXES.md](SUPABASE-ADMIN-FIXES.md) | Borrar/cancelar pedidos y `restock_order` | vigente |
| [SUPABASE-SECURITY-SETUP.md](SUPABASE-SECURITY-SETUP.md) | RLS de `addresses` y `promo_codes` | vigente |
| [SUPABASE-FASE1-RPCS.md](SUPABASE-FASE1-RPCS.md) | `top_products`, `last_order_for_email` | vigente |
| [SUPABASE-FASE2-FAVORITES.md](SUPABASE-FASE2-FAVORITES.md) | Tabla `favorites` | vigente |
| [SUPABASE-FASE2-REVIEWS.md](SUPABASE-FASE2-REVIEWS.md) | Tabla `reviews` con moderación | vigente |
| **[SUPABASE-FASE3-CORRECCIONES.md](SUPABASE-FASE3-CORRECCIONES.md)** | **`place_order` vigente**: montos calculados en el servidor y códigos de primera compra que exigen cuenta | **vigente — es la versión buena** |
| [SUPABASE-FASE1-PLACE-ORDER.md](SUPABASE-FASE1-PLACE-ORDER.md) | Versión anterior de `place_order` | superado por la Fase 3 |

## Infraestructura

| Documento | Qué contiene |
|---|---|
| [SECURITY-HEADERS-SETUP.md](SECURITY-HEADERS-SETUP.md) | Cabeceras de seguridad de Cloudflare Pages. La configuración real vive en `public/_headers`. |

---

## Cosas que se olvidan fácil

**El catálogo publicado manda sobre el código.** Los productos que ven los visitantes salen de
`data.json` en Supabase Storage, no de `public/data.js`. Editar el archivo no cambia la tienda:
hay que publicar desde el panel (**⬆ Publicar**). Y si el panel te muestra datos viejos, es su
caché del navegador — **Ajustes → Restaurar datos por defecto** la limpia.

**Publicar catálogo pide redesplegar.** Las páginas para buscadores y el `sitemap.xml` se generan
durante el build leyendo el catálogo publicado. Después de publicar, vuelve a desplegar o Google
seguirá viendo los productos anteriores.

**El stock se controla por presentación, no por producto.** La tabla `stock` de Supabase lleva una
fila por producto + presentación, y es lo que impide la sobreventa. Un `qty` en `null` significa
*sin límite*: con eso, `place_order` ni descuenta ni bloquea. Después de editar existencias en el
panel, corre **Ajustes → 🔄 Sincronizar stock a Supabase**.

**Desplegar no es hacer push.** El proyecto de Cloudflare Pages es de tipo *Direct Upload* y no
está conectado a GitHub. Ver la sección de deploy del [README](../README.md).
