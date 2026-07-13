import React from "react";
import ReactDOM from "react-dom/client";
/* FITFUEL — App raíz: router, estado, carrito, tweaks */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "voltage",
  "corners": "suave",
  "marquee": true
}/*EDITMODE-END*/;

const ITEM_INDEX = {};
FF.PRODUCTS.forEach((p) => { ITEM_INDEX[p.id] = { id: p.id, name: p.name, flavor: p.flavor, price: p.price, hue: p.hue, image: p.image, cat: p.cat, variants: FF.variantsOf(p), stock: p.stock }; });
FF.BUNDLES.forEach((b) => { ITEM_INDEX[b.id] = { id: b.id, name: b.name, flavor: "Pack · " + b.items.length + " productos", price: b.price, hue: b.hue, image: b.image, cat: "pack" }; });

const PAGE_TITLES = {
  "": "FITFUEL — Suplementos para rendir | Guatemala",
  catalogo: "Catálogo — FITFUEL",
  ofertas: "Ofertas — FITFUEL",
  objetivos: "Tu objetivo — FITFUEL",
  packs: "Packs — FITFUEL",
  pack: "Pack — FITFUEL",
  checkout: "Finalizar compra — FITFUEL",
  producto: "Producto — FITFUEL",
  blog: "Blog — FITFUEL",
  resenas: "Reseñas — FITFUEL",
  contacto: "Contacto — FITFUEL",
  ayuda: "Ayuda — FITFUEL",
  nosotros: "Sobre nosotros — FITFUEL",
  calidad: "Calidad — FITFUEL",
  afiliados: "Afiliados — FITFUEL",
};

const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };

function PageHost({ route, ctx }) {
  return renderPage(route, ctx);
}

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) { if (prev.routeKey !== this.props.routeKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (this.state.error) {
      return (
        <section className="page">
          <div className="ff-wrap ff-narrow" style={{ textAlign: "center", padding: "70px 0" }}>
            <h1 className="display" style={{ fontSize: "clamp(40px,9vw,80px)", color: "var(--accent)" }}>Ups</h1>
            <p style={{ color: "var(--text-dim)", margin: "0 0 24px" }}>Algo salió mal en esta sección. Intenta volver al inicio.</p>
            <a className="btn btn-primary btn-lg" href="#/">Volver al inicio <Icon name="arrow" size={18} /></a>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

function renderPage(route, ctx) {
  const seg = route.parts[0] || "";
  switch (seg) {
    case "": return <HomePage ctx={ctx} />;
    case "catalogo":
    case "ofertas": return <CatalogPage ctx={ctx} route={route} />;
    case "objetivos": return <GoalsPage ctx={ctx} />;
    case "packs": return <BundlesPage ctx={ctx} />;
    case "pack": return <PackPage ctx={ctx} route={route} />;
    case "checkout": return <CheckoutPage ctx={ctx} />;
    case "producto": return <ProductPage ctx={ctx} route={route} />;
    case "blog": return route.parts[1] ? <BlogPostPage route={route} /> : <BlogPage />;
    case "resenas": return <ReviewsPage ctx={ctx} />;
    case "contacto": return <ContactPage ctx={ctx} />;
    case "cuenta": return <AccountPage ctx={ctx} route={route} />;
    case "ayuda": {
      const data = CONTENT_PAGES[route.parts[1]];
      return data ? <ContentPage data={data} ctx={ctx} /> : <NotFoundPage />;
    }
    case "nosotros":
    case "calidad":
    case "afiliados": {
      const data = INFO_PAGES[seg];
      return data ? <ContentPage data={data} ctx={ctx} /> : <NotFoundPage />;
    }
    default: return <NotFoundPage />;
  }
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const route = useRoute();
  const [cart, setCart] = React.useState(() => load("ff_cart", []));
  const [favs, setFavs] = React.useState(() => new Set(load("ff_favs", [])));
  const [goals, setGoals] = React.useState(() => new Set());
  const [query, setQuery] = React.useState("");
  const [quick, setQuick] = React.useState(null);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [bump, setBump] = React.useState(false);
  const [toasts, setToasts] = React.useState([]);
  const [user, setUser] = React.useState(null);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [promoBanner, setPromoBanner] = React.useState(false);
  React.useEffect(() => {
    const dismissedAt = Number(load("ff_promo_dismissed", 0));
    if (dismissedAt && Date.now() - dismissedAt < 7 * 864e5) return; // no reaparece por 7 días
    const t = setTimeout(() => setPromoBanner(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const dismissPromo = () => {
    try { localStorage.setItem("ff_promo_dismissed", String(Date.now())); } catch {}
    setPromoBanner(false);
  };

  React.useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const toastId = React.useRef(0);

  React.useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-theme", t.theme);
    const r = t.corners === "marcado"
      ? { sm: "4px", md: "6px", lg: "8px", xl: "12px" }
      : { sm: "10px", md: "16px", lg: "24px", xl: "34px" };
    el.style.setProperty("--r-sm", r.sm); el.style.setProperty("--r-md", r.md);
    el.style.setProperty("--r-lg", r.lg); el.style.setProperty("--r-xl", r.xl);
  }, [t.theme, t.corners]);

  React.useEffect(() => { localStorage.setItem("ff_cart", JSON.stringify(cart)); }, [cart]);
  React.useEffect(() => { localStorage.setItem("ff_favs", JSON.stringify([...favs])); }, [favs]);

  // Scroll al inicio en cada cambio de ruta
  React.useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [route.path]);

  // Título del documento según la ruta (producto/pack/artículo usan su nombre)
  React.useEffect(() => {
    const seg = route.parts[0] || "";
    let title = PAGE_TITLES[seg] || "FITFUEL";
    if (seg === "producto" && route.parts[1]) {
      const p = FF.PRODUCTS.find((x) => x.id === route.parts[1]);
      if (p) title = `${p.name} · ${p.flavor} — FITFUEL`;
    } else if (seg === "pack" && route.parts[1]) {
      const b = FF.BUNDLES.find((x) => x.id === route.parts[1]);
      if (b) title = `${b.name} — FITFUEL`;
    } else if (seg === "blog" && route.parts[1]) {
      const a = FF.BLOG.find((x) => x.id === route.parts[1]);
      if (a) title = `${a.title} — FITFUEL`;
    }
    document.title = title;
  }, [route.path]);

  const toast = (msg) => {
    const id = ++toastId.current;
    setToasts((ts) => [...ts, { id, msg }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 2600);
  };
  const flashCount = () => { setBump(true); setTimeout(() => setBump(false), 420); };

  // Stock disponible de un item para una presentación (vf). Prioriza el stock de la
  // variante; si no, el del producto; Infinity si es ilimitado o no aplica (packs).
  const stockOf = (id, vf = null) => {
    const b = ITEM_INDEX[id];
    if (!b) return Infinity;
    if (vf && b.variants) {
      const v = b.variants.find((vv) => FF.variantLabel(vv) === vf);
      if (v && v.stock !== undefined) return v.stock == null ? Infinity : v.stock;
    }
    return b.stock != null ? b.stock : Infinity;
  };

  const addItem = (id, qty = 1, label, vf = null) => {
    const max = stockOf(id, vf);
    if (max <= 0) { toast("Producto agotado"); return; }
    const ex = cart.find((x) => x.id === id && (x.vf ?? null) === vf);
    const current = ex ? ex.qty : 0;
    if (current >= max) { toast("Alcanzaste el máximo disponible"); return; }
    setCart((c) => {
      const e2 = c.find((x) => x.id === id && (x.vf ?? null) === vf);
      if (e2) return c.map((x) => x.id === id && (x.vf ?? null) === vf ? { ...x, qty: Math.min(x.qty + qty, max) } : x);
      return [...c, { id, qty: Math.min(qty, max), ...(vf ? { vf } : {}) }];
    });
    flashCount();
    toast(label || "Añadido al carrito");
  };
  const onAdd = (p, _e, qty = 1, vf = null) => addItem(p.id, qty, `${p.name} añadido`, vf);
  const onAddBundle = (b) => addItem(b.id, 1, `${b.name} añadido`);

  const onQty = (id, d, vf = null) => setCart((c) => c.map((x) =>
    x.id === id && (x.vf ?? null) === vf ? { ...x, qty: Math.max(1, Math.min(x.qty + d, stockOf(id, vf))) } : x
  ));
  const onRemove = (id, vf = null) => setCart((c) => c.filter((x) =>
    !(x.id === id && (x.vf ?? null) === vf)
  ));

  const toggleFav = (id) => setFavs((f) => { const n = new Set(f); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleGoal = (id) => setGoals((g) => { const n = new Set(g); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Limpia items cuyo id ya no existe, o cuya presentación (vf) ya no coincide con
  // ninguna variante actual (ej. tras editar variantes en el admin). Evita cobrar
  // silenciosamente el precio base de una presentación que ya no existe.
  React.useEffect(() => {
    const valid = cart.filter((x) => {
      const base = ITEM_INDEX[x.id];
      if (!base) return false;
      if (x.vf) return (base.variants || []).some((vv) => FF.variantLabel(vv) === x.vf);
      return true;
    });
    if (valid.length !== cart.length) {
      setCart(valid);
      toast("Actualizamos tu carrito: quitamos productos no disponibles.");
    }
  }, []);

  const cartCount = cart.reduce((s, x) => s + x.qty, 0);
  const cartItems = cart.map((x) => {
    const base = ITEM_INDEX[x.id];
    if (!base) return { id: null };
    // La variante (vf) es la etiqueta de la presentación: define precio e imagen.
    const v = x.vf && base.variants ? base.variants.find((vv) => FF.variantLabel(vv) === x.vf) : null;
    return {
      ...base, qty: x.qty, vf: x.vf ?? null,
      price: v ? v.price : base.price,
      flavor: x.vf || base.flavor,
      // Variante sin imagen → placeholder (no la del primer sabor); sin variante → imagen base.
      image: v ? FF.variantImage({ variants: base.variants }, v) : base.image,
    };
  }).filter((x) => x.id);
  const clearCart = () => setCart([]);
  const onCheckout = () => { setCartOpen(false); navigate("/checkout"); };

  // Anima elementos .reveal al entrar en viewport
  React.useEffect(() => {
    const obs = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    // Espera un frame para que el DOM esté completamente pintado antes de observar
    const tid = setTimeout(() => {
      document.querySelectorAll(".reveal:not(.in)").forEach((n) => obs.observe(n));
    }, 50);
    return () => { clearTimeout(tid); obs.disconnect(); };
  }, [route.path]);

  const ctx = {
    onAdd, onAddBundle, onQuick: setQuick, favs, toggleFav,
    query, setQuery, activeGoals: goals, toggleGoal, clearGoals: () => setGoals(new Set()), toast,
    openCart: () => setCartOpen(true),
    cartItems, clearCart,
    user, openAuth: () => setAuthOpen(true),
  };

  // La página de producto trae su propio nav/footer dentro del frame del diseño.
  const bareRoute = route.parts[0] === "producto";

  const pageHost = (
    <main>
      <ErrorBoundary routeKey={route.path}>
        <PageHost route={route} ctx={ctx} key={route.path} />
      </ErrorBoundary>
    </main>
  );

  return (
    <>
      {bareRoute ? pageHost : (
        <div className="app-frame">
          <Header cartCount={cartCount} bump={bump} onCart={() => setCartOpen(true)}
            query={query} setQuery={setQuery} route={route}
            user={user} onAuthOpen={() => setAuthOpen(true)}
            onUserMenu={() => setUserMenuOpen((v) => !v)} />
          {t.marquee && <Marquee />}
          {pageHost}
          <Footer />
        </div>
      )}
      {!bareRoute && !user && promoBanner && (
        <div className="promo-popup">
          <button className="icon-btn promo-popup-close" aria-label="Cerrar"
            onClick={dismissPromo}>
            <Icon name="x" size={15} />
          </button>
          <img src="/logo-mark.png" alt="FITFUEL" className="promo-popup-logo" />
          <div className="promo-popup-tag">OFERTA DE BIENVENIDA</div>
          <h3 className="promo-popup-title">10% de descuento<br />en tu 1er pedido</h3>
          <p className="promo-popup-sub">Crea tu cuenta gratis y usa el código al finalizar tu compra.</p>
          <div className="promo-popup-code">BIENVENIDO10</div>
          <button className="btn btn-primary btn-block" onClick={() => { dismissPromo(); setAuthOpen(true); }}>
            Crear cuenta gratis <Icon name="arrow" size={16} />
          </button>
          <button className="promo-popup-skip"
            onClick={dismissPromo}>
            No, gracias
          </button>
        </div>
      )}

      <QuickView product={quick} onClose={() => setQuick(null)} onAdd={onAdd} />
      <CartDrawer open={cartOpen} items={cartItems} onClose={() => setCartOpen(false)}
        onQty={onQty} onRemove={onRemove} onCheckout={onCheckout} />

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {userMenuOpen && user && <UserMenu user={user} onClose={() => setUserMenuOpen(false)} />}

      <div className="toasts">
        {toasts.map((x) => (
          <div className="toast" key={x.id}>
            <span className="tk"><Icon name="check" size={16} stroke={3} /></span>
            <b>{x.msg}</b>
          </div>
        ))}
      </div>

      <TweaksPanel>
        <TweakSection label="Estética" />
        <TweakRadio label="Tema" value={t.theme}
          options={["voltage", "inferno", "clinic"]}
          onChange={(v) => setTweak("theme", v)} />
        <TweakSection label="Estilo" />
        <TweakRadio label="Bordes" value={t.corners}
          options={["suave", "marcado"]}
          onChange={(v) => setTweak("corners", v)} />
        <TweakToggle label="Cinta animada" value={t.marquee}
          onChange={(v) => setTweak("marquee", v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
