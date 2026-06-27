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
            <Ph label="foto producto · bote" hue={p.hue} tub={true} />
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
              <div><Icon name="ret" size={18} /><span>30 días para devolver</span></div>
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
              <div className="bl-vis"><Ph label="imagen artículo" hue={b.hue} /></div>
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
        <div className="article-vis"><Ph label="imagen artículo" hue={b.hue} /></div>
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
                  <div className="bl-vis"><Ph label="imagen artículo" hue={o.hue} /></div>
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
function ReviewsPage() {
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
                <Avatar name={t.name} hue={t.hue} />
                <div><b>{t.name}</b><span>{t.tag}</span></div>
              </div>
            </article>
          ))}
        </div>
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
    eyebrow: "Ayuda", title: "Devoluciones y garantía",
    sub: "Tu compra está protegida por 30 días.",
    blocks: [
      { h: "30 días de garantía", p: "Si no quedas satisfecho, tienes 30 días desde la fecha de entrega para solicitar la devolución de cualquier producto sin abrir y en su empaque original." },
      { h: "Producto defectuoso", p: "Si recibes un producto dañado o con un defecto de fábrica, te lo reponemos sin costo. Solo escríbenos por WhatsApp con una foto del producto." },
      { h: "Cómo solicitarla", p: "Escríbenos a hola@fitfuel.gt o por WhatsApp indicando tu número de pedido. Coordinamos la recolección y procesamos tu reembolso en un máximo de 5 días hábiles." },
      { h: "Reembolsos", p: "El reembolso se realiza por el mismo medio de pago utilizado en la compra. Las transferencias se acreditan en 1-3 días hábiles." },
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
  Breadcrumb, PageHead, HomePage, CatalogPage, GoalsPage, BundlesPage, ProductPage,
  BlogPage, BlogPostPage, ReviewsPage, ContactPage, ContentPage, FaqItem, NotFoundPage,
  CONTENT_PAGES, INFO_PAGES,
});
