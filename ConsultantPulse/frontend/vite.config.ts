import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Local version of the config (hosting-platform plugins removed).
// API_PROXY_TARGET is set by docker-compose; when running by hand the backend is on localhost:8001.
const apiTarget = process.env.API_PROXY_TARGET || "http://localhost:8001";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: /^lucide-react$/, replacement: path.resolve(__dirname, "./src/lib/lucide-react.tsx") },
      { find: "lucide-react-upstream", replacement: path.resolve(__dirname, "./node_modules/lucide-react") },
      { find: /^recharts$/, replacement: path.resolve(__dirname, "./src/lib/recharts.tsx") },
      { find: "recharts-upstream", replacement: path.resolve(__dirname, "./node_modules/recharts") },
    ],
  },
  server: {
    host: true,
    port: 3000,
    // GitHub Codespaces serves the app on https://<name>-3000.app.github.dev
    allowedHosts: [".app.github.dev"],
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
    },
  },
});
