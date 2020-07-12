import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { Random } from "meteor/random";
import { ServiceConfiguration } from "meteor/service-configuration";
import { OAuth } from "meteor/oauth";
import { _ } from "meteor/underscore";
import { HTTP } from "meteor/http";

Accounts.config({ forbidClientAccountCreation: true });

export const Bornhack = {};
if (Meteor.isClient) {
  // Request Bornhack credentials for the user
  // @param options {optional}
  // @param credentialRequestCompleteCallback {Function} Callback function to call on
  //   completion. Takes one argument, credentialToken on success, or Error on
  //   error.
  Bornhack.requestCredential = (options, credentialRequestCompleteCallback) => {
    // support both (options, callback) and (callback).
    if (!credentialRequestCompleteCallback && typeof options === "function") {
      credentialRequestCompleteCallback = options;
      options = {};
    }

    var config = ServiceConfiguration.configurations.findOne({
      service: "bornhack",
    });
    if (!config) {
      credentialRequestCompleteCallback &&
        credentialRequestCompleteCallback(
          new ServiceConfiguration.ConfigError(),
        );
      return;
    }
    var credentialToken = Random.secret();

    // var scope = (options && options.requestPermissions) || ["user:email"];
    // var flatScope = _.map(scope, encodeURIComponent).join("+");

    var loginStyle = OAuth._loginStyle("bornhack", config, options);
    var loginUrl =
      "https://wwwstaging.bornhack.org/o/authorize" +
      "?client_id=" +
      config.clientId +
      "&response_type=code" +
      //"&scope=" +
      //flatScope +
      //      "&redirect_uri=" +
      //      OAuth._redirectUri("bornhack", config) +
      "&state=" +
      OAuth._stateParam(
        loginStyle,
        credentialToken,
        options && options.redirectUrl,
      );

    OAuth.launchLogin({
      loginService: "bornhack",
      loginStyle: loginStyle,
      loginUrl: loginUrl,
      credentialRequestCompleteCallback: credentialRequestCompleteCallback,
      credentialToken: credentialToken,
      popupOptions: { width: 900, height: 450 },
    });
  };
} else {
  OAuth.registerService("bornhack", 2, null, (query) => {
    const accessToken = getAccessToken(query);
    const { id, email, login, name } = getIdentity(accessToken);
    const emails = getEmails(accessToken);
    const primaryEmail = _.findWhere(emails, { primary: true });

    return {
      serviceData: {
        id,
        accessToken: OAuth.sealSecret(accessToken),
        email: email || (primaryEmail && primaryEmail.email) || "",
        username: login,
        emails,
      },
      options: { profile: { name } },
    };
  });
  // http://developer.bornhack.com/v3/#user-agent-required
  var userAgent = "Meteor";
  if (Meteor.release) userAgent += "/" + Meteor.release;
  var getAccessToken = (query) => {
    var config = ServiceConfiguration.configurations.findOne({
      service: "bornhack",
    });
    if (!config) throw new ServiceConfiguration.ConfigError();

    var response;
    try {
      response = HTTP.post("https://wwwstaging.bornhack.org/o/token", {
        headers: {
          Accept: "application/json",
          "User-Agent": userAgent,
        },
        params: {
          code: query.code,
          client_id: config.clientId,
          client_secret: OAuth.openSecret(config.secret),
          redirect_uri: OAuth._redirectUri("bornhack", config),
          state: query.state,
        },
      });
    } catch (err) {
      console.log(err);
      throw _.extend(
        new Error(
          "Failed to complete OAuth handshake with Bornhack. " + err.message,
        ),
        { response: err.response },
      );
    }
    if (response.data.error) {
      // if the http response was a json object with an error attribute
      throw new Error(
        "Failed to complete OAuth handshake with Bornhack. " +
          response.data.error,
      );
    } else {
      return response.data.access_token;
    }
  };

  const getIdentity = (accessToken) => {
    try {
      return HTTP.get("https://api.bornhack.com/user", {
        headers: { "User-Agent": userAgent }, // http://developer.bornhack.com/v3/#user-agent-required
        params: { access_token: accessToken },
      }).data;
    } catch (err) {
      throw _.extend(
        new Error("Failed to fetch identity from Bornhack. " + err.message),
        { response: err.response },
      );
    }
  };

  const getEmails = (accessToken) => {
    try {
      return HTTP.get("https://api.bornhack.com/user/emails", {
        headers: { "User-Agent": userAgent }, // http://developer.bornhack.com/v3/#user-agent-required
        params: { access_token: accessToken },
      }).data;
    } catch (err) {
      return [];
    }
  };

  Bornhack.retrieveCredential = (credentialToken, credentialSecret) => {
    return OAuth.retrieveCredential(credentialToken, credentialSecret);
  };
  ServiceConfiguration.configurations.upsert(
    { service: "bornhack" },
    {
      $set: {
        loginStyle: "popup",
        clientId: Meteor.settings.BH_CLIENT_ID,
        secret: Meteor.settings.BH_CLIENT_SECRET,
      },
    },
  );
}

// based on accounts-bornhack/bornhack.js
Accounts.oauth.registerService("bornhack");

if (Meteor.isClient) {
  const loginWithBornhack = (options, callback) => {
    // support a callback without options
    if (!callback && typeof options === "function") {
      callback = options;
      options = null;
    }

    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(
      callback,
    );
    Bornhack.requestCredential(options, credentialRequestCompleteCallback);
  };
  Accounts.registerClientLoginFunction("bornhack", loginWithBornhack);
  Meteor.loginWithBornhack = (...args) => {
    return Accounts.applyLoginFunction("bornhack", ...args);
  };
} else {
  Accounts.addAutopublishFields({
    // not sure whether the bornhack api can be used from the browser,
    // thus not sure if we should be sending access tokens; but we do it
    // for all other oauth2 providers, and it may come in handy.
    forLoggedInUser: ["services.bornhack"],
    forOtherUsers: ["services.bornhack.username"],
  });
}
