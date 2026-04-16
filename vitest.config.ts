import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const srcUrl = new URL("./src", import.meta.url);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(srcUrl),
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
        "**/types.ts",
        "app/**/layout.tsx",
        "app/**/page.tsx",
        "app/**/not-found.tsx",
        "app/**/error.tsx",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
        "src/lib/**": {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80,
        },
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.unit.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "jsdom",
          include: ["src/**/*.component.test.tsx"],
          setupFiles: ["./src/test/setup.component.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["{app,src}/**/*.integration.test.ts"],
          setupFiles: ["./src/test/setup.integration.ts"],
        },
      },
    ],
  },
});
