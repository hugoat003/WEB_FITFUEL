/* FITFUEL — tienda: header, hero, quiz, catálogo */
const { useState, useMemo, useEffect, useRef } = React;

const NAV_LINKS = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/objetivos", label: "Objetivos" },
  { to: "/packs", label: "Packs" },
  { to: "/blog", label: "Blog" },
  { to: "/contacto", label: "Contacto" },
];

function Header({ cartCount, bump, onCart, query, setQuery, route }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [local, setLocal] = useState(query || "");
  useEffect(() => { setLocal(query || ""); }, [query]);
  // Cierra el menú móvil al cambiar de ruta
  useEffect(() => { setMenuOpen(false); }, [route && route.path]);

  const submitSearch = (e) => {
    e.preventDefault();
    setQuery(local);
    navigate("/catalogo");
    setMenuOpen(false);
  };
  const isActive = (to) => route && (route.path === to || route.path.startsWith(to + "/"));

  return (
    <header className="hd">
      <div className="ff-wrap hd-in">
        <button className="icon-btn hd-burger" aria-label="Menú" onClick={() => setMenuOpen((v) => !v)}>
          <Icon name={menuOpen ? "x" : "menu"} size={20} />
        </button>
        <a className="logo" href="#/" onClick={() => setMenuOpen(false)}>
          <span className="logo-mark">F</span>FIT<b>FUEL</b>
        </a>
        <nav className="hd-nav">
          {NAV_LINKS.map((l) => (
            <a key={l.to} href={"#" + l.to} className={isActive(l.to) ? "on" : ""}>{l.label}</a>
          ))}
        </nav>
        <div className="hd-spacer" />
        <form className="hd-search" onSubmit={submitSearch}>
          <button type="submit" className="hd-search-ic" aria-label="Buscar"><Icon name="search" size={17} /></button>
          <input value={local} onChange={(e) => setLocal(e.target.value)}
            placeholder="Buscar proteína, creatina…" />
        </form>
        <button className="icon-btn" aria-label="Carrito" onClick={onCart}>
          <Icon name="cart" size={19} />
          {cartCount > 0 && <span className={"cart-count" + (bump ? " bump" : "")}>{cartCount}</span>}
        </button>
      </div>

      {/* Menú móvil */}
      {menuOpen && <div className="m-scrim" onClick={() => setMenuOpen(false)} />}
      <div className={"m-menu" + (menuOpen ? " open" : "")}>
        <form className="m-search" onSubmit={submitSearch}>
          <Icon name="search" size={18} />
          <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Buscar productos…" />
        </form>
        <nav className="m-nav">
          {NAV_LINKS.map((l) => (
            <a key={l.to} href={"#" + l.to} className={isActive(l.to) ? "on" : ""}>
              {l.label} <Icon name="chevron" size={18} />
            </a>
          ))}
          <a href="#/resenas">Reseñas <Icon name="chevron" size={18} /></a>
          <a href="#/ayuda/faq">Ayuda <Icon name="chevron" size={18} /></a>
        </nav>
      </div>
    </header>
  );
}

function Marquee() {
  const items = [...FF.STATS, ...FF.STATS];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {items.map((s, i) => <span className="marquee-item" key={i}>{s}</span>)}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="ff-wrap hero-grid">
        <div className="reveal in">
          <span className="eyebrow">Suplementos hechos para rendir</span>
          <h1 className="display">
            Combustible<br />para tu<br /><span className="accent">mejor versión.</span>
          </h1>
          <p className="hero-sub">
            Proteína y creatina testadas en laboratorio, sin azúcares ocultos.
            Encuentra exactamente lo que tu objetivo necesita. Envío a toda Guatemala.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={() => navigate("/catalogo")}>
              Ver catálogo <Icon name="arrow" size={18} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate("/objetivos")}>
              Encuentra tu plan
            </button>
          </div>
          <div className="hero-trust">
            <div><b>4.9★</b><span>+12,000 reseñas</span></div>
            <div><b>50k+</b><span>atletas activos</span></div>
            <div><b>24-72h</b><span>envío nacional</span></div>
          </div>
        </div>
        <div className="hero-vis reveal in" style={{ animationDelay: ".1s" }}>
          <Ph label="foto producto · bote whey" hue={92} tub={true} />
          <div className="hero-disc">
            <div><b>-20%</b><span>HOY</span></div>
          </div>
          <div className="hero-badge">
            <span className="dot"><Icon name="shield" size={20} /></span>
            <div><b>Testado en lab</b><span>Pureza verificada</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GoalsQuiz({ active, toggle, onSee }) {
  return (
    <section className="section quiz" id="objetivos">
      <div className="ff-wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">Selector de objetivos</span>
            <h2 className="display">¿Cuál es tu meta?</h2>
            <p>Elige uno o varios objetivos y te mostramos exactamente lo que necesitas.</p>
          </div>
          {active.size > 0 && (
            <button className="btn btn-primary" onClick={onSee}>
              Ver {active.size === 1 ? "recomendación" : "recomendaciones"} <Icon name="arrow" size={18} />
            </button>
          )}
        </div>
        <div className="goals-grid">
          {FF.GOALS.map((g) => (
            <button key={g.id} className={"goal-card" + (active.has(g.id) ? " on" : "")}
              onClick={() => toggle(g.id)}>
              <span className="goal-check"><Icon name="check" size={20} stroke={3} /></span>
              <span className="goal-ico"><Icon name={g.icon} size={24} /></span>
              <h4>{g.label}</h4>
              <p>{g.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ p, onAdd, onQuick, fav, toggleFav }) {
  const cat = FF.CATEGORIES.find((c) => c.id === p.cat);
  const go = () => navigate("/producto/" + p.id);
  return (
    <article className="pcard">
      <div className="pcard-vis">
        {p.badge && <span className="pcard-badge">{p.badge}</span>}
        <button className={"pcard-fav" + (fav ? " on" : "")}
          onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }} aria-label="Favorito">
          <Icon name="heart" size={17} fill={fav} stroke={fav ? 0 : 2} />
        </button>
        <a href={"#/producto/" + p.id} className="pcard-link" aria-label={p.name}>
          <Ph label="foto producto" hue={p.hue} tub={true} />
        </a>
        <div className="pcard-quick">
          <button className="btn btn-ghost btn-block btn-sm" onClick={() => onQuick(p)}>Vista rápida</button>
        </div>
      </div>
      <div className="pcard-body">
        <span className="pcard-cat">{cat ? cat.label : ""}</span>
        <h3 onClick={go} style={{ cursor: "pointer" }}>{p.name}</h3>
        <p className="pcard-flav">{p.flavor}</p>
        <Stars rating={p.rating} reviews={p.reviews} />
        <div className="pcard-foot">
          <div className="price">
            <b>{money(p.price)}</b>
            {p.oldPrice && <s>{money(p.oldPrice)}</s>}
          </div>
          <button className="add-btn" onClick={(e) => onAdd(p, e)} aria-label="Añadir al carrito">
            <Icon name="plus" size={20} stroke={2.4} />
          </button>
        </div>
      </div>
    </article>
  );
}

const SORTS = [
  { id: "pop", label: "Más populares" },
  { id: "low", label: "Precio: menor" },
  { id: "high", label: "Precio: mayor" },
  { id: "rating", label: "Mejor valorados" },
];

function Catalog({ query, activeGoals, onAdd, onQuick, favs, toggleFav, initialCat = "all", offersOnly = false, heading }) {
  const [cat, setCat] = useState(initialCat);
  const [sort, setSort] = useState("pop");
  useEffect(() => { setCat(initialCat); }, [initialCat]);

  const list = useMemo(() => {
    let r = FF.PRODUCTS.slice();
    if (offersOnly) r = r.filter((p) => p.oldPrice);
    if (cat !== "all") r = r.filter((p) => p.cat === cat);
    if (activeGoals.size > 0) r = r.filter((p) => p.goals.some((g) => activeGoals.has(g)));
    const q = (query || "").trim().toLowerCase();
    if (q) r = r.filter((p) => (p.name + " " + p.flavor + " " + p.blurb).toLowerCase().includes(q));
    if (sort === "low") r.sort((a, b) => a.price - b.price);
    else if (sort === "high") r.sort((a, b) => b.price - a.price);
    else if (sort === "rating") r.sort((a, b) => b.rating - a.rating);
    else r.sort((a, b) => b.reviews - a.reviews);
    return r;
  }, [cat, sort, query, activeGoals, offersOnly]);

  const goalLabels = [...activeGoals].map((g) => FF.GOALS.find((x) => x.id === g)?.label).filter(Boolean);

  return (
    <section className="section" id="catalogo">
      <div className="ff-wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">{offersOnly ? "Ofertas" : "Catálogo"}</span>
            <h2 className="display">{heading || (offersOnly ? "En oferta" : "Tu arsenal")}</h2>
            {goalLabels.length > 0
              ? <p>Filtrado para: <b style={{ color: "var(--accent)" }}>{goalLabels.join(" · ")}</b></p>
              : <p>Todo lo que necesitas para entrenar, recuperar y crecer.</p>}
          </div>
        </div>

        <div className="toolbar">
          <div className="chips">
            {FF.CATEGORIES.map((c) => (
              <button key={c.id} className={"chip" + (cat === c.id ? " on" : "")} onClick={() => setCat(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="toolbar-end">
            <span className="result-note">{list.length} productos</span>
            <select className="sortsel" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="cart-empty">
            <Icon name="search" size={32} />
            <div>No encontramos productos. Prueba otra búsqueda o filtro.</div>
          </div>
        ) : (
          <div className="pgrid">
            {list.map((p) => (
              <ProductCard key={p.id} p={p} onAdd={onAdd} onQuick={onQuick}
                fav={favs.has(p.id)} toggleFav={toggleFav} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function QuickView({ product, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => { setQty(1); }, [product]);
  if (!product) return null;
  const cat = FF.CATEGORIES.find((c) => c.id === product.cat);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-vis">
          <button className="icon-btn modal-close" onClick={onClose} aria-label="Cerrar"><Icon name="x" size={18} /></button>
          {product.badge && <span className="pcard-badge" style={{ top: 26, left: 26 }}>{product.badge}</span>}
          <Ph label="foto producto · bote" hue={product.hue} tub={true} />
        </div>
        <div className="modal-body">
          <span className="pcard-cat">{cat ? cat.label : ""}</span>
          <h3>{product.name}</h3>
          <p className="pcard-flav" style={{ fontSize: 15 }}>{product.flavor}</p>
          <div style={{ margin: "10px 0" }}><Stars rating={product.rating} reviews={product.reviews} /></div>
          <p style={{ color: "var(--text-dim)", margin: "6px 0 0" }}>{product.blurb}</p>
          <div className="modal-facts">
            {product.facts.map(([k, v], i) => (
              <div className="fact" key={i}><b>{v}</b><span>{k}</span></div>
            ))}
          </div>
          <div className="price" style={{ margin: "4px 0 18px" }}>
            <b style={{ fontSize: 34 }}>{money(product.price)}</b>
            {product.oldPrice && <s>{money(product.oldPrice)}</s>}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: "auto", flexWrap: "wrap" }}>
            <div className="qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}><Icon name="minus" size={16} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}><Icon name="plus" size={16} /></button>
            </div>
            <button className="btn btn-primary btn-block" style={{ flex: 1 }} onClick={() => { onAdd(product, null, qty); onClose(); }}>
              Añadir · {money(product.price * qty)}
            </button>
          </div>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }}
            onClick={() => { onClose(); navigate("/producto/" + product.id); }}>
            Ver página completa <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Header, Marquee, Hero, GoalsQuiz, ProductCard, Catalog, QuickView, NAV_LINKS });
