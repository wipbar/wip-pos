import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { OAuth } from "meteor/oauth";
import { Random } from "meteor/random";
import { ServiceConfiguration } from "meteor/service-configuration";
import { Session } from "meteor/session";
import Camps, { ICamp } from "./camps";
import Locations from "./locations";

// eslint-disable-next-line @typescript-eslint/no-var-requires
(require("tls") as typeof import("tls")).DEFAULT_ECDH_CURVE = "auto";

Accounts.config({ forbidClientAccountCreation: true });
const service = "bornhack";
// Are these secret? Who the fuck cares
const code_verifier = "1IwjXGI5H56e8vWKLHJwLn615KuGr8_yQeCLFgftTJ4";
const code_challenge = "pAiuYdomi8XWR3KVWRQaHCqvtkFhX0Sjw5aCw6E--gI";

if (!Meteor.isClient) {
  OAuth.registerService(
    service,
    2,
    null,
    async ({ code, state }: { code: string; state: string }) => {
      const config = await ServiceConfiguration.configurations.findOneAsync({
        service,
      });
      if (!config) throw new ServiceConfiguration.ConfigError();

      let accessToken: string | undefined;
      let response: unknown;
      try {
        const tokenURL = new URL("https://bornhack.dk/o/token/");
        const tokenParams = new URLSearchParams();
        tokenParams.append("code", code);
        tokenParams.append("code_verifier", code_verifier);
        tokenParams.append("code_challenge", code_challenge);
        tokenParams.append("code_challenge_method", "S256");
        tokenParams.append("grant_type", "authorization_code");
        tokenParams.append("client_id", config.clientId);
        tokenParams.append("client_secret", OAuth.openSecret(config.secret));
        tokenParams.append("redirect_uri", OAuth._redirectUri(service, config));
        tokenParams.append("state", state);
        tokenParams.append("scope", "profile:read");

        response = await fetch(tokenURL, {
          method: "post",
          body: tokenParams,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
        }).then((r) => r.json());
      } catch (error) {
        throw Object.assign(
          new Error(
            "Failed to complete OAuth handshake with Bornhack, failed to request token: " +
              String(error),
          ),
          { cause: error },
        );
      }
      // if the http response was a json object with an error attribute
      if (
        response &&
        typeof response === "object" &&
        "error" in response &&
        response.error
      ) {
        throw new Error(
          `Failed to complete OAuth handshake with Bornhack, received an error when requesting token: ${String(
            response.error,
          )}`,
        );
      } else if (
        response &&
        typeof response === "object" &&
        "access_token" in response &&
        typeof response.access_token === "string"
      ) {
        accessToken = response.access_token;
      }
      if (!accessToken) {
        throw new Error(
          "Failed to complete OAuth handshake with Bornhack. No access token received.",
        );
      }

      let identity: {
        profile: { public_credit_name: string; description: string };
        user: { username: string; user_id: string };
        teams: { team: string; camp: string }[];
      };
      try {
        identity = (await fetch("https://bornhack.dk/profile/api/", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then((r) => r.json())) as typeof identity;
      } catch (error) {
        throw Object.assign(
          new Error("Failed to fetch identity from Bornhack. " + String(error)),
          { cause: error },
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

  Meteor.startup(async () => {
    await ServiceConfiguration.configurations.upsertAsync(
      { service },
      {
        $set: {
          loginStyle: "redirect", // || "popup",
          clientId: Meteor.settings.BH_CLIENT_ID as string | undefined,
          secret: Meteor.settings.BH_CLIENT_SECRET as string | undefined,
        },
      },
    );
  });
}

Accounts.oauth.registerService(service);

if (Meteor.isClient) {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  Accounts.registerClientLoginFunction(service, async () => {
    const credentialRequestCompleteCallback =
      Accounts.oauth.credentialRequestCompleteHandler();
    const config = await ServiceConfiguration.configurations.findOneAsync({
      service,
    });
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
    loginUrl.searchParams.set("scope", "profile:read");

    OAuth.launchLogin({
      loginService: service,
      loginStyle,
      loginUrl: loginUrl.toString(),
      credentialRequestCompleteCallback,
      credentialToken,
      popupOptions: { width: 900, height: 450 },
    });
  });

  Meteor.loginWithBornhack = () => {
    Accounts.callLoginFunction(service);
  };
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

export const isUserAdmin = (user: Meteor.User | null) => {
  if (!user) return false;

  if (user?.services?.bornhack?.id === "klarstrup") return true;
};

export const isUserResponsible = (user: Meteor.User | null) => {
  if (!user) return false;
  if (isUserAdmin(user)) return true;

  if (
    user?.services?.bornhack?.id === "klarstrup" ||
    user?.services?.bornhack?.id === "jagenau" ||
    user?.services?.bornhack?.id === "tykling" ||
    user?.services?.bornhack?.id === "zeltophil" ||
    user?.services?.bornhack?.id === "valberg" ||
    user?.services?.bornhack?.id === "flummer"
  ) {
    return true;
  }
};

export const isUserInTeam = (
  user: Meteor.User | null,
  currentCamp: ICamp | undefined,
  inTeam: string | undefined,
) => {
  if (!user || !inTeam || !currentCamp) return false;
  if (isUserAdmin(user)) return true;
  return Boolean(
    user?.services?.bornhack?.teams?.some(
      ({ team, camp }) =>
        team?.toLowerCase() === inTeam.toLowerCase() &&
        camp === currentCamp?.name,
    ),
  );
};
export const assertUserInAnyTeam = async (user: Meteor.User | null) => {
  const currentCamp = await Camps.findOneAsync({}, { sort: { end: -1 } });
  if (!currentCamp) {
    throw new Meteor.Error("No active camp found");
  }

  for (const location of await Locations.find().fetchAsync()) {
    if (isUserInTeam(user, currentCamp, location.teamName)) return;
  }

  throw new Meteor.Error(`You are not a member of an active team`);
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
