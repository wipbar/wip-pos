import { css } from "emotion";
import React from "react";
import { Route, Switch } from "react-router";
import { Link } from "react-router-dom";
import useCurrentUser from "../hooks/useCurrentUser";
import AccountsUIWrapper from "./AccountsUIWrapper";
import App from "./App";
import PageSales from "./PageSales";
import PageStock from "./PageStock";
import PageStats from "./PageStats";
import PageMenu from "./PageMenu";

export default function UI() {
  const user = useCurrentUser();

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
          display: ${!user ? "none" : "block"};
          min-height: 72px;
        `}
      >
        <nav
          className={css`
            display: flex;
            justify-content: space-between;
            align-items: center;
            > a,
            > span {
              padding: 0.5em 1em;
            }
          `}
        >
          {user ? (
            <>
              <AccountsUIWrapper />
              <Link to="/">Sell</Link>
              <Link to="/stock">Stock</Link>
              <Link to="/sales">Sales</Link>
            </>
          ) : null}
          <Link to="/stats">Stats</Link>
          <Link to="/menu">Menu</Link>
        </nav>
      </div>
      <Switch>
        {user ? (
          <>
            <Route exact path="/" component={App} />
            <Route exact path="/stock" component={PageStock} />
            <Route exact path="/sales" component={PageSales} />
            <Route exact path="/stats" component={PageStats} />
            <Route exact path="/menu" component={PageMenu} />
          </>
        ) : (
          <>
            <Route exact path="/" component={PageStats} />
            <Route exact path="/stats" component={PageStats} />
            <Route exact path="/menu" component={PageMenu} />
            <Route
              exact
              path="/signin"
              component={() => (
                <div>
                  <AccountsUIWrapper />
                </div>
              )}
            />
          </>
        )}
      </Switch>
    </div>
  );
}
