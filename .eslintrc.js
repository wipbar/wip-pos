module.exports = {
  root: true,
  settings: { react: { version: "detect" } },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react", "react-hooks", "prettier"],
  rules: {
    "react/prop-types": "off",
    "react-hooks/rules-of-hooks": [2],
    "react-hooks/exhaustive-deps": [
      "warn",
      {
        additionalHooks: "(useMongoFetch|useTracker|useTracker)",
      },
    ],
    "no-else-return": ["error"],
    "no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-ts-comment": "off",
  },
  ignorePatterns: ["**/vendor/**/*.js"],
};
