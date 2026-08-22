// FITFUEL — entrada del bundle (Vite).
// Los estilos y módulos se cargan en orden. Los componentes se comparten vía window.*
// (patrón existente del proyecto). FF (catálogo) lo provee /data.js como script clásico
// en la página, que corre antes que este módulo diferido.
import "./styles.css";
import "./styles2.css";
import "./styles3.css";
import "./pdp.css";

import "./tweaks-panel.jsx";
import "./supabase.js";
import "./components-base.jsx";
import "./components-shop.jsx";
import "./components-extra.jsx";
import "./components-auth.jsx";
import "./pages.jsx";

// La app se monta YA, con el catálogo que trae data.js. Antes esta línea esperaba a
// FF.loadRemote() + FF.loadStock() (hasta 3,5 s de timeout) antes de montar nada, así que
// en móvil con red lenta el visitante veía una pantalla en blanco durante todo ese rato,
// encima del tiempo de descarga del bundle. La mayoría del tráfico de la tienda es móvil.
import "./app.jsx";

// El catálogo publicado y el stock vivo se cargan DESPUÉS del montaje y, cuando terminan
// (con éxito o no), avisan a la app con `ff:catalog` para que rehaga su índice y repinte.
// La app no considera el catálogo definitivo hasta ese evento: así no descarta del carrito
// productos que todavía no habían llegado.
(async () => {
  try {
    const tasks = [];
    if (window.FF && FF.loadRemote) tasks.push(FF.loadRemote());
    if (window.FF && FF.loadStock) tasks.push(FF.loadStock());
    await Promise.all(tasks);
  } catch (e) {}
  window.__ffCatalogSettled = true;
  window.dispatchEvent(new CustomEvent("ff:catalog"));
})();
