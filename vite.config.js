import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { prerender } from "./prerender.js";

// FITFUEL — build de producción.
// Entrada única: index.html (la tienda). admin.html y data.js viven en /public y se sirven
// tal cual (el panel no se bundlea).
//
// `base` tiene que ser "/" (no "./"): con rutas reales, una página servida en
// /producto/whey-vainilla resolvería "./assets/main.js" como /producto/assets/main.js y
// daría 404. Con "/" las rutas de los assets son absolutas y funcionan a cualquier
// profundidad.
export default defineConfig({
  base: "/",
  plugins: [react(), prerender()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: { input: { index: "index.html" } },
  },
});
