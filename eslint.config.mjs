import js from "@eslint/js"
import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import boundaries from "eslint-plugin-boundaries"

const tsFiles = ["**/*.{ts,tsx}"]

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".turbo/**",
      "dist/**",
      "**/dist/**",
      "coverage/**",
      "pnpm-lock.yaml",
    ],
  },
  js.configs.recommended,
  {
    files: tsFiles,
    languageOptions: {
      parser: tsParser,
      globals: {
        console: "readonly",
        process: "readonly",
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "apps", pattern: "apps/*" },
        { type: "packages", pattern: "packages/*" },
      ],
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*", "../../*"],
              message:
                "Use workspace package imports instead of reaching across package internals.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/spec/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@cowards/engine",
            "@cowards/runtime-js",
            "@cowards/replay",
            "@cowards/map-configs",
            "@cowards/test-utils",
            "@cowards/web",
            "@cowards/worker",
            "apps/**",
            "packages/engine/**",
            "packages/runtime-js/**",
            "packages/replay/**",
            "packages/map-configs/**",
            "packages/test-utils/**",
          ],
        },
      ],
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@cowards/runtime-js", "packages/runtime-js/**"],
        },
      ],
    },
  },
  {
    files: ["packages/engine/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@cowards/runtime-js",
            "@cowards/web",
            "@cowards/worker",
            "apps/**",
            "packages/runtime-js/**",
          ],
        },
      ],
    },
  },
]
