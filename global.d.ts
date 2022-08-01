/* eslint-disable no-var */
import { Mongo } from "meteor/mongo";
import { DetailedHTMLProps, HTMLAttributes } from "react";
import "styled-components";

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
    interface IntrinsicElements {
      center: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
      marquee: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        scrollAmount: string;
      };
    }
  }
}

declare module "meteor/meteor" {
  namespace Meteor {
    interface UserProfile {
      [str: string]: any;
      name?: string;
      profile?: { public_credit_name?: string; description?: string };
      user?: { username?: string; user_id?: string };
      teams?: { team?: string; camp?: string }[];
    }
    function loginWithBornhack(
      options: Record<string, any>,
      callback: (err: Error) => void,
    ): void;
  }
}
declare module "meteor/accounts-base" {
  namespace Accounts {
    function addAutopublishFields(opts: {
      forLoggedInUser: string[];
      forOtherUsers: string[];
    }): void;
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

interface ConfigError {
  new (): Error;
}

declare module "meteor/service-configuration" {
  var ServiceConfiguration: {
    configurations: Mongo.Collection<Configuration & { clientId: string }>;
    ConfigError: ConfigError;
  };
}
