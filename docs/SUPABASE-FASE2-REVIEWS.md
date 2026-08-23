# FITFUEL — Fase 2.3: reseñas reales (con moderación)

Reemplaza el flujo de reseñas por WhatsApp/correo (manual, sin registro) por un sistema real:
- El cliente con **compra verificada** envía su reseña → se guarda **pendiente** (`published = false`).
- El **admin** la revisa en el panel (pestaña Testimonios) y la **publica**.
- La tienda muestra solo las **publicadas** (home y `#/resenas`).

RLS: lectura pública solo de publicadas; cualquiera puede *enviar* (pero no autopublicar); solo el
admin publica/edita/borra.

> Requiere el setup previo (`is_admin()`). Corre TODO el bloque en Supabase → **SQL Editor** → Run.

```sql
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  lugar      text,
  rating     int  not null check (rating between 1 and 5),
  texto      text not null,
  order_id   text,
  published  boolean not null default false,
  hue        int  not null default 150,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- Lectura pública SOLO de reseñas publicadas
drop policy if exists "reviews_read_published" on public.reviews;
create policy "reviews_read_published" on public.reviews
  for select using (published = true);

-- Cualquiera puede ENVIAR una reseña, pero NO puede autopublicarla
drop policy if exists "reviews_insert_pending" on public.reviews;
create policy "reviews_insert_pending" on public.reviews
  for insert with check (published = false);

-- Admin: ve todas, publica/edita y borra
drop policy if exists "reviews_admin_all" on public.reviews;
create policy "reviews_admin_all" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());
```

## Qué cambia en el código (ya aplicado)
- **Tienda** (`pages.jsx`): al enviar una reseña (tras verificar compra) se **inserta en `reviews`**
  como pendiente, en vez de abrir WhatsApp/correo.
- **Tienda** (`pages.jsx`, `components-extra.jsx`): la página de reseñas y la home cargan las reseñas
  **publicadas** desde Supabase (además de los testimonios curados existentes).
- **Panel** (`admin.html` → pestaña **Testimonios**): tabla nueva "Reseñas de clientes" con
  publicar/ocultar y eliminar.

## Probar
1. Coloca un pedido de prueba (o usa un correo que ya tenga pedido). En `#/resenas`, verifica el
   correo, escribe una reseña y envíala → "gracias, la revisamos".
2. En el panel → **Testimonios** → sección **Reseñas de clientes**: aparece **Pendiente**. Márcala
   como **Publicada**.
3. Recarga la tienda → la reseña ya aparece en `#/resenas` y en la home.
4. Anónimo con la anon key: `GET /rest/v1/reviews?select=*` → solo devuelve las publicadas.
