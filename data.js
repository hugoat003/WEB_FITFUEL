// FITFUEL — catálogo y contenido (Guatemala). Globals en window.
window.FF = window.FF || {};

// Umbral de envío gratis (Quetzales)
FF.FREE_SHIP = 400;

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
  {
    id: "whey-vainilla", name: "Whey Protein", flavor: "Vainilla Cremosa",
    cat: "proteina", price: 339, oldPrice: 425, rating: 4.9, reviews: 1284,
    badge: "BESTSELLER", goals: ["musculo", "recovery"], hue: 92,
    blurb: "24g de proteína de suero por servicio. Se mezcla sin grumos.",
    facts: [["Proteína", "24g"], ["BCAAs", "5.5g"], ["Servicios", "30"]],
  },
  {
    id: "whey-choco", name: "Whey Protein", flavor: "Chocolate Belga",
    cat: "proteina", price: 339, oldPrice: 425, rating: 4.8, reviews: 980,
    badge: null, goals: ["musculo", "recovery"], hue: 40,
    blurb: "El clásico chocolate, ahora más cremoso. 24g de proteína limpia.",
    facts: [["Proteína", "24g"], ["BCAAs", "5.5g"], ["Servicios", "30"]],
  },
  {
    id: "iso-fresa", name: "Iso Whey Zero", flavor: "Fresa",
    cat: "proteina", price: 409, oldPrice: null, rating: 4.7, reviews: 612,
    badge: "0 AZÚCAR", goals: ["definir", "musculo"], hue: 12,
    blurb: "Aislado de suero ultrafiltrado. 27g de proteína, 0g de azúcar.",
    facts: [["Proteína", "27g"], ["Azúcar", "0g"], ["Servicios", "28"]],
  },
  {
    id: "vegana", name: "Plant Protein", flavor: "Cacao",
    cat: "proteina", price: 365, oldPrice: null, rating: 4.6, reviews: 340,
    badge: "VEGANA", goals: ["definir", "recovery"], hue: 150,
    blurb: "Mezcla de guisante y arroz. Perfil completo de aminoácidos, 100% vegetal.",
    facts: [["Proteína", "22g"], ["Fibra", "4g"], ["Servicios", "30"]],
  },
  {
    id: "crea-mono", name: "Creatina Monohidrato", flavor: "Sin sabor · 300g",
    cat: "creatina", price: 199, oldPrice: 255, rating: 5.0, reviews: 2150,
    badge: "TOP VENTAS", goals: ["musculo", "energia"], hue: 200,
    blurb: "Creapure® micronizada. El suplemento más estudiado del mundo.",
    facts: [["Por dosis", "5g"], ["Servicios", "60"], ["Pureza", "99.9%"]],
  },
  {
    id: "crea-hcl", name: "Creatina HCL", flavor: "Limón · 180g",
    cat: "creatina", price: 255, oldPrice: null, rating: 4.7, reviews: 410,
    badge: null, goals: ["musculo", "energia"], hue: 110,
    blurb: "Mayor solubilidad, sin retención. Para quien busca dosis bajas.",
    facts: [["Por dosis", "2g"], ["Servicios", "90"], ["Solubilidad", "Alta"]],
  },
  {
    id: "ignite", name: "Pre-Entreno IGNITE", flavor: "Sandía Helada",
    cat: "pre", price: 295, oldPrice: 339, rating: 4.8, reviews: 870,
    badge: "INTENSO", goals: ["energia", "definir"], hue: 350,
    blurb: "300mg cafeína, citrulina y beta-alanina. Foco y bombeo brutal.",
    facts: [["Cafeína", "300mg"], ["Citrulina", "6g"], ["Servicios", "25"]],
  },
  {
    id: "pump-zero", name: "Pre-Entreno PUMP", flavor: "Mojito · Sin estimulantes",
    cat: "pre", price: 279, oldPrice: null, rating: 4.5, reviews: 295,
    badge: "0 CAFEÍNA", goals: ["energia", "musculo"], hue: 160,
    blurb: "Bombeo sin nervios. Ideal para entrenar de noche.",
    facts: [["Citrulina", "8g"], ["Glicerol", "3g"], ["Servicios", "25"]],
  },
  {
    id: "bcaa", name: "BCAA 2:1:1", flavor: "Mango · Maracuyá",
    cat: "amino", price: 235, oldPrice: null, rating: 4.6, reviews: 520,
    badge: null, goals: ["recovery", "definir"], hue: 60,
    blurb: "Aminoácidos ramificados para reducir el catabolismo intra-entreno.",
    facts: [["BCAA", "7g"], ["Electrolitos", "Sí"], ["Servicios", "30"]],
  },
  {
    id: "glutamina", name: "L-Glutamina", flavor: "Sin sabor · 250g",
    cat: "amino", price: 195, oldPrice: null, rating: 4.4, reviews: 180,
    badge: null, goals: ["recovery"], hue: 220,
    blurb: "Apoya la recuperación muscular y la salud intestinal.",
    facts: [["Por dosis", "5g"], ["Servicios", "50"], ["Pureza", "99%"]],
  },
  {
    id: "omega", name: "Omega-3 Ultra", flavor: "90 cápsulas",
    cat: "salud", price: 169, oldPrice: 210, rating: 4.8, reviews: 740,
    badge: null, goals: ["recovery", "definir"], hue: 30,
    blurb: "EPA y DHA de alta concentración. Salud cardiovascular y articular.",
    facts: [["EPA+DHA", "800mg"], ["Cápsulas", "90"], ["Origen", "Pescado"]],
  },
  {
    id: "zma", name: "ZMA Recovery", flavor: "120 cápsulas",
    cat: "salud", price: 185, oldPrice: null, rating: 4.5, reviews: 260,
    badge: "DESCANSO", goals: ["recovery", "musculo"], hue: 270,
    blurb: "Zinc, magnesio y B6 para un sueño profundo y mejor recuperación.",
    facts: [["Zinc", "30mg"], ["Magnesio", "450mg"], ["Cápsulas", "120"]],
  },
];

// Bundles / packs (precios en Quetzales GTQ)
FF.BUNDLES = [
  {
    id: "pack-volumen", name: "Pack VOLUMEN", tagline: "Gana masa sin pensar",
    items: ["Whey Protein", "Creatina Mono", "ZMA Recovery"], price: 679, value: 849,
    goal: "musculo", hue: 92,
  },
  {
    id: "pack-definicion", name: "Pack DEFINICIÓN", tagline: "Marca cada fibra",
    items: ["Iso Whey Zero", "BCAA 2:1:1", "Omega-3 Ultra"], price: 719, value: 879,
    goal: "definir", hue: 12,
  },
  {
    id: "pack-energia", name: "Pack ENERGÍA", tagline: "Domina cada sesión",
    items: ["Pre-Entreno IGNITE", "Creatina Mono", "Omega-3 Ultra"], price: 595, value: 719,
    goal: "energia", hue: 350,
  },
];

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
  "ENVÍO GRATIS +Q400", "TESTADO EN LABORATORIO", "+50,000 ATLETAS", "30 DÍAS DE GARANTÍA",
  "SIN AZÚCARES OCULTOS", "ENVÍO A TODA GUATEMALA",
];

// Datos de contacto / negocio (Guatemala)
FF.CONTACT = {
  address: "13 Calle 2-60, Zona 10, Ciudad de Guatemala",
  city: "Ciudad de Guatemala, Guatemala",
  phone: "+502 2245 6700",
  whatsapp: "+502 5512 8800",
  whatsappLink: "https://wa.me/50255128800",
  email: "hola@fitfuel.gt",
  hours: "Lun a Vie 8:00–18:00 · Sáb 9:00–13:00",
};

// Preguntas frecuentes
FF.FAQ = [
  { q: "¿Hacen envíos a todo el país?", a: "Sí. Enviamos a los 22 departamentos de Guatemala. En la Ciudad de Guatemala y zonas cercanas el envío suele tardar 24-48 horas; al interior, de 2 a 4 días hábiles." },
  { q: "¿Cuánto cuesta el envío?", a: "El envío estándar tiene un costo de Q35. En pedidos mayores a Q400 el envío es totalmente gratis a toda Guatemala." },
  { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos tarjetas Visa y Mastercard, transferencia bancaria y pago contra entrega (efectivo) en la Ciudad de Guatemala." },
  { q: "¿Los productos son originales?", a: "100%. Todos nuestros suplementos son originales, sellados y testados en laboratorio. Cada lote cuenta con su certificado de análisis." },
  { q: "¿Puedo devolver un producto?", a: "Sí. Tienes 30 días desde la compra para devolver cualquier producto sin abrir y recibir tu reembolso completo. Ver la página de Devoluciones para el detalle." },
  { q: "¿Cómo sé qué suplemento necesito?", a: "Usa nuestro selector de objetivos: eliges tu meta (ganar músculo, definir, energía o recuperación) y te mostramos exactamente lo que necesitas." },
];

// Load custom data saved from admin panel
(function () {
  try {
    const saved = JSON.parse(localStorage.getItem('ff_data'));
    if (!saved) return;
    if (saved.products)     FF.PRODUCTS     = saved.products;
    if (saved.bundles)      FF.BUNDLES      = saved.bundles;
    if (saved.blog)         FF.BLOG         = saved.blog;
    if (saved.testimonials) FF.TESTIMONIALS = saved.testimonials;
    if (saved.stats)        FF.STATS        = saved.stats;
    if (saved.categories)   FF.CATEGORIES   = saved.categories;
    if (saved.goals)        FF.GOALS        = saved.goals;
  } catch (e) {}
})();
