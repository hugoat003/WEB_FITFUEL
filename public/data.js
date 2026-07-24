// FITFUEL — catálogo y contenido (Guatemala). Globals en window.
window.FF = window.FF || {};

// Umbral de envío gratis (Quetzales)
FF.FREE_SHIP = 400;

// Costo de envío estándar (Quetzales) — editable desde el admin
FF.SHIP_COST = 35;

// Umbral de "Últimas unidades" (avisa escasez sin mostrar la cantidad exacta)
FF.LOW_STOCK = 5;

// Categorías
FF.CATEGORIES = [
  { id: "all", label: "Todo" },
  { id: "proteina", label: "Proteínas" },
  { id: "creatina", label: "Creatina" },
  { id: "pre", label: "Pre-entreno" },
  { id: "amino", label: "Aminoácidos" },
  { id: "salud", label: "Vitaminas" },
];

// Objetivos (para el quiz)
FF.GOALS = [
  { id: "musculo", label: "Ganar músculo", desc: "Construir masa y fuerza", icon: "muscle" },
  { id: "definir", label: "Definir", desc: "Quemar grasa, marcar", icon: "flame" },
  { id: "energia", label: "Energía", desc: "Rendir más en cada sesión", icon: "bolt" },
  { id: "recovery", label: "Recuperación", desc: "Volver más rápido", icon: "leaf" },
];

// Productos (precios en Quetzales GTQ)
FF.PRODUCTS = [
  { id: "whey-vainilla", name: "Whey Protein", flavor: "Vainilla",
    cat: "proteina", price: 339, oldPrice: 425, rating: 4.9, reviews: 2264,
    badge: "BESTSELLER", goals: ["musculo", "recovery"], hue: 92, stock: 48,
    blurb: "24g de proteína de suero por servicio. Se mezcla sin grumos.",
    facts: [["Proteína", "24g"], ["BCAAs", "5.5g"], ["Servicios", "30"]],
    variants: [
      { flavor: "Vainilla",  size: "907 g · 2 lb",  price: 339, images: [], facts: [["Proteína", "24g"], ["BCAAs", "5.5g"], ["Servicios", "30"]] },
      { flavor: "Vainilla",  size: "1.8 kg · 4 lb", price: 589, images: [], facts: [["Proteína", "24g"], ["BCAAs", "5.5g"], ["Servicios", "60"]] },
      { flavor: "Chocolate", size: "907 g · 2 lb",  price: 339, images: [], facts: [["Proteína", "24g"], ["BCAAs", "5.4g"], ["Servicios", "30"]] },
      { flavor: "Chocolate", size: "1.8 kg · 4 lb", price: 589, images: [], facts: [["Proteína", "24g"], ["BCAAs", "5.4g"], ["Servicios", "60"]] },
    ] },
  { id: "iso-fresa", name: "Iso Whey Zero", flavor: "Fresa",
    cat: "proteina", price: 409, oldPrice: null, rating: 4.7, reviews: 612,
    badge: "0 AZÚCAR", goals: ["definir", "musculo"], hue: 12, stock: 22,
    blurb: "Aislado de suero ultrafiltrado. 27g de proteína, 0g de azúcar.",
    facts: [["Proteína", "27g"], ["Azúcar", "0g"], ["Servicios", "28"]],
    sizes: [{ label: "900 g", price: 409 }, { label: "1.8 kg", price: 729 }] },
  { id: "vegana", name: "Plant Protein", flavor: "Cacao",
    cat: "proteina", price: 365, oldPrice: null, rating: 4.6, reviews: 340,
    badge: "VEGANA", goals: ["definir", "recovery"], hue: 150, stock: 18,
    blurb: "Mezcla de guisante y arroz. Perfil completo de aminoácidos, 100% vegetal.",
    facts: [["Proteína", "22g"], ["Fibra", "4g"], ["Servicios", "30"]] },
  { id: "crea-mono", name: "Creatina Monohidrato", flavor: "Sin sabor · 300g",
    cat: "creatina", price: 199, oldPrice: 255, rating: 5.0, reviews: 2150,
    badge: "TOP VENTAS", goals: ["musculo", "energia"], hue: 200, stock: 75,
    blurb: "Creapure® micronizada. El suplemento más estudiado del mundo.",
    facts: [["Por dosis", "5g"], ["Servicios", "60"], ["Pureza", "99.9%"]],
    sizes: [{ label: "300 g · 60 serv", price: 199 }, { label: "500 g · 100 serv", price: 299 }] },
  { id: "crea-hcl", name: "Creatina HCL", flavor: "Limón · 180g",
    cat: "creatina", price: 255, oldPrice: null, rating: 4.7, reviews: 410,
    badge: null, goals: ["musculo", "energia"], hue: 110, stock: 30,
    blurb: "Mayor solubilidad, sin retención. Para quien busca dosis bajas.",
    facts: [["Por dosis", "2g"], ["Servicios", "90"], ["Solubilidad", "Alta"]] },
  // Creatina MetaNutrition — dos presentaciones como productos SEPARADOS (cada uno su
  // card), unidos por `group` para que el selector de Tamaño del PDP navegue entre ellos.
  { id: "crea-meta-500", name: "Creatina MetaNutrition", flavor: "Sin sabor · 500 g",
    cat: "creatina", price: 199, oldPrice: null, rating: 4.9, reviews: 0,
    badge: "+10 TOMAS GRATIS", goals: ["musculo", "energia"], hue: 190, stock: null,
    group: "crea-meta", sizeLabel: "500 g",
    image: "/img/creatina-meta-500-front.webp",
    blurb: "Creatina monohidratada micronizada 100% pura (Creatine+ de Meta Nutrition). 5g por toma, 0 calorías, sin sabor y apta para veganos. Edición especial con 10 tomas gratis.",
    facts: [["Por dosis", "5g"], ["Servicios", "~110"], ["Pureza", "100%"]],
    variants: [
      { flavor: "Sin sabor", size: "500 g · ~110 tomas", price: 199, images: ["/img/creatina-meta-500-front.webp", "/img/creatina-meta-500-nutri2.webp"], facts: [["Por dosis", "5g"], ["Servicios", "~110"], ["Creatina", "100%"]] },
    ] },
  { id: "crea-meta-1050", name: "Creatina MetaNutrition", flavor: "Sin sabor · 1050 g",
    cat: "creatina", price: 449, oldPrice: null, rating: 4.9, reviews: 0,
    badge: "+10 TOMAS GRATIS", goals: ["musculo", "energia"], hue: 190, stock: null,
    group: "crea-meta", sizeLabel: "1050 g",
    image: "/img/creatina-meta-1050-front.webp",
    blurb: "Creatina monohidratada micronizada 100% pura (Creatine+ de Meta Nutrition). 5g por toma, 0 calorías, sin sabor y apta para veganos. Edición especial con 10 tomas gratis.",
    facts: [["Por dosis", "5g"], ["Servicios", "~210"], ["Pureza", "100%"]],
    variants: [
      { flavor: "Sin sabor", size: "1050 g · ~210 tomas", price: 449, images: ["/img/creatina-meta-1050-front.webp", "/img/creatina-meta-1050-back.webp"], facts: [["Por dosis", "5g"], ["Servicios", "~210"], ["Creatina", "100%"]] },
    ] },
  { id: "ignite", name: "Pre-Entreno IGNITE", flavor: "Sandía Helada",
    cat: "pre", price: 295, oldPrice: 339, rating: 4.8, reviews: 870,
    badge: "INTENSO", goals: ["energia", "definir"], hue: 350, stock: 40,
    blurb: "300mg cafeína, citrulina y beta-alanina. Foco y bombeo brutal.",
    facts: [["Cafeína", "300mg"], ["Citrulina", "6g"], ["Servicios", "25"]],
    sizes: [{ label: "300 g · 25 serv", price: 295 }, { label: "600 g · 50 serv", price: 519 }] },
  { id: "pump-zero", name: "Pre-Entreno PUMP", flavor: "Mojito · Sin estimulantes",
    cat: "pre", price: 279, oldPrice: null, rating: 4.5, reviews: 295,
    badge: "0 CAFEÍNA", goals: ["energia", "musculo"], hue: 160, stock: 25,
    blurb: "Bombeo sin nervios. Ideal para entrenar de noche.",
    facts: [["Citrulina", "8g"], ["Glicerol", "3g"], ["Servicios", "25"]] },
  { id: "bcaa", name: "BCAA 2:1:1", flavor: "Mango · Maracuyá",
    cat: "amino", price: 235, oldPrice: null, rating: 4.6, reviews: 520,
    badge: null, goals: ["recovery", "definir"], hue: 60, stock: 33,
    blurb: "Aminoácidos ramificados para reducir el catabolismo intra-entreno.",
    facts: [["BCAA", "7g"], ["Electrolitos", "Sí"], ["Servicios", "30"]] },
  { id: "glutamina", name: "L-Glutamina", flavor: "Sin sabor · 250g",
    cat: "amino", price: 195, oldPrice: null, rating: 4.4, reviews: 180,
    badge: null, goals: ["recovery"], hue: 220, stock: 20,
    blurb: "Apoya la recuperación muscular y la salud intestinal.",
    facts: [["Por dosis", "5g"], ["Servicios", "50"], ["Pureza", "99%"]] },
  { id: "omega", name: "Omega-3 Ultra", flavor: "90 cápsulas",
    cat: "salud", price: 169, oldPrice: 210, rating: 4.8, reviews: 740,
    badge: null, goals: ["recovery", "definir"], hue: 30, stock: 60,
    blurb: "EPA y DHA de alta concentración. Salud cardiovascular y articular.",
    facts: [["EPA+DHA", "800mg"], ["Cápsulas", "90"], ["Origen", "Pescado"]] },
  { id: "zma", name: "ZMA Recovery", flavor: "120 cápsulas",
    cat: "salud", price: 185, oldPrice: null, rating: 4.5, reviews: 260,
    badge: "DESCANSO", goals: ["recovery", "musculo"], hue: 270, stock: 15,
    blurb: "Zinc, magnesio y B6 para un sueño profundo y mejor recuperación.",
    facts: [["Zinc", "30mg"], ["Magnesio", "450mg"], ["Cápsulas", "120"]] },
];

// Bundles / packs (precios en Quetzales GTQ)
FF.BUNDLES = [
  {
    id: "pack-volumen", name: "Pack VOLUMEN", tagline: "Gana masa sin pensar",
    items: ["Whey Protein", "Creatina Mono", "ZMA Recovery"], productIds: ["whey-vainilla", "crea-mono", "zma"],
    price: 679, goal: "musculo", hue: 92,
    desc: "El stack definitivo para construir masa: proteína de calidad, la creatina más estudiada y un recuperador para descansar mejor. Todo lo que necesitas para crecer, en un solo pack y a mejor precio.",
  },
  {
    id: "pack-definicion", name: "Pack DEFINICIÓN", tagline: "Marca cada fibra",
    items: ["Iso Whey Zero", "BCAA 2:1:1", "Omega-3 Ultra"], productIds: ["iso-fresa", "bcaa", "omega"],
    price: 719, goal: "definir", hue: 12,
    desc: "Pensado para etapa de definición: aislado de proteína sin azúcar, aminoácidos para conservar músculo y Omega-3 para tu salud mientras estás en déficit. Marca cada fibra sin perder músculo.",
  },
  {
    id: "pack-energia", name: "Pack ENERGÍA", tagline: "Domina cada sesión",
    items: ["Pre-Entreno IGNITE", "Creatina Mono", "Omega-3 Ultra"], productIds: ["ignite", "crea-mono", "omega"],
    price: 595, goal: "energia", hue: 350,
    desc: "Para entrenar con todo: un pre-entreno intenso para el foco y el bombeo, creatina para la fuerza y Omega-3 para la recuperación articular. Domina cada serie.",
  },
];

// Valor "por separado" de un pack = suma de los precios reales de sus productos.
// Se calcula en runtime (refleja siempre el precio actual de cada producto).
FF.bundleValue = function (b) {
  if (b && b.productIds && b.productIds.length) {
    const sum = b.productIds.reduce((s, id) => {
      const p = FF.PRODUCTS.find((x) => x.id === id);
      return s + (p ? p.price : 0);
    }, 0);
    if (sum > 0) return sum;
  }
  return b && b.value ? b.value : b.price;
};

// ── Presentaciones (variantes SKU) ──────────────────────────────────────────
// Cada presentación: { flavor, size, price, images:[], facts:[[k,v]] }
// Etiqueta única (usada como clave de variante en el carrito):
FF.variantLabel = function (v) {
  return [v && v.flavor, v && v.size].filter(Boolean).join(" · ");
};
// Devuelve las presentaciones de un producto. Si no tiene `variants`, las
// construye desde los campos antiguos (flavors / sizes / flavor / price).
FF.variantsOf = function (p) {
  if (!p) return [];
  if (p.variants && p.variants.length) {
    return p.variants.map((v) => ({
      flavor: v.flavor || "", size: v.size || "",
      price: v.price != null ? v.price : p.price,
      images: (v.images || []).filter(Boolean),
      facts: v.facts || p.facts || [],
      stock: v.stock,
    }));
  }
  const flavors = (p.flavors && p.flavors.length) ? p.flavors : [{ label: p.flavor || "", image: p.image }];
  const sizes = (p.sizes && p.sizes.length) ? p.sizes : null;
  const out = [];
  flavors.forEach((fl) => {
    const imgs = [fl.image || p.image].filter(Boolean);
    if (sizes) {
      sizes.forEach((sz) => out.push({
        flavor: fl.label || "", size: sz.label || "",
        price: sz.price != null ? sz.price : p.price, images: imgs, facts: p.facts || [],
      }));
    } else {
      out.push({ flavor: fl.label || "", size: "", price: p.price, images: imgs, facts: p.facts || [] });
    }
  });
  return out;
};
// Imagen de una variante SIN robar la de otro sabor: usa su imagen; si no tiene,
// comparte con otra presentación del MISMO sabor; si tampoco hay, devuelve null
// (para que se muestre el placeholder). `variant` puede ser la variante ya resuelta.
FF.variantImage = function (p, variant) {
  if (variant && variant.images && variant.images.length) return variant.images[0];
  if (variant && p) {
    const vs = FF.variantsOf(p);
    const same = vs.find((v) => v.flavor === variant.flavor && v.images && v.images.length);
    if (same) return same.images[0];
  }
  return null;
};
// Stock vivo (tabla `stock` de Supabase), cargado al arranque. { 'pid|variante': qty }
FF.LIVE_STOCK = null;
FF.SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3ZHhucHl5YnpwY2pldHhlZHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNTAyOTMsImV4cCI6MjA5ODYyNjI5M30.4bRrW810z2C0Yjc6KdqZyQEEQKt_9nFa6vAxHEv75Y8";
FF.loadStock = async function () {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    const r = await fetch("https://dwdxnpyybzpcjetxedyq.supabase.co/rest/v1/stock?select=product_id,variant,qty",
      { headers: { apikey: FF.SB_ANON, Authorization: "Bearer " + FF.SB_ANON }, cache: "no-cache", signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return;
    const rows = await r.json();
    const m = {};
    rows.forEach((x) => { m[x.product_id + "|" + (x.variant || "")] = x.qty; });
    FF.LIVE_STOCK = m;
  } catch (e) {}
};
// Stock de una variante: prioriza el stock vivo de Supabase; si no, el propio de la variante;
// si no (legacy), el del producto. null = sin límite.
FF.variantStock = function (p, variant) {
  if (FF.LIVE_STOCK && p) {
    const key = p.id + "|" + (FF.variantLabel(variant) || "");
    if (key in FF.LIVE_STOCK) return FF.LIVE_STOCK[key];
  }
  if (variant && variant.stock !== undefined) return variant.stock;
  return p && p.stock != null ? p.stock : null;
};
// Stock total de un producto (suma de sus presentaciones); null si alguna es ilimitada.
FF.productStock = function (p) {
  const vs = FF.variantsOf(p);
  if (!vs.length) return p && p.stock != null ? p.stock : null;
  let sum = 0, anyNull = false;
  vs.forEach((v) => { const s = FF.variantStock(p, v); if (s == null) anyNull = true; else sum += s; });
  return anyNull ? null : sum;
};
// Busca la presentación que coincide con un sabor + tamaño (con fallbacks).
FF.findVariant = function (p, flavor, size) {
  const vs = FF.variantsOf(p);
  return vs.find((v) => v.flavor === flavor && v.size === size)
      || vs.find((v) => v.flavor === flavor)
      || vs.find((v) => v.size === size)
      || vs[0] || null;
};

// Testimonios (Guatemala)
FF.TESTIMONIALS = [
  { name: "Andrés R.", tag: "Powerlifter · Ciudad de Guatemala", quote: "La creatina de FITFUEL es la única que noto de verdad. Llevo 3 ciclos y mis marcas no paran de subir.", hue: 200 },
  { name: "Marina L.", tag: "Entrena 5x semana · Quetzaltenango", quote: "La whey de fresa se disuelve perfecta y no me cae pesada. Por fin un batido que sí me apetece tomar.", hue: 12 },
  { name: "Coach Dani", tag: "Entrenador personal · Antigua Guatemala", quote: "Recomiendo FITFUEL a todos mis clientes. Transparencia total en etiquetas y resultados que se ven.", hue: 92 },
];

// Blog (con cuerpo para la página del artículo)
FF.BLOG = [
  {
    id: "b1", cat: "Guía", title: "Creatina: cuánta tomar y cuándo (sin mitos)", read: "5 min", hue: 200,
    excerpt: "La creatina es el suplemento más estudiado del mundo. Te explicamos la dosis real, los tiempos y por qué no necesitas fase de carga.",
    body: [
      "La creatina monohidrato es, sin discusión, el suplemento deportivo con más respaldo científico. Funciona reponiendo la fosfocreatina muscular, lo que te permite generar más fuerza en esfuerzos cortos e intensos.",
      "La dosis efectiva es de 3 a 5 gramos al día, todos los días. No necesitas una fase de carga: simplemente tomando 5g diarios saturas tus depósitos en unas 3 a 4 semanas. La fase de carga solo acelera ese proceso, pero no da mejores resultados a largo plazo.",
      "¿A qué hora tomarla? No importa demasiado. La constancia gana sobre el momento exacto. Muchos la mezclan con su batido post-entreno simplemente por comodidad.",
      "Mito frecuente: la creatina no daña el riñón en personas sanas ni 'retiene grasa'. El pequeño aumento de peso inicial es agua dentro del músculo, justo donde la quieres.",
    ],
  },
  {
    id: "b2", cat: "Nutrición", title: "Proteína al día: la cifra real según tu peso", read: "7 min", hue: 92,
    excerpt: "Olvídate de las reglas mágicas. Esta es la cantidad de proteína que de verdad necesitas según tu objetivo y tu peso corporal.",
    body: [
      "La recomendación general para personas activas que quieren ganar o conservar músculo es de 1.6 a 2.2 gramos de proteína por kilo de peso corporal al día.",
      "Si pesas 70 kg, eso son entre 112 y 154 gramos diarios. Repártelos en 3 o 4 comidas con unos 30-40g de proteína cada una para maximizar la síntesis muscular.",
      "La proteína en polvo no es obligatoria, pero es la forma más práctica y económica de cerrar la brecha cuando la comida no alcanza. Un scoop de whey aporta ~24g de proteína de alta calidad.",
      "En etapa de definición sube ligeramente la proteína: ayuda a conservar músculo y aumenta la saciedad mientras estás en déficit calórico.",
    ],
  },
  {
    id: "b3", cat: "Entreno", title: "Pre-entreno sí o no: lo que dice la ciencia", read: "4 min", hue: 350,
    excerpt: "Cafeína, citrulina, beta-alanina... ¿qué ingredientes valen la pena y cuáles son relleno? Te lo contamos sin humo.",
    body: [
      "Un buen pre-entreno se sostiene sobre pocos ingredientes con evidencia real. El rey es la cafeína: 200 a 400 mg mejoran el foco, la fuerza y reducen la percepción de esfuerzo.",
      "La citrulina malato (6-8g) aumenta el flujo sanguíneo y el bombeo, y puede mejorar el rendimiento en series largas. La beta-alanina (esa sensación de hormigueo) ayuda en esfuerzos de 1 a 4 minutos cuando se toma a diario.",
      "Desconfía de las fórmulas con 20 ingredientes en dosis minúsculas: muchas veces es marketing. Menos, pero bien dosificado, rinde más.",
      "Si entrenas de noche, opta por un pre-entreno sin estimulantes para no afectar tu sueño. El descanso también construye músculo.",
    ],
  },
];

// Stats marquee (Guatemala)
FF.STATS = [
  "ENVÍO GRATIS +Q400", "TESTEADO EN LABORATORIO", "+50,000 ATLETAS", "PRODUCTOS 100% ORIGINALES",
  "SIN AZÚCARES OCULTOS", "ENVÍO A TODA GUATEMALA",
];

// Datos de contacto / negocio (Guatemala). Tienda 100% en línea.
// WhatsApp pendiente de definir: al dejarlo vacío, la UI oculta ese contacto.
FF.CONTACT = {
  address: "",            // sin local físico (tienda en línea)
  city: "Guatemala",
  phone: "",              // sin teléfono
  whatsapp: "",           // pendiente de definir
  whatsappLink: "",
  email: "contacto@fitfuelgt.com",
  hours: "",              // en línea, sin horario fijo
};

// Preguntas frecuentes
FF.FAQ = [
  { q: "¿Hacen envíos a todo el país?", a: "Sí. Enviamos a los 22 departamentos de Guatemala. En la Ciudad de Guatemala y zonas cercanas el envío suele tardar 2 a 3 días hábiles; al interior, de 2 a 4 días hábiles." },
  { q: "¿Cuánto cuesta el envío?", a: "El envío estándar tiene un costo de Q35. En pedidos mayores a Q400 el envío es totalmente gratis a toda Guatemala." },
  { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos pago contra entrega (efectivo) y transferencia bancaria. Si eliges transferencia, te enviamos los datos para completar el pago." },
  { q: "¿Los productos son originales?", a: "100%. Todos nuestros suplementos son originales, sellados y testeados en laboratorio. Cada lote cuenta con su certificado de análisis." },
  { q: "¿Aceptan devoluciones?", a: "Por higiene y seguridad del producto, no aceptamos devoluciones ni cambios una vez realizada la compra. Si tienes dudas sobre qué suplemento elegir, escríbenos por WhatsApp antes de comprar y te asesoramos sin compromiso." },
  { q: "¿Cómo sé qué suplemento necesito?", a: "Usa nuestro selector de objetivos: eliges tu meta (ganar músculo, definir, energía o recuperación) y te mostramos exactamente lo que necesitas." },
];

// URL pública del catálogo publicado (Supabase Storage). El bucket `catalog`
// debe ser público. Si el archivo aún no existe, la carga remota se ignora.
FF.PUBLIC_CATALOG_URL =
  "https://dwdxnpyybzpcjetxedyq.supabase.co/storage/v1/object/public/catalog/data.json";

// Aplica un objeto de datos (de localStorage o del catálogo remoto) sobre FF.*
FF.applyData = function (saved) {
  if (!saved) return;
  if (saved.products)     FF.PRODUCTS     = saved.products;
  if (saved.bundles)      FF.BUNDLES      = saved.bundles;
  if (saved.blog)         FF.BLOG         = saved.blog;
  if (saved.testimonials) FF.TESTIMONIALS = saved.testimonials;
  if (saved.stats)        FF.STATS        = saved.stats;
  if (saved.categories)   FF.CATEGORIES   = saved.categories;
  if (saved.goals)        FF.GOALS        = saved.goals;
  if (saved.faq)          FF.FAQ          = saved.faq;
  if (saved.contact)      FF.CONTACT      = Object.assign({}, FF.CONTACT, saved.contact);
  if (typeof saved.freeShip === "number") FF.FREE_SHIP = saved.freeShip;
  if (typeof saved.shipCost === "number") FF.SHIP_COST = saved.shipCost;
  if (typeof saved.lowStock === "number") FF.LOW_STOCK = saved.lowStock;
  if (FF.CONTACT && FF.CONTACT.whatsapp) {
    const digits = String(FF.CONTACT.whatsapp).replace(/[^0-9]/g, "");
    if (digits) FF.CONTACT.whatsappLink = "https://wa.me/" + digits;
  }
};

// Carga remota (catálogo publicado). La llama main.jsx ANTES de montar la app,
// así los visitantes ven el catálogo/ imágenes publicados. Falla en silencio.
FF.loadRemote = async function () {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500); // no bloquear el arranque más de 3.5s
    const res = await fetch(FF.PUBLIC_CATALOG_URL, { cache: "no-cache", signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) FF.applyData(await res.json());
  } catch (e) {}
};

// Datos locales (preview del panel admin en este navegador).
try { FF.applyData(JSON.parse(localStorage.getItem('ff_data'))); } catch (e) {}
