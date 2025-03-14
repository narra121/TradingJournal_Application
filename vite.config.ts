import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

//vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    define: {
      "process.env": env,
    },
    // base: "/TradingJournal_Application/",
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
  };
});
