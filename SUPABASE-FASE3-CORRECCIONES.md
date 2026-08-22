# FITFUEL — Fase 3: correcciones de seguridad en `place_order`

> **Qué hay que hacer:** copiar el bloque SQL de abajo, pegarlo entero en
> **Supabase → SQL Editor** y pulsar **Run**. Es lo único de esta ronda que no se
> despliega solo con el código: hay que correrlo a mano una vez.

## Qué cambia respecto a [`SUPABASE-FASE1-PLACE-ORDER.md`](SUPABASE-FASE1-PLACE-ORDER.md)

**Los códigos de primera compra ahora exigen una cuenta.**

Antes, la comprobación de "¿ya compraste?" solo corría si el pedido llevaba `user_id`:

```sql
if coalesce(r_promo.first_purchase_only, false) and v_uid is not null then
```

Como quien compra sin iniciar sesión manda `user_id = null`, la condición era falsa y el
descuento se aplicaba **siempre**. En la práctica `BIENVENIDO10` era un 10% permanente para
cualquiera que comprase como invitado, en todos sus pedidos.

Ahora, si el código es de primera compra y no hay sesión, la función **rechaza el pedido**
con `CODIGO_REQUIERE_CUENTA`. La tienda ya lo comprueba antes de llegar aquí y le pide al
cliente que inicie sesión; esto es la segunda barrera, la que no se puede saltar desde el
navegador.

Rechazar en vez de aplicar 0% es deliberado: si el servidor quitara el descuento en
silencio, el cliente habría confirmado viendo un total con descuento y se le cobraría otro.

## ⚠️ Importante al correrlo

**Copia y ejecuta TODO el bloque de una sola vez** — desde `create or replace` hasta el
`grant ...;` final. Si cortas antes del cierre `$fn$;`, Postgres da el error
*"unterminated dollar-quoted string"*. Pega todo en el SQL Editor, **no dejes nada
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
      if coalesce(r_promo.first_purchase_only, false) then
        -- CAMBIO FASE 3: un codigo de primera compra exige cuenta. Sin user_id no hay
        -- forma de contar compras previas, asi que antes era un descuento infinito
        -- para cualquiera que comprase como invitado.
        if v_uid is null then
          raise exception 'CODIGO_REQUIERE_CUENTA';
        end if;
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

## Cómo comprobar que quedó bien

1. **Sin iniciar sesión**, agrega algo barato al carrito y ve al checkout. Escribe
   `BIENVENIDO10` y pulsa Aplicar → debe salir *"Este código es solo para la primera
   compra. Crea tu cuenta gratis o inicia sesión para usarlo."*
2. **Con sesión y sin pedidos previos**, el mismo código debe aplicar el 10%.
3. **Con sesión y con un pedido previo**, debe salir *"Este código es solo para tu primera
   compra"*.
4. Tras un pedido de prueba, comprueba los montos en **SQL Editor**:
   ```sql
   select id, subtotal, shipping, discount_code, discount_pct, total, created_at
   from public.orders order by created_at desc limit 3;
   ```
   `total` debe cuadrar con `subtotal + shipping - (subtotal * discount_pct / 100)`.
5. Borra los pedidos de prueba desde el panel (**Pedidos → ✕**) para no ensuciar métricas.

## Sigue pendiente (no es de esta ronda)

Los **precios de línea** todavía llegan desde el navegador; el servidor recalcula el
subtotal sumándolos, pero no los verifica contra el catálogo. Con pago contra entrega y
transferencia el riesgo está acotado porque tú revisas cada pedido antes de cobrarlo.
**Antes de activar pago con tarjeta**, `place_order` tiene que recalcular el precio de cada
variante leyéndolo de la base de datos.
