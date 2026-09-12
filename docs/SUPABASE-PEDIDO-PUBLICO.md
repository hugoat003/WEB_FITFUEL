# FITFUEL — Seguimiento público del pedido (y dos fallos que arregla de paso)

Hoy **ningún cliente puede ver el estado de su pedido**. Ni desde el correo, ni desde su
cuenta. La única política de lectura sobre `orders` es `orders_select_admin`, así que:

1. **`/cuenta` enseña "Aún no tienes pedidos" a todo el mundo, siempre.** La consulta no
   falla: RLS la filtra a cero filas en silencio.
2. **Un cliente que repite puede confirmar un total y que se le cobre otro.** El checkout
   comprueba si `BIENVENIDO10` sigue disponible contando pedidos previos, consulta que RLS
   deja siempre en cero, así que el código *parece* válido. Pero `place_order` sí cuenta bien
   y aplica 0%. El cliente ve Q900, confirma, y en la base queda Q1,000.

Este bloque añade lo que falta. **Es todo aditivo**: tabla nueva, funciones nuevas, columna
nueva con valor por defecto y una política nueva. Nada de lo que ya está desplegado lo usa,
así que se puede correr en cualquier momento sin romper la tienda.

> Supabase → **SQL Editor**. Son cinco bloques. **Cópialos enteros, uno por uno y en
> orden**, y dale a Run después de cada uno. El bloque 4 necesita que el 3 ya esté corrido, y el 5 corrige al 4.
>
> Copia siempre de la primera a la última línea del recuadro. Si te dejas fuera la línea que
> cierra, Postgres avisa con `syntax error at or near ";"`: no es que el SQL esté mal, es que
> le falta el paréntesis o el punto y coma del final.

---

## Los bloques

### Bloque 1 de 5 — El cliente logueado ve SUS pedidos

```sql
-- Las políticas permisivas se suman con OR, así que esto no cambia nada de lo
-- que ve el administrador.
--
-- A propósito NO se amplía a `lower(correo) = auth.jwt()->>'email'` para que
-- aparezcan también los pedidos hechos como invitado. Si algún día se relajara
-- la verificación de correo al registrarse, registrarse con el correo de otra
-- persona entregaría su historial completo, con dirección y teléfono.
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (user_id is not null and user_id = auth.uid());
```

### Bloque 2 de 5 — Cuándo cambió de estado

```sql
-- Una página de seguimiento que no puede decir CUÁNDO se envió es media página.
--
-- Se sella con un disparador y no desde el panel a propósito: si el panel
-- mandara esta columna en su UPDATE y este SQL todavía no estuviera corrido,
-- PostgREST rechazaría la petición y cambiar de estado dejaría de funcionar.
-- Así el panel ni se entera de que esta columna existe.
alter table public.orders add column if not exists status_at timestamptz;
alter table public.orders alter column status_at set default now();
update public.orders set status_at = created_at where status_at is null;

create or replace function public.orders_stamp_status()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status then new.status_at := now(); end if;
  return new;
end; $$;

drop trigger if exists trg_orders_stamp_status on public.orders;
create trigger trg_orders_stamp_status
  before update on public.orders
  for each row execute function public.orders_stamp_status();
```

### Bloque 3 de 5 — Cubo de intentos, en el servidor

```sql
-- El limitador que ya usa la tienda vive en localStorage: frena al cliente que
-- insiste, no a un script. Buscar un pedido por id+correo SÍ es adivinable a
-- fuerza bruta, porque el id solo lleva 3 caracteres al azar sobre una marca de
-- tiempo predecible. El freno tiene que estar aquí.
create table if not exists public.lookup_throttle (
  k            text primary key,          -- 'ord:m:<md5 correo>' / 'ord:i:<md5 IP>'
  hits         int         not null default 0,
  window_start timestamptz not null default now()
);

-- RLS activo y CERO políticas: por la API REST no la lee ni la escribe nadie.
-- Solo la tocan las funciones SECURITY DEFINER de abajo.
alter table public.lookup_throttle enable row level security;
revoke all on table public.lookup_throttle from anon, authenticated;

create or replace function public.throttle_hit(p_key text, p_max int, p_window interval)
returns boolean
language plpgsql security definer set search_path = public as $fn$
declare v_hits int;
begin
  -- Una de cada cien llamadas barre lo viejo: la tabla no crece sin fin y no se
  -- paga un DELETE en cada consulta.
  if random() < 0.01 then
    delete from public.lookup_throttle where window_start < now() - interval '1 day';
  end if;

  insert into public.lookup_throttle (k, hits, window_start)
  values (p_key, 1, now())
  on conflict (k) do update set
    hits = case when lookup_throttle.window_start < now() - p_window
                then 1 else lookup_throttle.hits + 1 end,
    window_start = case when lookup_throttle.window_start < now() - p_window
                then now() else lookup_throttle.window_start end
  returning hits into v_hits;

  return v_hits <= p_max;
end;
$fn$;

-- Supabase concede EXECUTE a anon/authenticated por defecto en el esquema
-- public. Esta función es interna: si se pudiera llamar desde el navegador,
-- cualquiera llenaría el cubo del correo de otro y lo dejaría fuera.
revoke execute on function public.throttle_hit(text, int, interval) from public, anon, authenticated;
```

### Bloque 4 de 5 — Consulta pública de UN pedido: id + correo

```sql
-- NO devuelve dirección, teléfono, correo ni user_id. Quien acierta el par
-- id+correo es casi seguro el cliente, pero "casi" no basta para entregarle a
-- alguien una dirección de entrega. El nombre sale recortado al primero, que es
-- lo único que hace falta para saludar.
--
-- VOLATILE a propósito (no `stable`): escribe en lookup_throttle, y plpgsql
-- ejecuta las funciones STABLE en modo de solo lectura.
create or replace function public.order_public_status(p_id text, p_email text)
returns table (
  id            text,
  status        text,
  status_at     timestamptz,
  created_at    timestamptz,
  nombre        text,
  items         jsonb,
  subtotal      numeric,
  shipping      numeric,
  discount_code text,
  discount_pct  numeric,
  total         numeric,
  municipio     text,
  departamento  text,
  pago          text
)
language plpgsql security definer set search_path = public as $fn$
declare
  v_id    text := upper(trim(coalesce(p_id, '')));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_hdrs  json := nullif(current_setting('request.headers', true), '')::json;
  v_ip    text := coalesce(
    v_hdrs->>'cf-connecting-ip',
    v_hdrs->>'x-real-ip',
    nullif(split_part(coalesce(v_hdrs->>'x-forwarded-for', ''), ',', 1), ''),
    '');
begin
  -- El formato se descarta ANTES de tocar el cubo: el ruido no debe llenar la tabla.
  if v_id !~ '^FF-[A-Z0-9]{4,16}-[A-Z0-9]{2,6}$' then return; end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then return; end if;

  -- Dos cubos: por correo (frena adivinar el id de UN cliente) y por IP (frena
  -- el barrido de muchos). Basta con que se pase uno para cortar.
  if not public.throttle_hit('ord:m:' || md5(v_email), 12, interval '15 minutes') then
    raise exception 'DEMASIADOS_INTENTOS';
  end if;
  if v_ip <> '' and not public.throttle_hit('ord:i:' || md5(v_ip), 40, interval '15 minutes') then
    raise exception 'DEMASIADOS_INTENTOS';
  end if;

  return query
    select o.id, coalesce(o.status, 'pendiente'), o.status_at, o.created_at,
           split_part(coalesce(o.nombre, ''), ' ', 1),
           coalesce(o.items, '[]'::jsonb), o.subtotal, o.shipping,
           o.discount_code, o.discount_pct, o.total,
           o.municipio, o.departamento, o.pago
      from public.orders o
     where o.id = v_id and lower(o.correo) = v_email;

  -- Al acertar se vacía el cubo del correo, para que quien mira su pedido cinco
  -- veces al día no acabe bloqueado por hacerlo.
  if found then
    delete from public.lookup_throttle where k = 'ord:m:' || md5(v_email);
  end if;
end;
$fn$;

grant execute on function public.order_public_status(text, text) to anon, authenticated;
```

### Bloque 5 de 5 — Corrección de tipos y enlace de un solo clic

**Corre este bloque aunque ya hayas corrido los cuatro anteriores.** El bloque 4 declaraba
`discount_pct numeric` cuando en la tabla es `integer`, y PostgreSQL no ensancha el tipo por
su cuenta dentro de un `returns table`: la función se creaba bien pero fallaba al devolver
una fila, con `Returned type integer does not match expected type numeric in column 10`.

Aquí va corregida, con **conversión explícita en cada columna**. Así deja de importar cómo
esté declarada cada una en la tabla, que se creó desde el panel de Supabase y no tiene su
definición escrita en ningún sitio.

De paso añade el `lookup_token`, que es lo que hace que el enlace del correo funcione de un
solo clic sin pedir nada.

> **Lo que eso implica, para que lo sepas:** el enlace pasa a ser la credencial. Quien
> reenvíe ese correo está entregando el acceso a su pedido. Por eso el pedido que se ve por
> token sigue **sin** dirección ni teléfono, igual que por correo.

```sql
-- Uno por pedido, 122 bits al azar. Las filas que ya existen reciben el suyo al
-- correr esto. `not null` para que ningun pedido futuro se quede sin el, venga
-- de place_order o de donde venga.
alter table public.orders add column if not exists lookup_token uuid;
update public.orders set lookup_token = gen_random_uuid() where lookup_token is null;
alter table public.orders alter column lookup_token set default gen_random_uuid();
alter table public.orders alter column lookup_token set not null;
create unique index if not exists orders_lookup_token_key on public.orders (lookup_token);


-- Consulta por id + correo, corregida. Cambia lo que devuelve, asi que hay que
-- tirarla antes: `create or replace` no puede cambiar el tipo de retorno.
drop function if exists public.order_public_status(text, text);

create or replace function public.order_public_status(p_id text, p_email text)
returns table (
  id            text,
  status        text,
  status_at     timestamptz,
  created_at    timestamptz,
  nombre        text,
  items         jsonb,
  subtotal      numeric,
  shipping      numeric,
  discount_code text,
  discount_pct  numeric,
  total         numeric,
  municipio     text,
  departamento  text,
  pago          text,
  lookup_token  uuid
)
language plpgsql security definer set search_path = public as $fn$
declare
  v_id    text := upper(trim(coalesce(p_id, '')));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_hdrs  json := nullif(current_setting('request.headers', true), '')::json;
  v_ip    text := coalesce(
    v_hdrs->>'cf-connecting-ip',
    v_hdrs->>'x-real-ip',
    nullif(split_part(coalesce(v_hdrs->>'x-forwarded-for', ''), ',', 1), ''),
    '');
begin
  -- El formato se descarta ANTES de tocar el cubo: el ruido no debe llenar la tabla.
  if v_id !~ '^FF-[A-Z0-9]{4,16}-[A-Z0-9]{2,6}$' then return; end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then return; end if;

  -- Dos cubos: por correo (frena adivinar el id de UN cliente) y por IP (frena
  -- el barrido de muchos). Basta con que se pase uno para cortar.
  if not public.throttle_hit('ord:m:' || md5(v_email), 12, interval '15 minutes') then
    raise exception 'DEMASIADOS_INTENTOS';
  end if;
  if v_ip <> '' and not public.throttle_hit('ord:i:' || md5(v_ip), 40, interval '15 minutes') then
    raise exception 'DEMASIADOS_INTENTOS';
  end if;

  -- Conversion explicita en TODAS las columnas. La tabla se creo desde el panel y
  -- no hay DDL escrita en ninguna parte, asi que no damos por supuesto ningun tipo.
  return query
    select o.id::text,
           coalesce(o.status, 'pendiente')::text,
           o.status_at::timestamptz,
           o.created_at::timestamptz,
           split_part(coalesce(o.nombre, ''), ' ', 1)::text,
           coalesce(o.items, '[]'::jsonb),
           o.subtotal::numeric, o.shipping::numeric,
           o.discount_code::text, o.discount_pct::numeric, o.total::numeric,
           o.municipio::text, o.departamento::text, o.pago::text,
           o.lookup_token
      from public.orders o
     where o.id = v_id and lower(o.correo) = v_email;

  -- Al acertar se vacia el cubo del correo, para que quien mira su pedido cinco
  -- veces al dia no acabe bloqueado por hacerlo.
  if found then
    delete from public.lookup_throttle where k = 'ord:m:' || md5(v_email);
  end if;
end;
$fn$;

grant execute on function public.order_public_status(text, text) to anon, authenticated;


-- Consulta por token: el enlace de un solo clic. Sin cubo de intentos a
-- proposito: adivinar un UUID v4 son 122 bits, y un limite aqui solo serviria
-- para que alguien pudiera bloquear a un cliente de verdad. Devuelve lo mismo
-- que la otra, y tampoco entrega direccion ni telefono: el correo se puede
-- reenviar, y quien lo reciba no es necesariamente el cliente.
create or replace function public.order_status_by_token(p_token uuid)
returns table (
  id            text,
  status        text,
  status_at     timestamptz,
  created_at    timestamptz,
  nombre        text,
  items         jsonb,
  subtotal      numeric,
  shipping      numeric,
  discount_code text,
  discount_pct  numeric,
  total         numeric,
  municipio     text,
  departamento  text,
  pago          text
)
language sql security definer stable set search_path = public as $fn$
  select o.id::text,
         coalesce(o.status, 'pendiente')::text,
         o.status_at::timestamptz,
         o.created_at::timestamptz,
         split_part(coalesce(o.nombre, ''), ' ', 1)::text,
         coalesce(o.items, '[]'::jsonb),
         o.subtotal::numeric, o.shipping::numeric,
         o.discount_code::text, o.discount_pct::numeric, o.total::numeric,
         o.municipio::text, o.departamento::text, o.pago::text
    from public.orders o
   where p_token is not null and o.lookup_token = p_token;
$fn$;

grant execute on function public.order_status_by_token(uuid) to anon, authenticated;
```


---

## Decisiones que conviene entender

**Por qué hace falta el correo y no basta el id.** El id se genera como una marca de tiempo
en base36 más **3 caracteres al azar**: unas 46.000 combinaciones sobre una mitad predecible.
Eso no es un secreto. El correo es lo que convierte un identificador débil en una consulta
segura.

**Correo equivocado, id equivocado y pedido inexistente devuelven cero filas por el mismo
camino.** Sin códigos de error distintos y sin "ese pedido existe pero el correo no coincide".
La página enseña un único mensaje para los tres casos.

**El `raise exception` deshace también el incremento del cubo.** No reabre la puerta: el
contador se queda clavado en el máximo (el intento 13 sube a 13, lanza, y vuelve a 12; el 14
hace lo mismo) y la fila caduca igual con su `window_start`. Se menciona porque leyendo el SQL
parece un fallo y no lo es.

**`status_at` solo es exacta de aquí en adelante.** Las filas que ya existen se rellenan con
`created_at`, así que un pedido antiguo ya entregado dirá que se entregó el día que se hizo.

**Si la cabecera de IP no llega, el cubo por IP no hace nada.** Supabase no siempre expone la
IP del cliente a PostgREST. El cubo por correo, que es el que frena el ataque dirigido, sigue
funcionando igual.

---

## Cómo comprobar que quedó bien

Con un pedido real a mano (id y el correo con el que se hizo):

```sql
-- 1) Cada pedido tiene su token, y todos distintos
select count(*) as pedidos, count(distinct lookup_token) as tokens from public.orders;

-- 2) El par correcto devuelve UNA fila, con el token y sin direccion ni telefono
select * from public.order_public_status('FF-XXXXXXXX-XXX', 'correo@delcliente.com');

-- 3) El correo equivocado devuelve CERO filas, no un error
select * from public.order_public_status('FF-XXXXXXXX-XXX', 'otro@ejemplo.com');

-- 4) La consulta por token (pega el lookup_token que devolvio el punto 2).
--    Esta NO devuelve el token: no hace falta y no se regala.
select * from public.order_status_by_token('00000000-0000-0000-0000-000000000000');

-- 5) Un token inventado devuelve CERO filas
select * from public.order_status_by_token(gen_random_uuid());

-- 6) El cubo de intentos se esta llenando
select * from public.lookup_throttle;

-- 7) La funcion interna NO se puede llamar desde el navegador
--    (debe fallar con "permission denied" al probarla con la clave anon)
```

El punto 2 es el que fallaba antes del bloque 5, con
`Returned type integer does not match expected type numeric in column 10`. Si vuelve a
salirte un error de ese estilo con otro número de columna, pásamelo: significa que otra
columna de la tabla tiene un tipo distinto del que supuse, y se arregla con una conversión
más.

Para el disparador: cambia el estado de un pedido desde el panel y comprueba que `status_at`
se mueve.

```sql
select id, status, status_at from public.orders order by created_at desc limit 5;
```

Para `/cuenta`: inicia sesión en la tienda con una cuenta normal que tenga un pedido y entra
en Mi cuenta → Pedidos. Debe dejar de decir "Aún no tienes pedidos".

Para el enlace de un solo clic, de punta a punta: cambia el estado de un pedido de prueba
desde el panel, abre el correo que le llega al cliente y pulsa el botón. Debe abrir el pedido
**sin pedirte nada**. Si te pide el correo, es que el token no llegó: el panel lo saca de la
fila del pedido, así que recarga el panel para que vuelva a leer la tabla con la columna
nueva.

---

## Sobre el token del enlace

Hace que el botón del correo abra el pedido de un solo clic, sin preguntar nada. La
contrapartida es real y conviene tenerla clara: **el enlace es la credencial**. Quien reenvíe
ese correo está dando acceso a su pedido.

Por eso la consulta por token devuelve lo mismo que la de correo, es decir **sin dirección ni
teléfono**. Lo que se ve es el estado, los productos, los totales, el departamento y la forma
de pago. Suficiente para seguir un pedido, insuficiente para que un desconocido sepa dónde
vives.

El token lo genera la base de datos, no el navegador, y es un UUID v4: 122 bits al azar. Por
eso esa consulta no lleva límite de intentos, al contrario que la de id + correo. Ponerle uno
solo serviría para que alguien pudiera dejar fuera a un cliente de verdad.
