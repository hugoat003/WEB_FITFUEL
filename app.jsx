import React from "react";
import ReactDOM from "react-dom/client";
/* FITFUEL — App raíz: router, estado, carrito, tweaks */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "voltage",
  "corners": "suave",
  "marquee": true
}/*EDITMODE-END*/;

const ITEM_INDEX = {};
FF.PRODUCTS.forEach((p) => { ITEM_INDEX[p.id] = { id: p.id, name: p.name, flavor: p.flavor, price: p.price, hue: p.hue, image: p.image }; });
FF.BUNDLES.forEach((b) => { ITEM_INDEX[b.id] = { id: b.id, name: b.name, flavor: "Pack · " + b.items.length + " productos", price: b.price, hue: b.hue, image: b.image }; });

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
    case "": return HomePage(ctx);
    case "catalogo":
    case "ofertas": return CatalogPage(ctx, route);
    case "objetivos": return GoalsPage(ctx);
    case "packs": return BundlesPage(ctx);
    case "pack": return PackPage(ctx, route);
    case "checkout": return CheckoutPage(ctx);
    case "producto": return ProductPage(ctx, route);
    case "blog": return route.parts[1] ? BlogPostPage(route) : BlogPage();
    case "resenas": return ReviewsPage(ctx);
    case "contacto": return ContactPage(ctx);
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

  const addItem = (id, qty = 1, label) => {
    setCart((c) => {
      const ex = c.find((x) => x.id === id);
      if (ex) return c.map((x) => x.id === id ? { ...x, qty: x.qty + qty } : x);
      return [...c, { id, qty }];
    });
    flashCount();
    toast(label || "Añadido al carrito");
  };
  const onAdd = (p, _e, qty = 1) => addItem(p.id, qty, `${p.name} añadido`);
  const onAddBundle = (b) => addItem(b.id, 1, `${b.name} añadido`);

  const onQty = (id, d) => setCart((c) => c.map((x) => x.id === id ? { ...x, qty: Math.max(1, x.qty + d) } : x));
  const onRemove = (id) => setCart((c) => c.filter((x) => x.id !== id));

  const toggleFav = (id) => setFavs((f) => { const n = new Set(f); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleGoal = (id) => setGoals((g) => { const n = new Set(g); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const cartCount = cart.reduce((s, x) => s + x.qty, 0);
  const cartItems = cart.map((x) => ({ ...ITEM_INDEX[x.id], qty: x.qty })).filter((x) => x.id);
  const clearCart = () => setCart([]);
  const onCheckout = () => { setCartOpen(false); navigate("/checkout"); };

  // Anima elementos .reveal al entrar en viewport
  React.useEffect(() => {
    const obs = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal:not(.in)").forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [route.path]);

  const ctx = {
    onAdd, onAddBundle, onQuick: setQuick, favs, toggleFav,
    query, setQuery, activeGoals: goals, toggleGoal, toast,
    openCart: () => setCartOpen(true),
    cartItems, clearCart,
  };

  return (
    <>
      <Header cartCount={cartCount} bump={bump} onCart={() => setCartOpen(true)}
        query={query} setQuery={setQuery} route={route} />
      {t.marquee && <Marquee />}

      <main>
        <ErrorBoundary routeKey={route.path}>
          <PageHost route={route} ctx={ctx} key={route.path} />
        </ErrorBoundary>
      </main>

      <Footer />

      <QuickView product={quick} onClose={() => setQuick(null)} onAdd={onAdd} />
      <CartDrawer open={cartOpen} items={cartItems} onClose={() => setCartOpen(false)}
        onQty={onQty} onRemove={onRemove} onCheckout={onCheckout} />

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
