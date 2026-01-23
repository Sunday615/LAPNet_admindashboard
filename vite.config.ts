import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  // ✅ pre-bundle for better compat
  optimizeDeps: {
    include: ["docx-preview"],
  },

  // ✅ bypass "exports" restriction for css deep import
  resolve: {
    alias: {
      "docx-preview/dist/docx-preview.css": resolve(
        __dirname,
        "node_modules/docx-preview/dist/docx-preview.css"
      ),
    },
  },

  server: {
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
      "/uploads": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});
