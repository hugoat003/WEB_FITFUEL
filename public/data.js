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
  { id: "all",      label: "Todo" },
  { id: "proteina", label: "Proteínas" },
  { id: "creatina", label: "Creatina" },
  { id: "pre",      label: "Pre-entreno" },
  { id: "barras",   label: "Barras" },
  { id: "vitaminas",label: "Vitaminas" },
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

  // ─────────────────────────────────────────────────────────────────────────
  // 1. GOLD STANDARD 100% WHEY — 2 lb
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "on-gold-standard-2lb",
    name: "Gold Standard 100% Whey",
    brand: "Optimum Nutrition",
    flavor: "Vainilla · Cookies & Cream",
    cat: "proteina",
    price: 489,
    oldPrice: null,          // No inventes un precio anterior: nunca lo vendiste más caro.
    rating: 0, reviews: 0,   // Sin reseñas todavía. Que la UI oculte las estrellas si reviews === 0.
    badge: "MÁS VENDIDA DEL MUNDO",
    goals: ["musculo", "recovery"],
    hue: 45,
    stock: 2,                // 1 Vainilla + 1 Cookies & Cream
    group: "on-gold-standard",
    sizeLabel: "2 lb",
    image: "/img/on-gold-standard-2lb-front.webp",
    blurb: "24 g de proteína de suero por servicio, con 5.5 g de BCAAs naturalmente presentes. La proteína más vendida del mundo, testada contra sustancias prohibidas.",
    description: [
      `Gold Standard 100% Whey es la proteína de suero más vendida del mundo, y con razón: usa aislado de suero como ingrediente principal, se disuelve sin grumos con solo una cuchara y entrega 24 g de proteína por servicio con apenas 120 calorías.`,
      `Cada porción aporta 5.5 g de BCAAs y 4 g de glutamina y ácido glutámico naturalmente presentes en el suero — no agregados artificialmente para inflar la etiqueta.`,
      `Viene con certificación Banned Substance Tested, lo que significa que cada lote se analiza contra sustancias prohibidas en el deporte. Es libre de gluten.`,
      `Presentación de 2 libras: 29 servicios. Si ya entrenas constante, el bote de 5 libras te sale bastante más barato por servicio.`,
    ],
    facts: [["Proteína", "24 g"], ["BCAAs", "5.5 g"], ["Servicios", "29"]],
    variants: [
      { flavor: "Vainilla", size: "907 g · 2 lb · 29 servicios", price: 489,
        images: ["/img/on-gold-standard-2lb-vainilla.webp", "/img/on-gold-standard-nutri.webp"],
        facts: [["Proteína", "24 g"], ["Calorías", "120"], ["BCAAs", "5.5 g"], ["Servicios", "29"]] },
      { flavor: "Cookies & Cream", size: "907 g · 2 lb · 29 servicios", price: 489,
        images: ["/img/on-gold-standard-2lb-cookies.webp", "/img/on-gold-standard-nutri.webp"],
        facts: [["Proteína", "24 g"], ["Calorías", "120"], ["BCAAs", "5.5 g"], ["Servicios", "29"]] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. GOLD STANDARD 100% WHEY — 5 lb
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "on-gold-standard-5lb",
    name: "Gold Standard 100% Whey",
    brand: "Optimum Nutrition",
    flavor: "Double Rich Chocolate · Vainilla Ice Cream",
    cat: "proteina",
    price: 969,
    oldPrice: null,
    rating: 0, reviews: 0,
    badge: "MEJOR PRECIO POR SERVICIO",
    goals: ["musculo", "recovery"],
    hue: 45,
    stock: 4,                // 2 Double Rich Chocolate + 2 Vainilla Ice Cream
    group: "on-gold-standard",
    sizeLabel: "5 lb",
    image: "/img/on-gold-standard-5lb-front.webp",
    blurb: "24 g de proteína de suero por servicio y 5.5 g de BCAAs naturalmente presentes, en presentación grande de 5 libras. Ideal si entrenas todos los días y no quieres quedarte sin batido a mitad de mes.",
    description: [
      `Es exactamente la misma fórmula del Gold Standard de 2 libras, en el bote grande. La diferencia está en el precio por servicio: si ya entrenas de forma constante y sabes que la vas a terminar, esta presentación es la que más te conviene.`,
      `24 g de proteína de suero por porción, 120 calorías, 5.5 g de BCAAs naturalmente presentes, y certificación Banned Substance Tested en cada lote.`,
      `Disponible en Double Rich Chocolate y Vainilla Ice Cream — los dos sabores más pedidos de la línea.`,
    ],
    facts: [["Proteína", "24 g"], ["Calorías", "120"], ["BCAAs", "5.5 g"]],
    variants: [
      { flavor: "Double Rich Chocolate", size: "2.27 kg · 5 lb", price: 969,
        images: ["/img/on-gold-standard-5lb-chocolate.webp", "/img/on-gold-standard-nutri.webp"],
        facts: [["Proteína", "24 g"], ["Calorías", "120"], ["Carbohidratos", "3 g"], ["Grasa", "2 g"]] },
      { flavor: "Vainilla Ice Cream", size: "2.27 kg · 5 lb", price: 969,
        images: ["/img/on-gold-standard-5lb-vainilla.webp", "/img/on-gold-standard-nutri.webp"],
        facts: [["Proteína", "24 g"], ["Calorías", "120"], ["Carbohidratos", "3 g"], ["Grasa", "2 g"]] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. MUTANT WHEY — 4 lb (doble sabor en una bolsa)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "mutant-whey-4lb",
    name: "Mutant Whey",
    brand: "Mutant",
    flavor: "Triple Chocolate y Vainilla",
    cat: "proteina",
    price: 549,
    oldPrice: null,
    rating: 0, reviews: 0,
    badge: "2 SABORES EN 1",
    goals: ["musculo", "recovery"],
    hue: 25,
    stock: 2,
    group: "mutant-whey",
    sizeLabel: "4 lb",
    image: "/img/mutant-whey-4lb-front.webp",
    blurb: "Una sola bolsa con dos sabores adentro: Triple Chocolate y Vainilla. 22 g de proteína, 10.4 g de aminoácidos esenciales y 5 g de BCAAs por servicio.",
    description: [
      `Mutant Whey trae algo que casi ninguna proteína ofrece: dos sabores en la misma bolsa. Triple Chocolate y Vainilla, para que no te aburras a la mitad del envase.`,
      `Cada servicio aporta 22 g de proteína de suero, 10.4 g de aminoácidos esenciales (EAAs) y 5 g de BCAAs naturalmente presentes. Con 150 calorías por porción, incluye algo más de carbohidrato que un aislado puro, lo que la hace buena opción si buscas recuperarte y sumar calorías de calidad.`,
      `Si tu prioridad es la proteína más magra posible, el Gold Standard te conviene más. Si buscas sabor y recuperación, esta es la tuya.`,
    ],
    facts: [["Proteína", "22 g"], ["EAAs", "10.4 g"], ["BCAAs", "5 g"]],
    variants: [
      { flavor: "Triple Chocolate y Vainilla", size: "1.81 kg · 4 lb", price: 549,
        images: ["/img/mutant-whey-4lb-front.webp", "/img/mutant-whey-nutri.webp"],
        facts: [["Proteína", "22 g"], ["Calorías", "150"], ["Carbohidratos", "8 g"], ["Grasa", "2.5 g"]] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. MUTANT WHEY — 5 lb
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "mutant-whey-5lb",
    name: "Mutant Whey",
    brand: "Mutant",
    flavor: "Cookies & Cream · Vainilla Ice Cream",
    cat: "proteina",
    price: 629,
    oldPrice: null,
    rating: 0, reviews: 0,
    badge: null,
    goals: ["musculo", "recovery"],
    hue: 25,
    stock: 3,                // 1 Cookies & Cream + 2 Vainilla Ice Cream
    group: "mutant-whey",
    sizeLabel: "5 lb",
    image: "/img/mutant-whey-5lb-front.webp",
    blurb: "Proteína de suero con 22 g por servicio y perfil completo de aminoácidos esenciales. Presentación de 5 libras para quien ya entrena constante.",
    description: [
      `La presentación grande de Mutant Whey, en Cookies & Cream y Vainilla Ice Cream. 22 g de proteína por servicio, 10.4 g de aminoácidos esenciales y 5 g de BCAAs.`,
      `A 150 calorías por porción, con 8 g de carbohidratos, funciona bien como batido post-entreno cuando quieres reponer y no solo sumar proteína seca.`,
    ],
    facts: [["Proteína", "22 g"], ["EAAs", "10.4 g"], ["Calorías", "150"]],
    variants: [
      { flavor: "Cookies & Cream", size: "2.27 kg · 5 lb", price: 629,
        images: ["/img/mutant-whey-5lb-cookies.webp", "/img/mutant-whey-nutri.webp"],
        facts: [["Proteína", "22 g"], ["Calorías", "150"], ["Carbohidratos", "8 g"], ["Grasa", "2.5 g"]] },
      { flavor: "Vainilla Ice Cream", size: "2.27 kg · 5 lb", price: 629,
        images: ["/img/mutant-whey-5lb-vainilla.webp", "/img/mutant-whey-nutri.webp"],
        facts: [["Proteína", "22 g"], ["Calorías", "150"], ["Carbohidratos", "8 g"], ["Grasa", "2.5 g"]] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. CREATINA MONOHIDRATADA BIRDMAN — 450 g
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "birdman-creatina-450",
    name: "Creatina Monohidratada",
    brand: "Birdman",
    flavor: "Sin sabor",
    cat: "creatina",
    price: 309,
    oldPrice: null,
    rating: 0, reviews: 0,
    badge: "90 SERVICIOS",
    goals: ["musculo", "energia"],
    hue: 205,
    stock: 4,
    sizeLabel: "450 g",
    image: "/img/birdman-creatina-450-front.webp",
    blurb: "Creatina monohidratada micronizada de alta pureza, sin sabor. 5 g por dosis, 90 servicios, cero calorías y cero azúcar. Apta para veganos y sin gluten.",
    description: [
      `La creatina monohidratada es el suplemento más estudiado del mundo, y este es el formato más directo: polvo micronizado de alta pureza, sin sabor, sin endulzantes y sin rellenos. Un solo ingrediente en la etiqueta.`,
      `5 g por dosis, 90 servicios por envase — te alcanza para unos tres meses de uso diario. Al no tener sabor, puedes agregarla a agua, a tu batido de proteína o a cualquier bebida sin que cambie el sabor.`,
      `Cero calorías, cero carbohidratos, cero azúcar añadida. Es vegana, libre de gluten y pasa por el protocolo independiente de análisis de pureza CreaClean. La planta donde se produce está certificada FSSC 22000 en seguridad alimentaria, y el producto es Kosher.`,
      `Cómo tomarla: no necesitas fase de carga. 5 g al día, todos los días, a la hora que se te haga más fácil recordar. La constancia importa más que el momento.`,
    ],
    facts: [["Por dosis", "5 g"], ["Servicios", "90"], ["Calorías", "0"]],
    variants: [
      { flavor: "Sin sabor", size: "450 g · 90 servicios", price: 309,
        images: ["/img/birdman-creatina-450-front.webp", "/img/birdman-creatina-450-nutri.webp"],
        facts: [["Por dosis", "5 g"], ["Servicios", "90"], ["Calorías", "0"], ["Azúcar", "0 g"]] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. PSYCHOTIC — 35 servicios  ⚠ PRE-ENTRENO DE ALTA CAFEÍNA
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "insane-psychotic-35",
    name: "Psychotic",
    brand: "Insane Labz",
    flavor: "Blue Raspberry · Peach Mango",
    cat: "pre",
    price: 239,
    oldPrice: null,
    rating: 0, reviews: 0,
    badge: "ALTA INTENSIDAD",
    goals: ["energia", "definir"],
    hue: 0,
    stock: 4,                // 2 Blue Raspberry + 2 Peach Mango
    sizeLabel: "35 servicios",
    image: "/img/insane-psychotic-front.webp",
    blurb: "Pre-entreno de alta intensidad con 400 mg de cafeína, beta-alanina y creatina monohidratada. No es para principiantes: empieza con media dosis.",
    warning: "Contiene 400 mg de cafeína por porción (de todas las fuentes). No apto para menores de 18 años, embarazadas o en lactancia, ni para personas con problemas cardíacos, presión alta o sensibilidad a estimulantes. No lo combines con otras fuentes de cafeína. Consulta a tu médico si tomas algún medicamento.",
    description: [
      `Psychotic es de los pre-entrenos más fuertes del mercado, y lo decimos sin adornos: 400 mg de cafeína por porción de todas las fuentes — cerca de cuatro tazas de café en una sola toma.`,
      `Su fórmula combina cafeína anhidra, beta-alanina (la responsable del hormigueo en la piel, es normal y pasa), creatina monohidratada, AMPiberry®, OxyGold® (ácido fúlvico), DMAE, extracto de Rauwolfia vomitoria y Huperzia serrata.`,
      `Quién debería comprarlo: alguien que ya usa pre-entrenos y siente que los normales ya no le hacen efecto.`,
      `Quién NO debería comprarlo: si nunca has tomado un pre-entreno, empieza por otro. Si eres sensible a la cafeína, este no es el tuyo.`,
      `Primera vez: empieza con media dosis para medir tu tolerancia, y no lo tomes después de las 4 de la tarde o no vas a dormir.`,
    ],
    facts: [["Cafeína", "400 mg"], ["Servicios", "35"], ["Beta-alanina", "Sí"]],
    variants: [
      { flavor: "Blue Raspberry", size: "35 servicios", price: 239,
        images: ["/img/insane-psychotic-blue.webp", "/img/insane-psychotic-nutri.webp"],
        facts: [["Cafeína", "400 mg"], ["Servicios", "35"]] },
      { flavor: "Peach Mango", size: "35 servicios", price: 239,
        images: ["/img/insane-psychotic-peach.webp", "/img/insane-psychotic-nutri.webp"],
        facts: [["Cafeína", "400 mg"], ["Servicios", "35"]] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7. FIBO BAR — caja de 6 barras
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "fibo-bar-6",
    name: "Fibo Bar",
    brand: "Fibo",
    flavor: "Brownie · Cookies & Cream",
    cat: "barras",
    price: 119,
    oldPrice: null,
    rating: 0, reviews: 0,
    badge: "SIN AZÚCAR AÑADIDA",
    goals: ["musculo", "definir"],
    hue: 280,
    stock: 4,                // 2 Brownie + 2 Cookies & Cream
    sizeLabel: "Caja de 6",
    image: "/img/fibo-bar-front.webp",
    blurb: "22 g de proteína por barra de 65 g, sin glucosa, sin azúcar de caña añadida y sin conservadores. La opción práctica para el antojo o el post-entreno fuera de casa.",
    description: [
      `A veces no estás en tu casa con la licuadora a la mano. Para eso está la Fibo Bar: 22 g de proteína en una barra de 65 g que cabe en la mochila.`,
      `Sin glucosa, sin azúcar de caña añadida y sin conservadores — lo que la separa de la mayoría de barras "proteicas" que en realidad son dulces con proteína encima.`,
      `Caja de 6 barras, en Brownie y Cookies & Cream.`,
    ],
    facts: [["Proteína", "22 g"], ["Por caja", "6 barras"], ["Peso", "65 g c/u"]],
    variants: [
      { flavor: "Brownie", size: "Caja 6 barras · 65 g c/u", price: 119,
        images: ["/img/fibo-bar-brownie.webp", "/img/fibo-bar-nutri.webp"],
        facts: [["Proteína", "22 g"], ["Barras", "6"], ["Azúcar añadida", "0 g"]] },
      { flavor: "Cookies & Cream", size: "Caja 6 barras · 65 g c/u", price: 119,
        images: ["/img/fibo-bar-cookies.webp", "/img/fibo-bar-nutri.webp"],
        facts: [["Proteína", "22 g"], ["Barras", "6"], ["Azúcar añadida", "0 g"]] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // INVENTARIO META NUTRITION — ya en bodega (confirmar precio/stock/sabor)
  // ═══════════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────────────
  // 8. CREATINA META NUTRITION — 500 g  (YA EXISTÍA EN TU SITIO — restaurada)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "crea-meta-500",
    name: "Creatina Meta Nutrition",
    brand: "Meta Nutrition",
    flavor: "Sin sabor",
    cat: "creatina",
    price: 299,               // Confirmado por el usuario, ago 2026.
    oldPrice: null,
    rating: 0, reviews: 0,     // Corregido: tenía 4.9 con 0 reseñas, inconsistente.
    badge: "+10 TOMAS GRATIS",
    goals: ["musculo", "energia"],
    hue: 190,
    stock: 6,
    group: "crea-meta",
    sizeLabel: "500 g",
    image: "/img/creatina-meta-500-front.webp",   // Ya la tenías subida.
    blurb: "Creatina monohidratada micronizada 100% pura, sin sabor, sin colorantes ni rellenos. 5 g por toma, cero calorías. Edición con 10 tomas de regalo.",
    description: [
      `Creatina monohidratada micronizada de alta pureza, sin sabor y sin ingredientes de relleno — en la etiqueta solo aparece "creatina monohidratada". Se disuelve fácil y no altera el sabor de lo que la mezcles.`,
      `Cada dosis de 5 g no aporta calorías, carbohidratos ni azúcar. El envase trae 100 servicios más 10 de regalo, y es 100% de origen vegetal — apta para veganos.`,
      `Cómo tomarla: 5 g al día, todos los días. No necesitas fase de carga.`,
    ],
    facts: [["Por dosis", "5 g"], ["Servicios", "100 + 10"], ["Calorías", "0"]],
    variants: [
      { flavor: "Sin sabor", size: "500 g · 100 + 10 tomas", price: 299,
        images: ["/img/creatina-meta-500-front.webp", "/img/creatina-meta-500-nutri2.webp"],
        facts: [["Por dosis", "5 g"], ["Servicios", "100 + 10"], ["Calorías", "0"], ["Origen", "100% vegetal"]] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 9. CREATINA META NUTRITION — 1050 g  (YA EXISTÍA EN TU SITIO — restaurada)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "crea-meta-1050",
    name: "Creatina Meta Nutrition",
    brand: "Meta Nutrition",
    flavor: "Sin sabor",
    cat: "creatina",
    price: 475,                // Confirmado por el usuario, ago 2026.
    oldPrice: null,
    rating: 0, reviews: 0,
    badge: "+10 TOMAS GRATIS",
    goals: ["musculo", "energia"],
    hue: 190,
    stock: 11,
    group: "crea-meta",
    sizeLabel: "1050 g",
    image: "/img/creatina-meta-1050-front.webp",  // Ya la tenías subida.
    blurb: "La misma creatina monohidratada micronizada 100% pura, en el envase grande para varios meses de uso diario. 5 g por toma, sin sabor. Edición con 10 tomas de regalo.",
    description: [
      `Es la misma fórmula de la creatina de 500 g, en presentación grande: 200 servicios más 10 de regalo, para quien ya sabe que la va a usar todos los días durante varios meses y prefiere no reordenar seguido.`,
      `Sin sabor, sin calorías, sin azúcar, 100% de origen vegetal.`,
    ],
    facts: [["Por dosis", "5 g"], ["Servicios", "200 + 10"], ["Calorías", "0"]],
    variants: [
      { flavor: "Sin sabor", size: "1050 g · 200 + 10 tomas", price: 475,
        images: ["/img/creatina-meta-1050-front.webp", "/img/creatina-meta-1050-back.webp"],
        facts: [["Por dosis", "5 g"], ["Servicios", "200 + 10"], ["Calorías", "0"], ["Origen", "100% vegetal"]] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 10. 100% GERMAN CREATINE CREAPURE® — 300 g
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "meta-german-creapure-300",
    name: "100% German Creatine Creapure®",
    brand: "Meta Nutrition",
    flavor: "Sin sabor",
    cat: "creatina",
    price: 299,                // Confirmado por el usuario, ago 2026.
    oldPrice: null,
    rating: 0, reviews: 0,
    badge: "CREAPURE® ALEMANA",
    goals: ["musculo", "energia"],
    hue: 210,
    stock: 10,
    sizeLabel: "300 g",
    image: "/img/meta-german-creapure-300-front.webp",
    blurb: "Creatina monohidratada con certificación Creapure®, fabricada 100% en Alemania con materia prima de pureza farmacéutica. Sin sabor, sin azúcar, sin rellenos.",
    description: [
      `Creapure® es el estándar más alto en creatina monohidratada: se fabrica en Alemania bajo un proceso que garantiza pureza farmacéutica y elimina subproductos no deseados como la DHT y la diciandiamida, comunes en creatinas de menor calidad.`,
      `Esta presentación viene sin sabor, sin azúcar y sin rellenos — 5 g de creatina monohidratada Creapure® por dosis, 60 servicios en total.`,
      `Es la opción para el cliente que ya conoce de suplementos y busca específicamente la certificación Creapure®, no solo "creatina monohidratada" genérica.`,
    ],
    facts: [["Por dosis", "5 g"], ["Servicios", "60"], ["Origen", "Alemania"]],
    variants: [
      { flavor: "Sin sabor", size: "300 g · 60 servicios", price: 299,
        images: ["/img/meta-german-creapure-300-front.webp", "/img/meta-german-creapure-300-nutri.webp"],
        facts: [["Por dosis", "5 g"], ["Servicios", "60"], ["Certificación", "Creapure®"]] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 11. FULL PROTEIN — 4.4 lb
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "meta-full-protein-44",
    name: "Full Protein",
    brand: "Meta Nutrition",
    flavor: null,                // PENDIENTE: qué sabor(es) tienes — hay 9-10 disponibles en la marca
    cat: "proteina",
    price: 379,                  // Recomendado — ver razonamiento en FITFUEL-Fichas-Producto.md
    oldPrice: null,
    rating: 0, reviews: 0,
    badge: "6 FUENTES DE PROTEÍNA",
    goals: ["musculo", "recovery"],
    hue: 15,
    stock: 0,                    // Sin stock por ahora — se agrega igual, vuelve a pedirse pronto.
    group: "meta-full-protein",
    sizeLabel: "4.4 lb",
    image: "/img/meta-full-protein-44-front.webp",
    blurb: "23 g de proteína de liberación sostenida por servicio, combinando 6 fuentes: aislado hidrolizado, aislado de suero, concentrado de leche, caseína micelar, caseinato de calcio y aislado de soya hidrolizado.",
    description: [
      `Full Protein no es una proteína de una sola fuente: mezcla seis tipos distintos —aislado de suero hidrolizado, aislado de suero, concentrado de leche, caseína micelar, caseinato de calcio y aislado de soya hidrolizado— para que la absorción sea escalonada: parte rápida, parte lenta. Eso la hace útil tanto después de entrenar como en una toma antes de dormir.`,
      `Cada servicio aporta 23 g de proteína, con 4.5 g de BCAAs y 4.5 g de glutamina naturalmente presentes. Es libre de gluten. Contiene leche y soya como alérgenos.`,
      `Disponible en varios sabores — Vainilla Salvaje, Chocolate Power, Cookies & Cream, Fresa y Crema, Galletas de Canela, Caramelo Salado, entre otros.`,
    ],
    facts: [["Proteína", "23 g"], ["BCAAs", "4.5 g"], ["Glutamina", "4.5 g"]],
    variants: [
      { flavor: "(confirmar sabor en bodega)", size: "2.0 kg · 4.4 lb · 57 servicios", price: 379,
        images: ["/img/meta-full-protein-44-front.webp", "/img/meta-full-protein-nutri.webp"],
        facts: [["Proteína", "23 g"], ["BCAAs", "4.5 g"], ["Glutamina", "4.5 g"], ["Servicios", "57"]] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 12. FULL PROTEIN — 10 lb
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "meta-full-protein-10",
    name: "Full Protein",
    brand: "Meta Nutrition",
    flavor: null,                // PENDIENTE: qué sabor(es) tienes
    cat: "proteina",
    price: 719,                  // Recomendado — Viking GT (misma marca, GT) la vende en Q800
    oldPrice: null,
    rating: 0, reviews: 0,
    badge: "MEJOR PRECIO POR SERVICIO",
    goals: ["musculo", "recovery"],
    hue: 15,
    stock: 0,                    // Sin stock por ahora — se agrega igual, vuelve a pedirse pronto.
    group: "meta-full-protein",
    sizeLabel: "10 lb",
    image: "/img/meta-full-protein-10-front.webp",
    blurb: "23 g de proteína de 6 fuentes distintas de absorción rápida, media y lenta, con 4.5 g de BCAAs y 4.5 g de glutamina por servicio. Presentación grande para casi 4 meses de uso diario.",
    description: [
      `La misma fórmula del Full Protein de 4.4 lb, en la presentación grande: 129 servicios, suficiente para unos cuatro meses de uso diario si ya sabes que la vas a terminar.`,
      `Seis fuentes de proteína combinadas (whey hidrolizado, whey aislado, concentrado de leche, caseína micelar, caseinato de calcio y soya aislada hidrolizada), 23 g de proteína por servicio, 4.5 g de BCAAs y 4.5 g de glutamina naturalmente presentes.`,
    ],
    facts: [["Proteína", "23 g"], ["Servicios", "129"], ["Duración", "~4 meses"]],
    variants: [
      { flavor: "(confirmar sabor en bodega)", size: "4.5 kg · 10 lb · 129 servicios", price: 719,
        images: ["/img/meta-full-protein-10-front.webp", "/img/meta-full-protein-nutri.webp"],
        facts: [["Proteína", "23 g"], ["BCAAs", "4.5 g"], ["Glutamina", "4.5 g"], ["Servicios", "129"]] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 13. GLICINATO (BISGLICINATO) DE MAGNESIO — 120 cápsulas
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "meta-glicinato-magnesio",
    name: "Bisglicinato de Magnesio",
    brand: "Meta Nutrition",
    flavor: null,
    cat: "vitaminas",
    price: 199,                  // Confirmado por el usuario, ago 2026.
    oldPrice: null,
    rating: 0, reviews: 0,
    badge: "ALTA ABSORCIÓN",
    goals: ["recovery"],
    hue: 260,
    stock: 6,
    sizeLabel: "120 cápsulas",
    image: "/img/meta-glicinato-magnesio-front.webp",
    blurb: "294 mg de magnesio elemental por servicio (2 cápsulas), en su forma bisglicinato de alta absorción. Apoya el descanso, el sistema nervioso y la recuperación muscular.",
    description: [
      `El magnesio en forma de bisglicinato se absorbe mejor y es más suave para el estómago que otras formas comunes como el óxido de magnesio. Cada servicio (2 cápsulas) aporta 294 mg de magnesio elemental, dentro de 2,100 mg de bisglicinato de magnesio total.`,
      `Se usa principalmente para apoyar el descanso, la función del sistema nervioso y la recuperación muscular después de entrenar — muchos lo toman por la noche.`,
      `Un solo ingrediente activo en la etiqueta: bisglicinato de magnesio. El envase trae 120 cápsulas, 40 servicios.`,
    ],
    facts: [["Magnesio elemental", "294 mg"], ["Cápsulas", "120"], ["Servicios", "40"]],
    variants: [
      { flavor: "Sin sabor", size: "120 cápsulas · 40 servicios", price: 199,
        images: ["/img/meta-glicinato-magnesio-front.webp", "/img/meta-glicinato-magnesio-nutri.webp"],
        facts: [["Magnesio elemental", "294 mg"], ["Bisglicinato total", "2,100 mg"], ["Servicios", "40 (2 cáps.)"]] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 14. OMEGA 3 — 90 softgels
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "meta-omega3",
    name: "Omega 3+",
    brand: "Meta Nutrition",
    flavor: null,
    cat: "vitaminas",
    price: 199,                  // Confirmado por el usuario, ago 2026.
    oldPrice: null,
    rating: 0, reviews: 0,
    badge: "EPA + DHA",
    goals: ["recovery"],
    hue: 205,
    stock: 7,
    sizeLabel: "90 softgels",
    image: "/img/meta-omega3-front.webp",
    blurb: "Aceite de pescado de alta pureza, destilado molecularmente para eliminar metales pesados. Concentrado en EPA y DHA para salud cardiovascular, cerebral y articular.",
    description: [
      `Aceite de pescado procesado por destilación molecular, un método que retira metales pesados y otros contaminantes que suelen aparecer en aceites de pescado de menor calidad. El concentrado está estandarizado a 18% EPA y 12% DHA.`,
      `Sin maíz, levadura, soya, lácteos, ni sabores o colores artificiales. Fabricado bajo estándares GMP. El envase trae 90 cápsulas blandas (softgels).`,
    ],
    facts: [["Softgels", "90"], ["Concentración EPA", "18%"], ["Concentración DHA", "12%"]],
    variants: [
      { flavor: "Sin sabor", size: "90 softgels", price: 199,
        images: ["/img/meta-omega3-front.webp", "/img/meta-omega3-nutri.webp"],
        facts: [["Softgels", "90"], ["EPA", "18%"], ["DHA", "12%"], ["Uso diario", "1-2 cápsulas"]] },
    ],
  },

];

// Bundles / packs (precios en Quetzales GTQ)
FF.BUNDLES = [
  {
    id: "pack-musculo",
    name: "Pack MÚSCULO",
    tagline: "Construye masa con lo esencial",
    items: ["Gold Standard 100% Whey 5 lb", "Creatina Monohidratada Birdman", "Bisglicinato de Magnesio"],
    productIds: ["on-gold-standard-5lb", "birdman-creatina-450", "meta-glicinato-magnesio"],
    price: 1319,          // valor real: Q1,477 (969+309+199) → ahorro Q158 (~11%)
    goal: "musculo",
    hue: 45,
    desc: "Proteína, creatina y magnesio para dormir y recuperar bien — los tres suplementos con más evidencia científica detrás, juntos en un solo pack. 24 g de proteína por servicio, 5 g de creatina monohidratada al día y magnesio de alta absorción para tus noches de descanso.",
  },
  {
    id: "pack-energia",
    name: "Pack ENERGÍA",
    tagline: "Para entrenar más fuerte, más tiempo",
    items: ["Psychotic (Insane Labz)", "Creatina Meta Nutrition 500 g", "Omega 3+"],
    productIds: ["insane-psychotic-35", "crea-meta-500", "meta-omega3"],
    price: 659,            // valor real: Q737 (239+299+199) → ahorro Q78 (~11%)
    goal: "energia",
    hue: 0,
    desc: "Pre-entreno de alta intensidad, creatina diaria y omega-3 para la recuperación articular. Psychotic aporta 400 mg de cafeína por porción — no es para principiantes: si es tu primer pre-entreno o eres sensible a la cafeína, no empieces por este pack.",
  },
  {
    id: "pack-recuperacion",
    name: "Pack RECUPERACIÓN",
    tagline: "Para el día después del entreno",
    items: ["Gold Standard 100% Whey 2 lb", "Omega 3+", "Bisglicinato de Magnesio"],
    productIds: ["on-gold-standard-2lb", "meta-omega3", "meta-glicinato-magnesio"],
    price: 789,             // valor real: Q887 (489+199+199) → ahorro Q98 (~11%)
    goal: "recovery",
    hue: 205,
    desc: "Proteína de suero, omega-3 y magnesio: lo que tu cuerpo necesita para recuperarse entre sesiones, no solo durante el entrenamiento. Ideal si entrenas 4 o más días a la semana.",
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
  { q: "¿Hacen envíos a todo el país?", a: "Sí. Enviamos a los 22 departamentos de Guatemala. El tiempo estimado de entrega es de 2 a 3 días hábiles a cualquier punto del país." },
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
  // En vista previa se respeta la copia de trabajo: descargar el publicado la borraría.
  if (FF.PREVIEW) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500); // no bloquear el arranque más de 3.5s
    const res = await fetch(FF.PUBLIC_CATALOG_URL, { cache: "no-cache", signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) FF.applyData(await res.json());
  } catch (e) {}
};

// Copia intacta del catálogo de fábrica, ANTES de aplicar lo que haya en este navegador.
// El panel la usa para recuperar campos que su formulario no edita (descripción larga,
// advertencias) y que antes se perdían al guardar un producto.
FF.DEFAULTS = { products: JSON.parse(JSON.stringify(FF.PRODUCTS)), bundles: JSON.parse(JSON.stringify(FF.BUNDLES)) };

// ── Vista previa ───────────────────────────────────────────────────────────────
// El panel guarda su copia de trabajo en `ff_data`. Durante mucho tiempo la tienda la
// aplicaba SIEMPRE, así que quien administraba veía sus cambios sin publicar mientras los
// clientes veían otra cosa, sin ninguna señal de que estaba pasando. Ahora es explícito:
// solo con ?preview=1, y mientras dure esa pestaña. Se sale con ?preview=0.
FF.PREVIEW = false;
try {
  const qs = new URLSearchParams(window.location.search);
  const q = qs.get('preview');
  if (q === '1') sessionStorage.setItem('ff_preview', '1');
  else if (q === '0') sessionStorage.removeItem('ff_preview');
  FF.PREVIEW = sessionStorage.getItem('ff_preview') === '1';
} catch (e) {}

if (FF.PREVIEW) {
  try { FF.applyData(JSON.parse(localStorage.getItem('ff_data'))); } catch (e) {}
}
