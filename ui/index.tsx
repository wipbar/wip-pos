import { css } from "emotion";
import { useTracker } from "meteor/react-meteor-data";
import { Session } from "meteor/session";
import { Tracker } from "meteor/tracker";
import React, { useEffect } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useMatch,
  useNavigate,
} from "react-router-dom";
import { isUserInTeam } from "../api/accounts";
import Locations from "../api/locations";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useCurrentUser from "../hooks/useCurrentUser";
import useMongoFetch from "../hooks/useMongoFetch";
import useSession from "../hooks/useSession";
import AccountsUIWrapper from "./AccountsUIWrapper";
import PageMenu from "./PageMenu";
import PageSales from "./PageSales";
import PageStats from "./PageStats";
import PageStock from "./PageStock";
import PageTend from "./PageTend";

Tracker.autorun(() => (document.title = Session.get("DocumentTitle")));

export default function UI() {
  const navigate = useNavigate();
  const GALAXY_APP_VERSION_ID = useTracker(
    () => (Session.get("GALAXY_APP_VERSION_ID") as string | undefined) || "420",
  );
  const match = useMatch("/:locationSlug/*");
  const locationSlug = match?.params.locationSlug;
  const pageSlug = (match?.params as any)["*"] as string | undefined;

  const user = useCurrentUser();
  const { data: locations, loading } = useMongoFetch(Locations);
  const userLocations = locations?.filter(({ teamName }) =>
    isUserInTeam(user, teamName),
  );
  const currentLocation = useCurrentLocation()?.location || locations?.[0];
  useEffect(() => {
    if (userLocations?.length && !locationSlug) {
      navigate("/" + userLocations[0].slug + "/");
    }
  }, [navigate, locationSlug, userLocations]);
  const [, setTitle] = useSession("DocumentTitle");
  useEffect(() => {
    if (currentLocation && pageSlug) {
      setTitle(
        `${
          (locationSlug && currentLocation?.name) || "WIP POS"
        } - ${pageSlug}`.toUpperCase(),
      );
    } else {
      setTitle(
        `${(locationSlug && currentLocation?.name) || "WIP POS"}`.toUpperCase(),
      );
    }
  }, [currentLocation, setTitle, pageSlug, locationSlug]);

  if (!currentLocation || loading) return <>Loading...</>;

  return (
    <div
      className={css`
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
    >
      <div
        className={css`
          position: absolute;
          bottom: 24px;
          right: 12px;
          opacity: 0.5;
          transform: rotate(90deg);
          pointer-events: none;
        `}
      >
        {GALAXY_APP_VERSION_ID}
      </div>
      <div
        className={css`
          background: rgba(255, 255, 255, 0.2);
          border-bottom: 2px solid rgba(255, 255, 255, 0.3);
        `}
        hidden={(pageSlug === "menu" || pageSlug === "stats") && !user}
      >
        <nav
          className={css`
            display: flex;
            justify-content: space-around;
            align-items: center;
            > a,
            > div {
              padding: 0.25em 0.5em;
            }
          `}
        >
          {user && userLocations && userLocations.length > 1 ? (
            <select
              onChange={(event) =>
                navigate("/" + event.target.value + "/" + pageSlug)
              }
              value={locationSlug}
              className={css`
                font-size: larger;
              `}
            >
              {userLocations?.map(({ name, slug }) => (
                <option key={slug} value={slug}>
                  {name}
                </option>
              ))}
            </select>
          ) : (
            <big>
              <span
                className={css`
                  color: white;
                `}
              >
                {locationSlug ? currentLocation.name : "WIP POS"}
              </span>
            </big>
          )}
          {user && isUserInTeam(user, currentLocation.teamName) ? (
            <>
              <Link to={`/${locationSlug}/tend`}>Tend</Link>
              <Link to={`/${locationSlug}/stock`}>Stock</Link>
              <Link to={`/${locationSlug}/sales`}>Sales</Link>
            </>
          ) : null}
          {locationSlug ? (
            <>
              <Link to={`/${locationSlug}/stats`}>Stats</Link>
              <Link to={`/${locationSlug}/menu`}>Menu</Link>
            </>
          ) : null}
          <AccountsUIWrapper />
        </nav>
      </div>
      <Routes>
        <Route
          path="/:locationSlug"
          element={<Navigate to={`/${locationSlug}/tend`} />}
        />
        <Route path="/:locationSlug/tend" element={<PageTend />} />
        <Route path="/:locationSlug/stock" element={<PageStock />} />
        <Route path="/:locationSlug/sales" element={<PageSales />} />
        <Route path="/:locationSlug/stats" element={<PageStats />} />
        <Route path="/:locationSlug/menu" element={<PageMenu />} />
        <Route
          path="/"
          element={
            <div
              className={css`
                text-align: center;
              `}
            >
              <br />
              <ul
                className={css`
                  padding: 0;
                  margin: 0;
                  list-style: none;
                  display: flex;
                  font-size: 3em;
                  justify-content: space-evenly;
                `}
              >
                {locations?.map((location) => (
                  <li
                    key={location._id}
                    className={css`
                      margin-bottom: 16px;
                    `}
                  >
                    {location.name}
                    <br />
                    <Link to={`/${location.slug}/stats`}>Stats</Link>
                    <br />
                    <Link to={`/${location.slug}/menu`}>Menu</Link>
                  </li>
                ))}
              </ul>
            </div>
          }
        />
        <Route
          path="/signin"
          element={
            user ? (
              <Navigate to="/" />
            ) : (
              <div>
                <AccountsUIWrapper />
              </div>
            )
          }
        />
        <Route
          element={
            <div
              className={css`
                text-align: center;
              `}
            >
              not found
            </div>
          }
        />
      </Routes>
    </div>
  );
}
