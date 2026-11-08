import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  root: "src",
  plugins: [vue()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
