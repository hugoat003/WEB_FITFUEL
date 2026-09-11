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

> Supabase → **SQL Editor**. Son cuatro bloques. **Cópialos enteros, uno por uno y en
> orden**, y dale a Run después de cada uno. El bloque 4 necesita que el 3 ya esté corrido.
>
> Copia siempre de la primera a la última línea del recuadro. Si te dejas fuera la línea que
> cierra, Postgres avisa con `syntax error at or near ";"`: no es que el SQL esté mal, es que
> le falta el paréntesis o el punto y coma del final.

---

## Los bloques

### Bloque 1 de 4 — El cliente logueado ve SUS pedidos

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

### Bloque 2 de 4 — Cuándo cambió de estado

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

### Bloque 3 de 4 — Cubo de intentos, en el servidor

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

### Bloque 4 de 4 — Consulta pública de UN pedido: id + correo

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
-- 1) El par correcto devuelve una fila, sin dirección ni teléfono
select * from public.order_public_status('FF-XXXXXXXX-XXX', 'correo@delcliente.com');

-- 2) El correo equivocado devuelve CERO filas, no un error
select * from public.order_public_status('FF-XXXXXXXX-XXX', 'otro@ejemplo.com');

-- 3) El cubo se está llenando
select * from public.lookup_throttle;

-- 4) La función interna NO se puede llamar desde el navegador
--    (debe fallar con "permission denied" al probarla con la clave anon)
```

Para el disparador: cambia el estado de un pedido desde el panel y comprueba que `status_at`
se mueve.

```sql
select id, status, status_at from public.orders order by created_at desc limit 5;
```

Para `/cuenta`: inicia sesión en la tienda con una cuenta normal que tenga un pedido y entra
en Mi cuenta → Pedidos. Debe dejar de decir "Aún no tienes pedidos".

---

## Mejora futura, no incluida

Un `lookup_token uuid` en cada pedido haría que el enlace del correo funcionase de un solo
clic, sin pedir nada. No se hace ahora porque `place_order` solo devuelve el id, así que el
checkout no podría leer el token para construir el enlace de su propio correo de confirmación:
haría falta cambiar lo que devuelve esa función. Y tiene una contrapartida real, que el enlace
*sea* la credencial: reenviar el correo es entregar el pedido.
