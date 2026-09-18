# FITFUEL — Plan de unificación: GymStockPro + panel + CRM

> **Estado:** aprobado en ideas, **sin código todavía**. Última revisión: 18 sep 2026.
> Reemplaza la operación en dos sistemas por una sola sobre Supabase.
>
> **Cómo leer esto.** La sección 1 son cosas que pueden salir mal esta semana y no dependen
> del plan. La 2 son las decisiones que bloquean el diseño. De la 3 a la 10 es el plan. La 11
> son las fases. Los anexos guardan las cuentas que respaldan las afirmaciones, para que el
> cuerpo del documento se pueda leer de corrido.

---

## Índice

| | Sección | Para qué |
|---|---|---|
| **1** | [Riesgos abiertos hoy](#1-riesgos-abiertos-hoy) | Tres cosas que pueden costar dinero antes de escribir una línea |
| **2** | [Decisiones que bloquean](#2-decisiones-que-bloquean-el-diseño) | Nada se diseña bien sin cerrar estas seis |
| **3** | [Resumen](#3-resumen-en-una-página) | El plan en una página |
| **4** | [Punto de partida](#4-punto-de-partida) | Qué hay hoy y qué no cuadra |
| **5** | [Arquitectura](#5-arquitectura-y-principios) | Dónde vive cada cosa |
| **6** | [Modelo de datos](#6-modelo-de-datos) | Tablas y por qué |
| **7** | [Reglas de negocio](#7-reglas-de-negocio) | Stock, consignación, costo, precios |
| **8** | [Módulos](#8-módulos-del-panel-unificado) | Qué pantallas existen |
| **9** | [CRM](#9-crm) | El detalle del CRM |
| **10** | [La experiencia del panel](#10-la-experiencia-del-panel) | Lo que hace el panel usable o penoso |
| **11** | [Seguridad, migración y fases](#11-seguridad-y-roles) | Roles, corte, orden de entrega |
| **A** | [Anexos](#anexo-a--el-pedido-del-20-de-abril-cuenta-completa) | Las cuentas y las tablas largas |

---

# 1. Riesgos abiertos hoy

Tres cosas que no dependen de este plan y que conviene resolver antes de seguir.

## 1.1 🔴 Publicar desde un navegador limpio te borra cinco productos

**Verificado el 18 sep 2026 contra el código y el catálogo en vivo.** Es un fallo de un clic,
sin vuelta atrás, y es lo más urgente de todo el documento.

La cadena completa:

1. El panel arma su borrador (`D`) desde `FF.*`, que sale de **`public/data.js`** más el
   borrador local (`loadData()`, `admin.html:913`).
2. **El panel nunca descarga el catálogo publicado.** `FF.loadRemote()` solo se llama desde
   `main.jsx:33`, que es la tienda. El panel no.
3. `public/data.js` tiene **14 productos**. El catálogo publicado tiene **19**.
4. Los cinco que solo existen publicados: **Dymatize ISO100, Creatine Chews, Mutant Caffeine,
   Creatina Micronizada y Mutant Mass Extreme.**
5. `publishCatalog()` sube con `upsert: true` sobre la misma ruta `data.json`
   (`admin.html:991`). **No hay versión anterior a la que volver.**
6. **No existe ningún botón de exportar el catálogo.** Los tres `downloadFile` del panel son
   CSV de ventas, pedidos y entregas. Nada del catálogo.
7. Sí existe `btn-reset-all`, que hace `localStorage.removeItem('ff_data')`: un clic para
   quedarse sin borrador.

Basta con abrir el panel en el celular, en otro navegador, en incógnito, o tras limpiar los
datos del sitio, y darle a **⬆ Publicar**. Se van los cinco productos con sus fotos, precios y
existencias.

**Mientras no haya código, la regla es:** publicar **solo** desde el navegador que ya tiene el
borrador, y no tocar *Restablecer todo*.

**El arreglo, por orden de valor** (detalle en [10.1](#101-publicar-sin-red-de-seguridad)):
guardar una copia antes de publicar, que el panel parta del catálogo publicado, y enseñar qué
va a cambiar antes de subirlo.

## 1.2 🟠 El precio de cada línea lo pone el navegador

`place_order` **no se cree el subtotal declarado** —lo recalcula sumando las líneas— pero **sí
se cree el precio de cada línea** (`docs/SUPABASE-FASE3-CORRECCIONES.md:96-101`):

```sql
v_subtotal := v_subtotal
  + greatest(0, coalesce((li->>'price')::numeric, 0))
  * greatest(0, coalesce((li->>'qty')::numeric, 0));
```

Una petición armada a mano puede comprar cualquier cosa a Q1. Hoy el daño está contenido
porque **no hay pasarela de pago**: todo es contra entrega o transferencia y cada pedido se
confirma a mano, así que un pedido de Q1 por una proteína de 5 lb se ve a simple vista. El
costo real hoy es tiempo y stock reservado, no dinero.

Deja de estar contenido en dos momentos, y los dos están en este plan:

- **Cuando haya listas de precios**, porque el servidor tendrá que decidir qué precio aplica.
- **Cuando se acepte tarjeta**, porque el cobro dejará de pasar por las manos de nadie.

Por eso recomputar el precio en el servidor no es una mejora opcional de la fase 2: es su
requisito de entrada. Lo mismo aplica al envío, que hoy también llega del cliente
(`v_shipping` en la misma función).

## 1.3 🟠 Contar antes del drop

El drop contempla regalar **5 unidades de Creatina 500 g**. GymStockPro dice **3**; el
catálogo de la web decía **6**. GymStockPro es donde se registran las ventas en persona, así
que probablemente tiene razón.

**Contar físicamente los siete productos duplicados** antes del drop. Es media hora y evita
prometer producto que no está.

> Ojo con la fuente al contar: la existencia que manda es la **tabla `stock` de Supabase**
> (clave `(product_id, variant)`), no el campo `stock` del catálogo publicado, que es una
> foto del momento en que se publicó.

---

# 2. Decisiones que bloquean el diseño

Seis. Ninguna necesita código y todas cambian el modelo de datos si se responden tarde.

| # | Decisión | Por qué bloquea | Recomendación |
|---|---|---|---|
| 1 | **Qué precio gana al unificar.** 5 de 7 difieren ([anexo B](#anexo-b--divergencias-entre-los-dos-sistemas)) | Sin un precio por variante no hay lista de precios que construir | Que gane el de la web, salvo German Creapure. Subir Omega 3 de Q150 a Q199 en mostrador es un 33 % de golpe: avisar a los tres clientes antes |
| 2 | **Mayoreo: ¿por nivel o por cliente?** | Cambia `price_lists` de dos tablas a tres | Empezar **por nivel**. La lista por cliente se añade sin migrar nada si el modelo ya contempla la tabla puente |
| 3 | **Facturación (FEL).** Un gimnasio la va a pedir | Si el número sale del sistema, la orden necesita serie, correlativo y estado fiscal desde el principio | Fase 1: solo **registrar** el número que se emita por fuera. Integrar FEL es un proyecto propio |
| 4 | **Registro sanitario (MSPAS)** | Vender a gimnasios expone más que vender a consumidor final | Confirmar antes de empujar mayoreo, no después |
| 5 | **¿Va a usarlo alguien más?** | Define si el rol `vendedor` se construye ahora o después | Construir el rol **desde el principio** si la respuesta puede ser sí en seis meses. Añadirlo después obliga a repasar cada política de RLS |
| 6 | **Lead time real de MG Suplementos** | Es el parámetro del punto de reorden. Sin él, la alerta de reposición no sirve | Sacarlo de las dos compras que ya hay: fecha de pedido contra fecha de llegada a bodega |

---

# 3. Resumen en una página

Hoy FITFUEL opera con **dos sistemas que ya no cuadran**: la tienda (`fitfuelgt.com`, Supabase
+ Cloudflare Pages) y **GymStockPro** (`app.fitfuelgt.com`, un servidor Windows en la oficina
con los datos en un JSON local). De los siete productos que existen en ambos, **cinco tienen
precios distintos y tres tienen existencias distintas**.

El plan es **absorber GymStockPro dentro del panel**, todo sobre Supabase, y apagar el
servidor de la oficina.

No es "ponerle un CRM a la tienda". Los datos dicen otra cosa: **15 de 22 ventas son mayoreo y
14 vienen de una consignación**. El negocio real es vender a gimnasios; la tienda es el canal
nuevo. La unificación mete la tienda dentro del sistema que ya se usa, no al revés.

Lo que se gana:

- Una sola verdad de existencias, con lo consignado contado aparte pero sumando.
- Margen real por lote, con el costo puesto en bodega y no un tipo de cambio supuesto.
- Un CRM cuya función principal es **una lista diaria de a quién escribirle por WhatsApp**.
- Dejar de depender de que una PC esté encendida y con luz.

---

# 4. Punto de partida

## 4.1 Los dos sistemas

| | Tienda web | GymStockPro |
|---|---|---|
| Dónde | Cloudflare Pages + Supabase | Windows en la oficina + túnel `cloudflared` |
| Datos | Postgres con RLS | Un archivo `data/gymstock.json` |
| Acceso | Supabase Auth (correo y contraseña, `profiles.is_admin`) | PIN de 4+ dígitos (PBKDF2), sesión de 30 días |
| Catálogo | 19 productos, 24 presentaciones, 7 marcas | 7 productos, solo Meta Nutrition del primer lote |
| Existencias | Tabla `stock`, clave `(product_id, variant)` | Un campo `stock` por producto |
| Respaldos | Los de Supabase | 60 copias rotativas y export/import JSON |
| Sin conexión | La tienda sigue; el panel no | Solo lectura, a propósito |

## 4.2 Qué se usa de verdad en GymStockPro

Medido sobre el `gymstock.json` real (mayo a septiembre de 2026):

| Almacén | Registros | Veredicto |
|---|---|---|
| `sales` | 22 — 15 mayoreo, 5 detalle, 1 devolución, 1 a costo | Núcleo |
| `movements` | 61 — consignación 25, venta 23, entrada 7, devolución 6 | Núcleo |
| `consignments` | 7 (**8 unidades pendientes en la calle**) | Núcleo |
| `products` | 7 | Núcleo |
| `clients` | 3, **ninguno con teléfono** | Núcleo, con deuda de datos |
| `cashflows` | 1 | Se ocupa; poco uso porque aún hay pocos gastos |
| `suppliers` / `purchases` | 0 / 0 | Sin uso, pero es donde debe vivir el pedido a MG |

## 4.3 Lo que obliga a actuar

Las tablas completas de precios y existencias están en el
[anexo B](#anexo-b--divergencias-entre-los-dos-sistemas). El resumen:

- **5 de 7 precios no coinciden**, hasta Q69 de diferencia.
- **3 de 7 existencias no coinciden.**
- GymStockPro **no conoce los otros 12 productos** de la web. Una venta en persona de un Gold
  Standard, un Mutant o un Psychotic **no queda registrada en ninguna parte**.
- Los costos registrados están **subestimados un 15.24 %** ([anexo A](#anexo-a--el-pedido-del-20-de-abril-cuenta-completa)).

---

# 5. Arquitectura y principios

**Una sola base de datos, una sola verdad de existencias, varios puntos de captura.** Dos
sistemas sincronizándose es la única opción que garantiza descuadre, y ya lo demostró.

## 5.1 Dónde vive

El panel unificado se construye como **una aplicación de operación propia**, no como más
pestañas dentro de `public/admin.html`. Dos razones concretas:

- `admin.html` ya son **153 KB en un solo archivo sin empaquetar** (2,833 líneas, 8 pestañas).
  Sumarle ventas, consignaciones, clientes, compras y respaldos lo vuelve inmanejable.
- El módulo de ventas se usa **de pie**: en el mostrador y en el gimnasio. Necesita rutas,
  estado y una interfaz para el pulgar, no un panel de escritorio encogido.

**Migración por módulos**, no de un golpe: cada módulo nuevo entra en la aplicación nueva y se
apaga su equivalente viejo. `admin.html` se retira al final, cuando ya no quede nada dentro.

`app.fitfuelgt.com` se conserva como dirección, apuntando a Cloudflare Pages en vez del túnel.
Así no cambia el hábito ni el acceso directo del celular.

## 5.2 Qué desaparece

`cloudflared`, el túnel con nombre, el servicio de Windows y la tarea `GymStockServidor`,
`instalar-servicios.bat`, `desinstalar-servicios.bat`, `INICIAR.bat`,
`servidor-persistente.bat`, `start-server.vbs`, `iniciar.py`, `server.py`, el service worker
propio y `respaldo-navegador.html`.

## 5.3 Qué se conserva del diseño viejo

Cuatro decisiones de GymStockPro que son correctas y hay que mantener:

- **Sin conexión, solo lectura.** Aceptar ventas a ciegas en dos dispositivos desconectados
  descuadra el inventario. La decisión de `sync.js` era la buena.
- **El descuento de existencias se resuelve en el servidor**, nunca en el navegador. Ya lo hace
  `place_order`.
- **Ante datos ilegibles, negarse a continuar** en vez de empezar de cero.
- **Los respaldos, visibles y en manos del dueño**, no solo una promesa del proveedor.

---

# 6. Modelo de datos

## 6.1 La unidad vendible es la variante, no el producto

**Decidido: las existencias se llevan por variante (SKU).** No es nuevo: la tabla `stock` ya
tiene clave `(product_id, variant)` y el catálogo ya lleva precio y existencia por sabor (Gold
Standard 2 lb: Vainilla Q499, Cookies & Cream Q489). GymStockPro es el que se adapta.

- `product` = la familia, lo que tiene página en la tienda.
- `variant` = el SKU, lo que se cuenta, se cuesta y se vende. Los productos sin sabor usan
  `variant = ''`, como ya funciona.

Sin esto se puede vender "Psychotic Blue Raspberry" teniendo solo Peach Mango.

## 6.2 Tablas que ya existen y cómo cambian

| Tabla | Cambio |
|---|---|
| `stock` | **Se conserva tal cual.** Deja de editarse a mano: pasa a ser un caché que un disparador recalcula desde `stock_movements`. Así no se rompe `place_order` ni la tienda |
| `orders` | Gana `customer_id`, `channel`, `price_list`, `payment_status`, `delivery_status`, `sold_by`, `consignment_id`, `source`. Los campos de contacto que ya tiene se quedan como **foto del envío**, no como ficha del cliente |
| `orders.items` (jsonb) | Se conserva como **recibo inmutable**: lo que se vendió al precio que se vendió. No se toca nunca más |
| `profiles` | Gana `role` (`owner` / `vendedor`) además de `is_admin` |
| `costs` | Deja de ser la fuente del costo: pasa a ser **anulación manual** sobre el costo calculado por lote. Su política `costs_all_admin` ya la deja fuera del alcance de un vendedor |
| `promo_codes` | Gana `owner` (influencer o campaña) para atribución |
| `reviews`, `favorites`, `addresses` | Sin cambios |

## 6.3 Tablas nuevas

### Inventario y costo

- **`stock_movements`** — el libro. `product_id`, `variant`, `type`, `qty` (con signo),
  `qty_after`, `location`, `ref_type`, `ref_id`, `unit_cost`, `note`, `at`, `by`, `legacy_id`.
  - Tipos: `entry`, `sale`, `consignment_out`, `consignment_return`, `return`, `gift`,
    `shrink`, `adjust`.
  - Ubicaciones: `bodega`, `consignado:<customer_id>`, `reservado`.
  - `stock.qty` refleja solo lo **vendible en bodega**. Lo consignado sigue siendo inventario
    propio pero no vendible por la web.
- **`lots`** — un pedido a proveedor, con los **cinco** conceptos que hacen el costo:
  `merch_total`, `payment_fee`, `inland_freight`, `bank_charge`, `intl_freight`, más
  `allocation_method` (`weight` / `value`) y `landed_total`.
- **`lot_items`** — `lot_id`, `product_id`, `variant`, `qty`, `unit_merch_cost`,
  `unit_freight`, `unit_landed_cost`, `weight_kg`.
- **`purchases` / `purchase_items`** — la compra como documento. Genera el lote, la entrada de
  existencias y la salida de caja.

**Costeo:** promedio ponderado móvil por variante para el P&L, guardando el lote de origen para
auditoría. FIFO es más exacto y no compensa la complejidad a este volumen.

### Comercial

- **`customers`** — `name`, `phone` (normalizado `+502…`), `email`, `address`, `municipio`,
  `type` (`retail` / `mayorista`), `price_list`, `notes`, `consent_marketing`, `user_id`
  (opcional), `legacy_id`.
- **`order_items`** — normalizado, para reportes y margen por producto y canal. Convive con el
  jsonb: uno es el recibo, el otro es el dato analizable.
- **`price_lists` / `price_list_items`** — detalle, mayoreo y listas por cliente. Sustituye a
  `salePrice` / `wholesalePrice`.
- **`consignments` / `consignment_items`** — `customer_id`, estado por ítem
  (`pendiente` / `vendido` / `devuelto`), `sale_price`, fechas.
- **`account_entries`** — cuenta corriente de mayoreo: cargos, abonos, saldo.
- **`interactions`** — `customer_id`, `channel`, `direction`, `note`, `at`, `by`.
- **`tasks`** — `title`, `customer_id`, `due_at`, `done`.

### Dinero

- **`cashflows`** — `type` (`income` / `expense`), **`group`** (`inventory` / `operating`),
  `category`, `description`, `amount`, `ref_type`, `ref_id`, `date`.
  La separación en `group` es lo que hoy no existe y causa el doble conteo.

### Operación

- **`backup_runs`** — metadatos de cada respaldo: cuándo, quién, tamaño, ruta, conteos.
- **`settings`** — clave y valor, como ya funciona.
- **`audit_log`** — quién cambió qué y cuándo. Ver [10.4](#104-quién-cambió-qué).

---

# 7. Reglas de negocio

## 7.1 Una sola venta, venga de donde venga

Toda venta pasa por `place_order`, que ya es atómico y anti-sobreventa. La venta de mostrador y
la de mayoreo **no son flujos aparte**: son la misma orden con distinto `channel` y distinta
lista de precios. Canales: `web`, `mostrador`, `mayoreo`, `consignacion`.

**Requisito de entrada de la fase 2, no mejora opcional:** `place_order` debe recomputar en el
servidor el **precio por variante** y el **envío**. Hoy los dos llegan del cliente
([1.2](#12--el-precio-de-cada-línea-lo-pone-el-navegador)).

## 7.2 Consignación

Es el corazón del negocio y lo más delicado de modelar. El producto sale de la bodega pero
**sigue siendo de FITFUEL** hasta que el gimnasio lo vende.

| Acción | Movimiento | ¿Ingreso? | ¿Costo en P&L? | ¿Baja el stock vendible? |
|---|---|---|---|---|
| Entregar | `consignment_out`: bodega → `consignado:<cliente>` | No | No | **Sí** (si no, se sobrevende en la web) |
| Marcar vendido | genera orden `channel = consignacion` | **Sí** | **Sí** | Ya bajó al entregar |
| Marcar devuelto | `consignment_return`: vuelve a bodega | No | No | Vuelve a subir |

El valor del inventario y los reportes suman **bodega más consignado**. Solo el stock vendible
de la web usa bodega.

**Añadir un plazo.** Una consignación sin fecha de revisión se convierte en producto perdido.
Cada entrega lleva una fecha de revisión y la bandeja del día avisa de las que la pasaron.

## 7.3 Flete, costo y caja

- **Flete de entrada → costo del producto** (costo puesto en bodega). Sin ese flete la
  mercadería no está en la bodega: el costo es inseparable del producto.
- **Flete de salida → gasto de operación.**
- La caja **sí registra la compra de inventario**, porque el dinero salió. Son dos preguntas
  distintas: caja es *¿cuánto dinero tengo?*, P&L es *¿estoy ganando?* (solo cuenta el costo de
  lo ya vendido).
- **Una compra se registra una vez** y dispara tres cosas:
  1. entrada de existencias con costo puesto en bodega por unidad;
  2. salida de caja con `group = inventory`;
  3. **nada en el P&L** hasta que la unidad se venda.
- El costo puesto en bodega se calcula del **cargo real del banco**, nunca de un tipo de cambio
  supuesto. Las cuentas del pedido de abril, y el error del 15.24 %, están en el
  [anexo A](#anexo-a--el-pedido-del-20-de-abril-cuenta-completa).

Gastos de operación reales a contemplar: Meta Ads, marketing del drop, combustible y entregas
locales, empaque, hosting y dominio, y comisiones bancarias no atribuibles a un pedido.

## 7.4 Precios

Tres niveles por variante: **detalle**, **mayoreo** y **lista específica por cliente**.

- El precio de la web y el de mostrador **son el mismo**. Un cliente no puede pagar Q150 en
  persona por un Omega 3 que la web ofrece a Q199.
- **Alerta de precio piso.** Si el precio aplicado deja el margen por debajo de un umbral
  configurable, el sistema avisa **antes** de cerrar la venta. Con Gold Standard 5 lb al 9.5 %,
  un descuento de mayoreo deja pérdida.
- **Los precios pactados llevan vigencia.** Un descuento de una vez, sin fecha de caducidad, se
  convierte en el precio permanente de ese cliente y nadie se acuerda de por qué.

---

# 8. Módulos del panel unificado

| Módulo | Origen | Notas |
|---|---|---|
| **Inicio** | Ambos | P&L, existencias bajas y agotadas, consignaciones pendientes, a quién escribir hoy |
| **Ventas** | GymStock | Carrito, descuento, cliente, canal, ticket, devoluciones parciales. Para celular |
| **Pedidos web** | admin.html | Estados y correo al cliente por Resend |
| **Consignaciones** | GymStock | Entregar, marcar vendido o devuelto, ticket imprimible |
| **Clientes / CRM** | Nuevo | Ficha, historial, segmentos, recompra, interacciones, cuenta corriente |
| **Inventario** | Ambos | Existencias por variante y ubicación, libro de movimientos, conteo físico |
| **Catálogo** | admin.html | Productos, variantes, packs, blog, testimonios, reseñas, publicar |
| **Compras** | GymStock (vacío) | Pedido a proveedor, lote, costo puesto en bodega. Sustituye al Excel |
| **Caja** | GymStock | Con la separación inventario / operación |
| **Reportes** | Ambos | Ventas, inventario, ganancias, consignación, movimientos, canal, atribución |
| **Ajustes** | Ambos | Marca, listas de precios, usuarios, **respaldos** |

**En el celular** solo aparecen los que se usan de pie: Ventas, Consignaciones, Inventario,
Clientes. El resto queda en escritorio.

---

# 9. CRM

## 9.1 Identidad

**La llave es el teléfono, no el correo.** Quien compró en la web con correo y en persona con
teléfono tiene que ser **una sola ficha**.

- Teléfono normalizado a `+502…` y **obligatorio** al crear un cliente. Los 3 clientes que hay
  hoy no tienen ninguno: es la primera deuda de datos.
- **Detección de duplicados al crear y función de fusión desde el día uno.** Limpiarlo después
  es lo caro. La fusión debe arrastrar órdenes, interacciones y saldo, y dejar rastro de qué se
  fusionó con qué.
- `customers` (ficha comercial) separado de `profiles` (cuenta de acceso), ligados
  opcionalmente. Un cliente de mostrador no tiene cuenta y no debería necesitarla.

## 9.2 Ficha y segmentos

**Ficha:** compras, LTV, ticket promedio, qué compra, última compra, días desde la última,
canal preferido, notas libres, saldo en cuenta corriente.

**Una sola línea de tiempo** que mezcle órdenes, interacciones, tareas, cambios de saldo y
consignaciones, en orden. Tener cuatro listas separadas obliga a reconstruir la historia a
mano cada vez.

**Segmentos automáticos** (RFM simplificada): nuevo, activo, en riesgo, dormido, VIP,
mayorista.

**Para los gimnasios, notas con estructura**, no un campo libre. Lo que de verdad hace falta
saber: quién decide la compra, quién paga, en qué horario se puede entregar, por qué puerta se
entra, si piden factura. Eso es lo que se olvida y lo que hace perder una entrega.

## 9.3 La función que convierte el CRM en ventas

**Fecha estimada de recompra por producto.** Cada variante lleva `days_supply` (proteína 2 lb ≈
29 servicios ≈ 1 mes; creatina 500 g ≈ 100 días). Con la última compra y ese dato, el sistema
arma cada mañana una lista corta: *"hoy escríbele a estas seis personas, se les está
acabando"*. Eso vende; los reportes no.

Tres cosas que hacen que la lista siga siendo útil en el mes tres:

- **Posponer y descartar.** Sin un "recuérdame en dos semanas" y un "no volver a sugerir", la
  lista se llena de gente a la que ya se escribió y se deja de abrir.
- **Medir si funcionó.** Si el cliente compra dentro de los N días siguientes al mensaje, se
  atribuye a ese aviso. Sin eso no hay forma de saber si la lista sirve o solo da trabajo.
- **Para mayoreo, el ritmo por cuenta:** *"este gimnasio pide cada 4 semanas y lleva 6 sin
  pedir"*. Es la misma idea aplicada a la cuenta en vez del producto.

## 9.4 Contacto

WhatsApp, no correo.

- **Fase 1:** plantillas con enlace `wa.me` desde la ficha. Cero costo, cero API, y cada envío
  se registra como interacción con un botón.
- **Fase 2, solo si el volumen lo justifica:** API de WhatsApp Business con plantillas
  aprobadas.

**Plantillas con variables y con nombre** (`recompra-proteina`, `cobro-vencido`), guardadas y
editables. Reescribir el mensaje cada vez lleva a mandar cosas distintas y a no poder comparar
qué funciona. Contar los envíos y las compras posteriores por plantilla.

**Higiene:** escribir solo a quien compró o dio permiso (`consent_marketing`), con salida
fácil, y **guardar la baja con fecha** para poder demostrarla. WhatsApp banea por spam y no
avisa.

## 9.5 Mayoreo

- Listas de precios por nivel y mínimos de compra por nivel.
- **Cuenta corriente**: pedido a crédito, saldo, fecha de pago. Es el riesgo número uno del
  canal: vender fiado y perder el rastro.
- **Límite de crédito por cuenta**, no solo un saldo corriendo. Y aviso al pasar un pedido a
  crédito que lo supere. Un saldo que solo se mira hacia atrás no frena nada.
- **Devoluciones y notas de crédito** dentro de la cuenta, o el saldo deja de cuadrar el primer
  día que un gimnasio devuelve producto.
- **Cotización → pedido.** Documento que se manda por WhatsApp y que al aceptarse se convierte
  en orden y **reserva existencias**. La reserva **caduca**: sin fecha de vencimiento, las
  cotizaciones muertas se van comiendo el inventario disponible.
- **Aviso de pedido repetido**: mismo cliente, mismos artículos, pocos minutos de diferencia.
  Es el error de captura más común en mostrador.

## 9.6 Atribución

`promo_codes` con `owner` (un código por influencer y por campaña), la UTM guardada en la
orden, y un *"¿cómo nos conociste?"* en la venta manual. De ahí salen el costo de adquisición
por canal, el retorno de Meta Ads, las ventas por influencer y **el costo real del regalo**.

## 9.7 Reposición

Días de inventario y punto de reorden por variante, con el **lead time real** de traer de
México como parámetro. La alerta útil es *"a este ritmo `crea-meta-500` se acaba en 9 días y el
pedido tarda 25"*.

## 9.8 Retención

Con 30 o 60 clientes no hace falta un tablero, pero sí una cifra: **de los que compraron el mes
pasado, cuántos volvieron.** Es la que dice si el negocio crece o solo reemplaza clientes. Una
tabla de cohortes por mes de primera compra basta, y se calcula con lo que ya habrá en
`orders`.

## 9.9 Lo que NO se construye todavía

Con este volumen son trampas de tiempo: automatizaciones de correo, puntuación de leads,
embudos con etapas, campañas de cumpleaños, chatbot, programa de puntos. **El CRM útil hoy es
una lista de gente, qué compró y a quién escribirle.** Se anotan aquí para no volver a
discutirlas hasta que haya volumen.

---

# 10. La experiencia del panel

Lo que sigue sale de leer `admin.html` (153 KB, 2,833 líneas, 8 pestañas) y de lo que ha ido
apareciendo trabajando en él. Está en orden de valor.

## 10.1 Publicar sin red de seguridad

Es lo de [1.1](#11--publicar-desde-un-navegador-limpio-te-borra-cinco-productos), y son cuatro
arreglos independientes:

1. **Guardar la versión anterior antes de subir.** Publicar también a `data-<fecha>.json` y
   conservar las últimas N. Es lo más barato del documento y convierte un fallo irreversible en
   uno recuperable. **Primero esto, antes que lo demás.**
2. **Que el panel parta del catálogo publicado.** `loadData()` debe esperar a
   `FF.loadRemote()` y usar eso como base, no `public/data.js`. Con esto el borrador de un
   navegador limpio ya no es un catálogo viejo.
3. **Enseñar qué va a cambiar.** Antes de publicar, un resumen: *"19 productos → 19, 2 precios
   cambian, 0 se eliminan"*. Y **confirmación aparte cuando algo se elimina**, que es el caso
   que duele.
4. **Exportar e importar el catálogo.** Hoy no existe. El formato debe ser el mismo `rev` +
   `stores` de GymStockPro, para que los dos JSON sean intercambiables.

## 10.2 El borrador vive en un solo navegador

`save()` escribe en `localStorage.ff_data` (`admin.html:943`). Consecuencias:

- Editar desde el celular y desde la laptop crea **dos borradores distintos**, y el último que
  publique gana, pisando el trabajo del otro sin avisar.
- Limpiar los datos del sitio borra todo lo no publicado.
- Las fotos entran como data URL y **viven en el borrador hasta que se publica**. Por eso ya
  existe el aviso *"almacenamiento lleno, usa imágenes más livianas"*: el límite de
  localStorage está a la vuelta de la esquina.

**Arreglo:** el borrador vive en el servidor (una tabla `catalog_drafts` con su `updated_at` y
quién lo tocó), y las fotos se suben a Storage **al elegirlas**, no al publicar. Con eso el
panel funciona igual desde cualquier dispositivo y deja de haber un techo de almacenamiento.

## 10.3 La diferencia entre guardado y publicado es invisible

`save()` dice "Guardado ✓", que significa *guardado en este navegador*. Nada en la pantalla
dice que hay cambios sin publicar. Es el origen de que la cinta siguiera diciendo "testeado en
laboratorio" durante días después de corregirla.

**Arreglo:** un indicador permanente en la barra — *"3 cambios sin publicar"* — con la lista de
qué cambió, y que el botón Publicar se vea distinto cuando hay pendientes.

## 10.4 Quién cambió qué

No hay registro de cambios. Hoy da igual porque solo hay una persona; deja de dar igual el día
que exista el rol `vendedor`. Una tabla `audit_log` con tabla, id, acción, antes, después,
quién y cuándo. Se escribe desde disparadores, no desde el navegador, o se puede saltar.

## 10.5 Nada se puede deshacer

`btn-reset-all` borra el borrador de un clic. Eliminar un producto no pide confirmación con el
nombre. No hay papelera.

**Arreglo:** borrado suave (`deleted_at`) en productos, packs, blog y clientes, con una
papelera de 30 días. Y que las acciones destructivas exijan **escribir el nombre**, no un
"¿seguro?" que se acepta sin leer.

## 10.6 El catálogo ya no cabe en una lista

19 productos y 24 presentaciones hoy, y va a crecer. La pestaña de productos es una lista
plana.

**Arreglo:** buscador, filtro por categoría y marca, y filtros de trabajo que son los que se
usan de verdad: *sin foto*, *sin costo*, *sin existencias definidas*, *agotado*, *precio bajo
el piso de margen*. Y **acciones en lote**: subir un 10 % a las variantes seleccionadas, ajustar
existencias, publicar o despublicar.

## 10.7 Validar antes de publicar, no después

Una revisión automática que corra al pulsar Publicar y liste lo que está a medias: productos
sin foto, precio en cero, existencias sin definir, sin costo, descripción vacía, y **cifras en
quetzales escritas a mano** en la cinta o la FAQ (ese último ya existe desde hoy). No debe
bloquear, solo enseñarlo antes de que lo vea un cliente.

## 10.8 La caché manual de `data.js`

`admin.html` carga `data.js?v=10`, y ese número se sube **a mano** cada vez que cambia el
archivo. Si alguien lo olvida, el panel trabaja con un catálogo viejo y la siguiente
publicación borra lo que no conoce. Es la misma familia de fallo que
[1.1](#11--publicar-desde-un-navegador-limpio-te-borra-cinco-productos).

**Arreglo:** que el número lo ponga el build, o mejor, que deje de importar porque el panel ya
parte del catálogo publicado ([10.1](#101-publicar-sin-red-de-seguridad), punto 2).

## 10.9 Cosas pequeñas que se notan todos los días

- **Un buscador general** (`/` para abrirlo): cliente, pedido, producto. Con cinco módulos más,
  navegar por pestañas se vuelve lento.
- **Filtros que sobreviven a recargar la página**, en la URL. Hoy se pierden.
- **Fechas relativas con la fecha exacta al pasar el cursor.** "hace 3 días" se lee más rápido,
  pero para cuadrar caja hace falta el día.
- **Que cada pantalla vacía diga qué hacer**, no solo "sin datos".
- **Imprimir de verdad**: ticket de venta, ticket de consignación y hoja de entregas, que ya
  existe en CSV.
- **Un solo formato de dinero.** Hoy conviven `Q1,319.00` y `Q1319`.

---

# 11. Seguridad y roles

- **Autenticación**: sesión persistente de Supabase, más **el PIN como candado de pantalla**. El
  PIN deja de ser la autenticación (hoy lo es en GymStockPro) y pasa a ser comodidad de
  mostrador.
- **Roles**: `owner` ve todo. `vendedor` vende y consulta existencias pero **no ve costos,
  márgenes ni P&L**, y no borra. La tabla `costs` ya es privada; esa línea se mantiene y se
  extiende a `lots`, `purchases` y `cashflows`.
- **RLS en todas las tablas nuevas, sin excepción.**
- Datos de clientes: los mínimos, consentimiento explícito para marketing, y el export de
  respaldo tratado como dato sensible.

## 11.1 Respaldos

Al pasar a Supabase los datos dejan de estar en un archivo propio. Lo que debe existir:

- **Exportar**: un botón que arme el snapshot completo en el **mismo formato `rev` + `stores`**
  de GymStockPro, para que los dos JSON sean intercambiables. Se descarga y se guarda en un
  bucket **privado**.
- **Automático**: un trabajo diario que escriba el snapshot y conserve los últimos N.
  Sustituye a las 60 copias rotativas.
- **Restaurar, no mezclar.** Es la parte peligrosa:
  1. previsualización antes de aplicar: cuántos registros, qué fechas, qué cambia;
  2. elección explícita entre *reemplazar todo* y *solo lo que falta*;
  3. respaldo automático justo antes de restaurar;
  4. ante un archivo ilegible, negarse a continuar.
- El JSON lleva nombres, teléfonos y direcciones. **Bucket privado, nunca público.**
- Supabase ya hace sus respaldos. Estos son por **portabilidad y confianza**, no los sustituyen.

## 11.2 Migración

**Mapeo de catálogo.** Los ids no se parecen (`10`, sku `001` contra
`meta-full-protein-44`). Se mapean **a mano los 7**, se conservan los ids de la web, y el id
numérico viejo se guarda como `legacy_id` en cada tabla para poder reimportar el JSON sin
duplicar.

**Orden de carga:**

1. `customers` ← `clients` (3 registros; los teléfonos se completan a mano).
2. `stock_movements` ← `movements` (61), respetando fechas y el `qty_after` original.
3. `orders` + `order_items` ← `sales` (22), con `channel` derivado de `type`
   (`wholesale` → mayoreo, `retail` → mostrador, `cost` → caso por caso) y `consignment_id`
   desde `fromConsignment`.
4. `consignments` + `consignment_items` ← `consignments` (7). **Las 8 unidades pendientes son
   lo más importante de toda la migración**: son inventario que no está ni en bodega ni vendido.
5. `cashflows` ← `cashflows` (1), asignando `group`. El Q458 queda como `inventory` del lote de
   mayo, no como gasto de operación.
6. Conteo físico y un `adjust` final para cuadrar contra la realidad.

**Regla de corte.** Se fija un día y una hora a partir de los cuales **GymStockPro queda en
solo lectura**. Nada de operar en los dos a la vez: eso es exactamente lo que produjo las
divergencias actuales.

## 11.3 Fases

Cada fase termina en algo comprobable, no en "está hecho".

| Fase | Contenido | Terminada cuando |
|---|---|---|
| **0 · Cuadre** (sin código) | Conteo físico de los 7 duplicados, decisión de precios, recálculo de costos desde el cargo real del banco, factura de las 23 unidades sin documentar. **Y el respaldo del catálogo antes de volver a publicar** | Existe un número de existencias y un precio por variante que no se discute |
| **1 · Catálogo y existencias** | Variantes como unidad vendible, `stock_movements` con disparador hacia `stock`, ubicaciones, tres listas de precios, `legacy_id` | Las existencias de la web se mueven solo desde el libro de movimientos |
| **2 · Ventas** | Módulo de ventas en celular, canales, devoluciones parciales, **precio y envío recomputados en el servidor**, todo sobre `place_order` | Una venta de mostrador descuenta las existencias que ve la web |
| **3 · Consignaciones** | Entregas, marcar vendido o devuelto, tickets, plazo de revisión, y las 8 unidades pendientes migradas | El inventario consignado se ve aparte del vendible y suma en el valor total |
| **4 · Clientes y CRM** | Fichas con teléfono, fusión de duplicados, historial, segmentos, recompra, interacciones, cuenta corriente | Existe la lista diaria de "a quién escribirle hoy" y se puede actuar sobre ella |
| **5 · Compras y caja** | Pedido a proveedor con costo puesto en bodega y prorrateo por peso, caja con la separación inventario / operación | El Excel del pedido deja de usarse |
| **6 · Respaldos, reportes y apagado** | Export/import, trabajo diario, reportes por canal y atribución. Se apaga GymStockPro, el túnel y el servidor | La PC de la oficina se puede apagar sin que nadie lo note |

## 11.4 Riesgos

| Riesgo | Mitigación |
|---|---|
| **Borrar 5 productos publicando desde un navegador limpio** | Respaldo antes de publicar y que el panel parta del catálogo publicado. Mientras no haya código, publicar solo desde el navegador de siempre |
| Perder las 8 unidades en consignación durante la migración | Migrarlas primero y verificarlas contra el ticket físico antes de cortar |
| Operar en los dos sistemas a la vez | Regla de corte con fecha y hora; GymStockPro en solo lectura |
| Heredar costos subestimados un 15.24 % | Recalcular los `buyPrice` desde el cargo real del banco en la fase 0. Conseguir la factura de las 23 unidades anteriores |
| Que el drop salga con las existencias descuadradas | Conteo físico ya, sin esperar al código |
| CRM sin teléfonos | Teléfono obligatorio y campaña de captura desde la fase 4 |
| Precio manipulado desde el navegador | Recomputar en el servidor **antes** de aceptar tarjeta. Hoy lo contiene la confirmación manual |
| Sobre-construir | Ver [9.9](#99-lo-que-no-se-construye-todavía). Nada de automatizaciones antes de tener volumen |
| Quedarse sin respaldo propio al migrar a la nube | Export en formato compatible desde la fase 6, bucket privado |

---

# Anexo A — El pedido del 20 de abril, cuenta completa

⚠️ **Los costos registrados están subestimados un 15.24 %** (verificado el 18 sep 2026 contra
la factura).

Los `buyPrice` se calcularon aplicando un **tipo de cambio plano de 0.46 Q/MXN sobre el precio
de lista**, sin sumar nada más. Faltan cuatro cosas: la comisión de PayPal (4.8 %), el envío
interno en México (3GUERRAS, $169 MXN), el margen cambiario del banco y el flete a
Huehuetenango (Q458).

**La cuenta real, 53 unidades:**

```
  mercadería                $13,966.00 MXN
+ 3GUERRAS (envío interno)      $169.00 MXN
                            ─────────────────
                            $14,135.00 MXN
× 1.048 (PayPal 4.8 %)      $14,813.48 MXN
                            ─────────────────
  cargo real del banco         Q6,945.51      ← TC efectivo 0.468864, no 0.46
+ flete a Huehuetenango          Q458.00
                            ─────────────────
  puesto en bodega             Q7,403.51
```

| Producto | Uds | Lista MXN | Registrado | **Real puesto en bodega** |
|---|---|---|---|---|
| Omega 3 (90 s) | 5 | $150 | Q69.00 | **Q79.52** |
| Magnesio | 10 | $129 | Q59.34 | **Q68.38** |
| Creatina 500 g | 10 | $239 | Q109.94 | **Q126.70** |
| German Creapure 300 g | 10 | $239 | Q109.94 | **Q126.70** |
| Creatina 1.05 kg | 18 | $397 | Q182.62 | **Q210.45** |

El factor es **1.1524 idéntico en las cinco líneas**, lo que confirma un error de método y no
de captura: 1.0811 por PayPal, 3GUERRAS y margen bancario, y 1.0659 por el flete.

**Las otras 23 unidades del "stock inicial" (76 en total) no vienen de este pedido.** Son
existencias anteriores cargadas a la app el mismo día: las 5 Full Protein (4 de 4.4 lb y 1 de
10 lb, que no aparecen en esta factura), más 2 creatinas de 500 g, 4 de 1.05 kg, 4 de magnesio
y 8 de Omega 3. Su costo real **sigue sin documentar**: hace falta la factura de esa compra
anterior. Mientras tanto, lo razonable es asumir el mismo error de método y aplicarles el
1.1524, marcándolo como estimado.

**Efecto en el modelo del primer drop:** la creatina de 500 g cuesta **Q126.70**, no Q109.94,
así que el regalo a los 5 influencers cuesta **Q633.48** y no Q549.70. El margen a Q299 sigue
siendo excelente (**57.6 %**), pero la utilidad del drop baja unos Q84 respecto de lo modelado.

⚠️ **Discrepancia de producto.** La factura dice **CITRATO** de magnesio y tanto GymStockPro
como la web dicen **GLICINATO**. No son la misma sal ni tienen la misma absorción. Para una
tienda cuyo posicionamiento es "sin promesas milagro", conviene confirmarlo en la etiqueta
física antes del drop y corregir donde corresponda.

---

# Anexo B — Divergencias entre los dos sistemas

**Precios**, contra el catálogo en vivo de Supabase (18 sep 2026). 5 de 7 no coinciden:

| Producto | GymStock | Web | Δ |
|---|---|---|---|
| Full Protein 10 lb | Q650 | Q719 | Q69 |
| Glicinato de Magnesio | Q150 | Q199 | Q49 |
| Omega 3 | Q150 | Q199 | Q49 |
| Creatina 1.05 kg | Q450 | Q475 | Q25 |
| German Creapure 300 g | Q315 | Q299 | Q16 (la web más barata) |
| Creatina 500 g | Q300 | Q299 | — |
| Full Protein 4.4 lb | Q450 | Q449 | — |

**Existencias**, 3 de 7 no coinciden:

| Producto | GymStock | Web |
|---|---|---|
| Creatina 500 g | **3** | **6** |
| Creatina 1.05 kg | 9 | 11 |
| Glicinato de Magnesio | 3 | sin definir |

**Los 12 productos que GymStockPro no conoce:** Gold Standard 2 lb y 5 lb, Mutant Whey 4 lb y
5 lb, Birdman Creatina, Psychotic, Dymatize ISO100, Creatine Chews, Mutant Caffeine, Mutant
Mass Extreme, Creatina Micronizada ON y Fibo Bar. Una venta en persona de cualquiera de ellos
no queda registrada en ninguna parte.
