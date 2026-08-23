# FITFUEL — Fase 1: RPCs de lectura (fuente de verdad única)

Dos funciones que dejan que la tienda use **datos reales y compartidos** desde Supabase en vez de
`localStorage` (per-dispositivo), **sin exponer** la tabla `orders` (que sigue protegida por RLS):

1. `top_products` — "Más vendidos" del home, a partir de ventas reales (solo agrega unidades por
   producto; **no** devuelve nombres, correos ni nada personal).
2. `last_order_for_email` — verificación de compra para dejar reseña (devuelve solo el id del último
   pedido de ese correo, o `null`).

> Requiere el setup previo (tabla `orders`). Corre este bloque en Supabase → **SQL Editor** → Run.

```sql
-- ── "Más vendidos": unidades vendidas por producto (público, sin PII) ───────
create or replace function public.top_products(p_limit int default 12)
returns table (product_id text, units bigint)
language sql security definer stable set search_path = public as $$
  select it->>'id' as product_id,
         sum(coalesce((it->>'qty')::numeric, 0))::bigint as units
  from public.orders o
       cross join lateral jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) it
  where coalesce(o.status,'') <> 'cancelado'
  group by it->>'id'
  order by units desc
  limit greatest(1, least(p_limit, 50));
$$;
grant execute on function public.top_products(int) to anon, authenticated;

-- ── Verificación de compra para reseñas: id del último pedido de un correo ──
create or replace function public.last_order_for_email(p_email text)
returns text
language sql security definer stable set search_path = public as $$
  select id from public.orders
  where lower(correo) = lower(trim(p_email))
    and coalesce(status,'') <> 'cancelado'
  order by created_at desc
  limit 1;
$$;
grant execute on function public.last_order_for_email(text) to anon, authenticated;
```

## Qué cambia en el código (ya aplicado en el repo)
- **`pages.jsx` · Home**: "Más vendidos" ahora llama a `top_products` (con *fallback* a reseñas si el
  RPC no existe todavía — no se rompe nada antes de correr el SQL).
- **`pages.jsx` · Reseñas**: la verificación llama a `last_order_for_email` (antes leía `localStorage`,
  que era per-dispositivo y falsificable). Con rate-limit para evitar sondear correos.

## Probar
- **Home**: tras registrar algunas ventas, los "Más vendidos" reflejan las unidades reales (igual en
  cualquier dispositivo/navegador). Antes de correr el SQL, se ordenan por reseñas (fallback).
- **Reseñas** (`#/resenas`): ingresa un correo **con** pedido → pasa al formulario; uno **sin** pedido
  → "No encontramos ningún pedido con ese correo".
