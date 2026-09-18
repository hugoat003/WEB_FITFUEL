# FITFUEL — Plan de unificación: GymStockPro + panel de admin + CRM

> Estado: plan aprobado en ideas, **sin código todavía**. Fecha: 18 sep 2026.
> Reemplaza la operación en dos sistemas por una sola sobre Supabase.

---

## 0. Resumen en una página

Hoy FITFUEL opera con **dos sistemas que ya no cuadran entre sí**: la tienda web
(`fitfuelgt.com`, Supabase + Cloudflare Pages) y **GymStockPro** (`app.fitfuelgt.com`,
servidor Windows en la oficina, datos en un JSON local). Cinco de los siete productos que
existen en ambos tienen **precios distintos** y tres tienen **stock distinto**.

El plan es **absorber GymStockPro dentro del panel de admin**, todo sobre Supabase, y apagar
el servidor de oficina. No es "agregarle un CRM a la tienda": los datos dicen que **15 de 22
ventas son mayoreo y 14 vienen de una consignación**, así que el negocio real es la venta a
gimnasios y la tienda web es el canal nuevo. La unificación mete la tienda dentro del sistema
que ya se usa, no al revés.

Lo que se gana: una sola verdad de stock, margen real por lote, CRM con recompra por WhatsApp,
y dejar de depender de que la PC de la oficina esté encendida y con luz.

---

## 1. Punto de partida

### 1.1 Los dos sistemas

| | Tienda web | GymStockPro |
|---|---|---|
| Dónde | Cloudflare Pages + Supabase | Servidor Windows en la oficina + túnel `cloudflared` |
| Datos | Postgres con RLS | Un archivo `data/gymstock.json` |
| Acceso | Supabase Auth (correo + contraseña, `profiles.is_admin`) | PIN de 4+ dígitos (PBKDF2), sesión 30 días |
| Catálogo | 24 presentaciones, 10 marcas | 7 productos, solo Meta Nutrition del primer lote |
| Stock | Tabla `stock`, PK `(product_id, variant)` | Campo `stock` por producto |
| Respaldos | Los de Supabase | 60 copias rotativas + export/import JSON |
| Sin conexión | La web sigue, el admin no | Solo lectura, a propósito |

### 1.2 Qué se usa de verdad en GymStockPro

Medido sobre el `gymstock.json` real (mayo–sep 2026):

| Store | Registros | Veredicto |
|---|---|---|
| `sales` | 22 — 15 mayoreo, 5 detalle, 1 devolución, 1 a costo | Núcleo |
| `movements` | 61 — consignación 25, venta 23, entrada 7, devolución 6 | Núcleo |
| `consignments` | 7 (8 unidades pendientes en la calle) | Núcleo |
| `products` | 7 | Núcleo |
| `clients` | 3, **ninguno con teléfono** | Núcleo, con deuda de datos |
| `cashflows` | 1 | Sí se ocupa; poco uso porque aún hay pocos gastos |
| `suppliers` / `purchases` | 0 / 0 | No se usa aún, pero es donde debe vivir el pedido a MG |

### 1.3 Las divergencias que obligan a actuar

Precios (contra el catálogo en vivo de Supabase, 18 sep 2026) — 5 de 7 no coinciden:

| Producto | GymStock | Web | Δ |
|---|---|---|---|
| Full Protein 10 lb | Q650 | Q719 | Q69 |
| Glicinato de Magnesio | Q150 | Q199 | Q49 |
| Omega 3 | Q150 | Q199 | Q49 |
| Creatina 1.05 kg | Q450 | Q475 | Q25 |
| German Creapure 300 g | Q315 | Q299 | Q16 (web más barata) |
| Creatina 500 g | Q300 | Q299 | — |
| Full Protein 4.4 lb | Q450 | Q449 | — |

Stock — 3 de 7 no coinciden: **Creatina 500 g: 3 vs 6**, Creatina 1.05 kg: 9 vs 11,
Glicinato: 3 vs `null`.

> ⚠️ **Acción inmediata, sin código:** el drop contempla regalar **5 unidades de Creatina
> 500 g**. Si el número correcto es el de GymStock — que es donde se registran las ventas en
> persona — hay **3, no 6**. Contar físicamente antes del drop.

Y GymStockPro **no conoce los otros 17 productos** de la web (ON, Mutant, Birdman, Psychotic,
Dymatize, Creatine Chews, Mutant Caffeine, Mutant Mass, Creatina Micronizada ON). Una venta en
persona de cualquiera de ellos no queda registrada en ningún lado.

---

## 2. Principio rector y arquitectura

**Una sola base de datos, una sola fuente de verdad de stock, varios puntos de captura.**
Dos sistemas sincronizándose es la única opción que garantiza descuadre, y ya lo demostró.

### 2.1 Dónde vive todo

El panel unificado se construye como **una SPA de operación propia**, no como más pestañas
dentro de `public/admin.html`. Razones:

- `admin.html` ya pesa ~150 KB en un solo archivo sin bundlear. Sumarle ventas, consignaciones,
  clientes, compras y respaldos lo vuelve inmanejable.
- El módulo de ventas se usa **en el celular, en el mostrador y en el gimnasio**. Necesita rutas,
  estado y una interfaz pensada para el pulgar, no un panel de escritorio adaptado.

Migración por módulos (*strangler*), no de un solo golpe: cada módulo nuevo entra en la SPA y se
apaga el equivalente viejo. `admin.html` se retira al final, cuando ya no quede nada dentro.

El dominio `app.fitfuelgt.com` se conserva como dirección, pero apuntando a Cloudflare Pages en
lugar del túnel de la oficina. Así no cambia el hábito ni el acceso directo del celular.

### 2.2 Qué desaparece

`cloudflared`, el túnel con nombre, el servicio de Windows y la tarea `GymStockServidor`,
`instalar-servicios.bat`, `desinstalar-servicios.bat`, `INICIAR.bat`, `servidor-persistente.bat`,
`start-server.vbs`, `iniciar.py`, `server.py`, el service worker propio y
`respaldo-navegador.html`.

### 2.3 Qué se conserva del diseño viejo

- **Sin conexión = solo lectura.** La decisión de `sync.js` es correcta: aceptar ventas a ciegas
  en dos dispositivos desconectados descuadra el inventario. Se mantiene.
- **Descuento de stock resuelto en el servidor**, nunca en el navegador. Ya lo hace `place_order`.
- **Ante datos ilegibles, negarse a continuar** en vez de empezar de cero.
- Los respaldos como algo visible y en manos del dueño, no solo una promesa del proveedor.

---

## 3. Modelo de datos

### 3.1 La unidad vendible es la variante, no el producto

**Decidido: el stock se lleva por variante (SKU).** No es una elección nueva — la tabla `stock`
de la web ya tiene clave primaria `(product_id, variant)` y el catálogo en vivo ya lleva precio y
existencia por sabor (Gold Standard 2 lb: Vainilla Q499 / Cookies & Cream Q489). GymStockPro es
el que se adapta.

- `product` = la familia, lo que tiene página en la tienda.
- `variant` = el SKU, lo que se cuenta, se cuesta y se vende. Los productos sin sabor usan
  `variant = ''`, como ya funciona hoy.

Sin esto se puede vender "Psychotic Blue Raspberry" teniendo solo Peach Mango.

### 3.2 Tablas que ya existen y cómo cambian

| Tabla | Cambio |
|---|---|
| `stock` | **Se conserva tal cual** (`product_id`, `variant`, `qty`). Deja de editarse a mano: pasa a ser un caché que un *trigger* recalcula desde `stock_movements`. Así no se rompe `place_order` ni la tienda. |
| `orders` | Gana `customer_id`, `channel`, `price_list`, `payment_status`, `delivery_status`, `sold_by`, `consignment_id`, `source`. Los campos de contacto que ya tiene (`nombre`, `telefono`, `direccion`…) se quedan como **foto del envío**, no como ficha del cliente. |
| `orders.items` (jsonb) | Se conserva como **recibo inmutable**: lo que se vendió, al precio que se vendió. No se toca nunca más. |
| `profiles` | Gana `role` (`owner` / `vendedor`) además de `is_admin`. |
| `costs` | Deja de ser la fuente del costo — pasa a ser *anulación manual* sobre el costo calculado por lote. |
| `promo_codes` | Gana `owner` (influencer o campaña) para atribución. |
| `reviews`, `favorites`, `addresses` | Sin cambios. |

### 3.3 Tablas nuevas

**Inventario y costo**

- `stock_movements` — el libro. `product_id`, `variant`, `type`, `qty` (con signo), `qty_after`,
  `location`, `ref_type`, `ref_id`, `unit_cost`, `note`, `at`, `by`, `legacy_id`.
  Tipos: `entry`, `sale`, `consignment_out`, `consignment_return`, `return`, `gift`, `shrink`,
  `adjust`.
  Ubicaciones: `bodega`, `consignado:<customer_id>`, `reservado`.
  `stock.qty` refleja solo lo **vendible en bodega**; lo consignado sigue siendo inventario propio
  pero no vendible por la web.
- `lots` — un pedido a proveedor. `supplier`, `date`, `currency`, `merch_total`, `payment_fee`
  (PayPal y similares), `inland_freight` (envío dentro del país de origen), `bank_charge` (el cargo
  real en quetzales, del que sale el TC efectivo), `intl_freight`, `allocation_method`
  (`weight` / `value`), `landed_total`.
- `lot_items` — `lot_id`, `product_id`, `variant`, `qty`, `unit_merch_cost`, `unit_freight`,
  `unit_landed_cost`, `weight_kg`.
- `purchases` / `purchase_items` — la compra como documento; genera el lote, la entrada de stock
  y la salida de caja.

**Costeo:** promedio ponderado móvil por variante para el P&L, guardando el lote de origen para
auditoría. FIFO es más exacto pero no compensa la complejidad a este volumen.

**Comercial**

- `customers` — `name`, `phone` (normalizado `+502…`), `email`, `address`, `municipio`, `type`
  (`retail` / `mayorista`), `price_list`, `notes`, `consent_marketing`, `user_id` (opcional, si
  tiene cuenta), `legacy_id`.
- `order_items` — normalizado, para reportes y margen por producto/canal. Convive con el jsonb:
  uno es el recibo, el otro es el dato analizable.
- `price_lists` / `price_list_items` — detalle, mayoreo, y listas por cliente. Sustituye a
  `salePrice` / `wholesalePrice`.
- `consignments` / `consignment_items` — `customer_id`, `status` por ítem
  (`pendiente` / `vendido` / `devuelto`), `sale_price`, fechas.
- `account_entries` — cuenta corriente de mayoreo: cargos, abonos, saldo por cliente.
- `interactions` — `customer_id`, `channel`, `direction`, `note`, `at`, `by`.
- `tasks` — `title`, `customer_id`, `due_at`, `done`.

**Dinero**

- `cashflows` — `type` (`income` / `expense`), `group` (**`inventory`** / **`operating`**),
  `category`, `description`, `amount`, `ref_type`, `ref_id`, `date`.
  La separación en `group` es lo que hoy no existe y causa el doble conteo.

**Operación**

- `backup_runs` — metadatos de cada respaldo: cuándo, quién, tamaño, ruta en Storage, conteos.
- `settings` — clave/valor, como ya funciona.

---

## 4. Reglas de negocio

### 4.1 Una sola venta, venga de donde venga

Toda venta pasa por `place_order`, que ya es atómico y anti-sobreventa. La venta de mostrador y
la de mayoreo **no son flujos aparte**: son la misma orden con distinto `channel` y distinta lista
de precios. Canales: `web`, `mostrador`, `mayoreo`, `consignacion`.

Pendiente heredado y ahora obligatorio: `place_order` debe **recomputar el precio por variante**
en el servidor. Hoy el precio del ítem llega del cliente; con listas de precios eso deja de ser
aceptable.

### 4.2 Consignación

Es el corazón del negocio y lo más delicado de modelar. El producto sale de la bodega pero
**sigue siendo propiedad de FITFUEL** hasta que el gimnasio lo vende.

- Entregar en consignación: `consignment_out` mueve unidades de `bodega` a
  `consignado:<customer_id>`. **Baja el stock vendible** (si no, se sobrevende en la web) pero
  **no es venta**: no hay ingreso, no hay costo en el P&L.
- Marcar vendido: genera la orden con `channel = consignacion`, ahí sí ingreso y costo.
- Marcar devuelto: `consignment_return` regresa a bodega.
- El valor del inventario y los reportes deben sumar **bodega + consignado**. Solo el stock
  vendible de la web usa bodega.

### 4.3 Flete, costo y flujo de caja

- **Flete de entrada → costo del producto** (costo puesto en bodega). Sin ese flete la mercadería
  no está en la bodega, así que el costo es inseparable del producto.
- **Flete de salida → gasto de operación.**
- El flujo de caja **igual registra la compra de inventario**, porque el dinero sí salió. Son dos
  preguntas distintas: flujo de caja = *¿cuánto dinero tengo?*; P&L = *¿estoy ganando?* (solo
  cuenta el costo de lo ya vendido).
- **Una compra se registra una sola vez** y dispara tres cosas:
  1. entrada de stock con costo puesto en bodega por unidad;
  2. salida de caja con `group = inventory`;
  3. **nada en el P&L** hasta que la unidad se venda.
- ⚠️ **Los costos registrados están subestimados 15.24 % (verificado 18 sep 2026 contra la
  factura del pedido del 20 de abril).** Los `buyPrice` se calcularon aplicando un **tipo de
  cambio plano de 0.46 Q/MXN sobre el precio de lista**, sin sumar nada más. Faltan cuatro cosas:
  la comisión de PayPal (4.8 %), el envío interno en México (3GUERRAS, $169 MXN), el margen
  cambiario del banco, y el flete a Huehuetenango (Q458).

  Pedido del 20 de abril, 53 unidades: $13,966 MXN de mercadería + $169 de 3GUERRAS = $14,135,
  × 1.048 de PayPal = **$14,813.48 MXN**, que el banco cobró como **Q6,945.51** (TC efectivo real
  **0.468864**, no 0.46). Más **Q458** de flete = **Q7,403.51 puesto en bodega**.

  | Producto | Uds | Lista MXN | Registrado | **Real puesto en bodega** |
  |---|---|---|---|---|
  | Omega 3 (90 s) | 5 | $150 | Q69.00 | **Q79.52** |
  | Magnesio | 10 | $129 | Q59.34 | **Q68.38** |
  | Creatina 500 g | 10 | $239 | Q109.94 | **Q126.70** |
  | German Creapure 300 g | 10 | $239 | Q109.94 | **Q126.70** |
  | Creatina 1.05 kg | 18 | $397 | Q182.62 | **Q210.45** |

  El factor es **1.1524 idéntico en las cinco líneas**, lo que confirma que es un error de método
  y no de captura: 1.0811 por PayPal + 3GUERRAS + spread bancario, y 1.0659 por el flete.

  **Las otras 23 unidades del "Stock inicial" (76 en total) no vienen de este pedido** — son
  existencias anteriores que se cargaron a la app el mismo día: las 5 Full Protein (4 de 4.4 lb y
  1 de 10 lb, que no aparecen en esta factura) más 2 creatinas de 500 g, 4 de 1.05 kg, 4 de
  magnesio y 8 de Omega 3. Su costo real sigue sin documentar: hace falta la factura de esa compra
  anterior. Mientras tanto, lo razonable es asumir el mismo error de método y aplicarles el 1.1524,
  marcándolo como estimado.

  **Efecto en el modelo del primer drop:** la creatina 500 g cuesta **Q126.70**, no Q109.94, así
  que el regalo a los 5 influencers cuesta **Q633.48** y no Q549.70. El margen a Q299 sigue siendo
  excelente (**57.6 %**), pero la utilidad del drop baja ~Q84 respecto de lo modelado.

- ⚠️ **Discrepancia de producto:** la factura dice **CITRATO de magnesio** y tanto GymStockPro como
  la web dicen **GLICINATO de magnesio**. No son la misma sal ni tienen la misma absorción. Para
  una tienda cuyo posicionamiento es "sin promesas milagro", vale confirmarlo en la etiqueta física
  antes del drop y corregir donde corresponda.

- **Lo que esto exige del modelo de datos:** el lote debe capturar **cinco** conceptos, no tres —
  mercadería, comisión de la pasarela de pago, flete interno del país de origen, margen cambiario
  del banco y flete internacional. El costo puesto en bodega se calcula del **cargo real del
  banco**, nunca de un tipo de cambio supuesto.

Gastos de operación reales: Meta Ads, marketing del drop, combustible y entregas locales, empaque,
hosting y dominio, comisiones bancarias no atribuibles a un pedido.

### 4.4 Precios

Tres niveles por variante: **detalle**, **mayoreo** y **lista específica por cliente**. Reglas:

- El precio de la web y el de mostrador son el mismo. Un cliente no puede pagar Q150 en persona
  por un Omega 3 que la web ofrece a Q199.
- **Alerta de precio piso:** si el precio aplicado deja el margen por debajo de un umbral
  configurable, el sistema avisa antes de cerrar la venta. Con Gold Standard 5 lb al 9.5 %, un
  descuento de mayoreo deja pérdida.

---

## 5. Módulos del panel unificado

| Módulo | Origen | Notas |
|---|---|---|
| **Inicio** | Ambos | P&L, stock bajo y agotado, consignaciones pendientes, a quién escribir hoy |
| **Ventas** | GymStock | Carrito, descuento, cliente, canal, ticket, devoluciones parciales. Pensado para celular |
| **Pedidos web** | admin.html | Estados y correo al cliente vía Resend |
| **Consignaciones** | GymStock | Entregar, marcar vendido/devuelto, ticket imprimible y compartible |
| **Clientes / CRM** | Nuevo | Ficha, historial, segmentos, recompra, interacciones, cuenta corriente |
| **Inventario** | Ambos | Existencias por variante y ubicación, libro de movimientos, conteo físico |
| **Catálogo** | admin.html | Productos, variantes, packs, blog, testimonios, reseñas, publicar |
| **Compras** | GymStock (vacío) | Pedido a proveedor, lote, costo puesto en bodega. Sustituye al Excel |
| **Caja** | GymStock | Con la separación inventario / operación |
| **Reportes** | Ambos | Ventas, inventario, ganancias, consignación, movimientos, canal, atribución |
| **Ajustes** | Ambos | Marca, listas de precios, usuarios, **respaldos** |

**En el celular** solo se muestran los que se usan de pie: Ventas, Consignaciones, Inventario,
Clientes. El resto queda en escritorio.

---

## 6. CRM

### 6.1 Identidad

**La llave es el teléfono, no el correo.** Un cliente que compró en la web con correo y en
persona con teléfono tiene que ser una sola ficha.

- Teléfono normalizado a `+502…` y **obligatorio** al crear un cliente. Hoy los 3 clientes
  existentes no tienen ninguno: es la primera deuda de datos a saldar.
- Detección de duplicados al crear y función de fusión desde el día uno. Limpiarlo después es lo
  caro.
- `customers` (ficha comercial) separado de `profiles` (cuenta de acceso), ligados opcionalmente.
  Un cliente de mostrador no tiene cuenta y no debería necesitarla.

### 6.2 Ficha y segmentos

Ficha: compras, LTV, ticket promedio, productos que compra, última compra, días desde la última,
canal preferido, notas libres, saldo en cuenta corriente.

Segmentos automáticos (RFM simplificada): nuevo, activo, en riesgo, dormido, VIP, mayorista.

### 6.3 La función que convierte el CRM en ventas

**Fecha estimada de recompra por producto.** Cada variante lleva un campo `days_supply`
(proteína 2 lb ≈ 29 servicios ≈ 1 mes; creatina 500 g ≈ 100 días). Con la última compra y ese
dato, el sistema arma cada mañana una lista corta: *"hoy escríbele a estas seis personas, se les
está acabando"*. Eso vende; los reportes no.

Para mayoreo, el equivalente es el **ritmo por cuenta**: *"este gimnasio pide cada 4 semanas y
lleva 6 sin pedir"*.

### 6.4 Contacto

WhatsApp, no correo. Fase 1: plantillas con enlace `wa.me` desde la ficha — cero costo, cero API,
y cada envío se registra como interacción con un botón. Fase 2, solo si el volumen lo justifica:
API de WhatsApp Business con plantillas aprobadas.

Regla de higiene: escribir solo a quien compró o dio permiso (`consent_marketing`), con salida
fácil. WhatsApp banea por spam y no avisa.

### 6.5 Mayoreo

- Listas de precios por nivel y mínimos de compra por nivel.
- **Cuenta corriente**: pedido a crédito, saldo, fecha de pago. Es el riesgo número uno del canal —
  vender fiado y perder el rastro.
- Cotización → pedido: documento que se manda por WhatsApp y que al aceptarse se convierte en
  orden y **reserva stock**.

### 6.6 Atribución

`promo_codes` con `owner` (un código por influencer y por campaña), UTM guardada en la orden, y
un "¿cómo nos conociste?" en la venta manual. De ahí salen CAC por canal, ROAS de Meta Ads y
ventas por influencer — y el costo real del regalo.

### 6.7 Reposición

Días de inventario y punto de reorden por variante, con el **lead time real** de traer de México
como parámetro. La alerta útil es *"a este ritmo `crea-meta-500` se acaba en 9 días y el pedido
tarda 25"*.

---

## 7. Respaldos

Al pasar a Supabase los datos dejan de estar en un archivo propio. Lo que debe existir:

- **Exportar**: botón que arme el snapshot completo en el **mismo formato `rev` + `stores`** que
  GymStockPro, para que el JSON viejo y el nuevo sean intercambiables. Se descarga y se guarda en
  un bucket **privado** de Storage.
- **Automático**: job diario que escriba el snapshot y conserve los últimos N. Sustituye a las 60
  copias rotativas.
- **Restaurar, no mezclar.** Es la parte peligrosa:
  1. previsualización antes de aplicar — cuántos registros, qué fechas, qué cambia;
  2. elección explícita entre *reemplazar todo* y *solo lo faltante*;
  3. respaldo automático justo antes de restaurar;
  4. ante un archivo ilegible, negarse a continuar.
- El JSON lleva nombres, teléfonos y direcciones. **Bucket privado, nunca público.**
- Supabase ya hace sus propios respaldos. Estos son por **portabilidad y confianza**, no los
  sustituyen.

---

## 8. Seguridad y roles

- **Autenticación**: sesión persistente de Supabase + **PIN local como candado de pantalla**. El
  PIN deja de ser la autenticación (hoy sí lo es) y pasa a ser comodidad de mostrador.
- **Roles**: `owner` ve todo; `vendedor` vende y consulta stock pero **no ve costos, márgenes ni
  P&L**, y no borra. La tabla `costs` ya es privada — esa línea se mantiene y se extiende a
  `lots`, `purchases` y `cashflows`.
- **RLS en todas las tablas nuevas**, sin excepción.
- Datos de clientes: mínimos necesarios, consentimiento explícito para marketing, y el export de
  respaldo tratado como dato sensible.

---

## 9. Migración

### 9.1 Mapeo de catálogo

Los ids no se parecen (`10`, sku `001` vs `meta-full-protein-44`). Se mapean **a mano los 7**, se
conservan los ids de la web y el id numérico viejo se guarda como `legacy_id` en cada tabla, para
poder reimportar el JSON sin duplicar.

### 9.2 Orden de carga

1. `customers` ← `clients` (3 registros; los teléfonos se completan a mano).
2. `stock_movements` ← `movements` (61), respetando fechas y `qty_after` original.
3. `orders` + `order_items` ← `sales` (22), con `channel` derivado de `type`
   (`wholesale` → mayoreo, `retail` → mostrador, `cost` → revisar caso por caso) y
   `consignment_id` desde `fromConsignment`.
4. `consignments` + `consignment_items` ← `consignments` (7). **Las 8 unidades pendientes son lo
   más importante de toda la migración**: son inventario que no está ni en bodega ni vendido.
5. `cashflows` ← `cashflows` (1), asignando `group`. El Q458 queda como `inventory` del lote de
   mayo, no como gasto de operación.
6. Conteo físico y `adjust` final para cuadrar contra la realidad.

### 9.3 Regla de corte

Se define un día y una hora a partir de los cuales **GymStockPro pasa a solo lectura**. Nada de
operar en los dos a la vez: eso es exactamente lo que produjo las divergencias actuales.

---

## 10. Decisiones abiertas

1. **Precios al unificar** — 5 de 7 difieren. ¿Ganan los de la web (más altos en 4 casos)? Subir
   el precio de mostrador de Omega 3 de Q150 a Q199 es un 33 % para quien ya compraba en persona.
2. **Mayoreo: ¿por nivel o por cliente?** Niveles es más simple de sostener; por cliente es más
   flexible y más fácil de desordenar.
3. **Facturación (FEL)** — un gimnasio va a pedir factura. ¿El número sale del sistema o solo se
   registra en la orden?
4. **Registro sanitario MSPAS** — vender a gimnasios expone más que vender a consumidor final.
5. **¿Alguien más va a usar el sistema?** Define si el rol `vendedor` se construye ahora o después.
6. **Lead time real** de un pedido a MG Suplementos, para el punto de reorden.

---

## 11. Fases

**Fase 0 — Cuadre (sin código).**
Conteo físico de los 7 productos duplicados, decisión de precios, recálculo de costos desde el
cargo real del banco (Q6,945.51 + Q458), y la factura de las 23 unidades que no vienen del pedido
del 20 de abril.
*Terminado cuando:* existe un número de stock y un precio por variante que no se discute.

**Fase 1 — Catálogo y stock.**
Variantes como unidad vendible, `stock_movements` con trigger hacia `stock`, ubicaciones, tres
listas de precios, mapeo de ids con `legacy_id`.
*Terminado cuando:* el stock de la web se mueve solo desde el libro de movimientos.

**Fase 2 — Ventas.**
Módulo de ventas en el celular, canales, devoluciones parciales, precio recomputado en el
servidor, todo sobre `place_order`.
*Terminado cuando:* una venta de mostrador descuenta el stock que ve la web.

**Fase 3 — Consignaciones.**
Entregas, marcar vendido/devuelto, tickets, y migración de las 8 unidades pendientes.
*Terminado cuando:* el inventario consignado se ve separado del vendible y suma en el valor total.

**Fase 4 — Clientes y CRM.**
Fichas con teléfono, fusión de duplicados, historial, segmentos, recompra, interacciones, cuenta
corriente de mayoreo.
*Terminado cuando:* existe la lista diaria de "a quién escribirle hoy" y se puede actuar sobre ella.

**Fase 5 — Compras y caja.**
Pedido a proveedor con costo puesto en bodega y prorrateo por peso, flujo de caja con la separación
inventario / operación.
*Terminado cuando:* el Excel del pedido deja de usarse.

**Fase 6 — Respaldos, reportes y apagado.**
Export/import, job diario, reportes unificados por canal y atribución. Se apaga GymStockPro, el
túnel y el servidor de la oficina.
*Terminado cuando:* la PC de la oficina se puede apagar sin que nadie lo note.

---

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| Perder las 8 unidades en consignación durante la migración | Migrarlas primero y verificarlas contra el ticket físico antes de cortar |
| Operar en los dos sistemas a la vez | Regla de corte con fecha y hora; GymStockPro a solo lectura |
| Heredar costos subestimados 15.24 % | Recalcular los `buyPrice` desde el cargo real del banco en fase 0. Conseguir la factura de las 23 unidades anteriores |
| Que el drop salga con el stock descuadrado | Conteo físico ya, sin esperar al código |
| CRM sin teléfonos | Teléfono obligatorio y campaña de captura desde la fase 4 |
| Sobre-construir | Con 30-60 clientes el CRM útil es "lista de gente + qué compró + a quién escribo hoy". Nada de automatizaciones de correo antes de tener volumen |
| Quedarse sin el respaldo propio al migrar a la nube | Export en formato compatible desde la fase 6, bucket privado |
