import tsParser from "@typescript-eslint/parser";

export default [
  { ignores: ["dist/**", "node_modules/**", "coverage/**", "**/*.config.*"] },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      // Parses TypeScript so `npm run lint` passes; tighten rules later.
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
];
