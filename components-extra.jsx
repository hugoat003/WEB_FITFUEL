import React from "react";
/* FITFUEL — extras: bundles, testimonios, blog, carrito, footer */

function Bundles({ onAddBundle, compact = false }) {
  const list = compact ? FF.BUNDLES.slice(0, 3) : FF.BUNDLES;
  return (
    <section className="section bundles" id="packs">
      <div className="ff-wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">Packs con descuento</span>
            <h2 className="display">Combina y ahorra</h2>
            <p>Stacks diseñados por objetivo. Todo lo que necesitas, a mejor precio.</p>
          </div>
        </div>
        <div className="bgrid">
          {list.map((b) => {
            const value = FF.bundleValue(b);
            const save = value > b.price ? Math.round((1 - b.price / value) * 100) : 0;
            const color = `oklch(0.72 0.17 ${b.hue})`;
            return (
              <article className="bcard" key={b.id} style={{ "--ph-color": color }}>
                <div className="bcard-glow" />
                <a className="bcard-link" href={"#/pack/" + b.id} aria-label={"Ver " + b.name} />
                <span className="save-tag" style={{ position: "relative" }}>AHORRA {save}%</span>
                <h3>{b.name}</h3>
                <p className="tagline">{b.tagline}</p>
                <ul>
                  {b.items.map((it, i) => (
                    <li key={i}><span className="tick"><Icon name="check" size={16} stroke={3} /></span>{it}</li>
                  ))}
                </ul>
                <a className="bcard-see" href={"#/pack/" + b.id}>Ver productos del pack <Icon name="arrow" size={15} /></a>
                <div className="bcard-foot">
                  <div className="price">
                    <b>{money(b.price)}</b>
                    {value > b.price && <s>{money(value)}</s>}
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onAddBundle(b)}>
                    Añadir pack
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ compact = false }) {
  return (
    <section className="section" id="reseñas">
      <div className="ff-wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">Lo que dice la comunidad</span>
            <h2 className="display">Resultados reales</h2>
          </div>
          {compact && (
            <a className="btn btn-ghost" href="#/resenas">Ver todas <Icon name="arrow" size={18} /></a>
          )}
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
      </div>
    </section>
  );
}

function Blog({ compact = false }) {
  return (
    <section className="section" id="blog" style={compact ? { paddingTop: 0 } : null}>
      <div className="ff-wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">Aprende</span>
            <h2 className="display">Consejos sin humo</h2>
            <p>Ciencia aplicada al gimnasio, explicada fácil.</p>
          </div>
          {compact && (
            <a className="btn btn-ghost" href="#/blog">Ver todo el blog <Icon name="arrow" size={18} /></a>
          )}
        </div>
        <div className="blog-grid">
          {FF.BLOG.map((b) => (
            <a className="bl" key={b.id} href={"#/blog/" + b.id}>
              <div className="bl-vis"><ProdImg image={b.image} label="imagen artículo" hue={b.hue} /></div>
              <div className="bl-body">
                <span className="bl-tag">{b.cat}</span>
                <h4>{b.title}</h4>
                <span className="bl-read">{b.read} de lectura · Leer →</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function CartDrawer({ open, items, onClose, onQty, onRemove, onCheckout }) {
  const FREE_SHIP = FF.FREE_SHIP || 400;
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  const count = items.reduce((s, it) => s + it.qty, 0);
  const remaining = Math.max(0, FREE_SHIP - total);
  const pct = Math.min(100, (total / FREE_SHIP) * 100);
  return (
    <>
      {open && <div className="scrim" onClick={onClose} />}
      <aside className={"drawer" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="drawer-head">
          <h3>Tu carrito {count > 0 && <span style={{ color: "var(--accent)" }}>· {count}</span>}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><Icon name="x" size={18} /></button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-body">
            <div className="cart-empty">
              <Icon name="cart" size={34} />
              <div>Tu carrito está vacío.<br />¡Empieza a llenar el depósito!</div>
              <button className="btn btn-primary btn-sm" onClick={() => { onClose(); navigate("/catalogo"); }}>Ver productos</button>
            </div>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              {items.map((it) => (
                <div className="citem" key={it.id}>
                  <a className="citem-vis" href={"#/producto/" + it.id} onClick={onClose}><ProdImg image={it.image} label="" hue={it.hue} tub={true} /></a>
                  <div className="citem-main">
                    <b>{it.name}</b>
                    <span>{it.flavor}</span>
                    <div className="citem-row">
                      <div className="citem-qty">
                        <button onClick={() => onQty(it.id, -1)}><Icon name="minus" size={14} /></button>
                        <span>{it.qty}</span>
                        <button onClick={() => onQty(it.id, 1)}><Icon name="plus" size={14} /></button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                        <b style={{ fontFamily: "var(--font-display)", fontSize: 17 }}>{money(it.price * it.qty)}</b>
                        <button className="link-x" onClick={() => onRemove(it.id)}>Quitar</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="drawer-foot">
              <div className="ship-note">
                {remaining > 0
                  ? <>Te faltan <b style={{ color: "var(--accent)" }}>{money(remaining)}</b> para el envío gratis</>
                  : <><Icon name="truck" size={14} style={{ verticalAlign: "-2px" }} /> ¡Envío gratis desbloqueado!</>}
              </div>
              <div className="ship-bar"><i style={{ width: pct + "%" }} /></div>
              <div className="cart-total" style={{ marginTop: 16 }}>
                <span style={{ color: "var(--text-dim)" }}>Total</span>
                <b>{money(total)}</b>
              </div>
              <button className="btn btn-primary btn-block btn-lg" onClick={onCheckout}>
                Finalizar compra <Icon name="arrow" size={18} />
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function CtaBand({ onShop }) {
  return (
    <section className="ctaband">
      <div className="ff-wrap">
        <span className="eyebrow">Empieza hoy</span>
        <h2 className="display">No esperes al lunes.</h2>
        <p>Primer pedido con -20% y envío exprés a toda Guatemala.</p>
        <button className="btn btn-primary btn-lg" onClick={onShop || (() => navigate("/catalogo"))}>Comprar ahora <Icon name="arrow" size={18} /></button>
      </div>
    </section>
  );
}

const FOOT_COLS = [
  { h: "Tienda", links: [
    { label: "Proteínas", to: "/catalogo?cat=proteina" },
    { label: "Creatina", to: "/catalogo?cat=creatina" },
    { label: "Pre-entreno", to: "/catalogo?cat=pre" },
    { label: "Packs", to: "/packs" },
    { label: "Ofertas", to: "/ofertas" },
  ] },
  { h: "Ayuda", links: [
    { label: "Envíos", to: "/ayuda/envios" },
    { label: "Devoluciones", to: "/ayuda/devoluciones" },
    { label: "Contacto", to: "/contacto" },
    { label: "Preguntas frecuentes", to: "/ayuda/faq" },
  ] },
  { h: "FITFUEL", links: [
    { label: "Sobre nosotros", to: "/nosotros" },
    { label: "Calidad", to: "/calidad" },
    { label: "Blog", to: "/blog" },
    { label: "Afiliados", to: "/afiliados" },
  ] },
];

function Footer() {
  const c = FF.CONTACT || {};
  return (
    <footer className="footer">
      <div className="ff-wrap">
        <div className="foot-grid">
          <div>
            <a className="logo" href="#/" style={{ marginBottom: 14 }}>
              <span className="logo-mark">F</span>FIT<b style={{ color: "var(--accent)" }}>FUEL</b>
            </a>
            <p style={{ color: "var(--text-dim)", maxWidth: 280, fontSize: 15 }}>
              Suplementos deportivos testados en laboratorio. Sin atajos, sin azúcares ocultos. Hecho para Guatemala.
            </p>
            <div className="foot-contact">
              <a href={"tel:" + (c.phone || "").replace(/\s/g, "")}><Icon name="phone" size={15} /> {c.phone}</a>
              <a href={c.whatsappLink || "#"} target="_blank" rel="noopener"><Icon name="chat" size={15} /> WhatsApp</a>
              <span><Icon name="pin" size={15} /> {c.city}</span>
            </div>
          </div>
          {FOOT_COLS.map((col) => (
            <div key={col.h}>
              <h5>{col.h}</h5>
              {col.links.map((l) => <a key={l.label} href={"#" + l.to}>{l.label}</a>)}
            </div>
          ))}
        </div>
        <div className="foot-bottom">
          <span>© 2026 FITFUEL Guatemala. Demo de diseño — no es una tienda real.</span>
          <span>Hecho para rendir 💪</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Bundles, Testimonials, Blog, CartDrawer, CtaBand, Footer, FOOT_COLS });
