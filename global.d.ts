/* eslint-disable no-var */
/// <reference types="styled-components" />

interface ShareData {
  text?: string;
  title?: string;
  url?: string;
}

declare global {
  var __DEV__: boolean;
  var SERVER: boolean;
  var VIZSLA_VERSION: string;
  namespace JSX {
    type React = import("react");
    interface IntrinsicElements {
      center: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      marquee: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        scrollAmount: string;
      };
    }
  }
}

declare module "meteor/meteor" {
  namespace Meteor {
    interface UserProfile {
      [str: string]: unknown;
      name?: string;
    }
    function loginWithBornhack(): void;
    interface UserServices {
      bornhack?: {
        id: string;
        teams: { team: string; camp: string }[];
        publicCreditName?: string;
      };
    }
  }
}
declare module "meteor/accounts-base" {
  namespace Accounts {
    type Mongo = import("meteor/mongo").Mongo;

    function addAutopublishFields(opts: {
      forLoggedInUser: string[];
      forOtherUsers: string[];
    }): void;
    function setDefaultPublishFields(fields: Mongo.FieldSpecifier): void;
    function registerClientLoginFunction(
      funcName: string,
      func: () => void,
    ): void;
    function callLoginFunction(funcName: string, args?: any[]): any;
    namespace oauth {
      function registerService(name: string): void;
      function credentialRequestCompleteHandler(
        callback?: (error?: Error) => void,
      ): (credentialTokenOrError: string | Error) => void;
    }
  }
}

interface Configuration {
  appId: string;
  secret: string;
  clientId: string;
}
declare module "meteor/service-configuration" {
  interface Configuration {
    appId: string;
    secret: string;
    clientId: string;
  }
  var ServiceConfiguration: {
    configurations: import("meteor/mongo").Mongo.Collection<Configuration>;
    ConfigError: {
      new (): Error;
    };
  };
}

declare module "meteor/oauth" {
  namespace OAuth {
    function registerService(
      name: string,
      version: number,
      urls: null,
      handleOauthRequest: (query: { code: string; state: string }) => Promise<{
        serviceData: Record<string, unknown>;
      }>,
    ): void;
    function sealSecret(secret: string): string;
    function credentialRequestCompleteHandler(
      callback?: (error?: Error) => void,
    ): (credentialTokenOrError: string | Error) => void;
    function _loginStyle(service: string, config: Configuration): string;
    function _redirectUri(service: string, config: Configuration): string;
    function _stateParam(loginStyle: string, credentialToken: string): string;
    function launchLogin(config: {
      loginService: string;
      loginStyle: string;
      loginUrl: string;
      credentialRequestCompleteCallback: (
        credentialTokenOrError: string | Error,
      ) => void;
      credentialToken: string;
      popupOptions?: { width: number; height: number } | undefined;
    }): void;
    function openSecret(secret: string): string;
  }
}
