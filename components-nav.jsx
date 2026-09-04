import React from "react";
/* FITFUEL — navegación móvil.
   Panel flotante único para toda la tienda: lo usan el header del sitio
   (components-shop.jsx) y la ficha de producto (pages.jsx), que antes tenían dos menús
   distintos (7 enlaces + buscador uno, 4 enlaces sin buscador el otro). */

/* Hamburguesa que se transforma en X. No se puede hacer con <Icon>, que dibuja un solo
   <path>: aquí hacen falta tres barras independientes para poder cruzarlas. */
function BurgerIcon({ open, size = 20 }) {
  return (
    <span className={"ff-mobile-menu-burger" + (open ? " is-open" : "")}
      style={{ width: size, height: size }} aria-hidden="true">
      <i /><i /><i />
    </span>
  );
}

// Icono por ruta. Todos existen ya en el mapa ICONS de components-base.jsx.
const MENU_ICONS = {
  "/catalogo": "package",
  "/objetivos": "bolt",
  "/packs": "tag",
  "/blog": "lab",
  "/contacto": "mail",
  "/resenas": "star",
  "/ayuda/faq": "chat",
};

// Enlaces que solo aparecen en el menú, no en la nav de escritorio.
const MENU_EXTRA = [
  { to: "/resenas", label: "Reseñas" },
  { to: "/ayuda/faq", label: "Ayuda" },
];

function MobileMenu({ open, onClose, route, query, setQuery, user, cartCount, onAuthOpen, onCart }) {
  const [local, setLocal] = React.useState(query || "");
  React.useEffect(() => { setLocal(query || ""); }, [query]);

  // El bloqueo de scroll se declara ANTES que el focus-trap: React limpia los efectos en
  // el mismo orden, así que al cerrar se restaura primero la posición de la página y
  // después el foco. Al revés, el navegador saltaría al enfocar la hamburguesa.
  useBodyScrollLock(open);
  const ref = useFocusTrap(open, onClose);

  // useFocusTrap intenta enfocar en cuanto React confirma el DOM, pero en ese instante el
  // panel sigue en `visibility: hidden` (la transición aún no ha arrancado) y el navegador
  // rechaza el foco: acababa quedándose en <body>, sin trampa de foco real. Hacen falta dos
  // frames: uno para que arranque la transición y otro para enfocar ya visible. De paso
  // garantiza que el foco cae en Cerrar y no en el buscador, que en un teléfono abriría el
  // teclado sin que nadie lo pida.
  const closeRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => { closeRef.current && closeRef.current.focus(); });
    });
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
  }, [open]);

  // NAV_LINKS lo exporta components-shop.jsx. Se lee al pintar y no al cargar el módulo,
  // para no depender del orden de los imports en main.jsx.
  const links = [...(window.NAV_LINKS || []), ...MENU_EXTRA];
  const isActive = (to) => route && (route.path === to || route.path.startsWith(to + "/"));

  const submitSearch = (e) => {
    e.preventDefault();
    setQuery && setQuery(local);
    navigate("/catalogo");   // no hay ruta /buscar: el catálogo filtra con `query`
    onClose();
  };

  return (
    <>
      <div className={"ff-mobile-menu-scrim" + (open ? " is-open" : "")} onClick={onClose} />

      <div id="ff-mobile-menu" ref={ref}
        className={"ff-mobile-menu-panel" + (open ? " is-open" : "")}
        role="dialog" aria-modal="true" aria-label="Menú" aria-hidden={!open}>

        <div className="ff-mobile-menu-head">
          {/* Cae casi en el mismo píxel que la hamburguesa del header, para que se lea
              como si ese mismo botón se hubiera transformado en la X. */}
          <button type="button" ref={closeRef} className="ff-mobile-menu-close" onClick={onClose} aria-label="Cerrar menú">
            <BurgerIcon open={true} />
          </button>
          <img src="/logo-full.png" alt="FITFUEL" className="ff-mobile-menu-logo" />
        </div>

        <form className="ff-mobile-menu-search" onSubmit={submitSearch}>
          <button type="submit" className="ff-mobile-menu-search-ic" aria-label="Buscar">
            <Icon name="search" size={18} />
          </button>
          <input value={local} onChange={(e) => setLocal(e.target.value)}
            placeholder="Buscar productos…" aria-label="Buscar productos"
            type="search" autoComplete="off" enterKeyHint="search" />
        </form>

        {/* Anclas reales: el interceptor global de clics (components-base.jsx) ya las
            convierte en navegación SPA, y así siguen siendo rastreables y se pueden
            abrir en otra pestaña. */}
        <nav className="ff-mobile-menu-nav">
          {links.map((l, i) => (
            <a key={l.to} href={toPath(l.to)} style={{ "--i": i }} onClick={onClose}
              className={isActive(l.to) ? "is-on" : ""}
              aria-current={isActive(l.to) ? "page" : undefined}>
              <Icon name={MENU_ICONS[l.to] || "chevron"} size={19} stroke={1.7} />
              <span>{l.label}</span>
            </a>
          ))}
        </nav>

        {/* El panel tapa el header, así que sin este pie la cuenta y el carrito quedarían
            inalcanzables mientras el menú está abierto. */}
        <div className="ff-mobile-menu-foot">
          {user ? (
            <>
              <a href="/cuenta" onClick={onClose}>
                <Icon name="user" size={17} /><span>Mi cuenta</span>
              </a>
              <button type="button" onClick={() => { onClose(); sb.auth.signOut(); navigate("/"); }}>
                <Icon name="back" size={17} /><span>Cerrar sesión</span>
              </button>
            </>
          ) : (
            <button type="button" onClick={() => { onClose(); onAuthOpen && onAuthOpen(); }}>
              <Icon name="user" size={17} /><span>Iniciar sesión</span>
            </button>
          )}
          <button type="button" onClick={() => { onClose(); onCart && onCart(); }}>
            <Icon name="cart" size={17} />
            <span>Carrito{cartCount > 0 ? ` (${cartCount})` : ""}</span>
          </button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { MobileMenu, BurgerIcon });
