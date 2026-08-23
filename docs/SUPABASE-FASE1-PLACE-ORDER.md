# FITFUEL — Fase 1.1: `place_order` con montos autoritativos (servidor)

> ⚠️ **SUPERADO POR [`SUPABASE-FASE3-CORRECCIONES.md`](SUPABASE-FASE3-CORRECCIONES.md).**
> La versión de esta página deja que quien compra como invitado reutilice los códigos de
> primera compra. Corre el bloque de la Fase 3, que incluye todo lo de aquí más ese arreglo.
> Este documento se conserva para entender por qué se hizo cada cosa.

Reemplaza la función `place_order` (la de `SUPABASE-INVENTORY-SETUP.md`) por esta versión, que
**recalcula el dinero en el servidor** y deja de confiar en los totales del navegador:

- **Subtotal** = suma de las líneas del pedido (el `subtotal` declarado por el cliente se ignora).
- **Descuento** = se valida el código contra `promo_codes` (que esté `active`; si es de primera
  compra, que el usuario no tenga pedidos previos). El `discount_pct` que manda el cliente se ignora.
- **Total** = subtotal + envío − descuento, recalculado y sin negativos. Se **guarda lo que calcula
  el servidor**, no lo que dice el navegador.

> **Alcance (enfoque proporcionado):** los **precios de línea** todavía se toman del cliente. La
> recomputación total precio-por-variante se hará junto con la pasarela de tarjeta. Aun así, ya no se
> puede: falsear el total, inventar un descuento, ni reusar un código de primera compra.
>
> No hace falta cambiar el código de la tienda ni del admin: el checkout ya manda `items`,
> `discount_code`, `user_id` y `shipping`. El servidor hace el resto.

## ⚠️ Importante al correrlo
**Copia y ejecuta TODO el bloque de una sola vez** — desde `create or replace` hasta el `grant ...;`
final. No selecciones solo una parte: si cortas antes del cierre `$fn$;`, Postgres da el error
*"unterminated dollar-quoted string"*. Lo más seguro: pega todo en el SQL Editor, **no dejes nada
seleccionado** y pulsa **Run** (así corre el buffer completo).

```sql
create or replace function public.place_order(p_order jsonb, p_items jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $fn$
declare
  it jsonb; li jsonb;
  v_pid text; v_var text; v_qty int;
  v_id  text := p_order->>'id';
  v_uid uuid := nullif(p_order->>'user_id','')::uuid;
  v_subtotal numeric := 0;
  v_shipping numeric := greatest(0, coalesce((p_order->>'shipping')::numeric, 0));
  v_code text := nullif(trim(p_order->>'discount_code'), '');
  v_pct numeric := 0;
  v_discount numeric := 0;
  v_total numeric := 0;
  r_promo public.promo_codes%rowtype;
  v_prior int := 0;
begin
  -- 1) Descontar stock (atomico; aborta todo si falta)
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
      end if;
    end if;
  end loop;

  -- 2) Subtotal = suma de las lineas (no se confia en el subtotal declarado)
  for li in select * from jsonb_array_elements(coalesce(p_order->'items','[]'::jsonb)) loop
    v_subtotal := v_subtotal
      + greatest(0, coalesce((li->>'price')::numeric, 0))
      * greatest(0, coalesce((li->>'qty')::numeric, 0));
  end loop;
  v_subtotal := round(v_subtotal, 2);

  -- 3) Descuento validado en el servidor (ignora el discount_pct del cliente)
  if v_code is not null then
    select * into r_promo from public.promo_codes
     where upper(code) = upper(v_code) and active = true;
    if found then
      if coalesce(r_promo.first_purchase_only, false) and v_uid is not null then
        select count(*) into v_prior from public.orders where user_id = v_uid;
        v_pct := case when v_prior > 0 then 0 else coalesce(r_promo.discount_pct, 0) end;
      else
        v_pct := coalesce(r_promo.discount_pct, 0);
      end if;
    else
      v_code := null; v_pct := 0;
    end if;
  end if;
  v_pct := least(greatest(v_pct, 0), 100);
  v_discount := round(v_subtotal * v_pct / 100.0, 2);

  -- 4) Total autoritativo del servidor
  v_total := round(v_subtotal + v_shipping - v_discount, 2);
  if v_total < 0 then v_total := 0; end if;

  -- 5) Insertar con los montos recalculados
  insert into public.orders (id, user_id, items, subtotal, shipping, total,
      discount_code, discount_pct, nombre, telefono, correo, direccion,
      municipio, departamento, referencia, pago, status)
  values (
    v_id, v_uid,
    coalesce(p_order->'items','[]'::jsonb),
    v_subtotal, v_shipping, v_total,
    v_code, v_pct,
    p_order->>'nombre', p_order->>'telefono', p_order->>'correo',
    p_order->>'direccion', p_order->>'municipio', p_order->>'departamento',
    p_order->>'referencia', p_order->>'pago',
    coalesce(p_order->>'status','pendiente')
  );

  return v_id;
end;
$fn$;

grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
```

## Probar (seguro, con un pedido real de prueba)
1. En la tienda, agrega algo barato al carrito y ve al checkout; aplica `BIENVENIDO10` y confirma.
2. Verifica en **Supabase → SQL Editor**:
   ```sql
   select id, subtotal, shipping, discount_code, discount_pct, total, created_at
   from public.orders order by created_at desc limit 3;
   ```
   El `total` debe cuadrar con `subtotal + shipping - (subtotal*discount_pct/100)`.
3. Borra el pedido de prueba desde el panel (**Pedidos → ✕**) para no ensuciar tus métricas.
