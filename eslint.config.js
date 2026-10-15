import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["web-ext-artifacts/**"] },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: { ...globals.browser, ...globals.webextensions },
    },
  },
  {
    files: ["test/**/*.js", "scripts/**/*.js", "*.config.js"],
    languageOptions: { globals: globals.node },
  },
];
