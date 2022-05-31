module.exports = {
  servers: {
    one: {
      host: "",
      username: "",
      opts: { port: 666 },
    },
  },

  app: {
    name: "wip-bar",
    path: "../",
    servers: { one: {} },
    buildOptions: { serverOnly: true },
    env: {
      ROOT_URL: "https://wip.bar",
      MONGO_URL: "",
      MONGO_OPLOG_URL: "",
      BH_CLIENT_ID: "",
      BH_CLIENT_SECRET: "",
      ADMINPASS: "",
    },
    docker: { image: "zodern/meteor:root" },

    // Show progress bar while uploading bundle to server
    // You might need to disable it on CI servers
    enableUploadProgressBar: true,
  },
  proxy: {
    domains: "wip.bar",
    ssl: { letsEncryptEmail: "", forceSSL: true },
  },
};
