# FITFUEL — Setup de seguridad del admin (Supabase)

El panel `public/admin.html` ahora exige **iniciar sesión con Supabase Auth** y ser
**administrador** (`profiles.is_admin = true`). Además:
- La lectura de **pedidos y perfiles** queda restringida a admins (RLS).
- La **publicación del catálogo** (bucket `catalog` en Storage) solo la puede hacer un admin.

> ⚠️ Ejecuta TODO este SQL **antes** de usar el nuevo admin. Hasta que exista la columna
> `is_admin` y tu perfil esté marcado como admin, nadie podrá entrar al panel.

---

## 1. SQL — pégalo en Supabase → SQL Editor → Run

```sql
-- ── profiles: columna is_admin ──────────────────────────────────────────────
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- ── Crear perfil automáticamente al registrarse ─────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nombre, telefono)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
          new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Backfill: crear perfiles faltantes de usuarios ya registrados ───────────
insert into public.profiles (id, nombre, telefono, created_at)
select u.id,
       coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
       u.raw_user_meta_data->>'phone',
       u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ── Helper is_admin() (security definer: evita recursión de RLS) ────────────
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ── RLS profiles ────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (id = auth.uid());
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- ── RLS orders ──────────────────────────────────────────────────────────────
alter table public.orders enable row level security;
drop policy if exists "orders_insert_any" on public.orders;
create policy "orders_insert_any" on public.orders
  for insert with check (true);                 -- checkout (invitado o logueado)
drop policy if exists "orders_select_admin" on public.orders;
create policy "orders_select_admin" on public.orders
  for select using (public.is_admin());          -- solo admin lee pedidos
drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update using (public.is_admin());

-- ── Storage: bucket `catalog` (lectura pública, escritura solo admin) ───────
drop policy if exists "catalog anon write"  on storage.objects;
drop policy if exists "catalog anon update" on storage.objects;
drop policy if exists "catalog_read"        on storage.objects;
create policy "catalog_read" on storage.objects
  for select using (bucket_id = 'catalog');
drop policy if exists "catalog_write_admin" on storage.objects;
create policy "catalog_write_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'catalog' and public.is_admin());
drop policy if exists "catalog_update_admin" on storage.objects;
create policy "catalog_update_admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'catalog' and public.is_admin())
  with check (bucket_id = 'catalog' and public.is_admin());
```

> La tabla `profiles` de este proyecto usa las columnas `id`, `nombre`, `telefono`,
> `created_at`, `is_admin` (no tiene `email` ni `full_name`). Si en tu base cambian,
> ajusta el trigger y el backfill. El nombre se toma de `full_name`/`name` del metadata
> del usuario (lo que Google devuelve al iniciar sesión).

## 2. Crear el usuario admin (si no existe)
- Opción A: en el sitio, **Crear cuenta** con tu correo y confirma el email.
- Opción B: Supabase → **Authentication → Users → Add user** (marca "Auto confirm").

## 3. Marcarte como admin
```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'hugoaledelvallec@gmail.com');  -- cambia el correo admin
```
Para varios admins, repite el `update` con cada correo (todos deben existir en Auth).

## 4. Bucket de Storage
Si aún no lo creaste: Storage → **New bucket** → nombre `catalog` → **Public bucket** ON.
(La escritura ya queda restringida a admins por las políticas de arriba.)

## 5. Probar
- Abrir `admin.html` sin sesión → aparece el login.
- Login con un usuario **no admin** → "Esta cuenta no tiene acceso de administrador".
- Login con tu correo admin → entra; en Dashboard ya aparecen **usuarios** y **pedidos**.
- Botón **⬆ Publicar** → sube imágenes y `data.json` (funciona por ser admin).
- En Ajustes → **Cerrar sesión**.
