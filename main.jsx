// FITFUEL — entrada del bundle (Vite).
// Los estilos y módulos se cargan en orden. Los componentes se comparten vía window.*
// (patrón existente del proyecto). FF (catálogo) lo provee /data.js como script clásico
// en FITFUEL.html, que corre antes que este módulo diferido.
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

// Carga el catálogo publicado (Supabase Storage) ANTES de montar la app, para que
// los visitantes vean productos/imágenes publicados. app.jsx se importa dinámicamente
// porque construye su índice desde FF.PRODUCTS en tiempo de evaluación.
(async () => {
  try {
    const tasks = [];
    if (window.FF && FF.loadRemote) tasks.push(FF.loadRemote());
    if (window.FF && FF.loadStock) tasks.push(FF.loadStock());
    await Promise.all(tasks);
  } catch (e) {}
  await import("./app.jsx");
})();
