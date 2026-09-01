import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const base = env.VITE_BASE || "/";
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.{html,css,js,png,svg,jpg,webp}"]
        },
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        manifest: {
          name: "Inventory Tracker",
          short_name: "IT",
          description: "WSU's inventory tracker",
          theme_color: "#fff",
          background_color: "#fff",
          display: "standalone",
          icons: [
            {
              src: "/icons/bookcase.png",
              sizes: "512x512",
              type: "image/png"
            }
          ],
          screenshots: [
            {
              src: "/screenshots/screenshot1.png",
              sizes: "1606x874",
              type: "image/png",
              form_factor: "wide"
            },
            {
              src: "/screenshots/screenshot2.png",
              sizes: "428x712",
              type: "image/png"
            }
          ]
        }
      })
    ]
  };
});
