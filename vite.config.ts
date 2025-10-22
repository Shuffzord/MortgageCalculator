import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { removeConsolePlugin } from "./client/src/plugins/removeConsole";
import { cleanScreenshotsPlugin } from "./cleanscreenshots";
export default defineConfig({
  plugins: [    
    cleanScreenshotsPlugin(),
    react(),
    runtimeErrorOverlay(),
    removeConsolePlugin()
  ],
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    tsconfig: path.resolve(import.meta.dirname, "tsconfig.json"),
  },
  root: path.resolve(import.meta.dirname, "client"),  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    assetsDir: "assets",
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name].[hash][extname]"
      }
    }
  },
});
