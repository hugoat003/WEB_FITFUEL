import React from "react";
/* FITFUEL — páginas (router por hash) */

function Breadcrumb({ items }) {
  return (
    <nav className="crumb">
      {items.map((it, i) => (
        <span key={i}>
          {it.to && i < items.length - 1
            ? <a href={"#" + it.to}>{it.label}</a>
            : <b>{it.label}</b>}
          {i < items.length - 1 && <Icon name="chevron" size={14} />}
        </span>
      ))}
    </nav>
  );
}

function PageHead({ eyebrow, title, sub }) {
  return (
    <div className="page-head">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="display">{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
  );
}

/* ---------------- HOME ---------------- */
function HomePage(ctx) {
  const featured = FF.PRODUCTS.slice().sort((a, b) => b.reviews - a.reviews).slice(0, 4);
  return (
    <>
      <Hero />
      <section className="section">
        <div className="ff-wrap">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Los favoritos</span>
              <h2 className="display">Más vendidos</h2>
              <p>Lo que más entrena Guatemala ahora mismo.</p>
            </div>
            <a className="btn btn-ghost" href="#/catalogo">Ver catálogo <Icon name="arrow" size={18} /></a>
          </div>
          <div className="pgrid">
            {featured.map((p) => (
              <ProductCard key={p.id} p={p} onAdd={ctx.onAdd} onQuick={ctx.onQuick}
                fav={ctx.favs.has(p.id)} toggleFav={ctx.toggleFav} />
            ))}
          </div>
        </div>
      </section>
      <div className="reveal"><Bundles onAddBundle={ctx.onAddBundle} compact={true} /></div>
      <div className="reveal"><Testimonials compact={true} /></div>
      <div className="reveal"><Blog compact={true} /></div>
      <CtaBand />
    </>
  );
}

/* ---------------- CATÁLOGO ---------------- */
function CatalogPage(ctx, route) {
  const offersOnly = route.path === "/ofertas";
  const cat = (route.query && route.query.cat) || "all";
  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: offersOnly ? "Ofertas" : "Catálogo" }]} />
      </div>
      <Catalog query={ctx.query} activeGoals={ctx.activeGoals} onAdd={ctx.onAdd} onQuick={ctx.onQuick}
        favs={ctx.favs} toggleFav={ctx.toggleFav} initialCat={cat} offersOnly={offersOnly} />
    </section>
  );
}

/* ---------------- OBJETIVOS ---------------- */
function GoalsPage(ctx) {
  const recs = React.useMemo(() => {
    if (ctx.activeGoals.size === 0) return [];
    return FF.PRODUCTS.filter((p) => p.goals.some((g) => ctx.activeGoals.has(g)))
      .sort((a, b) => b.reviews - a.reviews).slice(0, 4);
  }, [ctx.activeGoals]);
  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: "Objetivos" }]} />
      </div>
      <GoalsQuiz active={ctx.activeGoals} toggle={ctx.toggleGoal} onSee={() => navigate("/catalogo")} />
      {recs.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="ff-wrap">
            <div className="sec-head">
              <div>
                <span className="eyebrow">Recomendado para ti</span>
                <h2 className="display">Tu selección</h2>
              </div>
              <a className="btn btn-primary" href="#/catalogo">Ver todo el catálogo <Icon name="arrow" size={18} /></a>
            </div>
            <div className="pgrid">
              {recs.map((p) => (
                <ProductCard key={p.id} p={p} onAdd={ctx.onAdd} onQuick={ctx.onQuick}
                  fav={ctx.favs.has(p.id)} toggleFav={ctx.toggleFav} />
              ))}
            </div>
          </div>
        </section>
      )}
    </section>
  );
}

/* ---------------- PACKS ---------------- */
function BundlesPage(ctx) {
  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: "Packs" }]} />
      </div>
      <Bundles onAddBundle={ctx.onAddBundle} />
      <CtaBand />
    </section>
  );
}

/* ---------------- PRODUCTO ---------------- */
function ProductPage(ctx, route) {
  const id = route.parts[1];
  const p = FF.PRODUCTS.find((x) => x.id === id);
  const [qty, setQty] = React.useState(1);
  React.useEffect(() => { setQty(1); window.scrollTo(0, 0); }, [id]);
  if (!p) return <NotFoundPage msg="No encontramos ese producto." />;
  const cat = FF.CATEGORIES.find((c) => c.id === p.cat);
  const fav = ctx.favs.has(p.id);
  const related = FF.PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const save = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[
          { label: "Inicio", to: "/" },
          { label: "Catálogo", to: "/catalogo" },
          { label: cat ? cat.label : "", to: "/catalogo?cat=" + p.cat },
          { label: p.name },
        ]} />

        <div className="pdp">
          <div className="pdp-vis">
            {p.badge && <span className="pcard-badge" style={{ top: 22, left: 22 }}>{p.badge}</span>}
            <ProdImg image={p.image} label="foto producto · bote" hue={p.hue} tub={true} />
          </div>
          <div className="pdp-info">
            <span className="pcard-cat">{cat ? cat.label : ""}</span>
            <h1 className="pdp-title">{p.name}</h1>
            <p className="pdp-flav">{p.flavor}</p>
            <div style={{ margin: "10px 0 14px" }}><Stars rating={p.rating} reviews={p.reviews} /></div>
            <p className="pdp-blurb">{p.blurb}</p>

            <div className="modal-facts">
              {p.facts.map(([k, v], i) => (
                <div className="fact" key={i}><b>{v}</b><span>{k}</span></div>
              ))}
            </div>

            <div className="price pdp-price">
              <b>{money(p.price)}</b>
              {p.oldPrice && <s>{money(p.oldPrice)}</s>}
              {save > 0 && <span className="save-tag">-{save}%</span>}
            </div>

            <div className="pdp-buy">
              <div className="qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}><Icon name="minus" size={16} /></button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)}><Icon name="plus" size={16} /></button>
              </div>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={() => ctx.onAdd(p, null, qty)}>
                Añadir · {money(p.price * qty)}
              </button>
              <button className={"icon-btn" + (fav ? " on-fav" : "")} aria-label="Favorito"
                onClick={() => ctx.toggleFav(p.id)}>
                <Icon name="heart" size={19} fill={fav} stroke={fav ? 0 : 2} />
              </button>
            </div>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 12 }}
              onClick={() => { ctx.onAdd(p, null, qty); ctx.openCart(); }}>
              Comprar ahora
            </button>

            <div className="pdp-trust">
              <div><Icon name="truck" size={18} /><span>Envío gratis en pedidos +{money(FF.FREE_SHIP)}</span></div>
              <div><Icon name="shield" size={18} /><span>Productos 100% originales</span></div>
              <div><Icon name="lab" size={18} /><span>Testado en laboratorio</span></div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="pdp-related">
            <div className="sec-head"><div><span className="eyebrow">También te puede servir</span><h2 className="display">Relacionados</h2></div></div>
            <div className="pgrid">
              {related.map((rp) => (
                <ProductCard key={rp.id} p={rp} onAdd={ctx.onAdd} onQuick={ctx.onQuick}
                  fav={ctx.favs.has(rp.id)} toggleFav={ctx.toggleFav} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- BLOG ---------------- */
function BlogPage() {
  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: "Blog" }]} />
        <PageHead eyebrow="Aprende" title="Blog FITFUEL" sub="Ciencia aplicada al gimnasio, explicada fácil." />
        <div className="blog-grid">
          {FF.BLOG.map((b) => (
            <a className="bl" key={b.id} href={"#/blog/" + b.id}>
              <div className="bl-vis"><ProdImg image={b.image} label="imagen artículo" hue={b.hue} /></div>
              <div className="bl-body">
                <span className="bl-tag">{b.cat}</span>
                <h4>{b.title}</h4>
                {b.excerpt && <p className="bl-excerpt">{b.excerpt}</p>}
                <span className="bl-read">{b.read} de lectura · Leer →</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogPostPage(route) {
  const id = route.parts[1];
  const b = FF.BLOG.find((x) => x.id === id);
  React.useEffect(() => { window.scrollTo(0, 0); }, [id]);
  if (!b) return <NotFoundPage msg="No encontramos ese artículo." />;
  const others = FF.BLOG.filter((x) => x.id !== id).slice(0, 2);
  return (
    <section className="page">
      <div className="ff-wrap ff-narrow">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: "Blog", to: "/blog" }, { label: b.cat }]} />
        <span className="bl-tag">{b.cat} · {b.read} de lectura</span>
        <h1 className="display article-title">{b.title}</h1>
        <div className="article-vis"><ProdImg image={b.image} label="imagen artículo" hue={b.hue} /></div>
        <article className="article-body">
          {(b.body || [b.excerpt]).map((par, i) => <p key={i}>{par}</p>)}
        </article>
        <a className="btn btn-ghost" href="#/blog"><Icon name="back" size={18} /> Volver al blog</a>

        {others.length > 0 && (
          <div className="article-more">
            <h3 className="display">Sigue leyendo</h3>
            <div className="blog-grid">
              {others.map((o) => (
                <a className="bl" key={o.id} href={"#/blog/" + o.id}>
                  <div className="bl-vis"><ProdImg image={o.image} label="imagen artículo" hue={o.hue} /></div>
                  <div className="bl-body">
                    <span className="bl-tag">{o.cat}</span>
                    <h4>{o.title}</h4>
                    <span className="bl-read">{o.read} de lectura · Leer →</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- RESEÑAS ---------------- */
function ReviewForm({ ctx }) {
  const [sent, setSent] = React.useState(false);
  const submit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const g = (k) => (f.get(k) || "").toString().trim();
    const msg =
      `*Nueva reseña para FITFUEL*\n\n` +
      `Nombre: ${g("nombre")}\n` +
      (g("lugar") ? `Lugar: ${g("lugar")}\n` : "") +
      `Valoración: ${g("rating")}/5\n\n` +
      `"${g("comentario")}"`;
    const c = FF.CONTACT || {};
    const digits = (c.whatsapp || "").replace(/[^0-9]/g, "");
    if (digits) window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, "_blank");
    else if (c.email) window.open(`mailto:${c.email}?subject=Reseña FITFUEL&body=${encodeURIComponent(msg)}`, "_blank");
    setSent(true);
    ctx && ctx.toast && ctx.toast("¡Gracias por tu reseña! ✦");
  };
  if (sent) {
    return (
      <div className="review-done">
        <span className="tk"><Icon name="check" size={22} stroke={3} /></span>
        <h3>¡Gracias por compartir!</h3>
        <p>Recibimos tu reseña. La revisamos y, si todo está en orden, la publicamos pronto.</p>
        <button className="btn btn-ghost" onClick={() => setSent(false)}>Enviar otra</button>
      </div>
    );
  }
  return (
    <form className="review-form" onSubmit={submit}>
      <h3 className="co-h">Deja tu reseña</h3>
      <div className="co-row">
        <label>Nombre<input required name="nombre" type="text" placeholder="Tu nombre" /></label>
        <label>Lugar (opcional)<input name="lugar" type="text" placeholder="Ciudad / departamento" /></label>
      </div>
      <label>Valoración
        <select name="rating" defaultValue="5">
          <option value="5">★★★★★ — Excelente</option>
          <option value="4">★★★★ — Muy buena</option>
          <option value="3">★★★ — Buena</option>
          <option value="2">★★ — Regular</option>
          <option value="1">★ — Mala</option>
        </select>
      </label>
      <label>Tu experiencia<textarea required name="comentario" rows="4" placeholder="Cuéntanos cómo te fue con el producto…" /></label>
      <button className="btn btn-primary btn-block" type="submit">Enviar reseña <Icon name="arrow" size={18} /></button>
      <p className="co-disclaimer">Las reseñas se revisan antes de publicarse. No necesitas crear una cuenta.</p>
    </form>
  );
}

function ReviewsPage(ctx) {
  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: "Reseñas" }]} />
        <PageHead eyebrow="Lo que dice la comunidad" title="Resultados reales"
          sub="Atletas de toda Guatemala que ya entrenan con FITFUEL." />
        <div className="stat-band">
          <div><b>4.8★</b><span>Valoración media</span></div>
          <div><b>+12,000</b><span>Reseñas verificadas</span></div>
          <div><b>50k+</b><span>Atletas activos</span></div>
          <div><b>98%</b><span>Lo recomienda</span></div>
        </div>
        <div className="tgrid">
          {FF.TESTIMONIALS.map((t, i) => (
            <article className="tcard" key={i}>
              <div className="stars">
                {[...Array(5)].map((_, s) => (
                  <Icon key={s} name="star" size={16} fill={true} stroke={0} style={{ color: "var(--accent)" }} />
                ))}
              </div>
              <p className="quote">"{t.quote}"</p>
              <div className="who">
                <Avatar name={t.name} hue={t.hue} image={t.avatar} />
                <div><b>{t.name}</b><span>{t.tag}</span></div>
              </div>
            </article>
          ))}
        </div>
        <div className="review-cta"><ReviewForm ctx={ctx} /></div>
        <CtaBand />
      </div>
    </section>
  );
}

/* ---------------- CONTACTO ---------------- */
function ContactPage(ctx) {
  const c = FF.CONTACT || {};
  const [sent, setSent] = React.useState(false);
  const submit = (e) => {
    e.preventDefault();
    setSent(true);
    ctx.toast("Mensaje enviado ✦ Te contactaremos pronto");
  };
  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: "Contacto" }]} />
        <PageHead eyebrow="Hablemos" title="Contacto"
          sub="¿Dudas con tu pedido o con qué suplemento elegir? Escríbenos." />
        <div className="contact-grid">
          <div className="contact-info">
            <a className="contact-row" href={c.whatsappLink || "#"} target="_blank" rel="noopener">
              <span className="ci-ic"><Icon name="chat" size={20} /></span>
              <div><b>WhatsApp</b><span>{c.whatsapp}</span></div>
            </a>
            <a className="contact-row" href={"tel:" + (c.phone || "").replace(/\s/g, "")}>
              <span className="ci-ic"><Icon name="phone" size={20} /></span>
              <div><b>Teléfono</b><span>{c.phone}</span></div>
            </a>
            <a className="contact-row" href={"mailto:" + c.email}>
              <span className="ci-ic"><Icon name="mail" size={20} /></span>
              <div><b>Correo</b><span>{c.email}</span></div>
            </a>
            <div className="contact-row">
              <span className="ci-ic"><Icon name="pin" size={20} /></span>
              <div><b>Tienda</b><span>{c.address}</span></div>
            </div>
            <div className="contact-row">
              <span className="ci-ic"><Icon name="clock" size={20} /></span>
              <div><b>Horario</b><span>{c.hours}</span></div>
            </div>
          </div>

          <form className="contact-form" onSubmit={submit}>
            {sent ? (
              <div className="form-done">
                <span className="tk"><Icon name="check" size={22} stroke={3} /></span>
                <h3>¡Mensaje enviado!</h3>
                <p>Gracias por escribirnos. Te responderemos en menos de 24 horas hábiles.</p>
                <button type="button" className="btn btn-ghost" onClick={() => setSent(false)}>Enviar otro</button>
              </div>
            ) : (
              <>
                <label>Nombre<input required type="text" placeholder="Tu nombre" /></label>
                <label>Correo<input required type="email" placeholder="tucorreo@email.com" /></label>
                <label>Teléfono<input type="tel" placeholder="+502 0000 0000" /></label>
                <label>Mensaje<textarea required rows="4" placeholder="¿En qué te ayudamos?" /></label>
                <button className="btn btn-primary btn-block btn-lg" type="submit">Enviar mensaje <Icon name="arrow" size={18} /></button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

/* ---------------- AYUDA / INFO (contenido) ---------------- */
const CONTENT_PAGES = {
  envios: {
    eyebrow: "Ayuda", title: "Envíos",
    sub: "Llevamos tu pedido a los 22 departamentos de Guatemala.",
    blocks: [
      { h: "Cobertura", p: "Enviamos a toda la República de Guatemala a través de mensajería nacional. En la Ciudad de Guatemala contamos también con mensajería propia el mismo día para pedidos antes del mediodía." },
      { h: "Tiempos de entrega", p: "Ciudad de Guatemala y área metropolitana: 24-48 horas. Cabeceras departamentales: 2-3 días hábiles. Municipios y áreas rurales: 3-5 días hábiles." },
      { h: "Costo de envío", p: "Tarifa plana de Q35 a todo el país. En pedidos mayores a Q400 el envío es totalmente gratis." },
      { h: "Seguimiento", p: "Al despachar tu pedido te enviamos por WhatsApp el número de guía para que sigas tu paquete en tiempo real." },
    ],
  },
  devoluciones: {
    eyebrow: "Ayuda", title: "Política de devoluciones",
    sub: "Compra informada: no aceptamos devoluciones.",
    blocks: [
      { h: "No se aceptan devoluciones ni cambios", p: "Por tratarse de productos de consumo, y por higiene y seguridad, no aceptamos devoluciones, cambios ni reembolsos una vez realizada la compra. Te pedimos revisar bien tu pedido antes de confirmarlo." },
      { h: "Asesoría antes de comprar", p: "¿No sabes qué suplemento elegir? Escríbenos por WhatsApp antes de tu compra y te asesoramos sin compromiso para que elijas con seguridad." },
      { h: "Producto dañado en el envío", p: "Si tu pedido llega físicamente dañado por el transporte, contáctanos por WhatsApp dentro de las 24 horas siguientes a la entrega, con fotos del empaque y el producto, y lo revisamos caso por caso." },
    ],
  },
  faq: {
    eyebrow: "Ayuda", title: "Preguntas frecuentes",
    sub: "Las dudas más comunes, resueltas.",
    faq: true,
  },
};

const INFO_PAGES = {
  nosotros: {
    eyebrow: "FITFUEL", title: "Sobre nosotros",
    sub: "Suplementos serios, hechos para el atleta guatemalteco.",
    blocks: [
      { h: "Nuestra historia", p: "FITFUEL nació en la Ciudad de Guatemala con una idea simple: que cualquier persona que entrena en serio tenga acceso a suplementos de calidad, originales y sin marketing engañoso, a un precio justo y en quetzales." },
      { h: "Qué nos mueve", p: "Creemos en la transparencia total. Etiquetas claras, dosis efectivas y cero azúcares ocultos. Si un ingrediente no tiene respaldo científico, no lo vendemos." },
      { h: "Hecho para Guatemala", p: "Entendemos al atleta local: desde quien entrena en casa hasta el competidor. Por eso enviamos a todo el país y damos asesoría real por WhatsApp." },
    ],
  },
  calidad: {
    eyebrow: "FITFUEL", title: "Calidad y laboratorio",
    sub: "Cada lote, verificado. Sin atajos.",
    blocks: [
      { h: "Testado en laboratorio", p: "Todos nuestros productos pasan por análisis de laboratorio de terceros que verifican pureza, contenido proteico y ausencia de metales pesados y sustancias prohibidas." },
      { h: "Productos originales", p: "Trabajamos únicamente con marcas y distribuidores autorizados. Cada producto llega sellado, con su lote y fecha de vencimiento visibles." },
      { h: "Sin azúcares ocultos", p: "Publicamos la información nutricional completa. Lo que ves en la etiqueta es exactamente lo que recibes." },
    ],
  },
  afiliados: {
    eyebrow: "FITFUEL", title: "Programa de afiliados",
    sub: "Entrenas, recomiendas, ganas.",
    blocks: [
      { h: "¿Cómo funciona?", p: "Si eres entrenador, atleta o creador de contenido fitness en Guatemala, te damos un código de descuento para tu comunidad y una comisión por cada venta que generes." },
      { h: "Beneficios", p: "Comisión competitiva, producto a precio especial para ti y materiales para tus redes. Pagos mensuales por transferencia." },
      { h: "Únete", p: "Escríbenos por WhatsApp o al correo hola@fitfuel.gt con el asunto 'Afiliados' y te enviamos los detalles." },
    ],
  },
};

function ContentPage({ data, ctx }) {
  return (
    <section className="page">
      <div className="ff-wrap ff-narrow">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: data.title }]} />
        <PageHead eyebrow={data.eyebrow} title={data.title} sub={data.sub} />
        {data.faq ? (
          <div className="faq">
            {FF.FAQ.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
            <div className="faq-cta">
              <p>¿No encuentras tu respuesta?</p>
              <a className="btn btn-primary" href="#/contacto">Contáctanos <Icon name="arrow" size={18} /></a>
            </div>
          </div>
        ) : (
          <div className="content-blocks">
            {data.blocks.map((b, i) => (
              <div className="cblock" key={i}>
                <h3>{b.h}</h3>
                <p>{b.p}</p>
              </div>
            ))}
          </div>
        )}
        <a className="btn btn-ghost" href="#/" style={{ marginTop: 30 }}><Icon name="back" size={18} /> Volver al inicio</a>
      </div>
    </section>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={"faq-item" + (open ? " open" : "")}>
      <button className="faq-q" onClick={() => setOpen((v) => !v)}>
        <span>{q}</span>
        <Icon name="chevron" size={18} />
      </button>
      {open && <div className="faq-a">{a}</div>}
    </div>
  );
}

/* ---------------- PACK ---------------- */
function PackPage(ctx, route) {
  const id = route.parts[1];
  const b = FF.BUNDLES.find((x) => x.id === id);
  React.useEffect(() => { window.scrollTo(0, 0); }, [id]);
  if (!b) return <NotFoundPage msg="No encontramos ese pack." />;
  const value = FF.bundleValue(b);
  const save = value > b.price ? Math.round((1 - b.price / value) * 100) : 0;
  const color = `oklch(0.72 0.17 ${b.hue})`;
  const products = (b.productIds || [])
    .map((pid) => FF.PRODUCTS.find((p) => p.id === pid))
    .filter(Boolean);
  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: "Packs", to: "/packs" }, { label: b.name }]} />

        <div className="packhero" style={{ "--ph-color": color }}>
          <div className="packhero-glow" />
          <div className="packhero-info">
            {save > 0 && <span className="save-tag">AHORRA {save}%</span>}
            <h1 className="display packhero-title">{b.name}</h1>
            <p className="packhero-tag">{b.tagline}</p>
            {b.desc && <p className="packhero-desc">{b.desc}</p>}
            <div className="packhero-buy">
              <div className="price pdp-price" style={{ margin: 0 }}>
                <b>{money(b.price)}</b>
                {value > b.price && <s>{money(value)}</s>}
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => ctx.onAddBundle(b)}>
                Añadir pack <Icon name="arrow" size={18} />
              </button>
            </div>
            <p className="packhero-note">
              <Icon name="check" size={15} stroke={3} /> {products.length} productos{value > b.price && <> · te ahorras {money(value - b.price)} vs comprarlos por separado</>}
            </p>
          </div>
        </div>

        <div className="sec-head" style={{ marginTop: 50 }}>
          <div>
            <span className="eyebrow">Qué incluye</span>
            <h2 className="display">Los productos del pack</h2>
            <p>Toca cualquiera para ver su ficha completa.</p>
          </div>
        </div>
        <div className="pgrid">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} onAdd={ctx.onAdd} onQuick={ctx.onQuick}
              fav={ctx.favs.has(p.id)} toggleFav={ctx.toggleFav} />
          ))}
        </div>

        <div className="pdp-trust" style={{ marginTop: 40, maxWidth: 520 }}>
          <div><Icon name="truck" size={18} /><span>Envío gratis en pedidos +{money(FF.FREE_SHIP)}</span></div>
          <div><Icon name="shield" size={18} /><span>Productos 100% originales</span></div>
          <div><Icon name="lab" size={18} /><span>Testado en laboratorio</span></div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- CHECKOUT ---------------- */
const GT_DEPTS = [
  "Guatemala", "Sacatepéquez", "Chimaltenango", "Escuintla", "Quetzaltenango",
  "Sololá", "Totonicapán", "Suchitepéquez", "Retalhuleu", "San Marcos",
  "Huehuetenango", "Quiché", "Alta Verapaz", "Baja Verapaz", "Petén",
  "Izabal", "Zacapa", "Chiquimula", "Jalapa", "Jutiapa", "El Progreso", "Santa Rosa",
];
const SHIP_COST = 35;

function CheckoutPage(ctx) {
  const items = ctx.cartItems || [];
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const freeShip = subtotal >= (FF.FREE_SHIP || 400) || subtotal === 0;
  const shipping = freeShip ? 0 : SHIP_COST;
  const total = subtotal + shipping;
  const [order, setOrder] = React.useState(null);
  React.useEffect(() => { window.scrollTo(0, 0); }, []);

  const placeOrder = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const g = (k) => (f.get(k) || "").toString().trim();
    const id = "FF-" + Math.floor(100000 + Math.random() * 900000);
    const count = items.reduce((s, it) => s + it.qty, 0);

    // Arma el mensaje del pedido para enviarlo por WhatsApp a la tienda
    const lines = items.map((it) => `• ${it.qty}× ${it.name} (${it.flavor}) — ${money(it.price * it.qty)}`);
    const msg =
      `*Nuevo pedido FITFUEL* #${id}\n\n` +
      lines.join("\n") +
      `\n\nSubtotal: ${money(subtotal)}\nEnvío: ${shipping === 0 ? "Gratis" : money(shipping)}\n*Total: ${money(total)}*\n\n` +
      `*Cliente*\n${g("nombre")}\nTel: ${g("telefono")}\nCorreo: ${g("correo")}\n` +
      `Dirección: ${g("direccion")}, ${g("municipio")}, ${g("departamento")}\n` +
      (g("referencia") ? `Referencia: ${g("referencia")}\n` : "") +
      `Pago: ${g("pago")}`;

    const c = FF.CONTACT || {};
    const digits = (c.whatsapp || "").replace(/[^0-9]/g, "");
    if (digits) {
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, "_blank");
    }
    setOrder({ id, total, count, sent: !!digits });
    ctx.clearCart();
    ctx.toast("¡Pedido enviado! ✦");
  };

  if (order) {
    return (
      <section className="page">
        <div className="ff-wrap ff-narrow">
          <div className="order-done">
            <span className="tk"><Icon name="check" size={30} stroke={3} /></span>
            <h1 className="display">¡Gracias por tu pedido!</h1>
            <p>Tu pedido <b>#{order.id}</b> está listo. {order.sent
              ? "Abrimos WhatsApp con el resumen — solo envíalo para confirmar el pago y la entrega."
              : "Escríbenos por WhatsApp con tu número de pedido para coordinar el pago y la entrega."}</p>
            <div className="order-sum">
              <div><span>Productos</span><b>{order.count}</b></div>
              <div><span>Total</span><b>{money(order.total)}</b></div>
            </div>
            <div className="order-actions">
              <a className="btn btn-primary btn-lg" href="#/catalogo">Seguir comprando <Icon name="arrow" size={18} /></a>
              <a className="btn btn-ghost btn-lg" href="#/">Ir al inicio</a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="page">
        <div className="ff-wrap ff-narrow">
          <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: "Checkout" }]} />
          <div className="cart-empty" style={{ padding: "70px 20px" }}>
            <Icon name="cart" size={40} />
            <div>Tu carrito está vacío.<br />Agrega productos antes de finalizar la compra.</div>
            <a className="btn btn-primary" href="#/catalogo">Ver productos <Icon name="arrow" size={18} /></a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: "Checkout" }]} />
        <PageHead eyebrow="Casi listo" title="Finalizar compra" sub="Completa tus datos de envío y elige cómo pagar." />

        <div className="checkout-grid">
          <form className="checkout-form" onSubmit={placeOrder}>
            <h3 className="co-h">Datos de contacto</h3>
            <div className="co-row">
              <label>Nombre completo<input required name="nombre" type="text" placeholder="Tu nombre" /></label>
              <label>Teléfono / WhatsApp<input required name="telefono" type="tel" placeholder="+502 0000 0000" /></label>
            </div>
            <label>Correo<input required name="correo" type="email" placeholder="tucorreo@email.com" /></label>

            <h3 className="co-h">Envío</h3>
            <label>Dirección<input required name="direccion" type="text" placeholder="Calle, número, zona" /></label>
            <div className="co-row">
              <label>Departamento
                <select required name="departamento" defaultValue="Guatemala">
                  {GT_DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label>Municipio<input name="municipio" type="text" placeholder="Municipio" /></label>
            </div>
            <label>Referencia (opcional)<input name="referencia" type="text" placeholder="Casa color, punto de referencia…" /></label>

            <h3 className="co-h">Pago</h3>
            <div className="co-pay">
              <label className="pay-opt"><input type="radio" name="pago" value="Contra entrega (efectivo)" defaultChecked /> <span><b>Contra entrega</b><small>Paga en efectivo al recibir</small></span></label>
              <label className="pay-opt"><input type="radio" name="pago" value="Tarjeta (Visa/Mastercard)" /> <span><b>Tarjeta</b><small>Visa / Mastercard</small></span></label>
              <label className="pay-opt"><input type="radio" name="pago" value="Transferencia bancaria" /> <span><b>Transferencia</b><small>Te enviamos los datos</small></span></label>
            </div>

            <button className="btn btn-primary btn-block btn-lg co-submit" type="submit">
              Enviar pedido por WhatsApp · {money(total)} <Icon name="chat" size={18} />
            </button>
            <p className="co-disclaimer">Al confirmar, se abre WhatsApp con el resumen de tu pedido para coordinar el pago y la entrega.</p>
          </form>

          <aside className="checkout-sum">
            <h3 className="co-h">Tu pedido</h3>
            <div className="co-items">
              {items.map((it) => (
                <div className="co-item" key={it.id}>
                  <div className="co-item-vis"><ProdImg image={it.image} label="" hue={it.hue} tub={true} /><span className="co-qty">{it.qty}</span></div>
                  <div className="co-item-main">
                    <b>{it.name}</b>
                    <span>{it.flavor}</span>
                  </div>
                  <b className="co-item-price">{money(it.price * it.qty)}</b>
                </div>
              ))}
            </div>
            <div className="co-line"><span>Subtotal</span><b>{money(subtotal)}</b></div>
            <div className="co-line"><span>Envío</span><b>{shipping === 0 ? "Gratis" : money(shipping)}</b></div>
            <div className="co-total"><span>Total</span><b>{money(total)}</b></div>
            {!freeShip && <p className="co-ship-note">Agrega {money((FF.FREE_SHIP || 400) - subtotal)} más para envío gratis</p>}
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 404 ---------------- */
function NotFoundPage({ msg }) {
  return (
    <section className="page">
      <div className="ff-wrap ff-narrow" style={{ textAlign: "center", padding: "80px 0" }}>
        <h1 className="display" style={{ fontSize: "clamp(60px,16vw,140px)", color: "var(--accent)" }}>404</h1>
        <p style={{ color: "var(--text-dim)", fontSize: 18, margin: "0 0 26px" }}>{msg || "Esta página no existe o fue movida."}</p>
        <a className="btn btn-primary btn-lg" href="#/">Volver al inicio <Icon name="arrow" size={18} /></a>
      </div>
    </section>
  );
}

Object.assign(window, {
  Breadcrumb, PageHead, HomePage, CatalogPage, GoalsPage, BundlesPage, ProductPage, PackPage,
  CheckoutPage, BlogPage, BlogPostPage, ReviewsPage, ReviewForm, ContactPage, ContentPage, FaqItem, NotFoundPage,
  CONTENT_PAGES, INFO_PAGES,
});
