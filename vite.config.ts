// Polyfill crypto.getRandomValues before any imports that might need it
try {
  const { webcrypto } = require('node:crypto');
  if (!globalThis.crypto) {
    (globalThis as any).crypto = webcrypto;
  }
} catch (e) {
  // Fallback for older Node versions
  try {
    const crypto = require('crypto');
    if (!globalThis.crypto) {
      (globalThis as any).crypto = {
        getRandomValues: (arr: any) => crypto.randomFillSync(arr)
      };
    }
  } catch {}
}

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
