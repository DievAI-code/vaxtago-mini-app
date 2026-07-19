import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "vendor";
            }
            if (id.includes("@twa-dev") || id.includes("telegram")) {
              return "telegram";
            }
            if (id.includes("@radix-ui") || id.includes("framer-motion")) {
              return "ui";
            }
            if (id.includes("@supabase") || id.includes("@tanstack")) {
              return "ai";
            }
            return "vendor";
          }
        },
      },
    },
  },
}));
