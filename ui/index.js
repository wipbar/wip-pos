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

Tracker.autorun(() => (document.title = Session.get("DocumentTitle")));

export default function UI() {
  let history = useHistory();
  useSubscription("locations");
  const { params: { locationSlug } = {} } =
    useRouteMatch("/:locationSlug") || {};
  const user = useCurrentUser();
  const locations = useTracker(() => Locations.find().fetch()) || [];
  const userLocations = locations.filter(({ teamName }) =>
    isUserInTeam(user, teamName),
  );
  const currentLocation = useCurrentLocation() || locations[0];
  useEffect(() => {
    if (userLocations.length === 1 && !locationSlug) {
      history.push("/" + userLocations[0].slug + "/tend");
    }
  }, [history, locationSlug, userLocations]);
  if (!currentLocation) return null;
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        height: 100%;
      `}
    >
      <div
        className={css`
          background: rgba(255, 255, 255, 0.2);
          border-bottom: 2px solid rgba(255, 255, 255, 0.3);
          display: ${!(user || !locationSlug) ? "none" : "block"};
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
          {user ? (
            <>
              {userLocations.length > 1 ? (
                <select
                  onChange={(event) =>
                    history.push("/" + event.target.value + "/tend")
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
          <Link to={`/${locationSlug}/stats`}>Stats</Link>
          <Link to={`/${locationSlug}/menu`}>Menu</Link>
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
