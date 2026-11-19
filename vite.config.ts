// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: "/",
    plugins: [react()],
    publicDir: "public",
    server: {
      host: true,
      port: 7169,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    css: {
      modules: {
        // "Home_container__H3aK1"
        generateScopedName: "[name]__[local]___[hash:base64:5]",
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@use "sass:color";
                           @use "@/shared/styles/_variables.scss" as *;`,
        },
      },
    },
  };
});
