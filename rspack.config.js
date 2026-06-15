const { defineConfig } = require("@meteorjs/rspack");

/**
 * Rspack configuration for Meteor projects.
 *
 * Provides typed flags on the `Meteor` object, such as:
 * - `Meteor.isClient` / `Meteor.isServer`
 * - `Meteor.isDevelopment` / `Meteor.isProduction`
 * - …and other flags available
 *
 * Use these flags to adjust your build settings based on environment.
 */
module.exports = defineConfig((Meteor) => {
  return {
    module: {
      rules: [
        {
          test: /\.(?:js|mjs|jsx|ts|tsx)$/,
          use: {
            loader: "builtin:swc-loader",
            options: {
              detectSyntax: "auto",
              jsc: {
                transform: {
                  react: {
                    runtime: "automatic",
                  },
                },
              },
            },
          },
          type: "javascript/auto",
        },
      ],
    },
  };
});
