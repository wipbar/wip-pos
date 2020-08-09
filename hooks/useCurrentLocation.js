import React from "react";
import { useRouteMatch } from "react-router-dom";
import { isUserInTeam } from "../api/accounts";
import Locations from "../api/locations";
import AccountsUIWrapper from "../ui/AccountsUIWrapper";
import useCurrentUser from "./useCurrentUser";
import useMongoFetch from "./useMongoFetch";
import useSubscription from "./useSubscription";

export default function useCurrentLocation(authorized) {
  const loading = useSubscription("locations");
  const { params: { locationSlug } = {} } =
    useRouteMatch("/:locationSlug") || {};

  const [location] = useMongoFetch(Locations.find({ slug: locationSlug }), [
    locationSlug,
  ]);
  const user = useCurrentUser();
  const error =
    !loading &&
    (() => {
      if (!location)
        return (
          <>
            Invalid location <code>{locationSlug}</code>
          </>
        );
      if (authorized) {
        if (!user)
          return (
            <>
              You need to <AccountsUIWrapper /> to tend{" "}
              <code>{location.name}</code>
            </>
          );
        if (!isUserInTeam(user, location.teamName))
          return (
            <>
              You need to be a member of <code>{location.teamName} Team</code>{" "}
              to tend <code>{location.name}</code>
            </>
          );
      }
    })();
  return { location, loading, error: error ? <center>{error}</center> : error };
}
