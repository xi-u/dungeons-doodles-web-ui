import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  root: ".",
  plugins: [vue()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    // During `npm run dev` the page comes from Vite on 5173, but Socket.IO runs on the real server on 3000
    proxy: {
      "/socket.io": { target: "http://localhost:3000", ws: true },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
