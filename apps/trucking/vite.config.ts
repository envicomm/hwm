import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  ssr: {
    noExternal: ['@convex-dev/better-auth'],
  },
  server: {
    port: 3003,
  },
  plugins: [
    viteTsConfigPaths(),
    tailwindcss(),
    tanstackStart(),
    react(),
  ],
});
