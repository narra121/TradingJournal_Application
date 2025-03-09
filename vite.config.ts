import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // You can explicitly set source maps if needed, but the default should work
  build: {
    sourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Prevents Vite from stopping
    },
  },
});
