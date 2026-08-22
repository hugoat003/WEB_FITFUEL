import React from "react";
/* FITFUEL — páginas (router por hash) */

const WEB3FORMS_KEY = "c56569ba-3baa-462d-a849-1d6585e39ad6";

// ── Confirmación automática al cliente ──────────────────────────────────────
// El correo se arma y envía en el servidor, en una Cloudflare Pages Function
// (functions/api/order-confirmation.js) que usa Resend con la API key como secreto.
// Así el correo sale desde el dominio propio (pedidos@fitfuelgt.com) y la clave
// nunca llega al navegador. El diseño HTML del correo vive en esa función.
async function sendClientConfirmation(orderData) {
  if (!orderData || !orderData.correo) return;
  await fetch("/api/order-confirmation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
}

// ── Aviso a la tienda de que entró un pedido ────────────────────────────────
// Se lanza DESPUÉS de que el pedido ya está guardado en Supabase, y nunca bloquea:
// si este correo falla, el pedido sigue estando en el panel de administración.
async function notifyNewOrder(orderData, detalle) {
  if (!orderData) return;
  await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      subject: `Nuevo pedido FITFUEL #${orderData.id}`,
      name: orderData.nombre,
      email: orderData.correo,
      message: detalle,
    }),
  });
}

function Breadcrumb({ items }) {
  return (
    <nav className="crumb">
      {items.map((it, i) => (
        <span key={i}>
          {it.to && i < items.length - 1
            ? <a href={toPath(it.to)}>{it.label}</a>
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
function HomePage({ ctx }) {
  // "Más vendidos" desde ventas reales y COMPARTIDAS (RPC público top_products, agregado y sin
  // datos personales). Fallback a reseñas si el RPC aún no existe o no hay ventas. Nunca localStorage.
  const [featured, setFeatured] = React.useState(
    () => FF.PRODUCTS.slice().sort((a, b) => b.reviews - a.reviews).slice(0, 4)
  );
  React.useEffect(() => {
    let alive = true;
    sb.rpc("top_products", { p_limit: 12 }).then(({ data }) => {
      if (!alive || !Array.isArray(data) || !data.length) return;
      const units = {};
      data.forEach((r) => { units[r.product_id] = Number(r.units) || 0; });
      setFeatured(FF.PRODUCTS.slice().sort((a, b) => (units[b.id] || 0) - (units[a.id] || 0)).slice(0, 4));
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const cats = FF.CATEGORIES.filter((c) => c.id !== "all");
  const catHues = [92, 200, 350, 150, 30, 270];
  return (
    <>
      <Hero />

      {/* Franja de beneficios */}
      <section className="ebens">
        <div className="ff-wrap ebens-grid">
          <div className="eben"><div><div className="eben-h">Envío gratis</div><div className="eben-p">En pedidos desde {money(FF.FREE_SHIP)}</div></div></div>
          <div className="eben"><div><div className="eben-h">Entrega 2-3 días hábiles</div><div className="eben-p">En toda Guatemala</div></div></div>
          <div className="eben"><div><div className="eben-h">Calidad certificada</div><div className="eben-p">Testeado en laboratorio</div></div></div>
        </div>
      </section>

      {/* Compra por categoría */}
      <section className="ecats">
        <div className="ff-wrap">
          <div className="ecats-head">
            <div>
              <h2 className="ecats-title">Compra por<br />categoría</h2>
              <span className="ecats-count">{String(cats.length).padStart(2, "0")} categorías</span>
            </div>
            <a className="btn btn-ghost" href="/catalogo">Ir a categorías <Icon name="arrow" size={18} /></a>
          </div>
          <div className="ecats-grid">
            {cats.map((c, i) => (
              <a key={c.id} className="ecat" href={"/catalogo?cat=" + c.id}>
                <Ph label={c.label} hue={catHues[i % catHues.length]} tub={true} />
                <div className="ecat-grad" />
                <span className="ecat-n">{String(i + 1).padStart(2, "0")}</span>
                <div className="ecat-foot">
                  <span className="ecat-name">{c.label}</span>
                  <span className="ecat-arrow"><Icon name="arrow" size={14} style={{ transform: "rotate(-45deg)" }} /></span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="ff-wrap">
          <div className="sec-head">
            <div>
              <h2 className="display">Los más vendidos</h2>
              <p>Nuestra selección de productos para empezar con todo.</p>
            </div>
            <a className="btn btn-ghost" href="/catalogo">Ver catálogo <Icon name="arrow" size={18} /></a>
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
      <CtaBand user={ctx.user} />
    </>
  );
}

/* ---------------- CATÁLOGO ---------------- */
function CatalogPage({ ctx, route }) {
  const offersOnly = route.path === "/ofertas";
  const cat = (route.query && route.query.cat) || "all";
  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: offersOnly ? "Ofertas" : "Catálogo" }]} />
      </div>
      <Catalog query={ctx.query} activeGoals={ctx.activeGoals} onAdd={ctx.onAdd} onQuick={ctx.onQuick}
        favs={ctx.favs} toggleFav={ctx.toggleFav} initialCat={cat} offersOnly={offersOnly}
        setQuery={ctx.setQuery} clearGoals={ctx.clearGoals} />
    </section>
  );
}

/* ---------------- OBJETIVOS ---------------- */
function GoalsPage({ ctx }) {
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
              <a className="btn btn-primary" href="/catalogo">Ver todo el catálogo <Icon name="arrow" size={18} /></a>
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
function BundlesPage({ ctx }) {
  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: "Packs" }]} />
      </div>
      <Bundles onAddBundle={ctx.onAddBundle} />
      <CtaBand user={ctx.user} />
    </section>
  );
}

/* ---------------- PRODUCTO ---------------- */
function ProductPage({ ctx, route }) {
  const id = route.parts[1];
  const p = FF.PRODUCTS.find((x) => x.id === id);
  const [selFlavor, setSelFlavor] = React.useState("");
  const [selSize, setSelSize] = React.useState("");
  const [imgIdx, setImgIdx] = React.useState(0);
  const [menuOpen, setMenuOpen] = React.useState(false);
  // Al cambiar de producto, arranca en la primera presentación.
  React.useEffect(() => {
    const first = FF.variantsOf(p)[0] || {};
    setSelFlavor(first.flavor || ""); setSelSize(first.size || ""); setImgIdx(0);
    window.scrollTo(0, 0);
  }, [id]);
  if (!p) return <NotFoundPage msg="No encontramos ese producto." />;
  const cat = FF.CATEGORIES.find((c) => c.id === p.cat);
  const related = FF.PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 3);
  // Presentaciones vendidas como productos separados (mismo `group`): el selector de
  // Tamaño navega entre ellas. Ordenadas por precio (menor primero).
  const groupSiblings = p.group ? FF.PRODUCTS.filter((x) => x.group === p.group).sort((a, b) => (a.price || 0) - (b.price || 0)) : [];

  // ── Presentaciones (SKU): sabor + tamaño, cada uno con precio/galería/nutrición ──
  const vs = FF.variantsOf(p);
  const flavors = [...new Set(vs.map((v) => v.flavor).filter(Boolean))];
  const sizesForFlavor = [...new Set(vs.filter((v) => !selFlavor || v.flavor === selFlavor).map((v) => v.size).filter(Boolean))];
  const cur = FF.findVariant(p, selFlavor, selSize) || {};
  const onFlavor = (f) => { const nv = FF.findVariant(p, f, selSize) || {}; setSelFlavor(f); setSelSize(nv.size || ""); setImgIdx(0); };
  const onSize = (s) => { setSelSize(s); setImgIdx(0); };

  // Solo comparte imágenes entre tamaños del MISMO sabor; nunca toma la de otro sabor.
  const sameFlavorVar = vs.find((v) => v.flavor === cur.flavor && v.images && v.images.length);
  const images = cur.images && cur.images.length ? cur.images : (sameFlavorVar ? sameFlavorVar.images : []);
  const nImg = images.length || 1;
  const activeImage = images.length ? images[Math.min(imgIdx, nImg - 1)] : null;
  const thumbImage = images.length ? images[(imgIdx + 1) % nImg] : null;
  const shownPrice = cur.price != null ? cur.price : p.price;
  const isDefaultVariant = vs[0] && cur.flavor === vs[0].flavor && cur.size === vs[0].size;
  const facts = cur.facts && cur.facts.length ? cur.facts : (p.facts || []);
  const c = FF.CONTACT || {};
  const cartCount = (ctx.cartItems || []).reduce((s, it) => s + it.qty, 0);
  // La presentación elegida se guarda como variante (vf): define precio e imagen en el carrito.
  const cartVariant = FF.variantLabel(cur) || null;
  const vStock = FF.variantStock(p, cur); // ya prefiere el stock vivo de Supabase
  const out = vStock === 0;
  const low = vStock != null && vStock > 0 && vStock <= (FF.LOW_STOCK || 5);
  const addToCart = () => { if (!out) ctx.onAdd(p, null, 1, cartVariant); };          // añade sin abrir el carrito
  const buyNow = () => { if (out) return; ctx.onAdd(p, null, 1, cartVariant); ctx.openCart(); }; // añade y abre

  return (
    <div className="dp-shell">
      <div className="dp-frame">

        {/* ===== HERO (claro) ===== */}
        <section className="dp-hero" id="top">
          <div className="dp-nav">
            <div className="dp-nav-l">
              <button className="dp-iconbtn" onClick={() => setMenuOpen(true)} aria-label="Menú"><Icon name="menu" size={20} stroke={1.8} /></button>
              <span className="dp-nav-label dp-mono">:: Catálogo</span>
            </div>
            <a href="/" aria-label="Inicio"><img src="/logo-full.png" alt="FITFUEL" className="dp-logo" /></a>
            <div className="dp-nav-r">
              {ctx.user
                ? <a href="/cuenta" className="dp-nav-link dp-mono">{(ctx.user.email || "").split("@")[0] || "Mi cuenta"}</a>
                : <button className="dp-nav-link dp-mono" onClick={ctx.openAuth}>Iniciar sesión</button>}
              <button className="dp-cart" onClick={ctx.openCart} aria-label="Carrito">
                <Icon name="cart" size={20} stroke={1.6} />
                {cartCount > 0 && <span className="dp-cart-badge">{cartCount}</span>}
              </button>
            </div>
          </div>

          <div className="dp-crumb dp-mono">
            <a href="/">Inicio</a> &nbsp;·&nbsp; <a href="/catalogo">Catálogo</a> &nbsp;·&nbsp; <b>{p.name}</b>
          </div>

          <div className="dp-grid">
            <h1 className="dp-title dp-arch">{p.name}</h1>

            {/* IZQUIERDA */}
            <div className="dp-col">
              {p.blurb && <p className="dp-desc">{p.blurb}</p>}
              {flavors.length >= 2 && (
                <div className="dp-block">
                  <span className="dp-block-n dp-mono">01</span>
                  <div className="dp-block-body">
                    <div className="dp-block-lbl dp-mono">Sabor</div>
                    <div className="dp-opts">
                      {flavors.map((f, i) => (
                        <button key={i} className={"dp-opt" + (f === cur.flavor ? " on" : "")}
                          onClick={() => onFlavor(f)}>{f}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {sizesForFlavor.length >= 2 && (
                <div className="dp-block">
                  <span className="dp-block-n dp-mono">{flavors.length >= 2 ? "02" : "01"}</span>
                  <div className="dp-block-body">
                    <div className="dp-block-lbl dp-mono">Tamaño</div>
                    <div className="dp-opts">
                      {sizesForFlavor.map((s, i) => (
                        <button key={i} className={"dp-opt" + (s === cur.size ? " on" : "")}
                          onClick={() => onSize(s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tamaño entre productos separados del mismo grupo (navega al otro producto) */}
              {groupSiblings.length >= 2 && (
                <div className="dp-block">
                  <span className="dp-block-n dp-mono">{String(1 + (flavors.length >= 2 ? 1 : 0) + (sizesForFlavor.length >= 2 ? 1 : 0)).padStart(2, "0")}</span>
                  <div className="dp-block-body">
                    <div className="dp-block-lbl dp-mono">Tamaño</div>
                    <div className="dp-opts">
                      {groupSiblings.map((sib) => (
                        <button key={sib.id} className={"dp-opt" + (sib.id === p.id ? " on" : "")}
                          onClick={() => { if (sib.id !== p.id) navigate("/producto/" + sib.id); }}>
                          {sib.sizeLabel || sib.flavor}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(out || low) && (
                <div className={"dp-stock dp-mono" + (out ? " out" : " low")}>
                  {out ? "Agotado" : "Últimas unidades"}
                </div>
              )}
              <div className="dp-buy">
                <div className="dp-price dp-arch">
                  {money(shownPrice)}{p.oldPrice && isDefaultVariant && <s>{money(p.oldPrice)}</s>}
                </div>
                <button className="dp-buy-ico" onClick={addToCart} disabled={out} aria-label={out ? "Agotado" : "Añadir al carrito"}><Icon name="cart" size={16} stroke={1.8} /></button>
                <button className="dp-buy-btn dp-mono" onClick={buyNow} disabled={out}>
                  {out ? "Agotado" : <><Icon name="cart" size={14} /> Comprar en 1 clic</>}
                </button>
              </div>
            </div>

            {/* CENTRO */}
            <div className="dp-main">
              <div className="dp-imgbox">
                <ProdImg image={activeImage} label="foto producto · bote" hue={p.hue} tub={true} />
                {nImg > 1 && (
                  <>
                    <button className="dp-gnav prev" onClick={() => setImgIdx((imgIdx - 1 + nImg) % nImg)} aria-label="Imagen anterior">
                      <Icon name="arrow" size={18} style={{ transform: "rotate(180deg)" }} />
                    </button>
                    <button className="dp-gnav next" onClick={() => setImgIdx((imgIdx + 1) % nImg)} aria-label="Imagen siguiente">
                      <Icon name="arrow" size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* DERECHA */}
            <div className="dp-side">
              <div className="dp-meta">
                <div>
                  <div className="dp-meta-k dp-mono">Código</div>
                  <div className="dp-meta-v">{(p.code || p.id || "").toUpperCase()}</div>
                </div>
                <div>
                  <div className="dp-meta-k dp-mono">Tipo</div>
                  <div className="dp-meta-v">{cat ? cat.label : "—"}</div>
                </div>
              </div>
              <div className={"dp-thumb-box" + (nImg > 1 ? " clickable" : "")}
                onClick={nImg > 1 ? () => setImgIdx((imgIdx + 1) % nImg) : undefined}
                role={nImg > 1 ? "button" : undefined} aria-label={nImg > 1 ? "Ver siguiente imagen" : undefined}>
                <ProdImg image={thumbImage} label="foto secundaria" hue={p.hue} tub={true} />
              </div>
              <div className="dp-pager">
                <div className="dp-dots">
                  {Array.from({ length: nImg }).map((_, i) => (
                    <button key={i} className={"dp-dot" + (i === Math.min(imgIdx, nImg - 1) ? " on" : "")}
                      onClick={() => setImgIdx(i)} aria-label={"Imagen " + (i + 1)} />
                  ))}
                </div>
                <div className="dp-pager-side">
                  <span className="dp-pager-n dp-mono">
                    {String(Math.min(imgIdx, nImg - 1) + 1).padStart(2, "0")}&nbsp;/&nbsp;{String(nImg).padStart(2, "0")}
                  </span>
                  <button className="dp-next" onClick={() => setImgIdx((imgIdx + 1) % nImg)} aria-label="Siguiente imagen">
                    <Icon name="arrow" size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Drawer móvil */}
        {menuOpen && (
          <div className="dp-drawer-scrim" onClick={() => setMenuOpen(false)}>
            <div className="dp-drawer" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="dp-iconbtn" onClick={() => setMenuOpen(false)} aria-label="Cerrar"><Icon name="x" size={20} /></button>
              </div>
              <div className="dp-drawer-nav">
                <a href="/" onClick={() => setMenuOpen(false)}>Inicio</a>
                <a href="/catalogo" onClick={() => setMenuOpen(false)}>Catálogo</a>
                <a href="/packs" onClick={() => setMenuOpen(false)}>Packs</a>
                <a href="/contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
              </div>
            </div>
          </div>
        )}

        {/* ===== STATEMENT (specs) ===== */}
        <section className="dp-stmt">
          <h2 className="dp-arch">
            {facts.length
              ? facts.map(([k, v], i) => (
                  <React.Fragment key={i}>{v} {k}{i < facts.length - 1 && <br />}</React.Fragment>
                ))
              : p.blurb}
          </h2>
          <div className="dp-stmt-ar"><Icon name="arrow" size={18} stroke={1.5} style={{ transform: "rotate(90deg)" }} /></div>
        </section>

        {/* ===== CARDS ===== */}
        <section className="dp-cards">
          <div className="dp-card">
            <h3 className="dp-arch">Envíos</h3>
            <p>Entregamos de lunes a viernes en 2 a 3 días hábiles. Envío gratis en pedidos desde {money(FF.FREE_SHIP)} a toda Guatemala.</p>
            <a href="/ayuda/envios" className="dp-card-link dp-mono">Ver detalles</a>
          </div>
          <div className="dp-card">
            <div className="dp-card-faq-body">
              <h3 className="dp-arch">Preguntas frecuentes</h3>
              <p>Resuelve tus dudas sobre uso, dosis y modo de preparación en nuestra sección de ayuda.</p>
              <a href="/ayuda/faq" className="dp-card-link dp-mono">Ver detalles</a>
            </div>
            <div className="dp-card-img"><ProdImg image={p.image} label="" hue={p.hue} tub={true} /></div>
            <div className="dp-card-fade" />
          </div>
        </section>

        {/* ===== RELACIONADOS ===== */}
        {related.length > 0 && (
          <section className="dp-rel" id="related">
            <div className="dp-rel-head">
              <h2 className="dp-arch">También te<br />puede interesar</h2>
              <a href="/catalogo" className="dp-rel-cta">
                <span className="ic"><Icon name="arrow" size={18} style={{ transform: "rotate(-45deg)" }} /></span>
                <span className="lbl dp-mono">Ver<br />catálogo</span>
              </a>
            </div>
            <div className="dp-rel-grid">
              {related.map((rp) => (
                <a key={rp.id} href={"/producto/" + rp.id} className="dp-rel-card">
                  <ProdImg image={rp.image} label={rp.name} hue={rp.hue} tub={true} className="dp-rel-img" />
                  <div className="grad" />
                  <span className="dp-rel-price dp-mono">{money(rp.price)}</span>
                  <span className="dp-rel-name dp-arch">{rp.name}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ===== FOOTER ===== */}
        <footer className="dp-foot" id="footer">
          <div className="dp-foot-grid">
            <div>
              <a href="/"><img src="/logo-full.png" alt="FITFUEL" className="dp-logo" style={{ opacity: .95 }} /></a>
              <div className="dp-foot-links">
                <div className="dp-foot-col">
                  <div className="dp-foot-col-h dp-mono">Navegación</div>
                  <a href="/">Inicio</a>
                  <a href="/catalogo">Catálogo</a>
                  <a href="/nosotros">Sobre FITFUEL</a>
                  <a href="/ayuda/envios">Envíos</a>
                  <a href="/contacto">Contacto</a>
                </div>
                <div className="dp-foot-col">
                  <div className="dp-foot-col-h dp-mono">Catálogo</div>
                  <a href="/catalogo?cat=proteina">Proteínas</a>
                  <a href="/catalogo?cat=creatina">Creatina</a>
                  <a href="/catalogo?cat=pre">Pre-Entreno</a>
                  <a href="/catalogo">Ver todo</a>
                </div>
              </div>
            </div>
            <div>
              <h2 className="dp-foot-h2 dp-arch">Hablemos <span className="out">contigo</span></h2>
              <div className="dp-foot-rows">
                {[
                  { k: "Correo", v: c.email, href: "mailto:" + c.email },
                  ...(c.whatsapp ? [{ k: "WhatsApp", v: "Escríbenos", href: c.whatsappLink || "#", ext: true }] : []),
                  { k: "Tienda", v: "En línea · " + (c.city || "Guatemala") },
                ].map((row, i) => (
                  <div className="dp-foot-row" key={row.k}>
                    <span className="n dp-mono">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="k dp-mono">{row.k}</div>
                      {row.href
                        ? <a className="v" href={row.href} {...(row.ext ? { target: "_blank", rel: "noopener" } : {})}>{row.v}</a>
                        : <div className="v">{row.v}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="dp-foot-bottom">
            <div className="sm dp-mono"><a href="/privacidad" style={{ color: "inherit" }}>Política de privacidad</a><br /><a href="/terminos" style={{ color: "inherit" }}>Términos y condiciones</a></div>
            <div className="sm dp-mono">© 2026 FITFUEL</div>
            <a href="#top" className="dp-round" aria-label="Volver arriba"><Icon name="arrow" size={16} style={{ transform: "rotate(-90deg)" }} /></a>
            <span className="dp-foot-brand">FITFUEL</span>
          </div>
        </footer>

      </div>
    </div>
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
            <a className="bl" key={b.id} href={"/blog/" + b.id}>
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

function BlogPostPage({ route }) {
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
        <a className="btn btn-ghost" href="/blog"><Icon name="back" size={18} /> Volver al blog</a>

        {others.length > 0 && (
          <div className="article-more">
            <h3 className="display">Sigue leyendo</h3>
            <div className="blog-grid">
              {others.map((o) => (
                <a className="bl" key={o.id} href={"/blog/" + o.id}>
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
  const [step, setStep] = React.useState("verify"); // "verify" | "form" | "sent"
  const [checkEmail, setCheckEmail] = React.useState("");
  const [verifyErr, setVerifyErr] = React.useState("");
  const [verifiedOrder, setVerifiedOrder] = React.useState(null);
  const [verifying, setVerifying] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const verifyPurchase = async (e) => {
    e.preventDefault();
    const email = checkEmail.trim().toLowerCase();
    if (!email) return;
    // Rate limit anti-enumeración de correos.
    const rl = rateLimit("ff_rl_review", 6, 10 * 60 * 1000);
    if (!rl.ok) { setVerifyErr(`Demasiados intentos. Espera ${Math.ceil(rl.retryMs / 60000)} min.`); return; }
    setVerifying(true); setVerifyErr("");
    // Verifica contra los pedidos REALES en Supabase (RPC que solo devuelve el id del último
    // pedido de ese correo, sin exponer datos). Antes usaba localStorage (per-dispositivo, falso).
    const { data, error } = await sb.rpc("last_order_for_email", { p_email: email });
    setVerifying(false);
    if (error) { setVerifyErr("No pudimos verificar ahora. Intenta de nuevo."); return; }
    if (data) { setVerifiedOrder({ id: data, correo: email }); setStep("form"); setVerifyErr(""); }
    else setVerifyErr("No encontramos ningún pedido con ese correo. Solo clientes que han comprado pueden dejar una reseña.");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const f = new FormData(e.target);
    const g = (k) => (f.get(k) || "").toString().trim();
    setSending(true);
    // Se guarda PENDIENTE (published=false por defecto) para que el admin la modere.
    const { error } = await sb.from("reviews").insert({
      nombre: g("nombre"), lugar: g("lugar") || null,
      rating: parseInt(g("rating")) || 5, texto: g("comentario"),
      order_id: verifiedOrder?.id || null, hue: Math.floor(Math.random() * 360),
    });
    setSending(false);
    if (error) { ctx && ctx.toast && ctx.toast("No se pudo enviar la reseña. Intenta de nuevo."); return; }
    setStep("sent");
    ctx && ctx.toast && ctx.toast("¡Gracias por tu reseña! ✦");
  };

  if (step === "sent") {
    return (
      <div className="review-done">
        <span className="tk"><Icon name="check" size={22} stroke={3} /></span>
        <h3>¡Gracias por compartir!</h3>
        <p>Recibimos tu reseña. La revisamos y, si todo está en orden, la publicamos manualmente.</p>
        <button className="btn btn-ghost" onClick={() => { setStep("verify"); setCheckEmail(""); setVerifiedOrder(null); }}>Enviar otra</button>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <form className="review-form" onSubmit={verifyPurchase}>
        <h3 className="co-h">Deja tu reseña</h3>
        <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 16 }}>
          Solo clientes que han realizado una compra pueden dejar reseñas. Ingresa el correo que usaste en tu pedido para continuar.
        </p>
        <label>Correo del pedido
          <input type="email" required value={checkEmail} onChange={(e) => { setCheckEmail(e.target.value); setVerifyErr(""); }}
            placeholder="correo@ejemplo.com" />
        </label>
        {verifyErr && <p style={{ color: "var(--danger, #ef4444)", fontSize: 13, marginTop: 4 }}>{verifyErr}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={verifying}>{verifying ? "Verificando…" : <>Verificar compra <Icon name="arrow" size={18} /></>}</button>
      </form>
    );
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <div style={{ background: "var(--surface-2, #f8fafc)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "var(--text-dim)" }}>
        ✓ Compra verificada · Pedido #{verifiedOrder?.id}
      </div>
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
      <button className="btn btn-primary btn-block" type="submit" disabled={sending}>{sending ? "Enviando…" : <>Enviar reseña <Icon name="arrow" size={18} /></>}</button>
      <p className="co-disclaimer">Tu reseña llega al equipo de FITFUEL y será publicada manualmente si cumple con nuestras normas.</p>
    </form>
  );
}

function ReviewsPage({ ctx }) {
  const [dbReviews, setDbReviews] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    sb.from("reviews").select("nombre,lugar,texto,hue").eq("published", true)
      .order("created_at", { ascending: false }).limit(60)
      .then(({ data }) => { if (alive && data) setDbReviews(data.map((r) => ({ name: r.nombre, tag: r.lugar, quote: r.texto, hue: r.hue }))); });
    return () => { alive = false; };
  }, []);
  const published = [...dbReviews, ...FF.TESTIMONIALS.filter((t) => t._published)];
  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: "Reseñas" }]} />
        <PageHead eyebrow="Lo que dice la comunidad" title="Reseñas de clientes"
          sub="Opiniones reales de personas que ya probaron nuestros productos." />
        {published.length > 0 ? (
          <div className="tgrid">
            {published.map((t, i) => (
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
        ) : (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-dim)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>Sé el primero en opinar</h3>
            <p style={{ maxWidth: 360, margin: "0 auto" }}>Aún no hay reseñas publicadas. Si ya compraste, cuéntanos tu experiencia.</p>
          </div>
        )}
        <div className="review-cta"><ReviewForm ctx={ctx} /></div>
        <CtaBand user={ctx.user} />
      </div>
    </section>
  );
}

/* ---------------- CONTACTO ---------------- */
function ContactPage({ ctx }) {
  const c = FF.CONTACT || {};
  const [sent, setSent] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const g = (k) => (f.get(k) || "").toString().trim();
    setSending(true);
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Contacto FITFUEL — ${g("nombre")}`,
          name: g("nombre"),
          email: g("correo"),
          phone: g("telefono"),
          message: g("mensaje"),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Error al enviar");
      setSent(true);
      ctx.toast("Mensaje enviado ✦ Te contactaremos pronto");
    } catch {
      ctx.toast("Error al enviar. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: "Contacto" }]} />
        <PageHead eyebrow="Hablemos" title="Contacto"
          sub="¿Dudas con tu pedido o con qué suplemento elegir? Escríbenos." />
        <div className="contact-grid">
          <div className="contact-info">
            {c.whatsapp && (
              <a className="contact-row" href={c.whatsappLink || "#"} target="_blank" rel="noopener">
                <span className="ci-ic"><Icon name="chat" size={20} /></span>
                <div><b>WhatsApp</b><span>{c.whatsapp}</span></div>
              </a>
            )}
            {c.phone && (
              <a className="contact-row" href={"tel:" + c.phone.replace(/\s/g, "")}>
                <span className="ci-ic"><Icon name="phone" size={20} /></span>
                <div><b>Teléfono</b><span>{c.phone}</span></div>
              </a>
            )}
            <a className="contact-row" href={"mailto:" + c.email}>
              <span className="ci-ic"><Icon name="mail" size={20} /></span>
              <div><b>Correo</b><span>{c.email}</span></div>
            </a>
            <div className="contact-row">
              <span className="ci-ic"><Icon name="pin" size={20} /></span>
              <div><b>Tienda</b><span>En línea · Envíos a toda Guatemala</span></div>
            </div>
            {/* Tienda física — pendiente de activar
            <div className="contact-row">
              <span className="ci-ic"><Icon name="pin" size={20} /></span>
              <div><b>Tienda</b><span>{c.address}</span></div>
            </div>
            <div className="contact-row">
              <span className="ci-ic"><Icon name="clock" size={20} /></span>
              <div><b>Horario</b><span>{c.hours}</span></div>
            </div>
            */}
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
                <label>Nombre<input required name="nombre" type="text" placeholder="Tu nombre" /></label>
                <label>Correo<input required name="correo" type="email" placeholder="tucorreo@email.com" /></label>
                <label>Teléfono<input name="telefono" type="tel" placeholder="+502 0000 0000" /></label>
                <label>Mensaje<textarea required name="mensaje" rows="4" placeholder="¿En qué te ayudamos?" /></label>
                <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={sending}>
                  {sending ? "Enviando…" : <>Enviar mensaje <Icon name="arrow" size={18} /></>}
                </button>
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
      { h: "Cobertura", p: "Enviamos a toda la República de Guatemala a través de mensajería nacional, a cualquiera de los 22 departamentos." },
      { h: "Tiempos de entrega", p: "El tiempo estimado de entrega es de 2 a 3 días hábiles a cualquier punto del país, contados a partir de la confirmación de tu pedido." },
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
      { h: "Nuestra historia", p: "FITFUEL nació con el propósito de acercar suplementos de calidad, originales y sin marketing engañoso a quienes entrenan en serio, ofreciendo precios justos y accesibles en quetzales." },
      { h: "Qué nos mueve", p: "Creemos en la transparencia total. Etiquetas claras, dosis efectivas y cero azúcares ocultos. Si un ingrediente no tiene respaldo científico, no lo vendemos." },
      { h: "Hecho para Guatemala", p: "Entendemos al atleta local: desde quien entrena en casa hasta el competidor. Por eso enviamos a todo el país y damos asesoría real por WhatsApp." },
    ],
  },
  calidad: {
    eyebrow: "FITFUEL", title: "Calidad y laboratorio",
    sub: "Cada lote, verificado. Sin atajos.",
    blocks: [
      { h: "Testeado en laboratorio", p: "Todos nuestros productos pasan por análisis de laboratorio de terceros que verifican pureza, contenido proteico y ausencia de metales pesados y sustancias prohibidas." },
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
      { h: "Únete", p: "Escríbenos al correo contacto@fitfuelgt.com con el asunto 'Afiliados' y te enviamos los detalles." },
    ],
  },
  privacidad: {
    eyebrow: "Legal", title: "Aviso de privacidad",
    sub: "Cómo tratamos tus datos personales en FITFUEL.",
    blocks: [
      { h: "Qué datos recopilamos", p: "Al comprar o crear una cuenta recopilamos: nombre, correo electrónico, teléfono, dirección de envío e historial de pedidos. Si te registras con Google, recibimos tu nombre y correo de esa cuenta. No almacenamos datos de tarjetas: el pago es contra entrega o por transferencia." },
      { h: "Para qué los usamos", p: "Usamos tus datos únicamente para procesar y entregar tus pedidos, contactarte sobre tu compra y, si tienes cuenta, guardar tu dirección e historial para agilizar futuras compras." },
      { h: "Con quién los compartimos", p: "Solo con los proveedores necesarios para operar la tienda: Supabase (base de datos y cuentas), Resend (correos de confirmación) y la empresa de mensajería que entrega tu pedido. No vendemos ni cedemos tus datos a terceros con fines publicitarios." },
      { h: "Tus derechos", p: "Puedes solicitar acceso, corrección o eliminación de tus datos personales, así como cerrar tu cuenta, escribiéndonos a contacto@fitfuelgt.com. Responderemos en un plazo razonable." },
      { h: "Seguridad", p: "La conexión con el sitio está cifrada (HTTPS) y el acceso a los datos está restringido. Aun así, ningún sistema es infalible; te recomendamos usar una contraseña única." },
      { h: "Contacto", p: "Para cualquier duda sobre privacidad, escríbenos a contacto@fitfuelgt.com. Este aviso es una versión base y puede actualizarse; te recomendamos revisarlo periódicamente." },
    ],
  },
  terminos: {
    eyebrow: "Legal", title: "Términos y condiciones",
    sub: "Las reglas de uso y compra en FITFUEL.",
    blocks: [
      { h: "Aceptación", p: "Al usar este sitio y realizar un pedido aceptas estos términos. Si no estás de acuerdo, por favor no completes la compra." },
      { h: "Productos y precios", p: "Los precios se muestran en Quetzales (GTQ) e incluyen los impuestos aplicables. Podemos actualizar precios, disponibilidad y descripciones en cualquier momento. Si detectamos un error evidente de precio en tu pedido, te contactaremos antes de procesarlo." },
      { h: "Pedidos y pago", p: "Aceptamos pago contra entrega (efectivo) y transferencia bancaria. Un pedido se considera confirmado solo cuando verificamos disponibilidad y coordinamos el pago; nos reservamos el derecho de rechazar o cancelar pedidos con datos incompletos o sospechosos." },
      { h: "Envíos y entregas", p: "Los tiempos y costos de envío se detallan en la página de Envíos. Las fechas son estimadas y pueden variar por causas ajenas a nosotros (clima, mensajería, dirección incompleta)." },
      { h: "Devoluciones", p: "Por tratarse de productos de consumo, y por higiene y seguridad, no aceptamos devoluciones ni cambios, salvo daño en el transporte según nuestra Política de devoluciones." },
      { h: "Uso de los suplementos", p: "Nuestros productos son suplementos alimenticios, no medicamentos, y no sustituyen una dieta equilibrada ni el consejo de un profesional de la salud. Consulta a tu médico antes de usarlos si tienes alguna condición." },
      { h: "Ley aplicable", p: "Estos términos se rigen por las leyes de la República de Guatemala." },
    ],
  },
  cookies: {
    eyebrow: "Legal", title: "Política de cookies y almacenamiento",
    sub: "Qué guardamos en tu navegador y por qué.",
    blocks: [
      { h: "Almacenamiento necesario", p: "Guardamos tu carrito y tus favoritos en el almacenamiento local (localStorage) de tu navegador para que no los pierdas entre visitas. Es información que se queda en tu dispositivo." },
      { h: "Sesión de tu cuenta", p: "Si inicias sesión, usamos el almacenamiento de Supabase para mantener tu sesión activa de forma segura. Sin esto no podrías permanecer identificado ni ver tus pedidos." },
      { h: "Publicidad y analítica", p: "Actualmente no usamos cookies de publicidad de terceros. Si en el futuro incorporamos herramientas de analítica, actualizaremos esta página y, cuando corresponda, te pediremos tu consentimiento." },
      { h: "Cómo controlarlas", p: "Puedes borrar el almacenamiento y las cookies desde la configuración de tu navegador. Ten en cuenta que, si lo haces, se vaciará tu carrito y se cerrará tu sesión." },
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
              <a className="btn btn-primary" href="/contacto">Contáctanos <Icon name="arrow" size={18} /></a>
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
        <a className="btn btn-ghost" href="/" style={{ marginTop: 30 }}><Icon name="back" size={18} /> Volver al inicio</a>
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
function PackPage({ ctx, route }) {
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
          <div><Icon name="lab" size={18} /><span>Testeado en laboratorio</span></div>
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
const SHIP_COST = () => FF.SHIP_COST || 35;

function CheckoutPage({ ctx }) {
  const items = ctx.cartItems || [];
  const user = ctx.user || null;
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const freeShip = subtotal >= (FF.FREE_SHIP || 400);
  const shipping = freeShip ? 0 : SHIP_COST();
  const [order, setOrder] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const [promoInput, setPromoInput] = React.useState("");
  const [promo, setPromo] = React.useState(null);
  const [promoErr, setPromoErr] = React.useState("");
  const [promoLoading, setPromoLoading] = React.useState(false);
  const [savedAddr, setSavedAddr] = React.useState(null);
  // Elegible al código de bienvenida solo si es logueado y aún no tiene pedidos.
  const [welcomeEligible, setWelcomeEligible] = React.useState(false);

  const discountAmt = promo ? Math.round(subtotal * promo.discount_pct) / 100 : 0;
  const total = subtotal + shipping - discountAmt;

  React.useEffect(() => { window.scrollTo(0, 0); }, []);

  React.useEffect(() => {
    if (!user) { setWelcomeEligible(false); return; }
    sb.from("addresses").select("*").eq("user_id", user.id).limit(1).single()
      .then(({ data }) => { if (data) setSavedAddr(data); });
    sb.from("orders").select("*", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => setWelcomeEligible((count || 0) === 0));
  }, [user]);

  const promoPlaceholder = welcomeEligible ? "BIENVENIDO10" : "Ingresa tu código";

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    // Rate limit: máx. 8 intentos por 10 min (evita fuerza bruta de códigos).
    const rl = rateLimit("ff_rl_promo", 8, 10 * 60 * 1000);
    if (!rl.ok) { setPromoErr(`Demasiados intentos. Espera ${Math.ceil(rl.retryMs / 60000)} min.`); return; }
    setPromoLoading(true); setPromoErr(""); setPromo(null);
    const { data, error } = await sb.from("promo_codes").select("*").eq("code", code).eq("active", true).single();
    if (error || !data) { setPromoErr("Código inválido o expirado"); setPromoLoading(false); return; }
    // Los códigos de primera compra EXIGEN sesión. Sin este bloque, quien compraba como
    // invitado podía usar BIENVENIDO10 en todos sus pedidos: no había con qué contar sus
    // compras previas. El servidor lo vuelve a comprobar en place_order (CODIGO_REQUIERE_CUENTA).
    if (data.first_purchase_only) {
      if (!user) {
        setPromoErr("Este código es solo para la primera compra. Crea tu cuenta gratis o inicia sesión para usarlo.");
        setPromoLoading(false);
        return;
      }
      const { count } = await sb.from("orders").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      if (count > 0) { setPromoErr("Este código es solo para tu primera compra"); setPromoLoading(false); return; }
    }
    setPromo(data);
    setPromoLoading(false);
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (sending) return;
    // Rate limit: máx. 5 pedidos por hora desde este navegador (anti-spam).
    const rl = rateLimit("ff_rl_order", 5, 60 * 60 * 1000);
    if (!rl.ok) {
      ctx.toast(`Demasiados pedidos seguidos. Espera ${Math.ceil(rl.retryMs / 60000)} min e intenta de nuevo.`);
      return;
    }
    // Validación de stock por presentación: no confirmar más unidades que las disponibles.
    const over = items.find((it) => {
      const prod = FF.PRODUCTS.find((x) => x.id === it.id);
      if (!prod) return false;
      const v = it.vf ? FF.variantsOf(prod).find((vv) => FF.variantLabel(vv) === it.vf) : null;
      const s = v ? FF.variantStock(prod, v) : (prod.stock != null ? prod.stock : null);
      return s != null && it.qty > s;
    });
    if (over) { ctx.toast(`Sin stock suficiente de ${over.name}. Ajusta la cantidad.`); return; }
    const f = new FormData(e.target);
    const g = (k) => (f.get(k) || "").toString().trim();
    // ID de pedido: marca de tiempo en base36 (ordena cronológicamente de forma natural)
    // + 3 caracteres al azar. El esquema anterior eran 6 dígitos aleatorios sobre 900k
    // combinaciones: ~5% de colisión a los 300 pedidos y ~50% a los 1.100. Al ser clave
    // primaria, una colisión le mostraba al cliente "Error al enviar" sin motivo aparente.
    const id = "FF-" + (Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 5)).toUpperCase();
    const count = items.reduce((s, it) => s + it.qty, 0);

    const lines = items.map((it) => `${it.qty}x ${it.name} (${it.flavor}) — ${money(it.price * it.qty)}`);
    const detalle =
      lines.join("\n") +
      `\n\nSubtotal: ${money(subtotal)}\nEnvío: ${shipping === 0 ? "Gratis" : money(shipping)}\nTotal: ${money(total)}\n\n` +
      `Cliente: ${g("nombre")}\nTel: ${g("telefono")}\nCorreo: ${g("correo")}\n` +
      `Dirección: ${g("direccion")}, ${g("municipio")}, ${g("departamento")}\n` +
      (g("referencia") ? `Referencia: ${g("referencia")}\n` : "") +
      `Pago: ${g("pago")}`;

    setSending(true);
    try {
      // ── 1) El pedido se registra PRIMERO ─────────────────────────────────────
      // Es la única operación que no puede fallar en silencio. Antes el aviso por correo
      // iba delante: si Web3Forms se caía o agotaba su cuota, el `throw` cortaba el flujo
      // y la venta no llegaba a registrarse en ninguna parte.
      const orderPayload = {
        id, user_id: user?.id || null,
        items: items.map((it) => ({ id: it.id, name: it.name, flavor: it.flavor, qty: it.qty, price: it.price, cat: it.cat || "" })),
        subtotal, shipping, total,
        discount_code: promo?.code || null,
        discount_pct: promo?.discount_pct || 0,
        nombre: g("nombre"), telefono: g("telefono"), correo: g("correo"),
        direccion: g("direccion"), municipio: g("municipio"), departamento: g("departamento"),
        referencia: g("referencia"), pago: g("pago"), status: "pendiente",
      };
      // Ítems para el descuento de stock: los packs se expanden a sus productos (presentación por defecto).
      const rpcItems = [];
      items.forEach((it) => {
        const bundle = (FF.BUNDLES || []).find((b) => b.id === it.id);
        if (bundle && bundle.productIds && bundle.productIds.length) {
          bundle.productIds.forEach((pid) => {
            const cp = FF.PRODUCTS.find((x) => x.id === pid);
            const dv = cp ? FF.variantsOf(cp)[0] : null;
            rpcItems.push({ id: pid, variant: dv ? (FF.variantLabel(dv) || "") : "", qty: it.qty, name: cp ? cp.name : pid });
          });
        } else {
          rpcItems.push({ id: it.id, variant: it.vf || "", qty: it.qty, name: it.name });
        }
      });
      // RPC atómico: descuenta stock, recalcula los montos en el servidor e inserta el pedido.
      const { error: rpcErr } = await sb.rpc("place_order", { p_order: orderPayload, p_items: rpcItems });
      if (rpcErr) {
        const msg = rpcErr.message || "";
        if (msg.includes("SIN_STOCK")) {
          const prod = (msg.split("SIN_STOCK:")[1] || "un producto").trim();
          ctx.toast(`Sin stock suficiente de ${prod}. Ajusta tu carrito.`);
          return; // el finally hace setSending(false); no se limpia el carrito
        }
        if (msg.includes("CODIGO_REQUIERE_CUENTA")) {
          ctx.toast("Ese código es solo para tu primera compra con cuenta. Inicia sesión y vuelve a intentarlo.");
          return;
        }
        throw rpcErr;
      }

      // ── 2) Desde aquí el pedido YA existe y el stock YA se descontó ──────────
      // Nada de lo que sigue puede caer al `catch`: si lo hiciera, el cliente vería un
      // error, reintentaría, y acabaría con dos pedidos y el stock descontado dos veces.
      const orderData = {
        id, total, count, subtotal, shipping, date: new Date().toLocaleString("es-GT"),
        nombre: g("nombre"), telefono: g("telefono"), correo: g("correo"),
        direccion: g("direccion"), municipio: g("municipio"), departamento: g("departamento"),
        referencia: g("referencia"), pago: g("pago"),
        items: items.map((it) => ({ name: it.name, flavor: it.flavor, qty: it.qty, price: it.price })),
      };
      ctx.clearCart();
      setOrder(orderData);
      ctx.toast("¡Pedido recibido! ✦");

      // ── 3) Efectos secundarios: ninguno bloquea ni propaga su error ──────────
      sendClientConfirmation(orderData).catch(() => {});   // correo al cliente
      notifyNewOrder(orderData, detalle).catch(() => {});  // aviso a la tienda
      // Guardar la dirección para la próxima compra. Antes vivía dentro del bloque
      // crítico, donde un corte de red justo después del RPC duplicaba el pedido.
      if (user && !savedAddr) {
        sb.from("addresses").insert({
          user_id: user.id,
          direccion: g("direccion"), municipio: g("municipio"),
          departamento: g("departamento"), referencia: g("referencia"),
        }).then(() => {}, () => {});
      }

      // Copia local del pedido (respaldo visible en el panel sin conexión)
      try {
        const orders = JSON.parse(localStorage.getItem("ff_orders") || "[]");
        orders.unshift({ ...orderPayload, date: new Date().toISOString() });
        localStorage.setItem("ff_orders", JSON.stringify(orders));
      } catch (_) {}

      // Decrementar stock en la caché local: por presentación (vf) si existe.
      try {
        const ffData = JSON.parse(localStorage.getItem("ff_data") || "{}");
        const products = ffData.products;
        if (products) {
          let changed = false;
          items.forEach((it) => {
            const prod = products.find((p) => p.id === it.id);
            if (!prod) return;
            if (Array.isArray(prod.variants) && it.vf) {
              const v = prod.variants.find((vv) => FF.variantLabel(vv) === it.vf);
              if (v && v.stock != null) { v.stock = Math.max(0, v.stock - it.qty); changed = true; }
              const anyUnlim = prod.variants.some((vv) => vv.stock == null);
              prod.stock = anyUnlim ? null : prod.variants.reduce((s, vv) => s + (vv.stock || 0), 0);
            } else if (prod.stock != null) {
              prod.stock = Math.max(0, prod.stock - it.qty); changed = true;
            }
          });
          if (changed) { ffData.products = products; localStorage.setItem("ff_data", JSON.stringify(ffData)); }
        }
      } catch (_) {}
    } catch {
      ctx.toast("Error al enviar el pedido. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  if (order) {
    const mailBody = encodeURIComponent(
      `Hola ${order.nombre},\n\nGracias por tu pedido en FITFUEL. Aquí tienes el resumen:\n\n` +
      `Pedido: #${order.id}\nFecha: ${order.date}\n\n` +
      `PRODUCTOS:\n` +
      order.items.map((it) => `  ${it.qty}x ${it.name} — ${it.flavor}  ${money(it.price * it.qty)}`).join("\n") +
      `\n\nSubtotal: ${money(order.subtotal)}\nEnvío: ${order.shipping === 0 ? "Gratis" : money(order.shipping)}\nTotal: ${money(order.total)}\n\n` +
      `DATOS DE ENTREGA:\n${order.nombre}\n${order.direccion}, ${order.municipio}, ${order.departamento}\nTel: ${order.telefono}\nPago: ${order.pago}\n\n` +
      `Nos contactaremos contigo para confirmar. ¡Gracias por elegir FITFUEL!\n\nEquipo FITFUEL Guatemala`
    );
    const mailSubject = encodeURIComponent(`Tu pedido FITFUEL #${order.id}`);
    const mailHref = `mailto:${order.correo}?subject=${mailSubject}&body=${mailBody}`;

    return (
      <section className="page">
        <div className="ff-wrap ff-narrow">
          <div className="order-done">
            <span className="tk"><Icon name="check" size={30} stroke={3} /></span>
            <h1 className="display">¡Gracias por tu pedido!</h1>
            <p style={{ color: "var(--text-dim)", marginBottom: 24 }}>
              Recibirás contacto de nuestro equipo pronto para confirmar el pago y coordinar la entrega.
            </p>

            {/* Recibo */}
            <div className="receipt" id="receipt-print">
              <div className="receipt-hd">
                <div className="receipt-logo">FIT<b>FUEL</b></div>
                <div className="receipt-id">
                  <span>Pedido</span>
                  <b>#{order.id}</b>
                </div>
              </div>
              <div className="receipt-date">{order.date}</div>

              <div className="receipt-section">
                <div className="receipt-label">Productos</div>
                {order.items.map((it, i) => (
                  <div className="receipt-row" key={i}>
                    <span>{it.qty}× {it.name} <span style={{ color: "var(--text-dim)", fontSize: 13 }}>({it.flavor})</span></span>
                    <b>{money(it.price * it.qty)}</b>
                  </div>
                ))}
              </div>

              <div className="receipt-totals">
                <div className="receipt-row">
                  <span>Subtotal</span><span>{money(order.subtotal)}</span>
                </div>
                <div className="receipt-row">
                  <span>Envío</span>
                  <span style={{ color: order.shipping === 0 ? "var(--ok)" : undefined }}>
                    {order.shipping === 0 ? "Gratis ✦" : money(order.shipping)}
                  </span>
                </div>
                <div className="receipt-row receipt-total-line">
                  <b>Total</b><b>{money(order.total)}</b>
                </div>
              </div>

              <div className="receipt-section">
                <div className="receipt-label">Datos de entrega</div>
                <div className="receipt-info">{order.nombre}</div>
                <div className="receipt-info">{order.direccion}, {order.municipio}</div>
                <div className="receipt-info">{order.departamento}</div>
                <div className="receipt-info">Tel: {order.telefono}</div>
                {order.correo && <div className="receipt-info">{order.correo}</div>}
                <div className="receipt-info" style={{ marginTop: 6 }}>Pago: <b>{order.pago}</b></div>
              </div>

              <div className="receipt-footer">
                FITFUEL Guatemala · fitfuelgt.com
              </div>
            </div>

            <div className="order-actions" style={{ marginTop: 20 }}>
              <button className="btn btn-accent btn-lg" onClick={() => window.print()}>
                <Icon name="shield" size={18} /> Imprimir / Guardar PDF
              </button>
              <a className="btn btn-ghost btn-lg" href={mailHref}>
                Enviar a mi correo
              </a>
            </div>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <a className="btn btn-primary btn-lg" href="/catalogo">Seguir comprando <Icon name="arrow" size={18} /></a>
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
            <a className="btn btn-primary" href="/catalogo">Ver productos <Icon name="arrow" size={18} /></a>
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
          <form className="checkout-form" onSubmit={placeOrder} key={savedAddr?.id || "no-addr"}>
            <h3 className="co-h">Datos de contacto</h3>
            {user && <p className="co-logged-as"><Icon name="user" size={13} /> Comprando como <b>{user.user_metadata?.full_name || user.email}</b></p>}
            <div className="co-row">
              <label>Nombre completo<input required name="nombre" type="text" placeholder="Tu nombre"
                defaultValue={user?.user_metadata?.full_name || ""} /></label>
              <label>Teléfono / WhatsApp<input required name="telefono" type="tel" placeholder="+502 0000 0000" /></label>
            </div>
            <label>Correo<input required name="correo" type="email" placeholder="tucorreo@email.com"
              defaultValue={user?.email || ""} /></label>

            <h3 className="co-h">Envío {savedAddr && <span className="co-saved-badge">Dirección guardada</span>}</h3>
            <label>Dirección<input required name="direccion" type="text" placeholder="Calle, número, zona"
              defaultValue={savedAddr?.direccion || ""} /></label>
            <div className="co-row">
              <label>Departamento
                <select required name="departamento" defaultValue={savedAddr?.departamento || "Guatemala"}>
                  {GT_DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label>Municipio<input required name="municipio" type="text" placeholder="Municipio"
                defaultValue={savedAddr?.municipio || ""} /></label>
            </div>
            <label>Referencia (opcional)<input name="referencia" type="text" placeholder="Casa color, punto de referencia…"
              defaultValue={savedAddr?.referencia || ""} /></label>

            <fieldset className="co-fieldset">
              <legend className="co-h">Pago</legend>
              <div className="co-pay">
                <label className="pay-opt"><input type="radio" name="pago" value="Contra entrega (efectivo)" defaultChecked /> <span><b>Contra entrega</b><small>Paga en efectivo al recibir</small></span></label>
                <label className="pay-opt"><input type="radio" name="pago" value="Transferencia bancaria" /> <span><b>Transferencia</b><small>Te enviamos los datos</small></span></label>
              </div>
            </fieldset>

            <h3 className="co-h" id="promo-label">Código de descuento</h3>
            <div className="co-promo">
              <input value={promoInput} onChange={(e) => { setPromoInput(e.target.value); setPromoErr(""); setPromo(null); }}
                placeholder={promoPlaceholder} className="co-promo-input" disabled={!!promo}
                aria-labelledby="promo-label" aria-describedby="promo-feedback"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())} />
              {promo
                ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPromo(null); setPromoInput(""); }}>Quitar</button>
                : <button type="button" className="btn btn-ghost btn-sm" onClick={applyPromo} disabled={promoLoading || !promoInput.trim()}>
                    {promoLoading ? "…" : "Aplicar"}
                  </button>}
            </div>
            <div id="promo-feedback" aria-live="polite">
              {promoErr && <p className="co-promo-err">{promoErr}</p>}
              {promo && <p className="co-promo-ok"><Icon name="check" size={14} stroke={3} /> {promo.discount_pct}% aplicado — ahorras {money(discountAmt)}</p>}
            </div>

            {!user && (
              <p className="co-login-tip">
                <Icon name="user" size={14} /> ¿Tienes cuenta?{" "}
                <button type="button" className="link-x" onClick={ctx.openAuth}>Inicia sesión</button>
                {" "}para usar tu código de bienvenida y guardar tu dirección.
              </p>
            )}

            <button className="btn btn-primary btn-block btn-lg co-submit" type="submit" disabled={sending}>
              {sending ? "Enviando pedido…" : <>Confirmar pedido · {money(total)} <Icon name="arrow" size={18} /></>}
            </button>
            <p className="co-disclaimer">Al confirmar, recibiremos tu pedido y nos pondremos en contacto contigo para coordinar el pago y la entrega.</p>
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
            <div className="co-line"><span>Envío</span><b>{shipping === 0 ? `Gratis` : money(shipping)}</b></div>
            {promo && <div className="co-line co-discount"><span>Descuento ({promo.code})</span><b>-{money(discountAmt)}</b></div>}
            <div className="co-total"><span>Total</span><b>{money(total)}</b></div>
            {!freeShip && <p className="co-ship-note">Agrega {money((FF.FREE_SHIP || 400) - subtotal)} más para envío gratis</p>}
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 404 ---------------- */
/* ── CUENTA / PEDIDOS ────────────────────────────────────── */
const STATUS_LABELS = { pendiente: "Pendiente", confirmado: "Confirmado", enviado: "En camino", entregado: "Entregado", cancelado: "Cancelado" };
const STATUS_COLORS = { pendiente: "var(--accent)", confirmado: "var(--info)", enviado: "var(--info-2)", entregado: "var(--ok)", cancelado: "var(--text-dim)" };

function AccountPage({ ctx, route }) {
  const { useState, useEffect } = React;
  const user = ctx.user;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const sub = route?.parts[1];

  useEffect(() => {
    if (!user) return;
    sb.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, [user]);

  if (!user) {
    return (
      <section className="page">
        <div className="ff-wrap ff-narrow" style={{ textAlign: "center", padding: "70px 0" }}>
          <Icon name="user" size={40} style={{ color: "var(--accent)", marginBottom: 16 }} />
          <h2 className="display">Tu cuenta</h2>
          <p style={{ color: "var(--text-dim)", margin: "12px 0 28px" }}>Inicia sesión para ver tus pedidos y datos guardados.</p>
          <button className="btn btn-primary btn-lg" onClick={ctx.openAuth}>
            Iniciar sesión <Icon name="arrow" size={18} />
          </button>
        </div>
      </section>
    );
  }

  const nombre = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";
  const favProducts = FF.PRODUCTS.filter((p) => ctx.favs.has(p.id));

  return (
    <section className="page">
      <div className="ff-wrap">
        <Breadcrumb items={[{ label: "Inicio", to: "/" }, { label: "Mi cuenta" }]} />
        <div className="account-grid">

          {/* Sidebar perfil */}
          <aside className="account-aside">
            <div className="account-card">
              <div className="account-avatar">{nombre[0].toUpperCase()}</div>
              <b>{nombre}</b>
              <span style={{ color: "var(--text-dim)", fontSize: 14 }}>{user.email}</span>
            </div>
            <nav className="account-nav">
              <a href="/cuenta" className={!sub ? "on" : ""}><Icon name="user" size={15} /> Perfil</a>
              <a href="/cuenta/pedidos" className={sub === "pedidos" ? "on" : ""}><Icon name="package" size={15} /> Mis pedidos <span className="acnt-badge">{orders.length}</span></a>
              <a href="/cuenta/favoritos" className={sub === "favoritos" ? "on" : ""}><Icon name="heart" size={15} /> Favoritos <span className="acnt-badge">{ctx.favs.size}</span></a>
            </nav>
          </aside>

          {/* Contenido */}
          <div className="account-main">
            {(!sub || sub === "perfil") && (
              <div>
                <h2 className="co-h" style={{ marginBottom: 20 }}>Perfil</h2>
                <div className="account-card" style={{ flexDirection: "row", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div className="account-field"><span>Nombre</span><b>{nombre}</b></div>
                    <div className="account-field"><span>Correo</span><b>{user.email}</b></div>
                    <div className="account-field"><span>Miembro desde</span><b>{new Date(user.created_at).toLocaleDateString("es-GT", { year: "numeric", month: "long" })}</b></div>
                  </div>
                </div>
                {!loading && orders.length === 0 && (
                  <div style={{ marginTop: 24 }}>
                    <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 8 }}>Código de bienvenida (primera compra)</p>
                    <div className="promo-badge">BIENVENIDO10 <span>— 10% de descuento</span></div>
                  </div>
                )}
              </div>
            )}

            {sub === "pedidos" && (
              <div>
                <h2 className="co-h" style={{ marginBottom: 20 }}>Mis pedidos</h2>
                {loading ? <p style={{ color: "var(--text-dim)" }}>Cargando…</p>
                  : orders.length === 0 ? (
                    <div className="cart-empty" style={{ padding: "50px 20px" }}>
                      <Icon name="package" size={36} />
                      <div>Aún no tienes pedidos.<br />¡Empieza a comprar!</div>
                      <a className="btn btn-primary" href="/catalogo">Ver productos <Icon name="arrow" size={18} /></a>
                    </div>
                  ) : orders.map((o) => (
                    <div className="acnt-order" key={o.id}>
                      <div className="acnt-order-hd" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                        <div>
                          <b>#{o.id}</b>
                          <span style={{ color: "var(--text-dim)", fontSize: 13, marginLeft: 10 }}>
                            {new Date(o.created_at).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span className="acnt-status" style={{ color: STATUS_COLORS[o.status] }}>● {STATUS_LABELS[o.status] || o.status}</span>
                          <b>{money(o.total)}</b>
                          <Icon name="chevron" size={16} style={{ transform: expanded === o.id ? "rotate(270deg)" : "rotate(90deg)", transition: ".2s", color: "var(--text-dim)" }} />
                        </div>
                      </div>
                      {expanded === o.id && (
                        <div className="acnt-order-body">
                          {(o.items || []).map((it, i) => (
                            <div className="acnt-item" key={i}>
                              <span>{it.qty}×</span>
                              <div><b>{it.name}</b><span>{it.flavor}</span></div>
                              <b>{money(it.price * it.qty)}</b>
                            </div>
                          ))}
                          <div className="acnt-order-totals">
                            <span>Envío: {o.shipping === 0 ? "Gratis" : money(o.shipping)}</span>
                            {o.discount_code && <span style={{ color: "var(--accent)" }}>Descuento ({o.discount_code}): -{money(o.subtotal * o.discount_pct / 100)}</span>}
                            <b>Total: {money(o.total)}</b>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {sub === "favoritos" && (
              <div>
                <h2 className="co-h" style={{ marginBottom: 20 }}>Mis favoritos</h2>
                {favProducts.length === 0 ? (
                  <div className="cart-empty" style={{ padding: "50px 20px" }}>
                    <Icon name="heart" size={36} />
                    <div>Aún no tienes favoritos.<br />Toca el ♥ en cualquier producto para guardarlo aquí.</div>
                    <a className="btn btn-primary" href="/catalogo">Explorar productos <Icon name="arrow" size={18} /></a>
                  </div>
                ) : (
                  <div className="pgrid">
                    {favProducts.map((p) => (
                      <ProductCard key={p.id} p={p} onAdd={ctx.onAdd} onQuick={ctx.onQuick}
                        fav={ctx.favs.has(p.id)} toggleFav={ctx.toggleFav} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function NotFoundPage({ msg }) {
  return (
    <section className="page">
      <div className="ff-wrap ff-narrow" style={{ textAlign: "center", padding: "80px 0" }}>
        <h1 className="display" style={{ fontSize: "clamp(60px,16vw,140px)", color: "var(--accent)" }}>404</h1>
        <p style={{ color: "var(--text-dim)", fontSize: 18, margin: "0 0 26px" }}>{msg || "Esta página no existe o fue movida."}</p>
        <a className="btn btn-primary btn-lg" href="/">Volver al inicio <Icon name="arrow" size={18} /></a>
      </div>
    </section>
  );
}

Object.assign(window, {
  Breadcrumb, PageHead, HomePage, CatalogPage, GoalsPage, BundlesPage, ProductPage, PackPage,
  CheckoutPage, BlogPage, BlogPostPage, ReviewsPage, ReviewForm, ContactPage, ContentPage, FaqItem,
  AccountPage, NotFoundPage, CONTENT_PAGES, INFO_PAGES,
});
