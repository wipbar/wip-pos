import { css } from "emotion";
import { useTracker } from "meteor/react-meteor-data";
import { Session } from "meteor/session";
import { Tracker } from "meteor/tracker";
import React, { useEffect } from "react";
import { Link, Route, Switch } from "react-router-dom";
import { isUserInTeam } from "../api/accounts";
import Locations from "../api/locations";
import useCurrentUser from "../hooks/useCurrentUser";
import AccountsUIWrapper from "./AccountsUIWrapper";
import PageTend from "./PageTend";
import PageMenu from "./PageMenu";
import PageSales from "./PageSales";
import PageStats from "./PageStats";
import PageStock from "./PageStock";
import { useHistory, useRouteMatch } from "react-router-dom";
import { Redirect } from "react-router-dom/cjs/react-router-dom.min";
import useSubscription from "../hooks/useSubscription";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useMongoFetch from "../hooks/useMongoFetch";
import useSession from "../hooks/useSession";

Tracker.autorun(() => (document.title = Session.get("DocumentTitle")));

export default function UI() {
  let history = useHistory();
  useSubscription("locations");
  const { params: { locationSlug, 0: pageSlug } = {} } =
    useRouteMatch("/:locationSlug/*") || {};
  const user = useCurrentUser();
  const locations = useMongoFetch(Locations.find()) || [];
  const userLocations = locations.filter(({ teamName }) =>
    isUserInTeam(user, teamName),
  );
  const currentLocation = useCurrentLocation()?.location || locations[0];
  useEffect(() => {
    if (userLocations.length === 1 && !locationSlug) {
      history.push("/" + userLocations[0].slug + "/");
    }
  }, [history, locationSlug, userLocations]);
  const [, setTitle] = useSession("DocumentTitle");
  useEffect(() => {
    if (currentLocation && pageSlug) {
      setTitle(`${currentLocation.name} - ${pageSlug}`.toUpperCase());
    } else if (currentLocation) {
      setTitle(`${currentLocation.name}`.toUpperCase());
    }
  }, [currentLocation, setTitle, pageSlug]);
  if (!currentLocation) return null;
  return (
    <div>
      <div
        className={css`
          background: rgba(255, 255, 255, 0.2);
          border-bottom: 2px solid rgba(255, 255, 255, 0.3);
          display: ${!user || !locationSlug ? "none" : "block"};
        `}
      >
        <nav
          className={css`
            display: flex;
            justify-content: space-around;
            align-items: center;
            > a,
            > div {
              padding: 0.5em 1em;
            }
          `}
        >
          <AccountsUIWrapper />
          {user && isUserInTeam(user, currentLocation.teamName) ? (
            <>
              {userLocations.length > 1 ? (
                <select
                  onChange={(event) =>
                    history.push("/" + event.target.value + "/" + pageSlug)
                  }
                  value={locationSlug}
                >
                  {userLocations.map(({ name, slug }) => (
                    <option key={slug} value={slug}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : null}
              <Link to={`/${locationSlug}/tend`}>Sell</Link>
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
                <ul>
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
