import { css } from "@emotion/css";
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
import Camps from "../api/camps";
import Locations from "../api/locations";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useCurrentUser from "../hooks/useCurrentUser";
import useMongoFetch from "../hooks/useMongoFetch";
import useSession from "../hooks/useSession";
import { getCorrectTextColor } from "../util";
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

  const { data: camps } = useMongoFetch(
    () => Camps.find({}, { sort: { end: -1 } }),
    [],
  );
  const currentCamp = useCurrentCamp();
  const user = useCurrentUser();
  const { data: locations } = useMongoFetch(() => Locations.find(), []);
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

  const [currentCampSlug, setCurrentCampSlug] = useSession<string | null>(
    "currentCampSlug",
    null,
  );

  return (
    <div
      className={css`
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
    >
      <style>{`
        @keyframes a {
          to {
            background-position: -200% 0%;
          }
        }
        html {
          color: ${currentCamp?.color};
          background-color: ${
            currentCamp && getCorrectTextColor(currentCamp.color)
          };

          background: linear-gradient(
              to right,
              #750787,
              #004dff,
              #008026,
              #ffed00,
              #ff8c00,
              #e40303,
              #750787
            )
            0 0/300% 100%;
          background: linear-gradient(
              -45deg,
              rgba(255, 0, 0, 1),
              rgba(255, 154, 0, 1),
              rgba(208, 222, 33, 1),
              rgba(79, 220, 74, 1),
              rgba(63, 218, 216, 1),
              rgba(47, 201, 226, 1),
              rgba(28, 127, 238, 1),
              rgba(95, 21, 242, 1),
              rgba(186, 12, 248, 1),
              rgba(251, 7, 217, 1),
              rgba(255, 0, 0, 1)
            )
            0 0/100% 100%;
        }
        a {
          color: ${currentCamp?.color};
        }
        .my-masonry-grid > div {
          border-color: ${currentCamp?.color};
        }

        #login-buttons-bornhack,
        #login-buttons-logout {
          background: ${currentCamp?.color} !important;
          border-color: ${currentCamp?.color} !important;
        }
      `}</style>
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
            overflow-x: auto;
            > a,
            > div {
              padding: 0.25em 0.5em;
            }
          `}
        >
          {user ? (
            <select
              value={currentCampSlug || ""}
              onChange={(event) =>
                setCurrentCampSlug(event.target.value || null)
              }
            >
              <option value="" key="">
                Auto
              </option>
              {camps.map((camp) => (
                <option value={camp.slug} key={camp.slug}>
                  {camp.name}
                </option>
              ))}
            </select>
          ) : null}
          {locationSlug ? (
            <>
              {locationSlug !== "stats" ? (
                user && userLocations && userLocations.length > 1 ? (
                  <select
                    onChange={(event) => {
                      navigate("/" + event.target.value + "/" + pageSlug);
                    }}
                    value={locationSlug}
                  >
                    {userLocations?.map(({ name, slug }) => (
                      <option key={slug} value={slug}>
                        {name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <big>
                    {locationSlug && currentLocation
                      ? currentLocation.name
                      : "WIP POS"}
                  </big>
                )
              ) : null}
              {user &&
              currentLocation &&
              isUserInTeam(user, currentLocation.teamName) ? (
                <>
                  <Link
                    to={`/${
                      locationSlug !== "stats"
                        ? locationSlug
                        : userLocations[0]?.slug
                    }/tend`}
                  >
                    Tend
                  </Link>
                  <Link
                    to={`/${
                      locationSlug !== "stats"
                        ? locationSlug
                        : userLocations[0]?.slug
                    }/stock`}
                  >
                    Stock
                  </Link>
                  <Link
                    to={`/${
                      locationSlug !== "stats"
                        ? locationSlug
                        : userLocations[0]?.slug
                    }/sales`}
                  >
                    Sales
                  </Link>
                  <Link
                    to={`/${
                      locationSlug !== "stats"
                        ? locationSlug
                        : userLocations[0]?.slug
                    }/menu`}
                  >
                    Menu
                  </Link>
                </>
              ) : null}
            </>
          ) : null}
          {(!locationSlug || locationSlug === "stats") &&
          !(
            user &&
            currentLocation &&
            isUserInTeam(user, currentLocation.teamName)
          )
            ? locations.map(({ slug, name }) => (
                <Link key={slug} to={`/${slug}/menu`}>
                  {name} Menu
                </Link>
              ))
            : null}
          <Link to={`/stats`}>Stats</Link>
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
        <Route path="/:locationSlug/menu" element={<PageMenu />} />
        <Route path="/stats" element={<PageStats />} />
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
                <li>
                  <Link to={`/stats`}>Stats</Link>
                </li>
                {locations?.map((location) => (
                  <li
                    key={location._id}
                    className={css`
                      margin-bottom: 16px;
                    `}
                  >
                    {location.name}
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
