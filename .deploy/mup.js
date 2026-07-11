const env = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
};

module.exports = {
  servers: {
    one: {
      // TODO: set host address, username, and authentication method
      host: env("DEPLOY_SERVER_HOST"),
      username: env("DEPLOY_SERVER_USERNAME"),
      // pem: './path/to/pem'
      password: env("DEPLOY_SERVER_PASSWORD"),
      // or neither for authenticate from ssh-agent
    },
  },

  app: {
    name: "app",
    path: "../",

    servers: { one: {} },

    buildOptions: { serverOnly: true },

    env: {
      ROOT_URL: env("DEPLOY_ROOT_URL"),
      MONGO_URL: env("DEPLOY_MONGO_URL"),
      MONGO_OPLOG_URL: env("DEPLOY_MONGO_OPLOG_URL"),
      DISABLE_SOCKJS: 1,
    },

    docker: { image: "zodern/meteor:root" },

    // Show progress bar while uploading bundle to server
    // You might need to disable it on CI servers
    enableUploadProgressBar: true,
  },

  proxy: {
    servers: { one: {} },
    domains: env("DEPLOY_PROXY_DOMAINS"),
    // Enable Let's Encrypt
    ssl: { letsEncryptEmail: env("DEPLOY_LETSENCRYPT_EMAIL"), forceSSL: true },
  },
};
