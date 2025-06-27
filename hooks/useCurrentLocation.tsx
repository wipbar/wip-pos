import { css } from "@emotion/css";
import { useFind } from "meteor/react-meteor-data";
import React from "react";
import { useMatch } from "react-router-dom";
import { isUserInTeam } from "../api/accounts";
import Locations from "../api/locations";
import AccountsUIWrapper from "../ui/AccountsUIWrapper";
import useCurrentUser from "./useCurrentUser";
import useSubscription from "./useSubscription";
import useCurrentCamp from "./useCurrentCamp";

export default function useCurrentLocation(authorized?: boolean) {
  const match = useMatch("/:locationSlug/*");
  const locationSlug = match?.params.locationSlug;

  const loading = useSubscription("locations");
  const [location] = useFind(
    () => Locations.find({ slug: locationSlug }, { limit: 1 }),
    [locationSlug],
  );

  const user = useCurrentUser();
  const camp = useCurrentCamp();
  const error =
    !loading &&
    (() => {
      if (!location) {
        return (
          <>
            Invalid location <code>{locationSlug}</code>
          </>
        );
      }

      if (authorized) {
        if (!user) {
          return (
            <>
              You need to <AccountsUIWrapper /> to tend{" "}
              <code>{location.name}</code>
            </>
          );
        }

        if (!isUserInTeam(user, camp, location.teamName)) {
          return (
            <>
              You need to be a member of <code>{location.teamName} Team</code>{" "}
              to tend <code>{location.name}</code>
            </>
          );
        }
      }
    })();

  return {
    location,
    loading,
    error: error && (
      <div
        className={css`
          text-align: center;
        `}
      >
        {error}
      </div>
    ),
  };
}
