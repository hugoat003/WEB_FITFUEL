# FITFUEL — SQL para las mejoras del panel de admin

Corre este bloque en Supabase → SQL Editor → Run. Habilita que el admin **borre** pedidos y que al
**cancelar** un pedido se devuelva el stock a la tabla `stock`.

> Requiere el setup previo (`is_admin()`, tabla `stock`, `place_order`).

```sql
-- Permitir a admins borrar pedidos
drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin" on public.orders
  for delete using (public.is_admin());

-- Devolver stock al cancelar un pedido (suma unidades a cada presentación)
create or replace function public.restock_order(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare it jsonb; v_pid text; v_var text; v_qty int;
begin
  for it in select * from jsonb_array_elements(p_items) loop
    v_pid := it->>'id';
    v_var := coalesce(it->>'variant','');
    v_qty := coalesce((it->>'qty')::int, 0);
    update public.stock
       set qty = qty + v_qty, updated_at = now()
     where product_id = v_pid and variant = v_var and qty is not null;
  end loop;
end; $$;

grant execute on function public.restock_order(jsonb) to authenticated;
```

## Aviso al cliente por correo (EmailJS)
Ya quedó configurado: **reutiliza la misma plantilla** de confirmación de pedido que ya usa el sitio
(`service_yqntdgr` / `template_58by5up`). Al cambiar el estado a confirmado/enviado/entregado/
cancelado se envía un correo al cliente automáticamente. No necesitas crear nada nuevo.
