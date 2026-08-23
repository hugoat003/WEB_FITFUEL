# FITFUEL — SQL para el costo de productos (rentabilidad del dashboard)

Crea la tabla **privada** `costs`, donde el admin guarda el costo de cada presentación
(sabor + tamaño). Con eso el dashboard calcula **COGS, ganancia bruta y margen %**.

> **Privacidad:** esta tabla es solo para admins. **No** tiene política de lectura pública, así que
> los clientes nunca ven los costos. El costo tampoco se publica en `data.json` ni pasa por el
> checkout.
>
> Requiere el setup previo (`is_admin()` — ver `SUPABASE-ADMIN-SETUP.md`).

Corre este bloque en Supabase → **SQL Editor** → Run:

```sql
create table if not exists public.costs (
  product_id text not null,
  variant    text not null default '',
  cost       numeric not null default 0,
  updated_at timestamptz default now(),
  primary key (product_id, variant)
);

alter table public.costs enable row level security;

-- Solo admins leen y escriben (sin política pública => invisible para clientes)
drop policy if exists "costs_all_admin" on public.costs;
create policy "costs_all_admin" on public.costs
  for all
  using (public.is_admin())
  with check (public.is_admin());
```

## Cómo se usa
1. En el admin, edita un producto y llena el campo **Costo (Q)** de cada presentación.
2. Al **Guardar**, los costos se suben a esta tabla (upsert por `product_id + variant`).
3. En el **Dashboard**, las tarjetas muestran Venta neta, Ganancia bruta, Margen % y Envío cobrado
   por separado. La ganancia usa el **costo actual** de cada presentación.

> Nota: la ganancia se calcula con el costo actual aplicado a pedidos históricos (no se guarda el
> "costo al momento de la venta"). Para una tienda de este tamaño es suficiente.
