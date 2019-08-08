import React from "react";
import { Route, Switch } from "react-router";
import { Link } from "react-router-dom";
import AccountsUIWrapper from "./AccountsUIWrapper";
import App from "./App";
import PageSales from "./PageSales";
import { css } from "emotion";

export default function UI() {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <div
        className={css`
          background: rgba(0, 0, 0, 0.2);
        `}
      >
        <AccountsUIWrapper />
        <nav>
          <Link to="/">Sell</Link>
          <Link to="/stock">Stock</Link>
          <Link to="/sales">Sales</Link>
        </nav>
      </div>
      <Switch>
        <Route exact path="/" component={App} />
        <Route exact path="/stock" component={() => "stock"} />
        <Route exact path="/sales" component={PageSales} />
      </Switch>
    </div>
  );
}
