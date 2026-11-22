import { defineConfig } from "vitest/config";

// fixed zone so DST-dependent tests are deterministic (inherited by the test workers)
process.env.TZ = "Europe/Berlin";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { environment: "jsdom", include: ["src/**/*.test.ts"] },
});
