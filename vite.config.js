import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.lottie"],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    // Las Cloud Functions son un proyecto Node aparte; no se prueban aquí
    exclude: ["node_modules", "dist", "src/cloudFunctions/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/services/**", "src/helpers/**", "src/hooks/**"],
    },
  },
});
