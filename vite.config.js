import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// FITFUEL — build de producción.
// Entrada principal: FITFUEL.html (se conserva el nombre conocido).
// admin.html y data.js viven en /public y se sirven tal cual (el panel no se bundlea).
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: { main: "FITFUEL.html" },
    },
  },
});
