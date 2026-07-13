# FITFUEL — Inventario en Supabase (Fase 1)

Hace que el stock sea **real y compartido**: se descuenta en el servidor al confirmar el pedido
(atómico, sin sobreventa) y el sitio/admin leen la misma fuente.

> Requiere haber corrido antes el setup de admin (necesita la función `public.is_admin()`).
> Corre este SQL en Supabase → SQL Editor → Run.

## 1. SQL — tabla de stock + función de pedido

```sql
-- ── Tabla de stock (una fila por presentación) ──────────────────────────────
create table if not exists public.stock (
  product_id text not null,
  variant    text not null default '',   -- etiqueta de la presentación ('' si no aplica)
  qty        int,                          -- null = ilimitado
  updated_at timestamptz not null default now(),
  primary key (product_id, variant)
);

alter table public.stock enable row level security;
drop policy if exists "stock_read" on public.stock;
create policy "stock_read" on public.stock for select using (true);   -- lectura pública
drop policy if exists "stock_write_admin" on public.stock;
create policy "stock_write_admin" on public.stock for all
  using (public.is_admin()) with check (public.is_admin());           -- escritura solo admin

-- ── Confirmar pedido: valida y descuenta stock + inserta el pedido (atómico) ─
create or replace function public.place_order(p_order jsonb, p_items jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  it jsonb;
  v_pid text; v_var text; v_qty int;
  v_id  text := p_order->>'id';
begin
  -- 1) Descontar stock de cada ítem rastreado (si falta, aborta todo)
  for it in select * from jsonb_array_elements(p_items) loop
    v_pid := it->>'id';
    v_var := coalesce(it->>'variant','');
    v_qty := coalesce((it->>'qty')::int, 0);
    update public.stock
       set qty = qty - v_qty, updated_at = now()
     where product_id = v_pid and variant = v_var
       and qty is not null and qty >= v_qty;
    if not found then
      if exists (select 1 from public.stock
                  where product_id = v_pid and variant = v_var and qty is not null) then
        raise exception 'SIN_STOCK:%', coalesce(it->>'name', v_pid);
      end if;  -- sin fila o qty null = ilimitado → se permite
    end if;
  end loop;

  -- 2) Insertar el pedido
  insert into public.orders (id, user_id, items, subtotal, shipping, total,
      discount_code, discount_pct, nombre, telefono, correo, direccion,
      municipio, departamento, referencia, pago, status)
  values (
    v_id,
    nullif(p_order->>'user_id','')::uuid,
    coalesce(p_order->'items','[]'::jsonb),
    (p_order->>'subtotal')::numeric,
    (p_order->>'shipping')::numeric,
    (p_order->>'total')::numeric,
    p_order->>'discount_code',
    coalesce((p_order->>'discount_pct')::numeric, 0),
    p_order->>'nombre', p_order->>'telefono', p_order->>'correo',
    p_order->>'direccion', p_order->>'municipio', p_order->>'departamento',
    p_order->>'referencia', p_order->>'pago',
    coalesce(p_order->>'status','pendiente')
  );

  return v_id;
end; $$;

grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
```

## 2. Cargar el stock inicial
No hace falta SQL: en el **admin → Inventario** habrá un botón **"Sincronizar stock a Supabase"**
que sube las cantidades actuales de cada presentación a la tabla `stock`. (Se agrega en el código.)

## 3. Cómo queda
- **Checkout**: el sitio llama a `place_order()` → descuenta stock y crea el pedido en una sola
  operación. Si no hay stock, no se cobra ni se crea el pedido y el cliente ve el aviso.
- **Mientras la tabla `stock` esté vacía**, todo se trata como *ilimitado* (no rompe nada); empieza
  a controlar en cuanto sincronizas.
- Si aún no corriste este SQL, el checkout usa el método anterior (fallback) — no se rompe.
