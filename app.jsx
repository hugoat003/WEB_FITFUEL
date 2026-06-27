/* FITFUEL — App raíz: router, estado, carrito, tweaks */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "voltage",
  "corners": "suave",
  "marquee": true
}/*EDITMODE-END*/;

const ITEM_INDEX = {};
FF.PRODUCTS.forEach((p) => { ITEM_INDEX[p.id] = { id: p.id, name: p.name, flavor: p.flavor, price: p.price, hue: p.hue }; });
FF.BUNDLES.forEach((b) => { ITEM_INDEX[b.id] = { id: b.id, name: b.name, flavor: "Pack · " + b.items.length + " productos", price: b.price, hue: b.hue }; });

const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };

function PageHost({ route, ctx }) {
  return renderPage(route, ctx);
}

function renderPage(route, ctx) {
  const seg = route.parts[0] || "";
  switch (seg) {
    case "": return HomePage(ctx);
    case "catalogo":
    case "ofertas": return CatalogPage(ctx, route);
    case "objetivos": return GoalsPage(ctx);
    case "packs": return BundlesPage(ctx);
    case "producto": return ProductPage(ctx, route);
    case "blog": return route.parts[1] ? BlogPostPage(route) : BlogPage();
    case "resenas": return ReviewsPage();
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
  const onCheckout = () => { toast("Esto es una demo de diseño ✦"); };

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
  };

  return (
    <>
      <Header cartCount={cartCount} bump={bump} onCart={() => setCartOpen(true)}
        query={query} setQuery={setQuery} route={route} />
      {t.marquee && <Marquee />}

      <main>
        <PageHost route={route} ctx={ctx} key={route.path} />
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
