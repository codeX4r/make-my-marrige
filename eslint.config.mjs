import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", ".tmp/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals,
  {
    settings: {
      next: { rootDir: ["apps/web/"] },
      react: { version: "19.3" },
    },
  },
  {
    files: ["**/*.config.{js,mjs,ts}", "*.{js,mjs}"],
    languageOptions: { globals: globals.node },
  },
  { files: ["**/*.test.ts", "**/*.spec.ts"], languageOptions: { globals: globals.node } },
);
