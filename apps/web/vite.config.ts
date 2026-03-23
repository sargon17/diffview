import { fileURLToPath } from "node:url";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL("../../", import.meta.url));
const reactRoot = fileURLToPath(new URL("../../node_modules/react", import.meta.url));
const reactDomRoot = fileURLToPath(
  new URL("../../node_modules/react-dom", import.meta.url)
);

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      react: reactRoot,
      "react-dom": reactDomRoot,
      "react/jsx-runtime": `${reactRoot}/jsx-runtime.js`,
      "react/jsx-dev-runtime": `${reactRoot}/jsx-dev-runtime.js`,
      "react/compiler-runtime": `${reactRoot}/compiler-runtime.js`,
    },
    dedupe: ["react", "react-dom"],
    tsconfigPaths: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
  },
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  server: {
    fs: {
      allow: [rootDir],
    },
    proxy: {
      "/session": "http://localhost:3000",
      "/refs": "http://localhost:3000",
      "/diff": "http://localhost:3000",
    },
  },
});
