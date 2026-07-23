# FITFUEL — Setup de seguridad P0 (RLS faltante + cerrar `orders`)

Cierra dos huecos detectados en la auditoría:
1. Las tablas **`addresses`** y **`promo_codes`** se usan desde el navegador con la anon key
   **pública**, pero no tenían política RLS documentada → posible lectura de datos personales
   (direcciones, teléfonos) de todos los clientes, y enumeración de todos los códigos.
2. La política `orders_insert_any` (`with check (true)`) permitía a **cualquiera** insertar
   pedidos arbitrarios con la anon key (spam + vector de payloads). El checkout real ya usa el
   RPC `place_order` (SECURITY DEFINER), así que la inserción directa sobra.

> Requiere el setup previo (`is_admin()`, tabla `orders`, `place_order` — ver los otros
> `SUPABASE-*.md`). Corre TODO este bloque en Supabase → **SQL Editor** → Run.

---

## 0. Antes de nada: verifica el estado actual
En Supabase → **Database → Tables**, abre `addresses` y `promo_codes` y mira si dicen
**"RLS enabled"**. Si alguna está **sin RLS**, cualquiera con la anon key ya puede leerla:
el SQL de abajo lo corrige. (No pasa nada por correrlo aunque ya tuvieran RLS: usa
`drop policy if exists`.)

## 1. SQL — pégalo y ejecútalo

```sql
-- ── addresses: cada quien solo ve/escribe SU dirección ──────────────────────
alter table public.addresses enable row level security;
drop policy if exists "addr_own" on public.addresses;
create policy "addr_own" on public.addresses
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── promo_codes: lectura pública solo de códigos ACTIVOS (nada de escritura) ─
alter table public.promo_codes enable row level security;
drop policy if exists "promo_read_active" on public.promo_codes;
create policy "promo_read_active" on public.promo_codes
  for select
  using (active = true);
-- (La gestión de códigos se hace desde el SQL Editor o, más adelante, desde el panel.)

-- ── orders: quitar la inserción directa anónima ─────────────────────────────
-- El checkout usa el RPC place_order() (SECURITY DEFINER), que NO depende de esta política.
-- Al quitarla, nadie puede insertar filas arbitrarias en orders vía la API REST.
drop policy if exists "orders_insert_any" on public.orders;
```

## 2. Qué cambia en el código (ya aplicado en el repo)
- **`pages.jsx`** (checkout): se eliminó el *fallback* `sb.from("orders").insert(...)`. Ahora el
  pedido se crea **solo** por `place_order()`. Si el RPC fallara, el pedido no se crea (correcto).
- **`public/admin.html`**: los pedidos se normalizan (tipos numéricos) al cargarlos y `qty` se
  escapa al render → cierra el XSS almacenado hacia el panel.

## 3. Probar
- **Sin sesión**, con la anon key:
  `GET https://<PROJECT>.supabase.co/rest/v1/addresses?select=*` → debe devolver **0 filas**.
  `GET .../rest/v1/promo_codes?select=*` → solo códigos `active = true`.
  `POST .../rest/v1/orders` (insert directo) → debe **fallar** (401/permission denied).
- **Checkout normal** en la tienda → sigue funcionando (pasa por `place_order`).
- **Panel admin** → un pedido con `qty` malicioso se muestra como `0×` y no ejecuta nada.

> Nota: en la Fase 1 se endurece `place_order` para recalcular precios/descuentos en el servidor
> (hoy confía en el total del cliente). Mientras tanto, el pago es manual y el admin revisa cada
> pedido antes de despachar.
