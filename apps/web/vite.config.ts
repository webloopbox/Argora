import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  // @brainstorm/core is a linked workspace package emitted as CommonJS
  // (the API consumes it via NestJS' CJS runtime). The browser can't
  // statically resolve named imports from CJS, so Vite must pre-bundle
  // it through esbuild to expose proper ESM bindings (DebateVisibility,
  // ArgumentSide, etc.).
  optimizeDeps: {
    include: ["@brainstorm/core"],
  },
  ssr: {
    noExternal: ["@brainstorm/core"],
  },
});
