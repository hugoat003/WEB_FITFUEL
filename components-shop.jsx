import React from "react";
/* FITFUEL — tienda: header, hero, quiz, catálogo */
const { useState, useMemo, useEffect, useRef } = React;

const NAV_LINKS = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/objetivos", label: "Objetivos" },
  { to: "/packs", label: "Packs" },
  { to: "/blog", label: "Blog" },
  { to: "/contacto", label: "Contacto" },
];

function Header({ cartCount, bump, onCart, query, setQuery, route, user, onAuthOpen, onUserMenu }) {
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
        <button className="icon-btn hd-burger" aria-label="Menú" aria-expanded={menuOpen}
          aria-controls="ff-mobile-menu" onClick={() => setMenuOpen((v) => !v)}>
          <BurgerIcon open={menuOpen} size={20} />
        </button>
        <a className="logo" href="/" onClick={() => setMenuOpen(false)}>
          <img src="/logo-full.png" alt="FITFUEL" className="logo-png" />
        </a>
        <nav className="hd-nav">
          {NAV_LINKS.map((l) => (
            <a key={l.to} href={toPath(l.to)} className={isActive(l.to) ? "on" : ""}>{l.label}</a>
          ))}
        </nav>
        <div className="hd-spacer" />
        <form className="hd-search" onSubmit={submitSearch}>
          <button type="submit" className="hd-search-ic" aria-label="Buscar"><Icon name="search" size={17} /></button>
          <input value={local} onChange={(e) => setLocal(e.target.value)}
            placeholder="Buscar proteína, creatina…" />
        </form>
        <button className="icon-btn" aria-label={user ? "Mi cuenta" : "Iniciar sesión"}
          onClick={user ? onUserMenu : onAuthOpen} title={user ? (user.user_metadata?.full_name || user.email) : "Iniciar sesión"}>
          {user
            ? <span className="hd-avatar">{(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}</span>
            : <Icon name="user" size={19} />}
        </button>
        <button className="icon-btn" aria-label="Carrito" onClick={onCart}>
          <Icon name="cart" size={19} />
          {cartCount > 0 && <span className={"cart-count" + (bump ? " bump" : "")}>{cartCount}</span>}
        </button>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} route={route}
        query={query} setQuery={setQuery} user={user} cartCount={cartCount}
        onAuthOpen={onAuthOpen} onCart={onCart} />
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
  // Carrusel de productos destacados: los marcados en el admin ("carousel"), ordenados por
  // `carouselOrder` (el orden que se define arrastrando en el panel). Los que no lo tengan
  // van al final, conservando el orden del catálogo. Sin ninguno marcado, cae al automático.
  const tick = useCatalogTick();   // rehacer cuando llegue el catálogo publicado
  const slides = React.useMemo(() => {
    const picked = FF.PRODUCTS.filter((p) => p.carousel)
      .sort((a, b) => (a.carouselOrder ?? Infinity) - (b.carouselOrder ?? Infinity));
    return picked.length
      ? picked
      : FF.PRODUCTS.slice().sort((a, b) => b.reviews - a.reviews).slice(0, 5);
  }, [tick]);
  const [idx, setIdx] = React.useState(0);
  const total = slides.length;
  const go = (i) => setIdx(((i % total) + total) % total);

  // El carrusel no empieza a girar hasta que la primera foto está cargada. Antes rotaba a
  // los 5 s pasara lo que pasara, así que en móvil pedía la segunda y la tercera mientras
  // la primera todavía venía en camino, y todas competían por el mismo ancho de banda.
  // El plazo de seguridad evita que se quede congelado si la imagen no llega nunca.
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setReady(true), 4000);
    return () => clearTimeout(t);
  }, []);
  // Temporizador reiniciable: al cambiar idx (auto o manual) reinicia la cuenta.
  React.useEffect(() => {
    if (total < 2 || !ready) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % total), 5000);
    return () => clearTimeout(t);
  }, [idx, total, ready]);

  if (!slides.length) return null;
  const p = slides[idx];
  const cat = FF.CATEGORIES.find((c) => c.id === p.cat);

  return (
    <section className="ehero" id="top">
      <div className="ff-wrap ehero-grid">
        <div className="ehero-copy">
          <div className="ehero-copy-slide" key={"c" + idx}>
            <div className="ehero-eyebrow"><span className="ehero-dash" />{cat ? cat.label : "Destacado"}</div>
            <h1 className="ehero-title">{p.name}</h1>
            <p className="ehero-sub">{p.blurb || p.flavor}</p>
            <div className="ehero-price-row">
              <span className="ehero-price">{money(p.price)}</span>
              {p.oldPrice && <s>{money(p.oldPrice)}</s>}
            </div>
          </div>
          <div className="ehero-cta">
            <button className="ehero-btn ehero-btn-dark" onClick={() => navigate("/producto/" + p.id)}>
              Ver producto <Icon name="arrow" size={14} />
            </button>
            <button className="ehero-btn ehero-btn-out" onClick={() => navigate("/catalogo")}>
              Ver catálogo
            </button>
          </div>
          <div className="ehero-dots">
            {slides.map((s, i) => (
              <button key={i} className={"ehero-dot" + (i === idx ? " on" : "")}
                onClick={() => setIdx(i)} aria-label={"Ver " + s.name} />
            ))}
          </div>
        </div>
        <div className="ehero-media">
          <a href={"/producto/" + p.id} className="ehero-stage" key={"m" + idx} aria-label={p.name}>
            <ProdImg image={p.image} label="producto destacado" hue={p.hue} tub={true}
              priority={true} onLoad={() => setReady(true)} onError={() => setReady(true)} />
          </a>
          <button className="ehero-nav prev" onClick={() => go(idx - 1)} aria-label="Producto anterior">
            <Icon name="arrow" size={18} style={{ transform: "rotate(180deg)" }} />
          </button>
          <button className="ehero-nav next" onClick={() => go(idx + 1)} aria-label="Producto siguiente">
            <Icon name="arrow" size={18} />
          </button>
          <div className="ehero-badge">
            <div className="ehero-badge-k">Destacado · {String(idx + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}</div>
            <div className="ehero-badge-name">{p.name} · {money(p.price)}</div>
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
  const vs = FF.variantsOf(p);
  const flavorCount = new Set(vs.map((v) => v.flavor).filter(Boolean)).size;
  const sizeCount = new Set(vs.map((v) => v.size).filter(Boolean)).size;
  const hasVariants = vs.length >= 2; // varias presentaciones → elegir en la ficha
  const varsLabel = flavorCount >= 2 ? `${flavorCount} sabores` : (sizeCount >= 2 ? `${sizeCount} tamaños` : "");
  const ps = FF.productStock(p); // stock total en vivo (Supabase) con fallback al snapshot
  const out = ps === 0;
  const low = ps != null && ps > 0 && ps <= (FF.LOW_STOCK || 5);
  return (
    <article className={"pcard" + (out ? " is-out" : "")} onClick={go} style={{ cursor: "pointer" }}>
      <div className="pcard-vis">
        {out ? <span className="pcard-out">Agotado</span> : p.badge && <span className="pcard-badge">{p.badge}</span>}
        <button className={"pcard-fav" + (fav ? " on" : "")}
          onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }} aria-label="Favorito">
          <Icon name="heart" size={17} fill={fav} stroke={fav ? 0 : 2} />
        </button>
        <a href={"/producto/" + p.id} className="pcard-link" aria-label={p.name} onClick={(e) => e.stopPropagation()}>
          <ProdImg image={p.image} label="foto producto" hue={p.hue} tub={true} />
        </a>
        <div className="pcard-quick">
          <button className="btn btn-ghost btn-block btn-sm" onClick={(e) => { e.stopPropagation(); onQuick(p); }}>Vista rápida</button>
        </div>
      </div>
      <div className="pcard-body">
        <div className="pcard-meta">
          <span className="pcard-cat">{cat ? cat.label : ""}</span>
          {p.facts?.[0] && <span className="pcard-spec">{p.facts[0][1]} {p.facts[0][0]}</span>}
        </div>
        <h3>{p.name}</h3>
        <p className="pcard-flav">
          {p.flavor}
          {varsLabel && <span className="pcard-vars">{varsLabel}</span>}
          {low && <span className="pcard-low">Últimas unidades</span>}
        </p>
        <div className="pcard-foot">
          <div className="price">
            <b>{money(p.price)}</b>
            {p.oldPrice && <s>{money(p.oldPrice)}</s>}
          </div>
          {hasVariants ? (
            <button className="add-btn add-btn-choose" onClick={(e) => { e.stopPropagation(); navigate("/producto/" + p.id); }}
              aria-label={`Elegir opciones de ${p.name}`} title="Elegir opciones">
              <Icon name="chevron" size={20} stroke={2.4} />
            </button>
          ) : (
            <button className="add-btn" onClick={(e) => { e.stopPropagation(); onAdd(p, e); }} disabled={out}
              aria-label={out ? `${p.name} agotado` : `Añadir ${p.name} al carrito`}>
              <Icon name="plus" size={20} stroke={2.4} />
            </button>
          )}
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

function Catalog({ query, activeGoals, onAdd, onQuick, favs, toggleFav, initialCat = "all", offersOnly = false, heading, setQuery, clearGoals }) {
  const [cat, setCat] = useState(initialCat);
  const [sort, setSort] = useState("pop");
  const filtersActive = cat !== "all" || sort !== "pop" || !!(query || "").trim() || activeGoals.size > 0;
  const clearFilters = () => {
    setCat("all"); setSort("pop");
    if (setQuery) setQuery("");
    if (clearGoals) clearGoals();
  };

  const tickCat = useCatalogTick();
  const list = useMemo(() => {
    let r = FF.PRODUCTS.slice();
    if (offersOnly) r = r.filter((p) => p.oldPrice);
    if (cat !== "all") r = r.filter((p) => p.cat === cat);
    if (activeGoals.size > 0) r = r.filter((p) => (p.goals || []).some((g) => activeGoals.has(g)));
    const q = (query || "").trim().toLowerCase();
    if (q) r = r.filter((p) => (p.name + " " + (p.flavor || "") + " " + (p.blurb || "")).toLowerCase().includes(q));
    if (sort === "low") r.sort((a, b) => a.price - b.price);
    else if (sort === "high") r.sort((a, b) => b.price - a.price);
    else if (sort === "rating") r.sort((a, b) => b.rating - a.rating);
    else r.sort((a, b) => b.reviews - a.reviews);
    return r;
  }, [cat, sort, query, activeGoals, offersOnly, tickCat]);

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
            {filtersActive && (
              <button className="clear-filters" onClick={clearFilters}>
                <Icon name="x" size={14} /> Limpiar filtros
              </button>
            )}
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
  const [activeVar, setActiveVar] = useState(0);
  const trapRef = useFocusTrap(!!product, onClose);
  useEffect(() => { setQty(1); setActiveVar(0); }, [product]);
  if (!product) return null;
  const vs = FF.variantsOf(product);
  const multi = vs.length >= 2;
  const cur = vs[Math.min(activeVar, Math.max(0, vs.length - 1))] || {};
  const activeImage = multi ? FF.variantImage(product, cur) : ((cur.images && cur.images[0]) || product.image);
  const displayFlavor = FF.variantLabel(cur) || product.flavor;
  const shownPrice = cur.price != null ? cur.price : product.price;
  const qvFacts = (cur.facts && cur.facts.length ? cur.facts : product.facts) || [];
  const cat = FF.CATEGORIES.find((c) => c.id === product.cat);
  const vStock = FF.variantStock(product, cur);
  const out = vStock === 0;
  const low = vStock != null && vStock > 0 && vStock <= (FF.LOW_STOCK || 5);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} ref={trapRef} role="dialog" aria-modal="true">
        <div className="modal-vis">
          <button className="icon-btn modal-close" onClick={onClose} aria-label="Cerrar"><Icon name="x" size={18} /></button>
          {product.badge && <span className="pcard-badge" style={{ top: 26, left: 26 }}>{product.badge}</span>}
          <ProdImg image={activeImage} label="foto producto · bote" hue={product.hue} tub={true} />
        </div>
        <div className="modal-body">
          <span className="pcard-cat">{cat ? cat.label : ""}</span>
          <h3>{product.name}</h3>
          <p className="pcard-flav" style={{ fontSize: 15 }}>{displayFlavor}</p>
          {multi && (
            <div className="pdp-var-btns" style={{ marginBottom: 8 }}>
              {vs.map((v, i) => (
                <button key={i} className={"pdp-var-btn" + (i === activeVar ? " on" : "")}
                  onClick={() => setActiveVar(i)}>{FF.variantLabel(v)}</button>
              ))}
            </div>
          )}
          <p style={{ color: "var(--text-dim)", margin: "6px 0 0" }}>{product.blurb}</p>
          <div className="modal-facts">
            {qvFacts.map(([k, v], i) => (
              <div className="fact" key={i}><b>{v}</b><span>{k}</span></div>
            ))}
          </div>
          <div className="price" style={{ margin: "4px 0 18px" }}>
            <b style={{ fontSize: 34 }}>{money(shownPrice)}</b>
            {product.oldPrice && activeVar === 0 && <s>{money(product.oldPrice)}</s>}
            {out && <span className="pcard-out" style={{ position: "static" }}>Agotado</span>}
            {low && <span className="pcard-low">Últimas unidades</span>}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: "auto", flexWrap: "wrap" }}>
            <div className="qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}><Icon name="minus" size={16} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}><Icon name="plus" size={16} /></button>
            </div>
            <button className="btn btn-primary btn-block" style={{ flex: 1 }} disabled={out}
              onClick={() => { onAdd(product, null, qty, FF.variantLabel(cur) || null); onClose(); }}>
              {out ? "Agotado" : <>Añadir · {money(shownPrice * qty)}</>}
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
