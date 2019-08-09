import { css } from "emotion";
import React from "react";
import { Route, Switch } from "react-router";
import { Link } from "react-router-dom";
import AccountsUIWrapper from "./AccountsUIWrapper";
import App from "./App";
import PageSales from "./PageSales";
import PageStock from "./PageStock";

export default function UI() {
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
          background: rgba(0, 0, 0, 0.2);
        `}
      >
        <AccountsUIWrapper />
        <nav
          className={css`
            padding: 1em;
            display: flex;
            justify-content: space-between;
            align-items: center;
          `}
        >
          <Link to="/">Sell</Link>
          <Link to="/stock">Stock</Link>
          <Link to="/sales">Sales</Link>
          <Link to="/stats">Stats</Link>
        </nav>
      </div>
      <Switch>
        <Route exact path="/" component={App} />
        <Route exact path="/stock" component={PageStock} />
        <Route exact path="/sales" component={PageSales} />
        <Route exact path="/stats" component={() => "stats"} />
      </Switch>
    </div>
  );
}
