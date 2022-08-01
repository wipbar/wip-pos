module.exports = {
  settings: { react: { version: "detect" } },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:react/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react", "react-hooks", "prettier"],
  rules: {
    "react/prop-types": "off",
    "react-hooks/rules-of-hooks": [2],
    "react-hooks/exhaustive-deps": [
      "warn",
      { additionalHooks: "useMongoFetch" },
    ],
    "no-else-return": ["error"],
  },
};
