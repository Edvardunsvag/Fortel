module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:react-hooks/recommended"],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    // Enforce Rules of Hooks - hooks must be called unconditionally and in the same order
    "react-hooks/rules-of-hooks": "error",
    // Ensure effect dependencies are correct
    "react-hooks/exhaustive-deps": "warn",
  },
};
