import { css } from "emotion";
import { Session } from "meteor/session";
import { Tracker } from "meteor/tracker";
import React, { useEffect } from "react";
import {
  Link,
  Route,
  Switch,
  useHistory,
  useRouteMatch,
} from "react-router-dom";
import { Redirect } from "react-router-dom/cjs/react-router-dom.min";
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
  let history = useHistory();
  const { params: { locationSlug, 0: pageSlug } = {} } =
    useRouteMatch("/:locationSlug/*") || {};
  const user = useCurrentUser();
  const { data: locations } = useMongoFetch(Locations);
  const userLocations = locations.filter(({ teamName }) =>
    isUserInTeam(user, teamName),
  );
  const currentLocation = useCurrentLocation()?.location || locations[0];
  useEffect(() => {
    if (userLocations.length && !locationSlug) {
      history.push("/" + userLocations[0].slug + "/");
    }
  }, [history, locationSlug, userLocations]);
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
  if (!currentLocation) return "Loading...";
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
          {user && userLocations.length > 1 ? (
            <select
              onChange={(event) =>
                history.push("/" + event.target.value + "/" + pageSlug)
              }
              value={locationSlug}
              className={css`
                font-size: larger;
              `}
            >
              {userLocations.map(({ name, slug }) => (
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
      <Switch>
        <Route
          exact
          path="/:locationSlug"
          component={() => <Redirect to={`/${locationSlug}/tend`} />}
        />
        <Route exact path="/:locationSlug/tend" component={PageTend} />
        <Route exact path="/:locationSlug/stock" component={PageStock} />
        <Route exact path="/:locationSlug/sales" component={PageSales} />
        <Route exact path="/:locationSlug/stats" component={PageStats} />
        <Route exact path="/:locationSlug/menu" component={PageMenu} />
        <Route
          exact
          path="/"
          component={() => {
            return (
              <center>
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
                  {locations.map((location) => (
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
              </center>
            );
          }}
        />
        <Route
          exact
          path="/signin"
          component={() =>
            user ? (
              <Redirect to="/" />
            ) : (
              <div>
                <AccountsUIWrapper />
              </div>
            )
          }
        />
        <>
          <center>not found</center>
        </>
      </Switch>
    </div>
  );
}
