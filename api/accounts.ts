import { Accounts } from "meteor/accounts-base";
import { HTTP } from "meteor/http";
import { Meteor } from "meteor/meteor";
// @ts-expect-error
import { OAuth } from "meteor/oauth";
import { Random } from "meteor/random";
import { ServiceConfiguration } from "meteor/service-configuration";
import { Session } from "meteor/session";
import Camps from "./camps";
import Locations from "./locations";

require("tls").DEFAULT_ECDH_CURVE = "auto";

Accounts.config({ forbidClientAccountCreation: true });
const service = "bornhack";

if (Meteor.isClient) {
} else {
  OAuth.registerService(
    service,
    2,
    null,
    ({ code, state }: { code: string; state: string }) => {
      const config = ServiceConfiguration.configurations.findOne({ service });
      if (!config) throw new ServiceConfiguration.ConfigError();

      let accessToken: string | string;
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
        throw Object.assign(
          new Error(
            "Failed to complete OAuth handshake with Bornhack. " + message,
          ),
          { response },
        );
      }
      // if the http response was a json object with an error attribute
      if (response.data.error) {
        throw new Error(
          "Failed to complete OAuth handshake with Bornhack. " +
            response.data.error,
        );
      } else {
        accessToken = response.data.access_token;
      }

      let identity: {
        profile: { public_credit_name: string; description: string };
        user: { username: string; user_id: string };
        teams: { team: string; camp: string }[];
      };
      try {
        identity = HTTP.get("https://bornhack.dk/profile/api/", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).data;
      } catch ({ message, response }) {
        throw Object.assign(
          new Error("Failed to fetch identity from Bornhack. " + message),
          { response },
        );
      }
      if (!identity) throw new Error("Failed to fetch identity from Bornhack.");

      return {
        serviceData: {
          accessToken: OAuth.sealSecret(accessToken),
          id: identity.user.username,
        },
        options: {
          profile: {
            name:
              identity.profile.public_credit_name !== "Unnamed"
                ? identity.profile.public_credit_name
                : identity.user.username,
            profile: identity.profile,
            user: identity.user,
            teams: identity.teams,
          },
        },
      };
    },
  );

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
  Accounts.registerClientLoginFunction(service, () => {
    const credentialRequestCompleteCallback =
      Accounts.oauth.credentialRequestCompleteHandler();
    const config = ServiceConfiguration.configurations.findOne({ service });
    if (!config) {
      return credentialRequestCompleteCallback?.(
        new ServiceConfiguration.ConfigError(),
      );
    }
    const credentialToken = Random.secret();

    const loginStyle = OAuth._loginStyle(service, config);

    const loginUrl = new URL("https://bornhack.dk/o/authorize/");
    loginUrl.searchParams.set("client_id", config.clientId);
    loginUrl.searchParams.set("response_type", "code");
    loginUrl.searchParams.set(
      "redirect_uri",
      OAuth._redirectUri(service, config),
    );
    loginUrl.searchParams.set(
      "state",
      OAuth._stateParam(loginStyle, credentialToken),
    );

    OAuth.launchLogin({
      loginService: service,
      loginStyle,
      loginUrl,
      credentialRequestCompleteCallback,
      credentialToken,
      popupOptions: { width: 900, height: 450 },
    });
  });

  Meteor.loginWithBornhack = () => Accounts.callLoginFunction(service);
} else {
  Accounts.addAutopublishFields({
    forLoggedInUser: ["services.bornhack"],
    forOtherUsers: ["services.bornhack.username"],
  });
}
export const isUserAdmin = (userOrId: string | Meteor.User | null) => {
  if (!userOrId) return false;

  const user = Meteor.users.findOne(
    typeof userOrId === "string" ? userOrId : userOrId._id,
  );

  if (user?.profile?.user?.username === "klarstrup") return true;
};

export const isUserInTeam = (
  userOrId: string | Meteor.User | null,
  inTeam: string | undefined,
) => {
  if (!userOrId || !inTeam) return false;
  if (isUserAdmin(userOrId)) return true;
  const user = Meteor.users.findOne(
    typeof userOrId === "string" ? userOrId : userOrId._id,
  );
  const [currentCamp] = Camps.find({}, { sort: { end: -1 } }).fetch();

  return Boolean(
    user?.profile?.teams?.some(
      ({ team, camp }) =>
        team?.toLowerCase() === inTeam.toLowerCase() &&
        camp === currentCamp.name,
    ),
  );
};
export const assertUserInAnyTeam = (userOrId: string | Meteor.User | null) => {
  if (
    !Locations.find()
      .fetch()
      .some(({ teamName }) => isUserInTeam(userOrId, teamName))
  )
    throw new Meteor.Error(`You are not a member of an active team`);
};

export const assertUserInTeam = (
  userOrId: string | Meteor.User,
  inTeam: string,
) => {
  if (!isUserInTeam(userOrId, inTeam))
    throw new Meteor.Error(`You are not a member of ${inTeam} Team`);
};

//In the client side
if (Meteor.isClient)
  Meteor.call(
    "GALAXY_APP_VERSION_ID",
    (_: any, GALAXY_APP_VERSION_ID: number) =>
      Session.set("GALAXY_APP_VERSION_ID", GALAXY_APP_VERSION_ID),
  );

if (Meteor.isServer)
  Meteor.methods({
    GALAXY_APP_VERSION_ID: () => process.env.GALAXY_APP_VERSION_ID || 69,
  });
