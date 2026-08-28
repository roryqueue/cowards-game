import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    // These correction generations authenticate source bytes at their own
    // immutable commits. Run them from those checkouts; later additive
    // successors must not make the ordinary current-tree suite reinterpret
    // their historical source manifests.
    exclude: [
      ...configDefaults.exclude,
      "scripts/check-v1-38-phase-262-review-fix-correction-v2.test.ts",
      "scripts/check-v1-38-phase-262-review-fix-correction-v3.test.ts",
    ],
  },
})
