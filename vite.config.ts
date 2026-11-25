// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
) as { version?: string };

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: "/",
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version ?? "null"),
    },
    publicDir: "public",
    server: {
      host: true,
      port: 7169,
    },
    preview: {
      host: true,
      port: 4173,
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
