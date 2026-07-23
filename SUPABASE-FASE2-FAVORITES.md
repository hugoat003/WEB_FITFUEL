# FITFUEL — Fase 2.4: favoritos sincronizados a la cuenta

Hace que los favoritos (♥) **sigan al usuario entre dispositivos** en vez de vivir solo en el
navegador. RLS por dueño: cada quien solo ve/edita los suyos.

Corre este bloque en Supabase → **SQL Editor** → Run:

```sql
create table if not exists public.favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.favorites enable row level security;
drop policy if exists "fav_own" on public.favorites;
create policy "fav_own" on public.favorites
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

## Qué cambia en el código (ya aplicado)
- **`app.jsx`**: al iniciar sesión se cargan los favoritos de la cuenta y se **fusionan** con los que
  el usuario marcó como invitado (se suben a su cuenta). Al marcar/desmarcar, se escribe en Supabase
  (si hay sesión). `localStorage` (`ff_favs`) queda solo como caché para invitados.

## Probar
1. Sin sesión, marca 2–3 productos como favoritos (♥).
2. Inicia sesión → esos favoritos deben quedar guardados en tu cuenta.
3. Abre el sitio en **otro navegador/dispositivo**, inicia sesión con la misma cuenta → los mismos
   favoritos aparecen. (Antes se perdían: eran per-dispositivo.)
4. Con la anon key y sin sesión, `GET /rest/v1/favorites?select=*` debe venir `[]` (RLS).
