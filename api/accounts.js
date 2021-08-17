import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { Random } from "meteor/random";
import { ServiceConfiguration } from "meteor/service-configuration";
import { OAuth } from "meteor/oauth";
import { _ } from "meteor/underscore";
import { HTTP } from "meteor/http";
import Locations from "./locations";

require("tls").DEFAULT_ECDH_CURVE = "auto";

Accounts.config({ forbidClientAccountCreation: true });
const service = "bornhack";
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

    const config = ServiceConfiguration.configurations.findOne({ service });
    if (!config) {
      credentialRequestCompleteCallback &&
        credentialRequestCompleteCallback(
          new ServiceConfiguration.ConfigError(),
        );
      return;
    }
    const credentialToken = Random.secret();

    // const scope = (options && options.requestPermissions) || ["user:email"];
    // const flatScope = _.map(scope, encodeURIComponent).join("+");

    const loginStyle = OAuth._loginStyle(service, config, options);
    const loginUrl =
      "https://bornhack.dk/o/authorize/" +
      `?client_id=${config.clientId}` +
      "&response_type=code" +
      // `&scope=${flatScope}` +
      `&redirect_uri=${OAuth._redirectUri(service, config)}` +
      `&state=${OAuth._stateParam(
        loginStyle,
        credentialToken,
        options?.redirectUrl,
      )}`;

    OAuth.launchLogin({
      loginService: service,
      loginStyle,
      loginUrl,
      credentialRequestCompleteCallback,
      credentialToken,
      popupOptions: { width: 900, height: 450 },
    });
  };
} else {
  OAuth.registerService(service, 2, null, (query) => {
    const accessToken = getAccessToken(query);
    const identity = getIdentity(accessToken);

    return {
      serviceData: {
        accessToken: OAuth.sealSecret(accessToken),
        id: identity.user.username,
      },
      options: {
        profile: {
          name: identity.profile.public_credit_name,
          profile: identity.profile,
          user: identity.user,
          teams: identity.teams,
        },
      },
    };
  });
  const getAccessToken = ({ code, state }) => {
    const config = ServiceConfiguration.configurations.findOne({ service });
    if (!config) throw new ServiceConfiguration.ConfigError();

    let response;
    try {
      response = HTTP.post("https://bornhack.dk/o/token/", {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        params: {
          code,
          grant_type: "authorization_code",
          client_id: config.clientId,
          client_secret: OAuth.openSecret(config.secret),
          redirect_uri: OAuth._redirectUri(service, config),
          state,
          scope: "read",
        },
      });
    } catch ({ message, response }) {
      throw _.extend(
        new Error(
          "Failed to complete OAuth handshake with Bornhack. " + message,
        ),
        { response },
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

  const getIdentity = (access_token) => {
    try {
      return HTTP.get("https://bornhack.dk/profile/api/", {
        headers: { Authorization: `Bearer ${access_token}` },
      }).data;
    } catch ({ message, response }) {
      throw _.extend(
        new Error("Failed to fetch identity from Bornhack. " + message),
        { response },
      );
    }
  };

  Bornhack.retrieveCredential = (credentialToken, credentialSecret) =>
    OAuth.retrieveCredential(credentialToken, credentialSecret);
  ServiceConfiguration.configurations.upsert(
    { service },
    {
      $set: {
        loginStyle: "redirect" || "popup",
        clientId: Meteor.settings.BH_CLIENT_ID,
        secret: Meteor.settings.BH_CLIENT_SECRET,
      },
    },
  );
}

Accounts.oauth.registerService(service);

if (Meteor.isClient) {
  const loginWithBornhack = (options, callback) => {
    // support a callback without options
    if (!callback && typeof options === "function") {
      callback = options;
      options = null;
    }

    Bornhack.requestCredential(
      options,
      Accounts.oauth.credentialRequestCompleteHandler(callback),
    );
  };
  Accounts.registerClientLoginFunction(service, loginWithBornhack);
  Meteor.loginWithBornhack = (...args) =>
    Accounts.applyLoginFunction(service, ...args);
} else {
  Accounts.addAutopublishFields({
    // not sure whether the bornhack api can be used from the browser,
    // thus not sure if we should be sending access tokens; but we do it
    // for all other oauth2 providers, and it may come in handy.
    forLoggedInUser: ["services.bornhack"],
    forOtherUsers: ["services.bornhack.username"],
  });
}
export const isUserAdmin = (userOrId) => {
  if (!userOrId) return false;
  const user = Meteor.users.findOne(
    typeof userOrId === "string" ? userOrId : userOrId._id,
  );
  if (user?.profile?.user?.username === "klarstrup") return true;
};
export const isUserInTeam = (userOrId, inTeam) => {
  if (!userOrId || !inTeam) return false;
  if (isUserAdmin(userOrId)) return true;
  const user = Meteor.users.findOne(
    typeof userOrId === "string" ? userOrId : userOrId._id,
  );
  return !!user?.profile?.teams?.find(
    ({ team, camp }) =>
      team.toLowerCase() === inTeam.toLowerCase() && camp === "BornHack 2021",
  );
};
export const assertUserInAnyTeam = (userOrId) => {
  if (
    !Locations.find()
      .fetch()
      .some(({ teamName }) => isUserInTeam(userOrId, teamName))
  )
    throw new Meteor.Error(`You are not a member of an active team`);
};

export const assertUserInTeam = (userOrId, inTeam) => {
  if (!isUserInTeam(userOrId, inTeam))
    throw new Meteor.Error(`You are not a member of ${inTeam} Team`);
};
