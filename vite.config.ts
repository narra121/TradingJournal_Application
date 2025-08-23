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
    base: "/TradingJournal_Application/",
    plugins: [react()],
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "lib": path.resolve(__dirname, "./lib"),
        "ui": path.resolve(__dirname, "./src/ui"),
      },
    },
    build: {
      sourcemap: true,
    },
    server: {
      port: 5173,
    },
  };
});
