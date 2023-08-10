import { Accounts } from "meteor/accounts-base";
import { HTTP } from "meteor/http";
import { Meteor } from "meteor/meteor";
// @ts-expect-error blah blah
import { OAuth } from "meteor/oauth";
import { Random } from "meteor/random";
import { ServiceConfiguration } from "meteor/service-configuration";
import { Session } from "meteor/session";
import Camps from "./camps";
import Locations from "./locations";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("tls").DEFAULT_ECDH_CURVE = "auto";

Accounts.config({ forbidClientAccountCreation: true });
const service = "bornhack";
const code_verifier = "1IwjXGI5H56e8vWKLHJwLn615KuGr8_yQeCLFgftTJ4";
const code_challenge = "pAiuYdomi8XWR3KVWRQaHCqvtkFhX0Sjw5aCw6E--gI";

if (!Meteor.isClient) {
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
            code_verifier,
            code_challenge,
            code_challenge_method: "S256",
            grant_type: "authorization_code",
            client_id: config.clientId,
            client_secret: OAuth.openSecret(config.secret),
            redirect_uri: OAuth._redirectUri(service, config),
            state,
            scope: "read",
          },
        });
      } catch ({ message, response }: any) {
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
      } catch ({ message, response }: any) {
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
          teams: identity.teams,
          publicCreditName: identity.profile.public_credit_name,
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
    loginUrl.searchParams.set("code_challenge_method", "S256");
    loginUrl.searchParams.set("code_challenge", code_challenge);
    loginUrl.searchParams.set("code_verifier", code_verifier);

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
  Accounts.setDefaultPublishFields({
    profile: 1,
    username: 1,
    emails: 1,
    "services.bornhack.id": 1,
    "services.bornhack.teams": 1,
    "services.bornhack.publicCreditName": 1,
  });
}

export const isUserAdmin = (userOrId: string | Meteor.User | null) => {
  if (!userOrId) return false;

  const user = Meteor.users.findOne(
    typeof userOrId === "string" ? userOrId : userOrId._id,
  );

  if (user?.services?.bornhack?.id === "klarstrup") return true;
};

export const isUserResponsible = (userOrId: string | Meteor.User | null) => {
  if (!userOrId) return false;
  if (isUserAdmin(userOrId)) return true;

  const user = Meteor.users.findOne(
    typeof userOrId === "string" ? userOrId : userOrId._id,
  );

  if (
    user?.services?.bornhack?.id === "klarstrup" ||
    user?.services?.bornhack?.id === "jagenau" ||
    user?.services?.bornhack?.id === "tykling" ||
    user?.services?.bornhack?.id === "zeltophil" ||
    user?.services?.bornhack?.id === "valberg" ||
    user?.services?.bornhack?.id === "flummer"
  )
    return true;
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
    user?.services?.bornhack?.teams?.some(
      ({ team, camp }: { team: string; camp: string }) =>
        team?.toLowerCase() === inTeam.toLowerCase() &&
        camp === currentCamp?.name,
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
if (Meteor.isClient) {
  Meteor.call(
    "GALAXY_APP_VERSION_ID",
    (_: unknown, GALAXY_APP_VERSION_ID: number) =>
      Session.set("GALAXY_APP_VERSION_ID", GALAXY_APP_VERSION_ID),
  );
}

if (Meteor.isServer) {
  Meteor.methods({
    GALAXY_APP_VERSION_ID: () => process.env.GALAXY_APP_VERSION_ID || 69,
  });
}
